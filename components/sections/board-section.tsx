"use client";

import "@/app/globals.css";
import React, { useState, useEffect, useRef } from "react";
import BoardWrite from "./board-write";
import BoardDetail from "./board-detail";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

import {
  MessageSquare,
  LayoutGrid,
  Table as TableIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Settings2,
  EyeOff,
  List,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ITag } from "@/types/index";

interface BoardPost {
  id: string;
  title: string;
  content: string;
  user_id: string; // author 대신 user_id 사용
  created_at: string;
  views: number;
  view_count?: number; // views와 호환성 유지
  category_id?: string | null;
  category_slug?: string | null;
  comment_count?: number;
  page_id: string;
  is_notice?: boolean;
  is_pinned?: boolean;
  thumbnail_image?: string;
  published_at?: string | null; // 게시일 필드 추가
  tags?: string; // 태그 JSON 문자열
  author?: {
    username: string;
    avatar_url?: string;
  }; // 최적화된 API에서 제공하는 작성자 정보
}

// 사용자 정보 인터페이스
interface UserInfo {
  username: string;
  avatar_url?: string;
}

import { Section } from "@/components/admin/section-manager";
import { api } from "@/lib/api";
import useSWR from "swr";

interface BoardSectionProps {
  section: Section;
  className?: string;
  menuTitle?: string;
}

// fetcher 함수 분리
interface FetchBoardDataParams {
  pageId?: string;
  categoryId?: string;
  itemCount: number;
  page: number;
  searchType: string;
  searchTerm: string;
  sortOption?: string;
}
// 재시도 헬퍼 함수
async function retryQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      console.error(`Query attempt ${attempt + 1} failed:`, error);

      if (attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Retry logic error");
}

async function fetchBoardData({
  pageId,
  categoryId,
  itemCount,
  page,
  searchType,
  searchTerm,
  sortOption,
}: FetchBoardDataParams) {
  try {
    const url = new URL("/api/board", window.location.origin);

    // 파라미터 설정
    const params: Record<string, string> = {
      itemCount: itemCount.toString(),
      page: page.toString(),
    };

    if (pageId) params.pageId = pageId;
    if (categoryId) params.categoryId = categoryId;
    if (searchType) params.searchType = searchType;
    if (searchTerm) params.searchTerm = searchTerm;
    // sortOption 항상 전달 (undefined면 latest로)
    params.sortOption = sortOption || "latest";

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error("Board data fetch failed:", error);
    return {
      posts: [],
      totalCount: 0,
      totalPages: 1,
      authorInfoMap: {},
    };
  }
}

export default function BoardSection({
  section,
  className = "",
  menuTitle,
}: BoardSectionProps) {
  // 컨테이너 클래스 설정 - 브레드크럼과 동일한 여백 적용
  const containerClass = "container mx-auto px-0";
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // section에서 필요한 정보 추출
  const title = menuTitle || section.title || "게시판";
  const description = section.description;

  // settings 확장 지원 (itemCount, categoryId, pageId 등)
  // 타입스크립트 오류 방지: settings, category, 기타 동적 필드만 접근 (as any 단언 추가)
  const s = section as any;
  const [itemCount, setItemCount] = useState<number>(() => {
    // localStorage에서 저장된 값을 불러옴
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("board_itemCount");
      if (saved) {
        try {
          return parseInt(saved, 10);
        } catch {}
      }
    }
    // 기본값 설정
    return (
      s.settings?.itemCount ??
      (typeof s.itemCount === "number" ? s.itemCount : 10)
    );
  });

  // itemCount가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("board_itemCount", itemCount.toString());
  }, [itemCount]);

  const categoryId =
    s.settings?.categoryId ??
    (typeof s.categoryId === "string" ? s.categoryId : undefined) ??
    (s.category && typeof s.category.id === "string"
      ? s.category.id
      : undefined) ??
    (typeof s.category_id === "string" ? s.category_id : undefined);
  const pageId =
    s.settings?.pageId ?? (typeof s.pageId === "string" ? s.pageId : undefined);
  const showViewAll = s.settings?.showViewAll !== false;

  // 검색 관련 상태
  const [searchType, setSearchType] = useState<string>("title");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 정렬 옵션 state
  const [sortOption, setSortOption] = useState<string>("latest");

  // 정렬 옵션 정의
  const sortOptions = [
    { value: "latest", label: "최신순" },
    { value: "popular", label: "인기순" },
    { value: "likes", label: "좋아요순" },
    { value: "comments", label: "댓글순" },
  ];

  // Pagination state
  const [page, setPage] = useState(1);

  // 레이아웃 타입 정의
  type LayoutType = "table" | "card" | "list";

  // 모바일 상태 초기값 설정
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 상태 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 레이아웃 상태 (테이블형/카드형/목록형)
  const [layout, setLayout] = useState<LayoutType>(() => {
    // localStorage에서 저장된 값을 불러옴
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("board_layout");
      if (saved === "table" || saved === "card" || saved === "list") {
        return saved as LayoutType;
      }
    }
    // 기본값 설정 - 기본은 리스트형
    return "list";
  });

  // 레이아웃 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("board_layout", layout);
  }, [layout]);

  // 모바일 상태 변경 시 레이아웃 자동 전환 (제거 - 사용자가 직접 선택할 수 있도록)
  // useEffect(() => {
  //   // 모바일에서는 목록형을 기본으로 사용
  //   if (isMobile && layout !== "list") {
  //     setLayout("list");
  //   }
  // }, [isMobile, layout]);

  // 컬럼 정렬 및 표시 상태 관리
  const [columnStates, setColumnStates] = useState<{
    [key: string]: { sort: "none" | "asc" | "desc" };
  }>({
    number: { sort: "none" },
    title: { sort: "none" },
    created_at: { sort: "desc" }, // 기본값: 작성일 내림차순
    view_count: { sort: "none" },
    comment_count: { sort: "none" },
  });

  // 컬럼 표시/숨김 상태 관리
  // const [visibleColumns, setVisibleColumns] = useState({
  //   number: true,
  //   title: true,
  //   author: true,
  //   created_at: true,
  //   view_count: true,
  //   comment_count: true,
  // });

  // 컬럼 레이블 정의
  const columnLabels: { [key: string]: string } = {
    number: "번호",
    title: "제목",
    author: "작성자",
    created_at: "작성일",
    view_count: "조회",
    comment_count: "댓글",
  };

  // 컬럼 설정 토글 함수
  const toggleColumn = (columnKey: keyof typeof visibleColumns) => {
    // 번호 컬럼은 토글 불가
    if (columnKey === "number") return;

    setVisibleColumns((prev: typeof visibleColumns) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  // 정렬 함수
  function getSortedPosts(posts: BoardPost[]) {
    const sorted = [...posts];
    const activeSort = Object.entries(columnStates).find(
      ([_, state]) => state.sort !== "none"
    );

    if (!activeSort) return sorted;

    const [key, state] = activeSort;

    sorted.sort((a, b) => {
      let aValue = a[key as keyof BoardPost];
      let bValue = b[key as keyof BoardPost];

      if (key === "number") {
        // 현재 페이지에서의 순서를 기준으로 정렬
        const aIndex = posts.indexOf(a);
        const bIndex = posts.indexOf(b);
        aValue = aIndex;
        bValue = bIndex;
      }
      if (["view_count", "views", "comment_count"].includes(key)) {
        aValue = Number(aValue ?? 0);
        bValue = Number(bValue ?? 0);
      }
      if (key === "created_at") {
        aValue = new Date((aValue ?? "").toString()).getTime();
        bValue = new Date((bValue ?? "").toString()).getTime();
      }
      if (key === "title") {
        aValue = ((aValue ?? "") as string).toLowerCase();
        bValue = ((bValue ?? "") as string).toLowerCase();
      }

      if (aValue! < bValue!) return state.sort === "asc" ? -1 : 1;
      if (aValue! > bValue!) return state.sort === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  // 컬럼 정렬 상태 변경
  const handleSort = (columnKey: string, order: "asc" | "desc") => {
    setColumnStates((prev) => {
      const newStates = { ...prev };
      // 다른 모든 컬럼의 정렬 상태를 초기화
      Object.keys(newStates).forEach((key) => {
        if (key !== columnKey) {
          newStates[key] = { ...newStates[key], sort: "none" };
        }
      });
      // 선택된 컬럼의 정렬 상태 변경
      newStates[columnKey] = { ...newStates[columnKey], sort: order };
      return newStates;
    });
  };

  // 컬럼 숨김 처리
  const hideColumn = (columnKey: keyof typeof visibleColumns) => {
    // 번호 컬럼은 숨김 불가
    if (columnKey === "number") return;

    setVisibleColumns((prev: typeof visibleColumns) => ({
      ...prev,
      [columnKey]: false,
    }));
  };

  // 컬럼별 최소 px 폭 지정 - 모바일/데스크탑 분리
  const columnMinWidths: { [key: string]: number } = {
    number: 80, // 데스크탑 기준
    title: 420, // 데스크탑 기준
    author: 100,
    created_at: 120,
    view_count: 80,
    comment_count: 80,
  };

  // 이미 위에서 선언했으므로 제거

  // 초기 컬럼 폭 비율 - 데스크탑/모바일 분리
  const initialPercents: { [key: string]: number } = {
    number: 10,
    title: isMobile ? 50 : 40,
    author: 15,
    created_at: isMobile ? 25 : 15,
    view_count: isMobile ? 25 : 10,
    comment_count: 10,
  };

  // localStorage에서 초기값 읽는 함수
  function getInitialVisibleColumns() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("board_visibleColumns");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return {
      number: true,
      title: true,
      author: true,
      created_at: true,
      view_count: true,
      comment_count: true,
    };
  }
  function getInitialColPercents() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("board_colPercents");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return initialPercents;
  }

  const [visibleColumns, setVisibleColumns] = useState(
    getInitialVisibleColumns
  );
  const [colPercents, setColPercents] = useState(getInitialColPercents);

  // 2. 리사이저 드래그
  const resizingRef = useRef<{
    leftKey: string;
    rightKey: string;
    startX: number;
    startLeft: number;
    startRight: number;
  } | null>(null);

  const handleResizeStart = (
    e: React.MouseEvent,
    leftKey: string,
    rightKey: string
  ) => {
    resizingRef.current = {
      leftKey,
      rightKey,
      startX: e.clientX,
      startLeft: colPercents[leftKey],
      startRight: colPercents[rightKey],
    };
    document.body.style.cursor = "col-resize";
  };

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!resizingRef.current) return;
      const { leftKey, rightKey, startX, startLeft, startRight } =
        resizingRef.current;
      const tableWidth = tableRef.current?.offsetWidth || 1;
      const diffPx = e.clientX - startX;
      const diffPercent = (diffPx / tableWidth) * 100;
      // 최소폭을 %로 변환
      const minLeftPercent = (columnMinWidths[leftKey] / tableWidth) * 100;
      const minRightPercent = (columnMinWidths[rightKey] / tableWidth) * 100;
      let newLeft = Math.max(minLeftPercent, startLeft + diffPercent);
      let newRight = Math.max(minRightPercent, startRight - diffPercent);
      // min 보장
      if (startLeft + diffPercent < minLeftPercent) {
        newLeft = minLeftPercent;
        newRight = startRight + (startLeft - minLeftPercent);
      }
      if (startRight - diffPercent < minRightPercent) {
        newRight = minRightPercent;
        newLeft = startLeft + (startRight - minRightPercent);
      }
      setColPercents((prev: typeof colPercents) => ({
        ...prev,
        [leftKey]: newLeft,
        [rightKey]: newRight,
      }));
    }
    function onMouseUp() {
      resizingRef.current = null;
      document.body.style.cursor = "";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // 검색 상태는 이미 위에서 선언됨

  // 인라인 상세보기용 상태
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // 검색 핸들러 추가
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // 검색 시 첫 페이지로 이동
    setSearchTerm(searchInput);
    // 검색 시 데이터 새로 로딩
  };

  // 정렬 변경 핸들러
  const handleSortChange = (newSortOption: string) => {
    setSortOption(newSortOption);
    setPage(1); // 정렬 변경 시 첫 페이지로
  };

  // SWR을 사용한 데이터 관리
  const { data, error, isLoading, mutate } = useSWR(
    pageId && !selectedPostId
      ? [
          "boardData",
          pageId,
          categoryId,
          itemCount,
          page,
          searchType,
          searchTerm,
          layout === "table" ? "latest" : sortOption,
        ]
      : null,
    () =>
      fetchBoardData({
        pageId: pageId!,
        categoryId,
        itemCount,
        page,
        searchType,
        searchTerm,
        sortOption: layout === "table" ? "latest" : sortOption,
      }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 3000, // 3초로 단축
      keepPreviousData: true,
    }
  );

  // 공지/고정글/일반글 분리
  const now = Date.now();

  // sortedPosts 먼저 정의
  // 테이블형에서만 프론트엔드 정렬, 리스트형/카드형에서는 API 정렬 유지
  const sortedPosts =
    layout === "table"
      ? [...(data?.posts || [])].sort((a, b) => {
          // 1. 고정글 우선
          const aPinned = a.is_pinned ? 1 : 0;
          const bPinned = b.is_pinned ? 1 : 0;
          if (aPinned !== bPinned) {
            return bPinned - aPinned; // 고정글이 위로
          }

          // 2. 공지사항 우선 (고정글이 아닌 경우)
          const aNotice = a.is_notice ? 1 : 0;
          const bNotice = b.is_notice ? 1 : 0;
          if (aNotice !== bNotice) {
            return bNotice - aNotice; // 공지사항이 위로
          }

          // 3. 날짜 정렬: published_at 우선, 없으면 created_at
          const aDate = new Date(a.published_at || a.created_at);
          const bDate = new Date(b.published_at || b.created_at);

          const timeDiff = bDate.getTime() - aDate.getTime();

          // 4. 날짜가 같으면 ID로 정렬 (안정성 보장)
          if (timeDiff === 0) {
            return a.id.localeCompare(b.id);
          }

          return timeDiff; // 최신순
        })
      : [...(data?.posts || [])]; // 리스트형/카드형에서는 API 정렬 그대로 사용

  const notices =
    sortedPosts.filter((p: BoardPost) => p.is_notice || p.is_pinned) || [];
  const normals =
    sortedPosts.filter((p: BoardPost) => !p.is_notice && !p.is_pinned) || [];

  // 실제 테이블에 표시할 posts (이미 정렬된 상태이므로 추가 정렬 불필요)
  const sortedNotices = notices;
  const sortedNormals = normals;

  // 새 글 표시 (3일 이내) - published_at 우선, 없으면 created_at
  function isNew(post: BoardPost) {
    try {
      // published_at이 있으면 우선 사용, 없으면 created_at 사용
      const dateString = post.published_at || post.created_at;
      const postDate = new Date(dateString);
      const diffMs = now - postDate.getTime();
      return diffMs < 3 * 24 * 60 * 60 * 1000; // 3일 이내
    } catch (e) {
      return false;
    }
  }

  // 게시글 내용 요약 (HTML 태그 제거 및 길이 제한)
  function getSummary(content: string, maxLength = 100) {
    const plainText = content.replace(/<[^>]*>/g, "");
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + "...";
  }

  // 시간 형식 변환 - mm. dd. yy 형식 (published_at 우선, 없으면 created_at)
  function formatTime(post: BoardPost) {
    try {
      // published_at이 있으면 우선 사용, 없으면 created_at 사용
      const dateString = post.published_at || post.created_at;
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "날짜 오류";

      // 오늘 이내면 "몇 시간 전" 형식
      const now = new Date();
      const diffHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      if (diffHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true, locale: ko });
      }

      // mm. dd. yy 형식으로 표시
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = String(date.getFullYear()).slice(-2); // 연도의 마지막 2자리만 사용

      return `${month}. ${day}. ${year}`;
    } catch (e) {
      return "날짜 오류";
    }
  }

  // 인라인 상세보기용 게시글 클릭 핸들러
  async function handlePostClick(postId: string) {
    // 상태를 먼저 설정하여 즉시 UI 전환
    setSelectedPostId(postId);

    // URL 업데이트
    const params = new URLSearchParams(window.location.search);
    params.set("post", postId);
    const newUrl = `${pathname}?${params.toString()}`;

    // URL 변경 (비동기로 처리하여 UI 블로킹 방지)
    router.push(newUrl, { scroll: false });

    try {
      // 조회수 증가 - API 호출로 변경 (일단 주석 처리)
      // TODO: 조회수 증가 API 구현 필요
      /*
      const response = await fetch(`/api/posts/${postId}/increment-view`, {
        method: 'POST'
      });
      */
    } catch (error) {
      // 무시
    }
  }

  // 게시글 작성 폼 표시 제어
  const handleWriteSuccess = () => {
    mutate(); // SWR 캐시 무효화하여 최신 글 목록 반영
  };

  // 상세에서 목록으로 돌아가기 (쿼리스트링에서 post 제거)
  function handleBackToList() {
    setSelectedPostId(null);
    const params = new URLSearchParams(window.location.search);
    params.delete("post");
    router.push(
      `${pathname}${params.toString() ? "?" + params.toString() : ""}`,
      { scroll: false }
    );
  }

  // 컬럼 헤더 렌더링 함수 (리사이저는 마지막 컬럼 제외, handleResizeStart만 사용)
  const renderColumnHeader = (
    key: string,
    label: string,
    className: string = "",
    canSort: boolean = true,
    isLast: boolean = false,
    visibleKeys: string[] = [],
    idx: number = 0
  ) => {
    const state = columnStates[key];
    const sortIcon =
      state?.sort === "asc" ? (
        <ArrowUp className="inline w-3 h-3 ml-1" />
      ) : state?.sort === "desc" ? (
        <ArrowDown className="inline w-3 h-3 ml-1" />
      ) : canSort ? (
        <ArrowUpDown className="inline w-3 h-3 ml-1 text-gray-400" />
      ) : null;

    const isNumber = key === "number";

    return (
      <TableHead
        key={`col-header-${key}`}
        className={`relative text-center font-semibold text-gray-700 dark:text-gray-300 select-none ${className}`}
        style={{
          width: isMobile
            ? key === "title"
              ? "50%"
              : key === "created_at"
                ? "25%"
                : key === "view_count"
                  ? "25%"
                  : "auto"
            : `${colPercents[key]}%`,
          minWidth: isMobile ? undefined : columnMinWidths[key],
          maxWidth: isMobile ? undefined : 800,
        }}
      >
        <div className="flex items-center justify-center gap-1 w-full h-full">
          {isNumber ? (
            <span className="px-2 py-1">{label}</span>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-offset-2 border border-transparent bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                  style={{ fontWeight: 600 }}
                >
                  {label}
                  {sortIcon}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleSort(key, "asc")}>
                  {" "}
                  <ArrowUp className="w-4 h-4 mr-2" /> 오름차순{" "}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort(key, "desc")}>
                  {" "}
                  <ArrowDown className="w-4 h-4 mr-2" /> 내림차순{" "}
                </DropdownMenuItem>
                {!isNumber && <DropdownMenuSeparator />}
                {!isNumber && (
                  <DropdownMenuItem
                    onClick={() =>
                      hideColumn(key as keyof typeof visibleColumns)
                    }
                  >
                    <EyeOff className="w-4 h-4 mr-2" /> 숨기기
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {/* 리사이저: 마지막 컬럼 전까지만 생성 */}
        {/* 리사이저: 데스크탑에서만 표시 */}
        {idx < visibleKeys.length - 1 && window.innerWidth >= 640 && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent z-50 hidden sm:block"
            style={{ userSelect: "none", pointerEvents: "auto" }}
            onMouseDown={(e) => handleResizeStart(e, key, visibleKeys[idx + 1])}
          >
            <div className="w-1 h-full bg-blue-400 transition-opacity duration-150 opacity-0 hover:opacity-100" />
          </div>
        )}
      </TableHead>
    );
  };

  // 컬럼 표시/숨김, 폭을 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(
      "board_visibleColumns",
      JSON.stringify(visibleColumns)
    );
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem("board_colPercents", JSON.stringify(colPercents));
  }, [colPercents]);

  // 마운트 시 localStorage에서 불러오기
  useEffect(() => {
    const savedVisible = localStorage.getItem("board_visibleColumns");
    if (savedVisible) {
      try {
        setVisibleColumns(JSON.parse(savedVisible));
      } catch {}
    }
    const savedPercents = localStorage.getItem("board_colPercents");
    if (savedPercents) {
      try {
        setColPercents(JSON.parse(savedPercents));
      } catch {}
    }
  }, []);

  // 마운트 시 쿼리스트링에 post가 있으면 바로 상세로 진입
  // URL 변경을 감지하여 selectedPostId 업데이트
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const postId = params.get("post");
      setSelectedPostId(postId);
    }
  }, [searchParams]); // searchParams 의존성 추가

  const posts: BoardPost[] = data?.posts || [];
  const totalCount: number = data?.totalCount || 0;
  const totalPages: number = data?.totalPages || 1;
  const authorInfoMap: Record<string, UserInfo> = data?.authorInfoMap || {};


  if (selectedPostId) {
    // 인라인 상세보기
    return (
      <div className={`board-section mb-8 ${className} ${containerClass}`}>
        <BoardDetail postId={selectedPostId} onBack={handleBackToList} />
      </div>
    );
  }

  // // 로딩 상태 UI
  // if (isLoading) {
  //   return (
  //     <div className={`board-section ${className} ${containerClass}`}>
  //       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
  //         <div className="space-y-2">
  //           <Skeleton className="h-8 w-48" />
  //           <Skeleton className="h-4 w-72" />
  //         </div>
  //         <div className="flex gap-2">
  //           <Skeleton className="h-9 w-24" />
  //           <Skeleton className="h-9 w-20" />
  //         </div>
  //       </div>
  //       <div className="rounded-lg border bg-white">
  //         <div className="p-2">
  //           {Array.from({ length: 5 }).map((_, i) => (
  //             <div key={i} className="flex items-center space-x-4 py-3">
  //               <Skeleton className="h-4 w-12" />
  //               <Skeleton className="h-4 flex-1" />
  //               <Skeleton className="h-4 w-20" />
  //               <Skeleton className="h-4 w-16" />
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // 에러 상태 UI
  if (error) {
    return (
      <div
        className={`board-section ${className} ${containerClass} bg-red-50 border border-red-200 rounded sm:p-4 my-4 text-red-800`}
      >
        <h3 className="font-bold mb-2">데이터 로드 오류</h3>
        <p>{error.message}</p>
        <Button variant="outline" className="mt-2" onClick={() => mutate()}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className={`board-section mb-8 ${className} ${containerClass}`}>
      {/* 타이틀/설명 헤더를 최상단에 분리 */}
      <div className="my-4">
        <div className="flex items-center gap-3 px-2 sm:px-0">
          <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
          <div className="text-xs text-blue-500 bg-white px-2 py-1 rounded-xl">
            {totalCount}
          </div>
        </div>
        {description && (
          <p className="text-gray-500 mt-1 px-2 sm:px-0">{description}</p>
        )}
      </div>
      {/* 필터/버튼 + 게시글 목록을 하나의 카드로 감싸기 */}
      <div className="sm:rounded-lg border-gray-100 shadow-sm bg-white">
        {/* 필터/버튼 영역 */}
        <div className="flex justify-between items-center border-b border-gray-100 px-4 py-3">
          {/* 정렬 드롭다운 - 리스트형과 카드형에서만 표시 */}
          {layout !== "table" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  {sortOptions.find((option) => option.value === sortOption)
                    ?.label || "정렬"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>정렬 방식</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={sortOption === option.value ? "bg-blue-50" : ""}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div></div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="px-3 py-2 border-gray-100 border rounded-lg text-sm min-w-[75px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={itemCount}
              onChange={(e) => setItemCount(Number(e.target.value))}
            >
              <option value={10}>10개씩</option>
              <option value={20}>20개씩</option>
              <option value={30}>30개씩</option>
              <option value={40}>40개씩</option>
              <option value={50}>50개씩</option>
            </select>
            {/* 레이아웃 토글 버튼 */}
            <div className="flex gap-1 ml-2">
              <button
                type="button"
                className={`p-2 rounded border ${layout === "list" ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-white border-gray-100 text-gray-400"}`}
                onClick={() => setLayout("list")}
                title="목록형 보기"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                className={`p-2 rounded border ${layout === "table" ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-white border-gray-100 text-gray-400"} ${isMobile ? "hidden" : ""}`}
                onClick={() => setLayout("table")}
                title="테이블형 보기"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                className={`p-2 rounded border ${layout === "card" ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-white border-gray-100 text-gray-400"}`}
                onClick={() => setLayout("card")}
                title="카드형 보기"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            {/* 컬럼 설정 드롭다운 */}
            {layout === "table" && !isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-2 hidden sm:flex"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>표시할 항목</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(columnLabels).map(([key, label]) => {
                    const isNumber = key === "number";
                    return (
                      <DropdownMenuItem
                        key={key}
                        className={`flex items-center justify-between gap-2 ${isNumber ? "opacity-50" : ""}`}
                        onSelect={(e) => {
                          e.preventDefault();
                          if (!isNumber) {
                            toggleColumn(key as keyof typeof visibleColumns);
                          }
                        }}
                      >
                        <span>{label}</span>
                        <Badge
                          variant="outline"
                          className={
                            isNumber
                              ? "bg-blue-50"
                              : visibleColumns[
                                    key as keyof typeof visibleColumns
                                  ]
                                ? "bg-blue-50"
                                : "bg-gray-50"
                          }
                        >
                          {isNumber
                            ? "고정"
                            : visibleColumns[key as keyof typeof visibleColumns]
                              ? "표시"
                              : "숨김"}
                        </Badge>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => {
                  const writeUrl = new URL(
                    `${pathname.replace(/\/$/, "")}/write`,
                    window.location.origin
                  );
                  if (pageId) writeUrl.searchParams.set("pageId", pageId);
                  if (categoryId)
                    writeUrl.searchParams.set("categoryId", categoryId);
                  router.push(writeUrl.pathname + writeUrl.search);
                }}
                className="ml-2 border-gray-100"
              >
                글쓰기
              </Button>
            )}
          </div>
        </div>
        {/* 게시글 목록 - 레이아웃 분기 */}
        <div className="p-0">
          {layout === "list" ? (
            // 목록형 - 모바일에 최적화된 레이아웃
            <div className="bg-white dark:bg-gray-900">
              {/* 공지사항 */}
              {sortedNotices.map((post) => (
                <div
                  key={post.id}
                  className="flex cursor-pointer items-start border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md shadow-sm min-h-[88px]"
                  onClick={() => handlePostClick(post.id)}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    {/* 제목 영역 - 최대 2줄, 넘치면 ... 처리 */}
                    <div className="flex items-start gap-1">
                      {isNew(post) && (
                        <div className="w-1 h-1 bg-red-500 rounded-full shrink-0 mt-2.5 animate-pulse" />
                      )}
                      <Badge className="bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white font-bold px-1.5 py-0.5 text-xs rounded mt-0.5 shrink-0">
                        공지
                      </Badge>
                      <div
                        className="text-md font-medium line-clamp-2"
                        style={{ wordBreak: "break-word" }}
                      >
                        {post.title}
                      </div>
                    </div>

                    {/* 작성자, 날짜, 조회수 영역 */}
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span
                        className="truncate max-w-[80px]"
                        title={authorInfoMap[post.user_id]?.username || "익명"}
                      >
                        {authorInfoMap[post.user_id]?.username || "익명"}
                      </span>
                      <span className="mx-1.5">·</span>
                      <span>{formatTime(post)}</span>
                      <span className="mx-1.5">·</span>
                      <span>조회 {post.view_count ?? 0}</span>
                    </div>
                  </div>

                  {/* 썸네일 이미지 영역 - 있는 경우에만 표시 */}
                  {post.thumbnail_image && (
                    <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                      <img
                        src={post.thumbnail_image}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* 일반 게시글 */}
              {sortedNormals.length === 0 && sortedNotices.length === 0 ? (
                <div className="text-center text-gray-400 dark:text-gray-500 py-12 bg-gray-50 dark:bg-gray-800">
                  게시글이 없습니다.
                </div>
              ) : (
                sortedNormals.map((post) => (
                  <div
                    key={post.id}
                    className="flex cursor-pointer px-2 py-3 overflow-hidden border-t items-start border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 min-h-[80px]"
                    onClick={() => handlePostClick(post.id)}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      {/* 제목 영역 - 최대 2줄, 넘치면 ... 처리 */}
                      <div className="flex items-start gap-1">
                        {isNew(post) && (
                          <div className="w-1 h-1 bg-red-500 rounded-full shrink-0 mt-2 animate-pulse" />
                        )}
                        {post.is_pinned && (
                          <Badge className="bg-green-500 dark:bg-green-600 text-white rounded-full px-1.5 py-0.5 text-xs mt-0.5 shrink-0">
                            고정
                          </Badge>
                        )}
                        <div className="flex-1 items-center gap-1">
                          <div
                            className="text-md line-clamp-2"
                            style={{ wordBreak: "break-word" }}
                          >
                            {post.title}
                          </div>

                          {/* 작성자, 날짜, 조회수 영역 */}
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span
                              className="truncate max-w-[80px]"
                              title={
                                authorInfoMap[post.user_id]?.username || "익명"
                              }
                            >
                              {authorInfoMap[post.user_id]?.username || "익명"}
                            </span>
                            <span className="mx-1.5">·</span>
                            <span>{formatTime(post)}</span>
                            <span className="mx-1.5">·</span>
                            <span>조회 {post.view_count ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 썸네일 이미지 영역 - 있는 경우에만 표시 */}
                    {post.thumbnail_image && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                        <img
                          src={post.thumbnail_image}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="ml-2 flex flex-col h-16 w-11 text-md text-center items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl px-2 py-0.5">
                      {/* 숫자를 별도의 div로 감싸기 */}
                      <div className="text-md">{post.comment_count ?? 0}</div>
                      {/* "댓글"을 별도의 div로 감싸기 (원래 있었음) */}
                      <div className="text-xs text-gray-500">댓글</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : layout === "table" ? (
            // 테이블형
            <div
              className={`overflow-x-auto rounded-lg dark:border-gray-800 bg-white dark:bg-gray-900 text-sm`}
            >
              <Table
                ref={tableRef}
                className="w-full"
                style={{
                  tableLayout: "fixed",
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <colgroup>
                  {Object.keys(columnLabels)
                    .filter(
                      (k) => visibleColumns[k as keyof typeof visibleColumns]
                    )
                    .map((key) => (
                      <col
                        key={key}
                        className={
                          key === "number"
                            ? "hidden sm:table-cell"
                            : key === "title"
                              ? "w-[70%] sm:w-auto"
                              : key === "author"
                                ? "hidden sm:table-cell"
                                : key === "created_at"
                                  ? "w-[15%] sm:w-auto"
                                  : key === "view_count"
                                    ? "w-[15%] sm:w-auto"
                                    : "hidden sm:table-cell"
                        }
                      />
                    ))}
                </colgroup>
                <TableHeader>
                  <TableRow>
                    {Object.keys(columnLabels)
                      .filter(
                        (k) => visibleColumns[k as keyof typeof visibleColumns]
                      )
                      .map((key, idx, visibleKeys) => {
                        const label =
                          key === "number"
                            ? "번호"
                            : key === "title"
                              ? "제목"
                              : key === "author"
                                ? "작성자"
                                : key === "created_at"
                                  ? "날짜"
                                  : key === "view_count"
                                    ? "조회"
                                    : key === "comment_count"
                                      ? "댓글"
                                      : columnLabels[key];

                        const className =
                          key === "number"
                            ? "w-14 px-1 sm:px-2 text-xs sm:text-sm hidden sm:table-cell"
                            : key === "title"
                              ? "w-[70%] sm:w-auto px-1 sm:px-2 text-xs sm:text-sm"
                              : key === "author"
                                ? "w-24 hidden sm:table-cell px-1 sm:px-2 text-xs sm:text-sm"
                                : key === "created_at"
                                  ? "w-[15%] sm:w-auto px-1 sm:px-2 text-xs sm:text-sm"
                                  : key === "view_count"
                                    ? "w-[15%] sm:w-auto px-1 sm:px-2 text-xs sm:text-sm"
                                    : "w-20 hidden sm:table-cell px-1 sm:px-2 text-xs sm:text-sm";

                        const canSort = key !== "author";
                        const isLast = idx === visibleKeys.length - 1;

                        // key prop을 TableHead 컴포넌트에 직접 전달하도록 renderColumnHeader 함수 호출
                        return renderColumnHeader(
                          key,
                          label,
                          className,
                          canSort,
                          isLast,
                          visibleKeys,
                          idx
                        );
                      })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedNotices.map((post) => {
                    const visibleKeys = Object.keys(columnLabels).filter(
                      (k) => visibleColumns[k as keyof typeof visibleColumns]
                    );
                    return (
                      <TableRow
                        key={post.id}
                        className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-gray-100 dark:border-gray-800"
                      >
                        {visibleKeys.map((key) => (
                          <TableCell
                            key={key}
                            className={`${
                              key === "number"
                                ? "text-center text-gray-400 dark:text-gray-500 px-1 sm:px-2 text-xs hidden sm:table-cell"
                                : key === "title"
                                  ? "w-[70%] sm:w-auto py-2 px-2"
                                  : key === "author"
                                    ? "text-center text-gray-800 dark:text-gray-300 whitespace-nowrap py-2 hidden sm:table-cell"
                                    : key === "created_at"
                                      ? "w-[15%] sm:w-auto text-center text-gray-500 dark:text-gray-400 whitespace-nowrap py-2 px-1 sm:px-2 text-xs"
                                      : key === "view_count"
                                        ? "w-[15%] sm:w-auto text-center text-gray-500 dark:text-gray-400 py-2 px-1 sm:px-2 text-xs"
                                        : "text-center text-gray-500 dark:text-gray-400 py-2 hidden sm:table-cell"
                            }`}
                          >
                            {/* 각 컬럼별 내용 렌더링 */}
                            {key === "number" && "공지"}
                            {key === "title" && (
                              <div className="flex items-center gap-1 overflow-hidden max-w-full">
                                {/* 뱃지들 - flex-shrink-0으로 고정 크기 */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {post.is_notice && (
                                    <Badge className="bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white font-bold px-1.5 py-0.5 text-xs rounded">
                                      공지
                                    </Badge>
                                  )}
                                  {post.is_pinned && (
                                    <Badge className="bg-green-500 dark:bg-green-600 text-white rounded-full px-1.5 py-0.5 text-xs">
                                      고정
                                    </Badge>
                                  )}
                                  {isNew(post) && (
                                    <Badge
                                      className="bg-blue-100 text-blue-700 font-bold text-[11px] rounded-full border border-blue-200 px-2 py-0.5 min-w-[22px] h-5 flex items-center justify-center shadow-sm tracking-wide"
                                      style={{
                                        lineHeight: "1.1",
                                        fontWeight: 700,
                                        letterSpacing: "0.04em",
                                      }}
                                    >
                                      N
                                    </Badge>
                                  )}
                                </div>
                                {/* 제목 - 남은 공간에서 truncate */}
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <Button
                                    variant="link"
                                    className="text-xs sm:text-sm text-black font-medium hover:no-underline transition-colors p-0 h-auto text-left w-full justify-start"
                                    onClick={() => handlePostClick(post.id)}
                                    title={post.title}
                                  >
                                    <span className="truncate block w-full text-left">
                                      {post.title}
                                    </span>
                                  </Button>
                                </div>
                              </div>
                            )}
                            {key === "author" &&
                              (authorInfoMap[post.user_id]?.username || "익명")}
                            {key === "created_at" && formatTime(post)}
                            {key === "view_count" && (post.view_count ?? 0)}
                            {key === "comment_count" &&
                              (post.comment_count ?? 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  {sortedNormals.length === 0 && sortedNotices.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={
                          Object.values(visibleColumns).filter(Boolean).length
                        }
                        className="text-center text-gray-400 dark:text-gray-500 py-12 bg-gray-50 dark:bg-gray-800 px-1 sm:px-2"
                      >
                        게시글이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                  {sortedNormals.map((post, rowIdx) => {
                    const visibleKeys = Object.keys(columnLabels).filter(
                      (k) => visibleColumns[k as keyof typeof visibleColumns]
                    );
                    return (
                      <TableRow
                        key={post.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                      >
                        {visibleKeys.map((key) => (
                          <TableCell
                            key={key}
                            className={`${
                              key === "number"
                                ? "text-center text-gray-400 dark:text-gray-500 px-1 sm:px-2 text-xs hidden sm:table-cell"
                                : key === "title"
                                  ? "w-[70%] sm:w-auto py-2 px-2"
                                  : key === "author"
                                    ? "text-center text-gray-800 dark:text-gray-300 whitespace-nowrap py-2 hidden sm:table-cell"
                                    : key === "created_at"
                                      ? "w-[15%] sm:w-auto text-center text-gray-500 dark:text-gray-400 whitespace-nowrap py-2 px-1 sm:px-2 text-xs"
                                      : key === "view_count"
                                        ? "w-[15%] sm:w-auto text-center text-gray-500 dark:text-gray-400 py-2 px-1 sm:px-2 text-xs"
                                        : "text-center text-gray-500 dark:text-gray-400 py-2 hidden sm:table-cell"
                            }`}
                          >
                            {/* 각 컬럼별 내용 렌더링 */}
                            {key === "number" &&
                              (totalCount > 0
                                ? totalCount - ((page - 1) * itemCount + rowIdx)
                                : rowIdx + 1)}
                            {key === "title" && (
                              <div className="flex items-center gap-1 overflow-hidden max-w-full">
                                {/* 뱃지들 - flex-shrink-0으로 고정 크기 */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {post.is_notice && (
                                    <Badge className="bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white font-bold px-1.5 py-0.5 text-xs rounded">
                                      공지
                                    </Badge>
                                  )}
                                  {post.is_pinned && (
                                    <Badge className="bg-green-500 dark:bg-green-600 text-white rounded-full px-1.5 py-0.5 text-xs">
                                      고정
                                    </Badge>
                                  )}
                                  {isNew(post) && (
                                    <Badge
                                      className="bg-blue-100 text-blue-700 font-bold text-[11px] rounded-full border border-blue-200 px-2 py-0.5 min-w-[22px] h-5 flex items-center justify-center shadow-sm tracking-wide"
                                      style={{
                                        lineHeight: "1.1",
                                        fontWeight: 700,
                                        letterSpacing: "0.04em",
                                      }}
                                    >
                                      N
                                    </Badge>
                                  )}
                                </div>
                                {/* 제목 - 남은 공간에서 truncate */}
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <Button
                                    variant="link"
                                    className="text-xs sm:text-sm text-black font-medium hover:no-underline transition-colors p-0 h-auto text-left w-full justify-start"
                                    onClick={() => handlePostClick(post.id)}
                                    title={post.title}
                                  >
                                    <span className="truncate block w-full text-left">
                                      {post.title}
                                    </span>
                                  </Button>
                                </div>
                              </div>
                            )}
                            {key === "author" &&
                              (authorInfoMap[post.user_id]?.username || "익명")}
                            {key === "created_at" && formatTime(post)}
                            {key === "view_count" && (post.view_count ?? 0)}
                            {key === "comment_count" &&
                              (post.comment_count ?? 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            // 카드형 레이아웃 (shadcn Card 컴포넌트 적용)
            <div className="p-4 bg-background bg-gray-50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {[...sortedNotices, ...sortedNormals].length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-12 bg-gray-50 rounded">
                  게시글이 없습니다.
                </div>
              ) : (
                [...sortedNotices, ...sortedNormals].map((post) => (
                  <Card
                    key={post.id}
                    className="w-full h-80 min-h-[320px] flex flex-col overflow-hidden cursor-pointer rounded-xl border border-slate-200/5 transition-transform duration-400 group hover:scale-[1.01] v-card-scale hover:-translate-y-1"
                    onClick={() => handlePostClick(post.id)}
                  >
                    {/* 썸네일 이미지 (상단, 고정 높이) */}
                    <div className="w-full h-44 bg-muted border-b flex items-center justify-center overflow-hidden">
                      {post.thumbnail_image ? (
                        <img
                          src={post.thumbnail_image}
                          alt="썸네일"
                          className="w-full h-full object-cover group-hover:scale-125 ease-in-out transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <CardHeader className="p-4 pb-2 flex flex-col gap-1 bg-transparent">
                      <div className="flex items-center gap-1">
                        {post.is_notice && (
                          <Badge className="bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white font-bold px-1.5 py-0.5 text-xs rounded">
                            공지
                          </Badge>
                        )}
                        {post.is_pinned && (
                          <Badge className="bg-green-500 dark:bg-green-600 text-white rounded-full px-1.5 py-0.5 text-xs">
                            고정
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 font-bold text-base line-clamp-2">
                        {/* N 새글 뱃지 제목 앞에 */}
                        {isNew(post) && (
                          <Badge
                            className="bg-blue-100 text-blue-700 font-bold text-[11px] rounded-full border border-blue-200 px-2 py-0.5 min-w-[22px] h-5 flex items-center justify-center shadow-sm tracking-wide ml-0.5"
                            style={{
                              lineHeight: "1.1",
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                            }}
                          >
                            N
                          </Badge>
                        )}
                        <span className="truncate">{post.title}</span>
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-2">
                        {getSummary(post.content, 60)}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pt-0 pb-2 flex-1 flex flex-col justify-end bg-transparent">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>
                          {authorInfoMap[post.user_id]?.username || "익명"}
                        </span>
                        <span>{formatTime(post)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>조회 {post.view_count ?? 0}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {post.comment_count ?? 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
        {/* 페이지네이션 */}
        <div className="flex justify-center py-6 border-t border-gray-100 dark:border-gray-800">
          <Pagination>
            <PaginationContent className="flex flex-wrap justify-center">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, idx) => {
                // 모바일에서는 현재 페이지 주변의 페이지만 표시
                const isCurrent = page === idx + 1;
                const isNearCurrent = Math.abs(page - (idx + 1)) <= 1;
                const isFirstOrLast = idx === 0 || idx === totalPages - 1;
                const shouldShow =
                  isNearCurrent || isFirstOrLast || totalPages <= 5;

                if (!shouldShow && idx === 1 && page > 3) {
                  return <PaginationEllipsis key={`ellipsis-start`} />;
                }

                if (
                  !shouldShow &&
                  idx === totalPages - 2 &&
                  page < totalPages - 2
                ) {
                  return <PaginationEllipsis key={`ellipsis-end`} />;
                }

                return shouldShow ? (
                  <PaginationItem key={idx}>
                    <PaginationLink
                      href="#"
                      isActive={isCurrent}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(idx + 1);
                      }}
                    >
                      {idx + 1}
                    </PaginationLink>
                  </PaginationItem>
                ) : null;
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  className={
                    page === totalPages ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        {/* 검색 폼 */}
        <div className="flex justify-center pb-8 px-4 sm:px-6">
          <form
            onSubmit={handleSearch}
            className="flex flex-row items-stretch w-full max-w-lg sm:max-w-2xl space-x-2"
          >
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-3 py-2 w-[80px] border border-gray-100 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="title">제목</option>
              <option value="content">내용</option>
              <option value="author">작성자</option>
            </select>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="flex-1 px-3 py-2 border border-gray-100 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
            />
            <Button type="submit" className="px-4 whitespace-nowrap">
              검색
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
