"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { mutate } from "swr";
import useSWR from "swr";
import { api } from "@/lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Eye,
  MessageSquare,
  Calendar,
  ChevronLeft,
  Edit,
  Trash2,
  Heart,
  Share2,
  Download,
  File,
  FileText,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";
import BoardComments from "./board-comments";
import BoardWrite from "./board-write";
import Image from "next/image";
import { ChevronRight, Home } from "lucide-react";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import GlassContainer from "@/components/ui/glass-container";
import { useAuth } from "@/contexts/auth-context";
import TipTapViewer from "@/components/ui/tiptap-viewer";
import { logBoardPostDelete } from "@/services/activityLogService";
import { ITag } from "@/types/index";

interface BoardPost {
  id: string;
  title: string;
  content: string;
  author: string;
  user_id?: string;
  created_at: string;
  views: number;
  view_count?: number;
  comment_count?: number;
  allow_comments?: boolean;
  page_id?: string;
  category_id?: string;
  thumbnail_image?: string | null;
  files?: string; // 첨부파일 정보(문자열로 저장된 JSON)
  tags?: string; // 태그 정보(문자열로 저장된 JSON)
  status?: string;
  is_notice?: boolean;
}

// 첨부파일 정보 인터페이스
interface IAttachment {
  url: string;
  name?: string; // 선택적 속성으로 변경
  type: string;
  size?: string;
}

interface User {
  id: string;
  username: string;
  email?: string;
}

interface BoardDetailProps {
  postId?: string;
  onBack?: () => void;
}

export default function BoardDetail({ postId, onBack }: BoardDetailProps) {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // 글꼴 설정 메뉴 렌더링 함수
  const renderFontSettingsMenu = (
    position: string = "bottom-full",
    additionalClasses: string = ""
  ) => {
    return (
      <div
        ref={moreMenuRef}
        className={`absolute ${position} right-0 mb-2 w-60 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${additionalClasses}`}
      >
        <div className="py-1">
          <div className="px-3 py-2 text-xs font-semibold text-gray-800 border-b">
            글꼴 크기 조절
          </div>
          <div className="flex items-center justify-between p-3">
            <button
              onClick={decreaseFontSize}
              className="p-1 text-gray-700 hover:bg-gray-100 rounded-full"
              disabled={fontSizeLevel <= -2}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </button>

            <button
              onClick={resetFontSize}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded mx-1"
            >
              기본
            </button>

            <button
              onClick={increaseFontSize}
              className="p-1 text-gray-700 hover:bg-gray-100 rounded-full"
              disabled={fontSizeLevel >= 2}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </button>
          </div>

          <div className="px-3 py-2 text-xs font-semibold text-gray-800 border-b border-t">
            글꼴 굵기 조절
          </div>
          <div className="flex items-center justify-between p-3">
            <button
              onClick={decreaseFontBold}
              className="p-1 text-gray-700 hover:bg-gray-100 rounded-full"
              disabled={fontBoldLevel <= -1}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </button>

            <button
              onClick={resetFontBold}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded mx-1"
            >
              기본
            </button>

            <button
              onClick={increaseFontBold}
              className="p-1 text-gray-700 hover:bg-gray-100 rounded-full"
              disabled={fontBoldLevel >= 3}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </button>
          </div>

          <div className="px-3 py-2 text-xs font-semibold text-gray-800 border-b border-t">
            글꼴 변경
          </div>
          <div className="p-3 space-y-2">
            <div className="flex flex-col space-y-1">
              <button
                onClick={(e) => changeFontFamily("default", e)}
                className={`text-left px-2 py-1 text-sm rounded ${fontFamily === "default" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
              >
                기본 글꼴
              </button>
              <button
                onClick={(e) => changeFontFamily("notoSans", e)}
                className={`text-left px-2 py-1 text-sm rounded font-noto-sans ${fontFamily === "notoSans" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
              >
                노토 산스
              </button>
              <button
                onClick={(e) => changeFontFamily("nanumGothic", e)}
                className={`text-left px-2 py-1 text-sm rounded font-nanum-gothic ${fontFamily === "nanumGothic" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
              >
                나눔고딕
              </button>
              <button
                onClick={(e) => changeFontFamily("nanumMyeongjo", e)}
                className={`text-left px-2 py-1 text-sm rounded font-nanum-myeongjo ${fontFamily === "nanumMyeongjo" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
              >
                나눔명조
              </button>
              <button
                onClick={(e) => changeFontFamily("spoqa", e)}
                className={`text-left px-2 py-1 text-sm rounded font-spoqa ${fontFamily === "spoqa" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
              >
                스포카한산스
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [post, setPost] = useState<BoardPost | null>(null);
  const [authorInfo, setAuthorInfo] = useState<{
    username: string;
    avatar_url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 수정 상태 관리
  const [editing, setEditing] = useState(false);
  // 좋아요 상태 관리
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [menuInfo, setMenuInfo] = useState<{
    title: string;
    url: string;
  } | null>(null);
  // 이전글, 다음글 상태 관리
  const [prevPost, setPrevPost] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [nextPost, setNextPost] = useState<{
    id: string;
    title: string;
  } | null>(null);
  // 첨부파일 관리
  const [attachments, setAttachments] = useState<IAttachment[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [toastState, setToastState] = useState<{
    open: boolean;
    title: string;
    description?: string | React.ReactNode;
    variant?: "default" | "destructive";
  }>({ open: false, title: "", description: "", variant: "default" });
  const [showAttachments, setShowAttachments] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  // 모바일 글꼴 설정 메뉴 표시 상태
  const [showMobileFontMenu, setShowMobileFontMenu] = useState(false);
  // 플로팅 버튼 표시 상태
  const [showFloatingButtons, setShowFloatingButtons] = useState(true);
  // 작성자 여부 상태 추가
  const [isAuthor, setIsAuthor] = useState(false);
  // 작성자 아바타 상태 추가
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  // 글꼴 크기 상태 (기본 = 0, +1, +2, -1, -2)
  // 글꼴 크기, 굵기, 패밀리 상태
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0);
  const [fontBoldLevel, setFontBoldLevel] = useState<number>(0);
  const [fontFamily, setFontFamily] = useState<string>("nanumMyeongjo");
  // 메뉴 소스 (more: 데스크탑 더보기 버튼, font: 모바일 글꼴 버튼)
  const [menuSource, setMenuSource] = useState<string>("more");
  // 더보기 메뉴 표시 상태
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // 로컬 스토리지에서 글꼴 설정을 불러오는 함수
  const loadFontSettings = () => {
    if (typeof window === "undefined")
      return { size: 0, bold: 0, family: "nanumMyeongjo" };

    try {
      const savedSettings = localStorage.getItem("fontSettings");
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error("글꼴 설정 불러오기 오류:", error);
    }

    return { size: 0, bold: 0, family: "nanumMyeongjo" };
  };

  // 로컬 스토리지에 글꼴 설정을 저장하는 함수
  const saveFontSettings = (size: number, bold: number, family: string) => {
    if (typeof window === "undefined") return;

    try {
      const settings = { size, bold, family };
      localStorage.setItem("fontSettings", JSON.stringify(settings));
    } catch (error) {
      console.error("글꼴 설정 저장 오류:", error);
    }
  };

  // 컴포넌트 마운트 시 로컬 스토리지에서 설정 불러오기
  useEffect(() => {
    const settings = loadFontSettings();
    setFontSizeLevel(settings.size);
    setFontBoldLevel(settings.bold);
    setFontFamily(settings.family);
  }, []);

  // 플로팅 버튼 자동 숨김/표시 기능
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    const showButtons = () => {
      setShowFloatingButtons(true);
      // 기존 타이머가 있으면 클리어
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      // 3초 후 버튼 숨김
      hideTimeout = setTimeout(() => {
        setShowFloatingButtons(false);
      }, 3000);
    };

    const handleUserActivity = () => {
      showButtons();
    };

    // 사용자 활동 감지 이벤트들
    const events = ["touchstart", "touchmove", "scroll", "click"];

    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity);
    });

    // 초기 3초 후 숨김
    hideTimeout = setTimeout(() => {
      setShowFloatingButtons(false);
    }, 3000);

    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, []);

  // 더보기 메뉴 및 모바일 글꼴 메뉴 외부 클릭 감지
  useEffect(() => {
    // 클릭 이벤트 핸들러 함수
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 메뉴 내부 클릭은 무시 (메뉴 내부 버튼 클릭을 허용하기 위함)
      if (moreMenuRef.current && moreMenuRef.current.contains(target)) {
        return;
      }

      // 모바일 글꼴 다이얼로그 내부 클릭은 무시
      const isMobileFontDialog = target.closest(
        '[class*="fixed inset-0 z-50 sm:hidden"]'
      );
      const isMobileFontDialogContent = target.closest(
        '[class*="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl"]'
      );

      // 글꼴 버튼 클릭은 무시 (토글 기능을 위해)
      const isFontButton = target.closest(
        '.relative button[class*="flex flex-col items-center"]'
      );

      // 더보기 메뉴 닫기 (버튼 클릭이 아닌 경우만)
      if (showMoreMenu && !isFontButton) {
        setShowMoreMenu(false);
      }

      // 모바일 글꼴 설정 메뉴 닫기 (다이얼로그 내부 클릭이 아닌 경우만)
      if (showMobileFontMenu && !isFontButton && !isMobileFontDialogContent) {
        // 배경 오버레이 클릭인 경우에만 닫기
        if (target.classList.contains("bg-black/50")) {
          setShowMobileFontMenu(false);
        }
      }
    };

    // 클릭 이벤트 리스너 추가
    document.addEventListener("mousedown", handleClickOutside);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu, showMobileFontMenu]);

  // 토스트 표시 함수
  const showToast = (args: {
    title: string;
    description?: string | React.ReactNode;
    variant?: "default" | "destructive";
  }) => {
    setToastState({ open: true, ...args });
  };

  // 게시글 로드 후 첨부파일 추출 - 여러 방법으로 시도
  useEffect(() => {
    if (post?.id) {
      // 1. 게시글 데이터에서 파일 정보 추출 (이것만 사용)
      if (post.files) {
        try {
          const filesData = JSON.parse(post.files);
          if (Array.isArray(filesData) && filesData.length > 0) {
            const extractedAttachments: IAttachment[] = filesData.map(
              (file: any) => ({
                url: file.url || "",
                name: file.name || "파일",
                type: file.type || "unknown",
              })
            );
            setAttachments(extractedAttachments);
          } else {
            setAttachments([]);
          }
        } catch (error) {
          setAttachments([]);
          console.error("파일 데이터 파싱 오류:", error);
        }
      } else {
        setAttachments([]);
      }
    }
  }, [post?.id, post?.files]);

  // 이전글, 다음글 가져오기 함수
  async function fetchPrevNextPosts(postId: string, pageId?: string) {
    try {
      if (!postId) return;

      const supabase = createClient();
      // 현재 게시글 정보 가져오기 (작성일 확인용)
      const { data: currentPost } = await supabase
        .from("board_posts")
        .select("created_at, page_id")
        .eq("id", postId)
        .single();

      if (!currentPost) return;

      const currentPageId = pageId || currentPost.page_id;
      if (!currentPageId) return;

      // 이전글 가져오기 (현재 글보다 이전에 작성된 글)
      const { data: prevData } = await supabase
        .from("board_posts")
        .select("id, title")
        .eq("page_id", currentPageId)
        .lt("created_at", currentPost.created_at)
        .order("created_at", { ascending: false })
        .limit(1);

      setPrevPost(prevData && prevData.length > 0 ? prevData[0] : null);

      // 다음글 가져오기 (현재 글보다 나중에 작성된 글)
      const { data: nextData } = await supabase
        .from("board_posts")
        .select("id, title")
        .eq("page_id", currentPageId)
        .gt("created_at", currentPost.created_at)
        .order("created_at", { ascending: true })
        .limit(1);


      setNextPost(nextData && nextData.length > 0 ? nextData[0] : null);
    } catch (err) {
      console.error("이전/다음 글 가져오기 오류:", err);
    }
  }

  // SWR을 사용한 게시글 데이터 페칭
  const currentPostId = postId || (params?.id as string);
  const { data: postData, error: postError, isLoading: postLoading, mutate: mutatePost } = useSWR(
    currentPostId ? ['postDetail', currentPostId] : null,
    () => api.posts.getDetail(currentPostId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryCount: 2,
    }
  );

  // SWR 데이터에서 개별 상태로 분리
  useEffect(() => {
    if (postData?.post) {
      setPost(postData.post);
      setAuthorInfo(postData.post.author ? {
        username: postData.post.author.username,
        avatar_url: postData.post.author.avatar_url
      } : null);
      setLikeCount(postData.post.like_count || 0);
      setCommentCount(postData.post.comment_count || 0);
      setMenuInfo(postData.menuInfo);
      setPrevPost(postData.prevPost);
      setNextPost(postData.nextPost);
      setAttachments(postData.attachments || []);
      setLoading(false);
    }
  }, [postData]);

  // 에러 처리
  useEffect(() => {
    if (postError) {
      setError(postError.message || "게시글을 불러올 수 없습니다.");
      setLoading(false);
    }
  }, [postError]);

  // 로딩 상태 동기화
  useEffect(() => {
    setLoading(postLoading);
  }, [postLoading]);

  // 사용자 권한 확인 및 좋아요 상태 확인
  useEffect(() => {
    if (!post || !currentPostId) return;
    
    async function checkUserStatus() {
      try {
        const currentUser = await getHeaderUser();
        if (currentUser && post) {
          setIsAuthor(currentUser.id === post.user_id);
          
          // 좋아요 상태 확인
          const supabase = createClient();
          const { data: likeData } = await supabase
            .from("board_like")
            .select("id")
            .eq("post_id", currentPostId)
            .eq("user_id", currentUser.id);
          
          setLiked(Boolean(likeData && likeData.length > 0));
        }
      } catch (err) {
        console.error("사용자 상태 확인 오류:", err);
      }
    }
    
    checkUserStatus();
  }, [post, currentPostId]);

  // 기존 복잡한 로직들 제거됨 - SWR API로 처리
  useEffect(() => {
    if (!currentPostId) {
      setError("잘못된 접근입니다.");
      setLoading(false);
      return;
    }
  }, [currentPostId]);

  // 기타 UI 관련 useEffect들
  useEffect(() => {
    if (!showAttachments) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowAttachments(false);
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [showAttachments]);

  // 작성자 아바타 설정 (SWR 데이터에서 이미 처리되지만 기존 호환성 유지)
  useEffect(() => {
    if (authorInfo?.avatar_url) {
      setAuthorAvatar(authorInfo.avatar_url);
    } else {
      setAuthorAvatar(null);
    }
  }, [authorInfo]);

  if (loading) {
    return (
      <Card className="my-8">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card className="my-8 border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-red-500 text-center p-4 flex flex-col items-center gap-2">
            <span className="text-lg font-medium">오류가 발생했습니다</span>
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => router.back()}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> 뒤로 가기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!post) return null;

  // 숨김글 접근 제한 처리
  if (post.status === "hidden" && !isAdmin) {
    return (
      <Card className="my-8 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="text-yellow-700 text-center p-4 flex flex-col items-center gap-2">
            <span className="text-lg font-medium">
              숨김 처리된 게시글입니다
            </span>
            <p>이 게시글은 관리자만 볼 수 있습니다.</p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => router.back()}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> 뒤로 가기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 게시글 내용에서 이미지 URL들을 추출하는 함수
  function extractImagesFromContent(content: string): string[] {
    const imageUrls: string[] = [];

    // HTML에서 img 태그의 src 속성 추출
    const imgRegex = /<img[^>]+src="([^"]+)"/g;
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      const imgUrl = match[1];
      // Supabase Storage URL인 경우만 추출
      if (imgUrl.includes("/storage/v1/object/public/board/")) {
        const urlParts = imgUrl.split("/storage/v1/object/public/board/");
        if (urlParts.length === 2) {
          imageUrls.push(urlParts[1]);
        }
      }
    }

    return imageUrls;
  }

  // 게시글의 첨부파일들을 Storage에서 삭제하는 함수
  async function deletePostFiles(files: string, content: string) {
    try {
      const supabase = createClient();
      const filesToDelete: string[] = [];

      // 1. 첨부파일 목록에서 파일 경로 추출
      if (files) {
        try {
          const fileList = JSON.parse(files);
          if (Array.isArray(fileList)) {
            for (const file of fileList) {
              if (file.url && typeof file.url === "string") {
                const urlParts = file.url.split(
                  "/storage/v1/object/public/board/"
                );
                if (urlParts.length === 2) {
                  filesToDelete.push(urlParts[1]);
                }
              }
            }
          }
        } catch (parseError) {
          console.error("첨부파일 정보 파싱 오류:", parseError);
        }
      }

      // 2. 게시글 내용에서 이미지 URL 추출
      const contentImages = extractImagesFromContent(content);
      filesToDelete.push(...contentImages);

      // 중복 제거
      const uniqueFiles = filesToDelete.filter(
        (file, index) => filesToDelete.indexOf(file) === index
      );

      if (uniqueFiles.length > 0) {
        const { error } = await supabase.storage
          .from("board")
          .remove(uniqueFiles);

        if (error) {
          console.error("파일 삭제 중 오류:", error);
        } else {
        }
      }
    } catch (error) {
      console.error("파일 정보 파싱 또는 삭제 중 오류:", error);
    }
  }

  // 삭제 핸들러
  async function handleDelete() {
    if (!post) return;
    if (
      !window.confirm(
        "정말로 이 글을 삭제하시겠습니까?\n(첨부된 파일들도 함께 삭제됩니다)"
      )
    )
      return;

    try {
      const supabase = createClient();
      // 로그에 사용할 정보 미리 저장 (삭제 전)
      const postTitle = post.title;
      const postFiles = post.files;
      const postContent = post.content;
      const logDetails = {
        page_id: post.page_id,
        category_id: post.category_id,
        had_files: !!(postFiles && postFiles.length > 0),
        content_length: postContent ? postContent.length : 0,
        was_notice: post.is_notice,
      };

      // 1. 첨부파일 및 게시글 내 이미지 삭제 (게시글 삭제 전에 수행)
      if (post.files || post.content) {
        await deletePostFiles(post.files || "", post.content || "");
      }

      // 2. 게시글 삭제
      const { error } = await supabase
        .from("board_posts")
        .delete()
        .eq("id", post.id);

      if (error) {
        alert("삭제 중 오류가 발생했습니다: " + error.message);
        return;
      }

      // 3. 삭제 로그 기록 (사용자 정보가 있는 경우)
      if (user?.id) {
        await logBoardPostDelete(user.id, post.id, postTitle, logDetails);
      }

      // 4. SWR 캐시 무효화
      try {
        // 게시글 목록 캐시 무효화 (page_id가 있는 경우)
        if (post.page_id) {
          await mutate(`/api/board/posts/${post.page_id}`);
          await mutate(
            (key: any) =>
              key &&
              typeof key === "string" &&
              key.includes(`/api/board/posts/${post.page_id}`)
          );
        }

        // 전체 게시글 목록 캐시 무효화
        await mutate(
          (key: any) =>
            key && typeof key === "string" && key.includes("/api/board/posts")
        );

        // 위젯 관련 캐시도 무효화
        await mutate(
          (key: any) => key && typeof key === "string" && key.includes("widget")
        );

      } catch (cacheError) {
        console.warn("캐시 무효화 중 오류:", cacheError);
      }

      alert("게시글과 첨부파일이 모두 삭제되었습니다.");

      if (onBack) {
        onBack();
      } else {
        router.back();
      }
    } catch (error) {
      console.error("삭제 처리 중 오류:", error);
      alert("삭제 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  }

  // 이전 경로를 가져오는 함수
  function getParentPath() {
    if (typeof pathname !== "string") return "/";
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 1) {
      return "/" + segments.slice(0, -1).join("/") + window.location.search;
    }
    return "/" + window.location.search;
  }

  // 목록으로 이동
  function handleGoList(e?: React.MouseEvent) {
    if (e) e.preventDefault();
    if (onBack) {
      onBack();
    } else {
      router.push(getParentPath());
    }
    // 페이지 맨 위로 스크롤
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 목록 경로와 이름 가져오기
  function getListInfo() {
    if (typeof pathname !== "string") return { path: "/", name: "목록" };
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length <= 1) return { path: "/", name: "목록" };

    // 게시판 이름 가져오기 (예: board, qna 등)
    const boardName = segments[0];
    let displayName = "목록";

    // 게시판 이름에 따른 표시 이름 설정
    switch (boardName) {
      case "board":
        displayName = "자유게시판";
        break;
      case "notice":
        displayName = "공지사항";
        break;
      case "qna":
        displayName = "질문과 답변";
        break;
      default:
        displayName = boardName;
    }

    return {
      path: getParentPath(),
      name: displayName,
    };
  }

  // 좋아요 토글 함수 (SWR mutate 사용)
  const toggleLike = async () => {
    if (!post) return;

    if (!user || !user.username) {
      showToast({
        title: "로그인 필요",
        description: (
          <div className="flex flex-col gap-2">
            <p>좋아요 기능은 로그인이 필요합니다.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => {
                localStorage.setItem("returnUrl", window.location.pathname);
                router.push("/auth/signin");
              }}
            >
              로그인하기
            </Button>
          </div>
        ),
        variant: "default",
      });
      return;
    }

    setLikeLoading(true);
    try {
      const supabase = createClient();
      if (liked) {
        // 좋아요 삭제
        const { error } = await supabase
          .from("board_like")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);

        if (error) throw error;

        setLikeCount((prev) => Math.max(0, prev - 1));
        setLiked(false);
      } else {
        // 좋아요 추가
        const { error } = await supabase.from("board_like").insert({
          post_id: post.id,
          user_id: user.id,
        });

        if (error) {
          // 이미 좋아요한 경우 무시
          if (error.code === "23505") return;
          throw error;
        }

        setLikeCount((prev) => prev + 1);
        setLiked(true);
      }
      
      // SWR 데이터 갱신
      mutatePost();
    } catch (err) {
      console.error("좋아요 처리 중 오류:", err);
      showToast({
        title: "오류 발생",
        description: "좋아요 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLikeLoading(false);
    }
  };

  // getHeaderUser 함수 수정
  async function getHeaderUser(): Promise<User | null> {
    try {
      const supabase = createClient();
      // Supabase 세션 확인을 우선으로
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Supabase 세션이 있으면 해당 정보 사용
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, full_name")
          .eq("id", session.user.id)
          .single();

        const userData = {
          id: session.user.id,
          username:
            profile?.username || session.user.email?.split("@")[0] || "익명",
          email: session.user.email,
        };
        return userData;
      }

      // 세션이 없는 경우에만 로컬/세션 스토리지 확인 (레거시 지원)
      if (typeof window !== "undefined") {
        const stored =
          localStorage.getItem("user") || sessionStorage.getItem("user");
        if (stored) {
          try {
            const user = JSON.parse(stored);
            if (user && user.id && user.username) {
              // 스토리지의 사용자 정보로 Supabase 세션 생성 시도
              try {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("username")
                  .eq("id", user.id)
                  .single();

                if (profile) {
                  return user as User;
                }
              } catch (error) {
              }
            }
          } catch (error) {
            console.error("저장된 사용자 정보 파싱 오류:", error);
          }
        }
      }

      return null;
    } catch (error) {
      console.error("사용자 정보 조회 오류:", error);
      return null;
    }
  }

  // 날짜 포맷팅 함수
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  // 파일 확장자에 따른 아이콘 가져오기
  function getFileIcon(fileType: string) {
    const type = fileType.toLowerCase();
    if (["pdf"].includes(type)) {
      return <FileText className="w-5 h-5" />;
    } else if (["doc", "docx"].includes(type)) {
      return <FileText className="w-5 h-5" />;
    } else if (["xls", "xlsx", "csv"].includes(type)) {
      return <FileSpreadsheet className="w-5 h-5" />;
    } else if (["ppt", "pptx"].includes(type)) {
      return <Presentation className="w-5 h-5" />;
    } else {
      return <File className="w-5 h-5" />;
    }
  }

  // 첨부파일 추출 함수
  function extractAttachments() {
    if (!post?.content) {
      return;
    }


    const extractedAttachments: IAttachment[] = [];

    // 정규표현식을 사용하여 이미지 및 파일 URL 추출
    // href와 src 속성 모두 처리
    const regex = /(?:href|src)=["'](https?:\/\/[^"']+)["']/g;
    let match;
    const urls = new Set<string>();

    while ((match = regex.exec(post.content)) !== null) {
      const url = match[1];

      if (url.includes("supabase") && !urls.has(url)) {
        urls.add(url);

        // URL에서 파일명 추출
        const urlParts = url.split("/");
        const fileName = urlParts[urlParts.length - 1];
        const decodedFileName = decodeURIComponent(fileName);

        // 파일 확장자 추출
        const fileExt = decodedFileName.split(".").pop()?.toLowerCase() || "";

        // 이미지 파일인지 확인
        const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
          fileExt
        );

        // 이미지가 아닌 파일만 첨부파일로 추가
        if (!isImage) {
          extractedAttachments.push({
            url,
            name: decodedFileName,
            type: fileExt,
          });
        } else {
        }
      }
    }

    // 추가 방법: 직접 a 태그의 href 값을 처리
    const anchorRegex =
      /<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([^<]+)<\/a>/g;
    while ((match = anchorRegex.exec(post.content)) !== null) {
      const url = match[1];
      const linkText = match[2];

      if (url.includes("supabase") && !urls.has(url)) {
        urls.add(url);

        // URL에서 파일명 추출
        const urlParts = url.split("/");
        const fileName = urlParts[urlParts.length - 1];
        const decodedFileName = decodeURIComponent(fileName);

        // 파일 확장자 추출
        const fileExt = decodedFileName.split(".").pop()?.toLowerCase() || "";

        // 이미지 파일인지 확인
        const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
          fileExt
        );

        // 이미지가 아닌 파일만 첨부파일로 추가
        if (!isImage) {
          extractedAttachments.push({
            url,
            name: linkText || decodedFileName,
            type: fileExt,
          });
        }
      }
    }

    setAttachments(extractedAttachments);
  }

  // 더보기 메뉴와 모바일 메뉴는 버튼 클릭으로만 토글

  // 글꼴 크기 증가 함수
  const increaseFontSize = (e?: React.MouseEvent) => {
    // 클릭 이벤트의 기본 동작 방지 및 전파 중단
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (fontSizeLevel < 2) {
      const newSize = fontSizeLevel + 1;
      setFontSizeLevel(newSize);
      saveFontSettings(newSize, fontBoldLevel, fontFamily);
    }
  };

  // 글꼴 크기 감소 함수
  const decreaseFontSize = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const newSize = Math.max(fontSizeLevel - 1, -2);
    setFontSizeLevel(newSize);
    saveFontSettings(newSize, fontBoldLevel, fontFamily);
  };

  // 글꼴 굵기 증가 함수
  const increaseFontBold = (e?: React.MouseEvent) => {
    // 클릭 이벤트의 기본 동작 방지 및 전파 중단
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (fontBoldLevel < 3) {
      const newBold = fontBoldLevel + 1;
      setFontBoldLevel(newBold);
      saveFontSettings(fontSizeLevel, newBold, fontFamily);
    }
  };

  // 글꼴 굵기 감소 함수
  const decreaseFontBold = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const newBold = Math.max(fontBoldLevel - 1, -1);
    setFontBoldLevel(newBold);
    saveFontSettings(fontSizeLevel, newBold, fontFamily);
  };

  // 글꼴 굵기 초기화 함수
  const resetFontBold = (e?: React.MouseEvent) => {
    // 클릭 이벤트의 기본 동작 방지 및 전파 중단
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setFontBoldLevel(0);
    saveFontSettings(fontSizeLevel, 0, fontFamily);
  };

  // 글꼴 크기 초기화 함수
  const resetFontSize = (e?: React.MouseEvent) => {
    // 클릭 이벤트의 기본 동작 방지 및 전파 중단
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setFontSizeLevel(0);
    saveFontSettings(0, fontBoldLevel, fontFamily);
  };

  // 글꼴 변경 함수
  const changeFontFamily = (family: string, e?: React.MouseEvent) => {
    // 클릭 이벤트의 기본 동작 방지 및 전파 중단
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setFontFamily(family);
    saveFontSettings(fontSizeLevel, fontBoldLevel, family);
  };

  // 글꼴 초기화 함수
  const resetFontFamily = () => {
    setFontFamily("nanumMyeongjo");
    saveFontSettings(fontSizeLevel, fontBoldLevel, "nanumMyeongjo");
  };

  // 게시글에 연결된 첨부파일 가져오기
  async function fetchAttachments(postId: string, content?: string) {
    try {

      // 게시글 내용에서 파일 URL 추출
      const contentToProcess = content || post?.content;
      if (contentToProcess) {
        const fileUrls: string[] = [];

        // 1. 모든 a 태그 추출
        const anchorRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/g;
        let match;

        while ((match = anchorRegex.exec(contentToProcess)) !== null) {
          const url = match[1];
          const text = match[2];

          // 파일 확장자가 있는 URL만 추출
          if (url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt)$/i)) {
            fileUrls.push(url);
          }
        }

        // 2. href 속성에서 추출
        const hrefRegex =
          /href=["']([^"']+\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt))["']/gi;
        while ((match = hrefRegex.exec(contentToProcess)) !== null) {
          const url = match[1];
          if (!fileUrls.includes(url)) {
            fileUrls.push(url);
          }
        }

        // 3. 직접 URL 추출
        const urlRegex =
          /(https?:\/\/[^\s"'<>]+\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt))/gi;
        while ((match = urlRegex.exec(contentToProcess)) !== null) {
          const url = match[1];
          if (!fileUrls.includes(url)) {
            fileUrls.push(url);
          }
        }


        // 파일 URL에서 첨부파일 정보 추출
        const extractedAttachments: IAttachment[] = [];

        for (const url of fileUrls) {
          // URL에서 파일명 추출
          const urlParts = url.split("/");
          const fileName = urlParts[urlParts.length - 1];
          const decodedFileName = decodeURIComponent(fileName);

          // 파일 확장자 추출
          const fileExt = decodedFileName.split(".").pop()?.toLowerCase() || "";

          // 이미지 파일인지 확인
          const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
            fileExt
          );

          // 이미지가 아닌 파일만 첨부파일로 추가
          if (!isImage) {
            extractedAttachments.push({
              url,
              name: decodedFileName,
              type: fileExt,
            });
          }
        }

        setAttachments(extractedAttachments);
      }
    } catch (error) {
      console.error("첨부파일 가져오기 오류:", error);
    }
  }

  // 파일 다운로드 함수
  async function handleDownload(attachment: IAttachment) {
    try {
      // URL에서 파일명 추출 (기본값으로 attachment.name 사용)
      let fileName = attachment.name || "download";

      // URL에서 파일명이 있는지 확인 (URL이 유효한 경우에만 시도)
      if (attachment.url) {
        try {
          // URL에서 마지막 경로 부분 추출
          const url = new URL(attachment.url);
          const pathParts = url.pathname.split("/");
          const lastPart = pathParts[pathParts.length - 1];

          // 파일 확장자가 있는지 확인
          if (lastPart && lastPart.includes(".")) {
            fileName = lastPart;
          }
        } catch (e) {
          console.warn("URL 파싱 중 오류 발생, 기본 파일명 사용:", e);
        }
      }

      // 파일 다운로드 시작
      showToast({
        title: "다운로드 시작",
        description: `${fileName} 파일을 다운로드합니다.`,
        variant: "default",
      });

      // fetch를 사용하여 파일 다운로드
      const response = await fetch(attachment.url);
      if (!response.ok) {
        throw new Error(
          `파일 다운로드 실패: ${response.status} ${response.statusText}`
        );
      }

      const blob = await response.blob();

      // 다운로드 링크 생성
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // 정리
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);

      // 다운로드 완료 알림
      showToast({
        title: "다운로드 완료",
        description: `${fileName} 파일이 다운로드되었습니다.`,
        variant: "default",
      });
    } catch (error) {
      console.error("파일 다운로드 오류:", error);
      showToast({
        title: "다운로드 오류",
        description:
          error instanceof Error
            ? error.message
            : "파일을 다운로드하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  }

  // 게시글 본문 내 유튜브 썸네일 이미지를 iframe으로 변환하는 함수
  function renderContentWithYoutube(content: string) {
    if (!content) return content;
    // img[data-youtube-video-id]를 iframe으로 변환
    return content.replace(
      /<img([^>]*?)data-youtube-video-id=["']([^"']+)["']([^>]*)>/g,
      (match, before, videoId, after) => {
        return `
        <div style="position:relative;width:100%;padding-bottom:56.25%;background:#000;border-radius:0.5rem;overflow:hidden;margin:1.5rem 0;">
          <iframe
            src="https://www.youtube.com/embed/${videoId}"
            style="position:absolute;top:0;left:0;width:100%;height:100%;"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            title="유튜브 영상"
          ></iframe>
        </div>
      `;
      }
    );
  }

  return (
    <>
      <ToastProvider>
        <Toast
          open={toastState.open}
          onOpenChange={(open) => setToastState((prev) => ({ ...prev, open }))}
          variant={toastState.variant}
        >
          {toastState.title && <ToastTitle>{toastState.title}</ToastTitle>}
          {toastState.description && (
            <ToastDescription>{toastState.description}</ToastDescription>
          )}
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>

      <div className="curs py-4 sm:py-0 mx-0 sm:mx-auto w-full max-w-full overflow-hidden bg-white relative sm:pb-0 border border-slate-100 sm:rounded-xl sm:mt-2">
        {/* 수정, 삭제 버튼과 이전글, 다음글, 목록 버튼 한 줄에 배치 - 모바일에서는 숨김 */}
        <div className="hidden sm:flex justify-between items-center p-4 border-b border-gray-100 space-x-2">
          {/* 수정, 삭제 버튼 - 작성자인 경우에만 표시 */}
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `${pathname.replace(/\/$/, "")}/${post.id}/edit`
                    )
                  }
                >
                  수정
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  삭제
                </Button>
              </>
            )}
          </div>

          {/* 이전글, 다음글, 목록 버튼 */}
          <div className="flex gap-1 space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-3 text-gray-500 bg-gray-200 hover:text-gray-700 disabled:opacity-50"
              disabled={!prevPost}
              onClick={() => {
                if (prevPost && post?.page_id) {
                  const currentUrl = new URL(window.location.href);
                  currentUrl.searchParams.set("post", prevPost.id);
                  router.push(currentUrl.pathname + currentUrl.search);
                }
              }}
            >
              이전글
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-3 text-gray-500 bg-gray-200 hover:text-gray-700 disabled:opacity-50"
              disabled={!nextPost}
              onClick={() => {
                if (nextPost && post?.page_id) {
                  const currentUrl = new URL(window.location.href);
                  currentUrl.searchParams.set("post", nextPost.id);
                  router.push(currentUrl.pathname + currentUrl.search);
                }
              }}
            >
              다음글
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-3 text-gray-500 bg-gray-200 hover:text-gray-700"
              onClick={handleGoList}
            >
              목록
            </Button>
          </div>
        </div>
        <CardHeader className="px-4 sm:px-8 py-2 space-y-2">
          {/* 카테고리 정보 표시 */}
          <div className="">
            {menuInfo ? (
              <Link
                href={menuInfo.url.split("?")[0]}
                className="text-sm text-blue-500 hover:text-blue-700 transition-colors font-medium flex items-center"
              >
                {menuInfo.title} <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            ) : (
              <Link
                href={getListInfo().path}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium flex items-center"
              >
                {getListInfo().name} <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            )}
          </div>

          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl font-bold break-words">
              {post.title}
            </CardTitle>
          </div>


          {/* 유저/메타데이터 + 액션 버튼 한 줄 */}
          <div className="flex items-start my-6 border-b border-gray-200 pb-6 justify-between">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage
                  src={
                    authorInfo?.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${authorInfo?.username}`
                  }
                  alt={authorInfo?.username}
                />
                <AvatarFallback>
                  {authorInfo?.username
                    ? authorInfo.username.substring(0, 2).toUpperCase()
                    : "UN"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {authorInfo?.username || "익명"}
                </span>
                <div className="flex text-xs text-gray-500">
                  <span>{formatDate(post.created_at)}</span>
                  <span className="mx-2">·</span>
                  <span>조회 {post.views || post.view_count || 0}</span>
                </div>
              </div>
            </div>
            {/* 액션 버튼 - 모바일에서는 숨김 */}
            <div className="hidden sm:flex items-center gap-2 ml-4">
              {/* 댓글 버튼 */}
              <button
                type="button"
                className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm"
                onClick={() => {
                  const commentSection =
                    document.getElementById("comments-section");
                  if (commentSection) {
                    const y =
                      commentSection.getBoundingClientRect().top +
                      window.scrollY -
                      100;
                    window.scrollTo({ top: y, behavior: "smooth" });
                  }
                }}
                title="댓글로 이동"
              >
                <MessageSquare className="w-4 h-4" />
                <span>댓글 {commentCount}</span>
              </button>
              {/* URL 복사 버튼 */}
              <button
                type="button"
                className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast({
                      title: "URL 복사 완료",
                      description: "현재 주소가 복사되었습니다.",
                      variant: "default",
                    });
                  } catch {
                    showToast({
                      title: "URL 복사 실패",
                      description: "주소 복사 중 오류가 발생했습니다.",
                      variant: "destructive",
                    });
                  }
                }}
                title="URL 복사"
              >
                <Share2 className="w-4 h-4" />
                <span>URL 복사</span>
              </button>
              {/* 더보기 버튼 */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                  title="더보기"
                  onClick={() => {
                    setShowMoreMenu(!showMoreMenu);
                    setMenuSource("more");
                  }}
                >
                  <span className="text-xl">…</span>
                </button>
                {showMoreMenu &&
                  menuSource === "more" &&
                  renderFontSettingsMenu(
                    "bottom-full sm:bottom-auto",
                    "sm:w-40 sm:right-0 sm:mt-2"
                  )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-2 sm:px-8">
          {/* 첨부파일 버튼/리스트: 본문 위에, 오른쪽 정렬 */}
          <div className="mb-2 flex justify-end">
            {attachments.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center text-gray-600 p-2 rounded-md text-sm hover:bg-gray-100"
                  onClick={() => setShowAttachments((prev) => !prev)}
                >
                  <File className="w-4 h-4 mr-1" />
                  첨부파일 {attachments.length}
                </button>
                {showAttachments && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 mt-2 w-full sm:w-[400px] bg-white border rounded-lg shadow-lg z-50 max-h-[60vh] overflow-y-auto min-w-[280px]"
                    style={{
                      maxWidth: "calc(100vw - 2rem)",
                    }}
                  >
                    <div className="py-1">
                      {attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
                        >
                          <span className="text-sm truncate flex-1 pr-4">
                            {attachment.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 shrink-0"
                            onClick={() => handleDownload(attachment)}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">다운로드</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div ref={contentRef} className="min-h-[120px] mb-4 sm:mb-6">
            <TipTapViewer
              content={renderContentWithYoutube(post.content)}
              fontSizeLevel={fontSizeLevel}
              fontBoldLevel={fontBoldLevel}
              fontFamily={fontFamily}
            />
          </div>

          {/* 좋아요 및 댓글 카운트 UI */}
          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={toggleLike}
              disabled={likeLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${liked ? "bg-red-50 text-red-600" : "hover:bg-gray-100 text-gray-600"}`}
            >
              <Heart
                className={`h-4 w-4 ${liked ? "fill-red-600 text-red-600" : "text-gray-500"}`}
              />
              <span className="text-sm font-medium">{likeCount}</span>
            </button>

            <div className="flex items-center gap-1.5 text-gray-500">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">{commentCount}</span>
            </div>
          </div>

          {/* 태그 표시 */}
          {post.tags && (() => {
            try {
              const tags: ITag[] = JSON.parse(post.tags);
              return tags && tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                  {tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="text-xs px-2 py-1"
                      style={{
                        backgroundColor: tag.color || '#e5e7eb',
                        color: tag.color ? '#ffffff' : '#374151'
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : null;
            } catch (e) {
              return null;
            }
          })()}
        </CardContent>

        <CardFooter className="px-0 sm:px-6 pt-0 pb-0 border-t-0">
          {/* 버튼들은 CardContent로 이동했습니다 */}
        </CardFooter>

        <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6 border-t border-gray-100">
          <div id="comments-section">
            <BoardComments
              postId={post.id}
              allowComments={post.allow_comments !== false}
            />
          </div>
        </div>

        {/* 모바일 이전/다음 플로팅 버튼 */}
        <div
          className={`fixed bottom-20 left-0 right-0 sm:hidden z-40 flex justify-between px-4 pointer-events-none transition-all duration-500 ease-in-out ${
            showFloatingButtons
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          {/* 이전글 플로팅 버튼 */}
          {prevPost && (
            <button
              onClick={() => {
                if (prevPost && post?.page_id) {
                  const currentUrl = new URL(window.location.href);
                  currentUrl.searchParams.set("post", prevPost.id);
                  router.push(currentUrl.pathname + currentUrl.search);
                }
              }}
              className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg pointer-events-auto hover:bg-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
          )}

          <div className="flex-1"></div>

          {/* 다음글 플로팅 버튼 */}
          {nextPost && (
            <button
              onClick={() => {
                if (nextPost && post?.page_id) {
                  const currentUrl = new URL(window.location.href);
                  currentUrl.searchParams.set("post", nextPost.id);
                  router.push(currentUrl.pathname + currentUrl.search);
                }
              }}
              className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg pointer-events-auto hover:bg-white transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          )}
        </div>

        {/* 모바일 하단 고정 네비게이션 */}
        <div className="fixed bottom-0 left-0 right-0 sm:hidden z-50 bg-white border-t border-gray-200">
          {/* 통합된 하단 메뉴바 */}
          <div className="flex items-center justify-between px-8 py-3">
            {/* 목록으로 버튼 */}
            <button
              onClick={handleGoList}
              className="flex flex-col items-center text-gray-700 hover:text-gray-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span className="text-xs mt-0.5">목록</span>
            </button>

            {/* 글꼴 설정 버튼 */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowMobileFontMenu(!showMobileFontMenu);
                }}
                className="flex flex-col items-center text-gray-700 hover:text-gray-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <polyline points="4 7 4 4 20 4 20 7"></polyline>
                  <line x1="9" y1="20" x2="15" y2="20"></line>
                  <line x1="12" y1="4" x2="12" y2="20"></line>
                </svg>
                <span className="text-xs mt-0.5">글자</span>
              </button>

              {/* 모바일 글꼴 설정 다이얼로그 */}
              {showMobileFontMenu && (
                <div className="fixed inset-0 z-50 sm:hidden">
                  {/* 배경 오버레이 */}
                  <div
                    className="absolute inset-0 bg-black/50"
                    onClick={() => setShowMobileFontMenu(false)}
                  />

                  {/* 하단 다이얼로그 */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
                      showMobileFontMenu ? "translate-y-0" : "translate-y-full"
                    }`}
                  >
                    {/* 드래그 핸들 */}
                    <div className="flex justify-center pt-3 pb-2">
                      <div className="w-10 h-1 bg-gray-300 rounded-full" />
                    </div>

                    {/* 헤더 */}
                    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        글자 설정
                      </h3>
                      <button
                        onClick={() => setShowMobileFontMenu(false)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* 글꼴 설정 내용 */}
                    <div className="p-4 pb-6">
                      {/* 글꼴 크기와 굵기를 한 줄에 배치 */}
                      <div className="mb-4">
                        <div className="grid grid-cols-2 gap-3">
                          {/* 글꼴 크기 */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              글자 크기
                            </h4>
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                              <button
                                onClick={(e) => decreaseFontSize(e)}
                                className="w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50"
                                disabled={fontSizeLevel <= -2}
                              >
                                <span className="text-sm font-bold text-gray-600">
                                  -
                                </span>
                              </button>
                              <span className="text-sm font-medium">
                                {fontSizeLevel === 0
                                  ? "기본"
                                  : fontSizeLevel > 0
                                    ? `+${fontSizeLevel}`
                                    : fontSizeLevel}
                              </span>
                              <button
                                onClick={(e) => increaseFontSize(e)}
                                className="w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50"
                                disabled={fontSizeLevel >= 2}
                              >
                                <span className="text-sm font-bold text-gray-600">
                                  +
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* 글꼴 굵기 */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              글자 굵기
                            </h4>
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                              <button
                                onClick={(e) => decreaseFontBold(e)}
                                className="w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50"
                                disabled={fontBoldLevel <= -1}
                              >
                                <span className="text-sm font-bold text-gray-600">
                                  -
                                </span>
                              </button>
                              <span className="text-sm font-medium">
                                {fontBoldLevel === 0
                                  ? "기본"
                                  : fontBoldLevel > 0
                                    ? `+${fontBoldLevel}`
                                    : fontBoldLevel}
                              </span>
                              <button
                                onClick={(e) => increaseFontBold(e)}
                                className="w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50"
                                disabled={fontBoldLevel >= 3}
                              >
                                <span className="text-sm font-bold text-gray-600">
                                  +
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* 초기화 버튼 */}
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={resetFontSize}
                          className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          크기 초기화
                        </button>
                        <button
                          onClick={resetFontBold}
                          className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          굵기 초기화
                        </button>
                      </div>

                      {/* 글꼴 패밀리 */}
                      <div className="mb-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          글꼴 종류
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            {
                              value: "default",
                              label: "기본",
                              style: "",
                            },
                            {
                              value: "notoSans",
                              label: "노토산스",
                              style: "font-noto-sans",
                            },
                            {
                              value: "nanumGothic",
                              label: "나눔고딕",
                              style: "font-nanum-gothic",
                            },
                            {
                              value: "nanumMyeongjo",
                              label: "나눔명조",
                              style: "font-nanum-myeongjo",
                            },
                            {
                              value: "spoqa",
                              label: "스포카",
                              style: "font-spoqa",
                            },
                          ].map((font) => (
                            <button
                              key={font.value}
                              onClick={(e) => changeFontFamily(font.value, e)}
                              className={`p-2 rounded-lg border text-center transition-colors text-sm ${font.style} ${
                                fontFamily === font.value
                                  ? "bg-blue-50 border-blue-200 text-blue-700"
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {font.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 좋아요 버튼 */}
            <button
              onClick={toggleLike}
              disabled={likeLoading}
              className="flex flex-col items-center text-gray-700 hover:text-gray-900"
            >
              <Heart
                className={`h-5 w-5 ${liked ? "fill-red-600 text-red-600" : "text-gray-600"}`}
              />
              <span className="text-xs mt-0.5">{likeCount}</span>
            </button>

            {/* 댓글 버튼 */}
            <button
              onClick={() => {
                const commentSection =
                  document.getElementById("comments-section");
                if (commentSection) {
                  const y =
                    commentSection.getBoundingClientRect().top +
                    window.scrollY -
                    100;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className="flex flex-col items-center text-gray-700 hover:text-gray-900"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs mt-0.5">{commentCount}</span>
            </button>

            {/* 작성자인 경우에만 더보기 메뉴 표시 */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="flex flex-col items-center text-gray-700 hover:text-gray-900"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                  <span className="text-xs mt-0.5">더보기</span>
                </button>
                {showMobileMenu && (
                  <div className="absolute bottom-full w-16 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200">
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        router.push(`${pathname}/edit`);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        handleDelete();
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-lg"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
