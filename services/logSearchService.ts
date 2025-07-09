import { createClient } from "@/utils/supabase/client";
import { format as formatDate, parseISO, isValid } from "date-fns";

interface SearchQuery {
  // 기본 필터
  text?: string;
  action?: string;
  resourceType?: string;
  userId?: string;
  level?: number;

  // 날짜 범위
  startDate?: string;
  endDate?: string;

  // 고급 필터
  ipAddress?: string;
  userAgent?: string;
  hasDetails?: boolean;

  // 정렬 및 페이징
  sortBy?: "created_at" | "level" | "action" | "resource_type";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;

  // 집계 옵션
  groupBy?: "user" | "action" | "resource_type" | "date" | "hour";
  includeStats?: boolean;
}

interface SearchResult {
  logs: any[];
  totalCount: number;
  stats?: {
    totalLogs: number;
    uniqueUsers: number;
    errorCount: number;
    warningCount: number;
    levelDistribution: Record<string, number>;
    actionDistribution: Record<string, number>;
    resourceDistribution: Record<string, number>;
    timelineData: Array<{
      date: string;
      count: number;
      errors: number;
    }>;
  };
  facets?: {
    users: Array<{ id: string; name: string; count: number }>;
    actions: Array<{ name: string; count: number }>;
    resourceTypes: Array<{ name: string; count: number }>;
    levels: Array<{ level: number; name: string; count: number }>;
  };
}

class LogSearchService {
  private supabase = createClient();

  // 고급 로그 검색
  async searchLogs(query: SearchQuery): Promise<SearchResult> {
    try {
      let supabaseQuery = this.supabase.from("activity_logs").select(
        `
          *,
          user:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `,
        { count: "exact" }
      );

      // 텍스트 검색 (제목, 상세 내용에서 검색)
      if (query.text) {
        supabaseQuery = supabaseQuery.or(
          `resource_title.ilike.%${query.text}%,` +
            `details->>'content'.ilike.%${query.text}%,` +
            `details->>'description'.ilike.%${query.text}%`
        );
      }

      // 기본 필터들
      if (query.action) {
        supabaseQuery = supabaseQuery.eq("action", query.action);
      }

      if (query.resourceType) {
        supabaseQuery = supabaseQuery.eq("resource_type", query.resourceType);
      }

      if (query.userId) {
        supabaseQuery = supabaseQuery.eq("user_id", query.userId);
      }

      if (query.level !== undefined) {
        supabaseQuery = supabaseQuery.eq("level", query.level);
      }

      // 날짜 범위 필터
      if (query.startDate) {
        supabaseQuery = supabaseQuery.gte("created_at", query.startDate);
      }

      if (query.endDate) {
        supabaseQuery = supabaseQuery.lte("created_at", query.endDate);
      }

      // IP 주소 필터
      if (query.ipAddress) {
        supabaseQuery = supabaseQuery.eq("ip_address", query.ipAddress);
      }

      // User Agent 필터
      if (query.userAgent) {
        supabaseQuery = supabaseQuery.ilike(
          "user_agent",
          `%${query.userAgent}%`
        );
      }

      // 상세 정보 존재 여부
      if (query.hasDetails !== undefined) {
        if (query.hasDetails) {
          supabaseQuery = supabaseQuery.not("details", "is", null);
        } else {
          supabaseQuery = supabaseQuery.is("details", null);
        }
      }

      // 정렬
      const sortBy = query.sortBy || "created_at";
      const sortOrder = query.sortOrder || "desc";
      supabaseQuery = supabaseQuery.order(sortBy, {
        ascending: sortOrder === "asc",
      });

      // 페이징
      const limit = query.limit || 50;
      const offset = query.offset || 0;
      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      const { data: logs, error, count } = await supabaseQuery;

      if (error) {
        throw error;
      }

      const result: SearchResult = {
        logs: logs || [],
        totalCount: count || 0,
      };

      // 통계 정보 생성
      if (query.includeStats) {
        result.stats = await this.generateStats(query);
      }

      // 패싯 정보 생성 (필터링을 위한 집계 데이터)
      result.facets = await this.generateFacets(query);

      return result;
    } catch (error) {
      console.error("로그 검색 오류:", error);
      throw error;
    }
  }

  // 통계 정보 생성
  private async generateStats(
    query: SearchQuery
  ): Promise<SearchResult["stats"]> {
    try {
      // 기본 쿼리 (필터 적용)
      let baseQuery = this.supabase.from("activity_logs").select("*");

      // 필터 적용 (검색과 동일한 조건)
      baseQuery = this.applyFilters(baseQuery, query);

      const { data: filteredLogs } = await baseQuery;

      if (!filteredLogs) {
        return undefined;
      }

      // 레벨별 분포
      const levelDistribution = filteredLogs.reduce(
        (acc: Record<string, number>, log: any) => {
          const levelName =
            ["DEBUG", "INFO", "WARN", "ERROR", "OFF"][log.level || 1] ||
            "UNKNOWN";
          acc[levelName] = (acc[levelName] || 0) + 1;
          return acc;
        },
        {}
      );

      // 액션별 분포
      const actionDistribution = filteredLogs.reduce(
        (acc: Record<string, number>, log: any) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        },
        {}
      );

      // 리소스별 분포
      const resourceDistribution = filteredLogs.reduce(
        (acc: Record<string, number>, log: any) => {
          acc[log.resource_type] = (acc[log.resource_type] || 0) + 1;
          return acc;
        },
        {}
      );

      // 시간별 데이터 (최근 7일)
      const timelineData = this.generateTimelineData(filteredLogs);

      return {
        totalLogs: filteredLogs.length,
        uniqueUsers: new Set(filteredLogs.map((log: any) => log.user_id)).size,
        errorCount: filteredLogs.filter((log: any) => log.level === 3).length,
        warningCount: filteredLogs.filter((log: any) => log.level === 2).length,
        levelDistribution,
        actionDistribution,
        resourceDistribution,
        timelineData,
      };
    } catch (error) {
      console.error("통계 생성 오류:", error);
      return undefined;
    }
  }

  // 패싯 정보 생성
  private async generateFacets(
    query: SearchQuery
  ): Promise<SearchResult["facets"]> {
    try {
      // 사용자별 집계
      const { data: userStats } = await this.supabase
        .from("activity_logs")
        .select(
          `
          user_id,
          user:user_id (
            email,
            raw_user_meta_data
          )
        `
        )
        .not("user_id", "is", null);

      const userCounts = (userStats || []).reduce(
        (acc: Record<string, any>, log: any) => {
          if (!acc[log.user_id]) {
            acc[log.user_id] = {
              id: log.user_id,
              name:
                log.user?.raw_user_meta_data?.name ||
                log.user?.email ||
                "Unknown",
              count: 0,
            };
          }
          acc[log.user_id].count++;
          return acc;
        },
        {}
      );

      // 액션별 집계
      const { data: actionStats } = await this.supabase
        .from("activity_logs")
        .select("action");

      const actionCounts = (actionStats || []).reduce(
        (acc: Record<string, number>, log: any) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        },
        {}
      );

      // 리소스 타입별 집계
      const { data: resourceStats } = await this.supabase
        .from("activity_logs")
        .select("resource_type");

      const resourceCounts = (resourceStats || []).reduce(
        (acc: Record<string, number>, log: any) => {
          acc[log.resource_type] = (acc[log.resource_type] || 0) + 1;
          return acc;
        },
        {}
      );

      // 레벨별 집계
      const { data: levelStats } = await this.supabase
        .from("activity_logs")
        .select("level");

      const levelCounts = (levelStats || []).reduce(
        (acc: Record<number, number>, log: any) => {
          const level = log.level || 1;
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        },
        {}
      );

      return {
        users: (Object.values(userCounts) as { id: string; name: string; count: number; }[])
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 20),
        actions: Object.entries(actionCounts)
          .map(([name, count]: any) => ({ name, count: count as number }))
          .sort((a, b) => b.count - a.count),
        resourceTypes: Object.entries(resourceCounts)
          .map(([name, count]: any) => ({ name, count: count as number }))
          .sort((a, b) => b.count - a.count),
        levels: Object.entries(levelCounts)
          .map(([level, count]: any) => ({
            level: parseInt(level),
            name:
              ["DEBUG", "INFO", "WARN", "ERROR", "OFF"][parseInt(level)] ||
              "UNKNOWN",
            count: count as number,
          }))
          .sort((a, b) => a.level - b.level),
      };
    } catch (error) {
      console.error("패싯 생성 오류:", error);
      return undefined;
    }
  }

  // 시간별 데이터 생성
  private generateTimelineData(
    logs: any[]
  ): Array<{ date: string; count: number; errors: number }> {
    const timelineMap = new Map<string, { count: number; errors: number }>();

    logs.forEach((log: any) => {
      const date = formatDate(parseISO(log.created_at), "yyyy-MM-dd");

      if (!timelineMap.has(date)) {
        timelineMap.set(date, { count: 0, errors: 0 });
      }

      const dayData = timelineMap.get(date)!;
      dayData.count++;

      if (log.level === 3) {
        // ERROR 레벨
        dayData.errors++;
      }
    });

    return Array.from(timelineMap.entries())
      .map(([date, data]: any) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // 필터 적용 헬퍼
  private applyFilters(query: any, filters: SearchQuery) {
    if (filters.text) {
      query = query.or(
        `resource_title.ilike.%${filters.text}%,` +
          `details->>'content'.ilike.%${filters.text}%`
      );
    }

    if (filters.action) query = query.eq("action", filters.action);
    if (filters.resourceType)
      query = query.eq("resource_type", filters.resourceType);
    if (filters.userId) query = query.eq("user_id", filters.userId);
    if (filters.level !== undefined) query = query.eq("level", filters.level);
    if (filters.startDate) query = query.gte("created_at", filters.startDate);
    if (filters.endDate) query = query.lte("created_at", filters.endDate);
    if (filters.ipAddress) query = query.eq("ip_address", filters.ipAddress);
    if (filters.userAgent)
      query = query.ilike("user_agent", `%${filters.userAgent}%`);

    return query;
  }

  // 저장된 검색 쿼리 관리
  async saveSearch(
    name: string,
    query: SearchQuery,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase.from("saved_searches").insert([
        {
          name,
          query: JSON.stringify(query),
          user_id: userId,
          search_type: "activity_logs",
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error("검색 저장 오류:", error);
      throw error;
    }
  }

  // 저장된 검색 조회
  async getSavedSearches(
    userId: string
  ): Promise<
    Array<{ id: string; name: string; query: SearchQuery; created_at: string }>
  > {
    try {
      const { data, error } = await this.supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", userId)
        .eq("search_type", "activity_logs")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        query: JSON.parse(item.query),
        created_at: item.created_at,
      }));
    } catch (error) {
      console.error("저장된 검색 조회 오류:", error);
      return [];
    }
  }

  // 로그 내보내기 (CSV 형식)
  async exportLogs(
    query: SearchQuery,
    format: "csv" | "json" = "csv"
  ): Promise<string> {
    try {
      const result = await this.searchLogs({ ...query, limit: 10000 }); // 최대 10,000개

      if (format === "json") {
        return JSON.stringify(result.logs, null, 2);
      }

      // CSV 형식
      const headers = [
        "날짜",
        "사용자",
        "액션",
        "리소스 타입",
        "리소스 제목",
        "레벨",
        "IP 주소",
        "상세 정보",
      ];

      const csvRows = result.logs.map((log: any) => [
        formatDate(parseISO(log.created_at), "yyyy-MM-dd HH:mm:ss"),
        log.user?.raw_user_meta_data?.name || log.user?.email || "알 수 없음",
        log.action,
        log.resource_type,
        log.resource_title || "",
        ["DEBUG", "INFO", "WARN", "ERROR", "OFF"][log.level || 1] || "UNKNOWN",
        log.ip_address || "",
        log.details ? JSON.stringify(log.details) : "",
      ]);

      const csvContent = [headers, ...csvRows]
        .map((row: any) =>
          row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      return csvContent;
    } catch (error) {
      console.error("로그 내보내기 오류:", error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const logSearchService = new LogSearchService();

// 편의 함수들
export function searchActivityLogs(query: SearchQuery): Promise<SearchResult> {
  return logSearchService.searchLogs(query);
}

export function exportActivityLogs(
  query: SearchQuery,
  format: "csv" | "json" = "csv"
): Promise<string> {
  return logSearchService.exportLogs(query, format);
}

export function saveSearchQuery(
  name: string,
  query: SearchQuery,
  userId: string
): Promise<void> {
  return logSearchService.saveSearch(name, query, userId);
}

export function getSavedSearchQueries(
  userId: string
): Promise<
  Array<{ id: string; name: string; query: SearchQuery; created_at: string }>
> {
  return logSearchService.getSavedSearches(userId);
}
