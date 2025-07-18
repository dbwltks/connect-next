"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import useSWR from "swr";
import {
  User,
  Users,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Crown,
  Shield,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IWidget } from "@/types";

interface OrganizationChartWidgetProps {
  widget: IWidget;
}

interface Person {
  id: string;
  name: string;
  position: string;
  department?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  level: number;
  parentId?: string;
  children?: Person[];
  social_links?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    threads?: string;
  };
}

// 조직도 스타일 타입
export const CHART_STYLES = {
  TREE: "tree", // 트리형 (수직)
  HORIZONTAL: "horizontal", // 수평형
  COMPACT: "compact", // 컴팩트형
  CARDS: "cards", // 카드형
  DETAILED: "detailed", // 상세라인형
} as const;

// 직책별 색상 및 아이콘 매핑
const getPositionStyle = (position: string) => {
  if (position.includes("담임목사")) {
    return {
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
      textColor: "text-white",
      icon: Crown,
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    };
  }
  if (position.includes("부목사") || position.includes("전도사")) {
    return {
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      textColor: "text-white",
      icon: Shield,
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    };
  }
  if (position.includes("장로")) {
    return {
      bgColor: "bg-gradient-to-br from-green-500 to-green-600",
      textColor: "text-white",
      icon: Star,
      badgeColor: "bg-green-100 text-green-800 border-green-200",
    };
  }
  if (position.includes("집사") || position.includes("권사")) {
    return {
      bgColor: "bg-gradient-to-br from-orange-400 to-orange-500",
      textColor: "text-white",
      icon: User,
      badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
    };
  }
  return {
    bgColor: "bg-gradient-to-br from-gray-400 to-gray-500",
    textColor: "text-white",
    icon: User,
    badgeColor: "bg-gray-100 text-gray-800 border-gray-200",
  };
};

export function OrganizationChartWidget({
  widget,
}: OrganizationChartWidgetProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const chartStyle = widget.settings?.chart_style || CHART_STYLES.TREE;
  const showAvatars = widget.settings?.show_avatars ?? true;
  const showContact = widget.settings?.show_contact ?? false;
  const showDepartments = widget.settings?.show_departments ?? true;
  const showPositionIcons = widget.settings?.show_position_icons ?? true;
  const enableExpandCollapse = widget.settings?.enable_expand_collapse ?? true;
  const cardSize = widget.settings?.card_size || "medium";
  const themeColor = widget.settings?.theme_color || "blue";
  const backgroundStyle = widget.settings?.background_style || "gradient";
  const cardSpacing = widget.settings?.card_spacing || "normal";
  const enableAnimations = widget.settings?.enable_animations ?? true;
  const enableShadows = widget.settings?.enable_shadows ?? true;

  // 테마 색상에 따른 스타일 매핑
  const getThemeColors = (theme: string) => {
    const themes = {
      blue: {
        primary: "from-blue-500 to-blue-600",
        secondary: "from-blue-400 to-blue-300",
        accent: "bg-blue-100 text-blue-800 border-blue-200",
        background: "from-gray-50 via-white to-blue-50",
      },
      purple: {
        primary: "from-purple-500 to-purple-600",
        secondary: "from-purple-400 to-purple-300",
        accent: "bg-purple-100 text-purple-800 border-purple-200",
        background: "from-gray-50 via-white to-purple-50",
      },
      green: {
        primary: "from-green-500 to-green-600",
        secondary: "from-green-400 to-green-300",
        accent: "bg-green-100 text-green-800 border-green-200",
        background: "from-gray-50 via-white to-green-50",
      },
      orange: {
        primary: "from-orange-500 to-orange-600",
        secondary: "from-orange-400 to-orange-300",
        accent: "bg-orange-100 text-orange-800 border-orange-200",
        background: "from-gray-50 via-white to-orange-50",
      },
      gray: {
        primary: "from-gray-500 to-gray-600",
        secondary: "from-gray-400 to-gray-300",
        accent: "bg-gray-100 text-gray-800 border-gray-200",
        background: "from-gray-50 via-white to-gray-100",
      },
    };
    return themes[theme as keyof typeof themes] || themes.blue;
  };

  // 카드 크기에 따른 클래스
  const getCardSizeClasses = (size: string) => {
    const sizes = {
      small: { width: "w-48", avatar: "w-12 h-12", text: "text-sm" },
      medium: { width: "w-64", avatar: "w-16 h-16", text: "text-base" },
      large: { width: "w-80", avatar: "w-20 h-20", text: "text-lg" },
    };
    return sizes[size as keyof typeof sizes] || sizes.medium;
  };

  // 간격에 따른 클래스
  const getSpacingClasses = (spacing: string) => {
    const spacings = {
      tight: { gap: "gap-8", margin: "my-2" },
      normal: { gap: "gap-16", margin: "my-4" },
      wide: { gap: "gap-24", margin: "my-6" },
    };
    return spacings[spacing as keyof typeof spacings] || spacings.normal;
  };

  const themeColors = getThemeColors(themeColor);
  const cardSizeClasses = getCardSizeClasses(cardSize);
  const spacingClasses = getSpacingClasses(cardSpacing);

  // 샘플 조직도 데이터 - 교회용
  const sampleData: Person[] = [
    {
      id: "1",
      name: "김담임",
      position: "담임목사",
      department: "목회진",
      email: "pastor@church.com",
      phone: "02-1234-5678",
      level: 0,
      avatar: "https://via.placeholder.com/80x80/6366f1/ffffff?text=김담임",
    },
    {
      id: "2",
      name: "이부목사",
      position: "부목사",
      department: "목회진",
      email: "associate@church.com",
      phone: "02-1234-5679",
      level: 1,
      parentId: "1",
      avatar: "https://via.placeholder.com/80x80/3b82f6/ffffff?text=이부목사",
    },
    {
      id: "3",
      name: "박전도사",
      position: "전도사",
      department: "목회진",
      email: "evangelist@church.com",
      phone: "02-1234-5680",
      level: 1,
      parentId: "1",
      avatar: "https://via.placeholder.com/80x80/06b6d4/ffffff?text=박전도사",
    },
    {
      id: "4",
      name: "최장로",
      position: "장로",
      department: "당회",
      email: "elder1@church.com",
      level: 1,
      parentId: "1",
      avatar: "https://via.placeholder.com/80x80/10b981/ffffff?text=최장로",
    },
    {
      id: "5",
      name: "정장로",
      position: "장로",
      department: "당회",
      email: "elder2@church.com",
      level: 1,
      parentId: "1",
      avatar: "https://via.placeholder.com/80x80/059669/ffffff?text=정장로",
    },
    {
      id: "6",
      name: "한집사",
      position: "집사",
      department: "집사회",
      email: "deacon1@church.com",
      level: 2,
      parentId: "4",
      avatar: "https://via.placeholder.com/80x80/f59e0b/ffffff?text=한집사",
    },
    {
      id: "7",
      name: "윤집사",
      position: "집사",
      department: "집사회",
      email: "deacon2@church.com",
      level: 2,
      parentId: "5",
      avatar: "https://via.placeholder.com/80x80/d97706/ffffff?text=윤집사",
    },
    {
      id: "8",
      name: "강권사",
      position: "권사",
      department: "권사회",
      email: "kwonsa1@church.com",
      level: 2,
      parentId: "2",
      avatar: "https://via.placeholder.com/80x80/dc2626/ffffff?text=강권사",
    },
    {
      id: "9",
      name: "오권사",
      position: "권사",
      department: "권사회",
      email: "kwonsa2@church.com",
      level: 2,
      parentId: "3",
      avatar: "https://via.placeholder.com/80x80/be185d/ffffff?text=오권사",
    },
    {
      id: "10",
      name: "송집사",
      position: "교육부장",
      department: "교육부",
      email: "education@church.com",
      level: 2,
      parentId: "2",
      avatar: "https://via.placeholder.com/80x80/7c3aed/ffffff?text=송집사",
    },
    {
      id: "11",
      name: "임집사",
      position: "찬양팀장",
      department: "찬양부",
      email: "worship@church.com",
      level: 2,
      parentId: "3",
      avatar: "https://via.placeholder.com/80x80/1d4ed8/ffffff?text=임집사",
    },
  ];

  // SWR을 사용하여 조직원 데이터 관리
  const fetcher = (key: string) => {
    // 위젯 설정에서 조직원 데이터를 가져오거나 기본 샘플 데이터 사용
    return Promise.resolve(widget.settings?.custom_data || sampleData);
  };

  const {
    data: organizationData = [],
    error,
    isLoading,
  } = useSWR(
    `organization-chart-${widget.id}-${JSON.stringify(widget.settings?.custom_data)}`,
    fetcher,
    {
      dedupingInterval: 60000, // 1분간 중복 요청 방지
      // 전역 설정 사용
    }
  );

  // 계층 구조 빌드
  const buildHierarchy = useCallback((data: Person[]): Person[] => {
    const map = new Map<string, Person>();
    const roots: Person[] = [];

    // 모든 사람을 맵에 저장
    data.forEach((person) => {
      map.set(person.id, { ...person, children: [] });
    });

    // 부모-자식 관계 설정
    data.forEach((person) => {
      const node = map.get(person.id)!;
      if (person.parentId) {
        const parent = map.get(person.parentId);
        if (parent) {
          parent.children!.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, []);

  const hierarchy = useMemo(() => {
    return buildHierarchy(organizationData);
  }, [organizationData, buildHierarchy]);

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return newExpanded;
    });
  }, []);

  // 기본적으로 모든 노드 확장
  useEffect(() => {
    if (organizationData.length > 0) {
      const allIds = organizationData.map((p: any) => p.id);
      setExpandedNodes(new Set(allIds));
    }
  }, [organizationData]);

  // 개인 카드 렌더링 - 현대적 디자인
  const renderPersonCard = (person: Person, isCompact = false) => {
    const hasChildren = person.children && person.children.length > 0;
    const isExpanded = expandedNodes.has(person.id);
    const positionStyle = getPositionStyle(person.position);
    const IconComponent = positionStyle.icon;

    // 동적 스타일 적용
    const cardWidth = isCompact
      ? cardSizeClasses.width.replace("w-", "w-")
      : cardSizeClasses.width;
    const shadowClass = enableShadows
      ? "shadow-lg hover:shadow-xl"
      : "shadow-sm";
    const animationClass = enableAnimations
      ? "transition-all duration-300 hover:scale-105"
      : "";
    const avatarSize = cardSizeClasses.avatar;
    const textSize = cardSizeClasses.text;

    return (
      <div key={person.id} className="flex flex-col items-center">
        <Card
          className={`${cardWidth} bg-white ${shadowClass} border-0 ${animationClass} relative overflow-hidden`}
        >
          {/* 상단 그라데이션 헤더 */}
          <div
            className={`bg-gradient-to-br ${positionStyle.bgColor} h-16 relative`}
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute -bottom-8 left-4 z-10">
              {showAvatars && person.avatar && (
                <div className="relative">
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className={`${avatarSize} rounded-full object-cover border-4 border-white shadow-lg`}
                    loading="lazy"
                  />
                  {showPositionIcons && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                      <IconComponent className="h-3 w-3 text-gray-600" />
                    </div>
                  )}
                </div>
              )}
            </div>
            {hasChildren && enableExpandCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpand(person.id)}
                className="absolute top-2 right-2 p-1 h-8 w-8 hover:bg-white/20 text-white rounded-full"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          <CardContent className="pt-12 pb-4 px-4">
            <div className="text-center mb-3">
              <h4 className={`font-bold ${textSize} text-gray-900 mb-1`}>
                {person.name}
              </h4>
              <p className="text-sm font-medium text-gray-600 mb-2">
                {person.position}
              </p>
              {showDepartments && person.department && (
                <Badge
                  variant="outline"
                  className={`text-xs ${themeColors.accent}`}
                >
                  {person.department}
                </Badge>
              )}
            </div>

            {showContact && (person.email || person.phone) && (
              <div className="space-y-2 mt-4 pt-3 border-t border-gray-100">
                {person.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{person.email}</span>
                  </div>
                )}
                {person.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span>{person.phone}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // 트리형 렌더링 - 개선된 연결선
  const renderTreeNode = (person: Person, level = 0) => {
    const hasChildren = person.children && person.children.length > 0;
    const isExpanded = expandedNodes.has(person.id);
    const showChildren = hasChildren && isExpanded;

    return (
      <div key={person.id} className="flex flex-col items-center">
        {renderPersonCard(person, chartStyle === CHART_STYLES.COMPACT)}

        {showChildren && (
          <>
            {/* 수직 연결선 - 그라데이션 */}
            <div
              className={`w-0.5 h-12 bg-gradient-to-b ${themeColors.secondary} ${spacingClasses.margin}`}
            ></div>

            {/* 자식 노드들 */}
            <div
              className={`flex flex-wrap justify-center ${spacingClasses.gap} relative`}
            >
              {person.children!.map((child, index: any) => (
                <div key={child.id} className="relative">
                  {/* 수평 연결선 - 여러 자식이 있을 때만 */}
                  {person.children!.length > 1 && (
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                      <div
                        className={`w-0.5 h-12 bg-gradient-to-b ${themeColors.secondary}`}
                      ></div>
                      {index === 0 && (
                        <div
                          className={`absolute top-0 left-0 h-0.5 bg-gradient-to-r ${themeColors.secondary} rounded-full`}
                          style={{
                            width: `${(person.children!.length - 1) * parseInt(spacingClasses.gap.split("-")[1]) * 4}px`,
                            left: "50%",
                          }}
                        ></div>
                      )}
                      {index > 0 && index < person.children!.length - 1 && (
                        <div
                          className={`absolute top-0 left-1/2 w-0.5 h-0.5 bg-gradient-to-r ${themeColors.secondary} rounded-full transform -translate-x-1/2`}
                        ></div>
                      )}
                    </div>
                  )}
                  {renderTreeNode(child, level + 1)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // 수평형 렌더링 - 개선된 디자인
  const renderHorizontalNode = (person: Person, level = 0) => {
    const hasChildren = person.children && person.children.length > 0;
    const isExpanded = expandedNodes.has(person.id);
    const showChildren = hasChildren && isExpanded;

    return (
      <div key={person.id} className="flex items-start gap-6">
        <div className="flex flex-col items-center">
          {renderPersonCard(person, true)}
        </div>

        {showChildren && (
          <div className="flex flex-col gap-6 pt-12">
            {person.children!.map((child, index: any) => (
              <div key={child.id} className="relative">
                <div className="absolute -left-6 top-12 w-6 h-px bg-gradient-to-r from-blue-400 to-blue-300"></div>
                {index > 0 && (
                  <div className="absolute -left-6 top-0 w-px h-12 bg-gradient-to-b from-blue-400 to-blue-300"></div>
                )}
                {renderHorizontalNode(child, level + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 카드형 렌더링 - 개선된 그룹핑
  const renderCardsLayout = () => {
    const groupedByLevel: Record<number, Person[]> = {};

    organizationData.forEach((person: Person) => {
      if (!groupedByLevel[person.level]) {
        groupedByLevel[person.level] = [];
      }
      groupedByLevel[person.level].push(person);
    });

    // 설정된 계층 이름을 사용하거나 기본값 사용
    const defaultLevelTitles = {
      0: "최고 경영진",
      1: "임원진",
      2: "부서장",
      3: "팀장",
      4: "팀원",
    };

    const getLevelTitle = (level: number) => {
      const customName = widget.settings?.level_names?.[level];
      if (customName) {
        return customName;
      }
      return (
        defaultLevelTitles[level as keyof typeof defaultLevelTitles] ||
        `레벨 ${level}`
      );
    };

    return (
      <div className="space-y-12">
        {Object.entries(groupedByLevel).map(([level, people]: any) => (
          <div key={level}>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                {getLevelTitle(parseInt(level))}
              </h3>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
              {people.map((person: any) => (
                <div key={person.id} className="w-full max-w-xs">
                  {renderPersonCard(person)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 상세라인형 렌더링 - 팀 소개 스타일
  const renderDetailedLayout = () => {
    const groupedByLevel: Record<number, Person[]> = {};

    organizationData.forEach((person: Person) => {
      if (!groupedByLevel[person.level]) {
        groupedByLevel[person.level] = [];
      }
      groupedByLevel[person.level].push(person);
    });

    return (
      <div className="space-y-16">
        {Object.entries(groupedByLevel).map(([level, people]: any) => (
          <div key={level} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {people.map((person: Person, index: number) => (
              <div
                key={person.id}
                className="flex flex-col lg:flex-row gap-6 items-center w-full"
              >
                {/* 프로필 이미지 */}
                <div className="flex-shrink-0 w-full lg:w-2/5">
                  <div className="relative">
                    <div className="w-full max-w-xs mx-auto aspect-square bg-gray-200 rounded-lg overflow-hidden">
                      {person.avatar ? (
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                          <User className="w-24 h-24 text-gray-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 상세 정보 */}
                <div className="flex-1 lg:w-3/5 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {person.position}
                    </h3>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      {person.name}
                    </h2>
                    {person.department && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {person.department}
                      </span>
                    )}
                  </div>

                  {/* 연락처 정보 */}
                  <div className="space-y-2">
                    {person.email && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Mail className="w-5 h-5" />
                        <span>{person.email}</span>
                      </div>
                    )}
                    {person.phone && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Phone className="w-5 h-5" />
                        <span>{person.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* 소셜 링크 */}
                  {person.social_links &&
                    Object.values(person.social_links).some(
                      (link: any) => link
                    ) && (
                      <div className="flex gap-3">
                        {person.social_links.facebook && (
                          <a
                            href={person.social_links.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
                          >
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          </a>
                        )}
                        {person.social_links.twitter && (
                          <a
                            href={person.social_links.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-black rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
                          >
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          </a>
                        )}
                        {person.social_links.linkedin && (
                          <a
                            href={person.social_links.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-800 transition-colors"
                          >
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                          </a>
                        )}
                        {person.social_links.instagram && (
                          <a
                            href={person.social_links.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                          </a>
                        )}
                        {person.social_links.threads && (
                          <a
                            href={person.social_links.threads}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-black rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
                          >
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.745-1.757-.513-.589-1.293-.2-2.253-.2-.809 0-1.612.159-2.38.472l-.48-1.874c.912-.375 1.918-.563 2.99-.563 1.505 0 2.658.483 3.425 1.437.637.793.951 1.824 1.034 2.958.085.05.168.102.249.156 1.16.784 1.857 1.751 2.095 2.882.309 1.471.157 3.307-1.188 5.185C17.999 22.663 15.598 23.971 12.186 24zM9.225 15.15c.49 0 .965-.04 1.41-.119.565-.095 1.023-.283 1.323-.544.328-.286.551-.679.652-1.14a11.459 11.459 0 0 0-2.717-.285c-.715.042-1.224.25-1.414.576-.146.251-.1.464-.025.617.117.238.342.386.771.386z" />
                            </svg>
                          </a>
                        )}
                        {person.social_links.youtube && (
                          <a
                            href={person.social_links.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors"
                          >
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                          </a>
                        )}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // 배경 스타일 결정
  const backgroundClass =
    backgroundStyle === "transparent"
      ? "bg-transparent"
      : backgroundStyle === "solid"
        ? "bg-white"
        : `bg-gradient-to-br ${themeColors.background}`;

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div className={`w-full ${backgroundClass} rounded-xl overflow-hidden`}>
        {widget.title && (
          <div className="p-6 bg-white border-b border-gray-100">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${themeColors.primary} rounded-full flex items-center justify-center`}
                >
                  <Users className="h-5 w-5 text-white" />
                </div>
                {widget.title}
              </h3>
            </div>
          </div>
        )}
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">조직도를 로딩 중입니다...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className={`w-full ${backgroundClass} rounded-xl overflow-hidden`}>
        {widget.title && (
          <div className="p-6 bg-white border-b border-gray-100">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${themeColors.primary} rounded-full flex items-center justify-center`}
                >
                  <Users className="h-5 w-5 text-white" />
                </div>
                {widget.title}
              </h3>
            </div>
          </div>
        )}
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-red-600 mb-2">
            조직도를 불러오는 중 오류가 발생했습니다
          </p>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${backgroundClass} rounded-xl overflow-hidden`}>
      {widget.title && (
        <div className="p-6 bg-white border-b border-gray-100">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
              {/* <div
                className={`w-10 h-10 bg-gradient-to-br ${themeColors.primary} rounded-full flex items-center justify-center`}
              >
                <Users className="h-5 w-5 text-white" />
              </div> */}
              {widget.title}
            </h3>
            <div
              className={`w-32 h-1 bg-gradient-to-r ${themeColors.secondary} mx-auto rounded-full`}
            ></div>
            {widget.settings?.description && (
              <p className="text-sm text-gray-600 mt-3 max-w-md mx-auto">
                {widget.settings.description}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="p-8">
        {chartStyle === CHART_STYLES.TREE && (
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {hierarchy.map((root: any) => renderTreeNode(root))}
            </div>
          </div>
        )}

        {chartStyle === CHART_STYLES.HORIZONTAL && (
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {hierarchy.map((root: any) => renderHorizontalNode(root))}
            </div>
          </div>
        )}

        {chartStyle === CHART_STYLES.COMPACT && (
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {hierarchy.map((root: any) => renderTreeNode(root))}
            </div>
          </div>
        )}

        {chartStyle === CHART_STYLES.CARDS && renderCardsLayout()}

        {chartStyle === CHART_STYLES.DETAILED && renderDetailedLayout()}
      </div>
    </div>
  );
}
