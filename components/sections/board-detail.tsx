"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/db";
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

export default function BoardDetail() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [post, setPost] = useState<BoardPost | null>(null);
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
  // user 상태 추가
  const [user, setUser] = useState<any>(null);
  // 작성자 여부 상태 추가
  const [isAuthor, setIsAuthor] = useState(false);
  // 작성자 아바타 상태 추가
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);

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

      console.log("Current post created_at:", currentPost.created_at);
      console.log("Next post data:", nextData);

      setNextPost(nextData && nextData.length > 0 ? nextData[0] : null);
    } catch (err) {
      console.error("이전/다음 글 가져오기 오류:", err);
    }
  }

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      setError(null);
      const id = Array.isArray(params?.slug)
        ? params.slug.at(-1)
        : params?.slug;
      if (!id) {
        setError("잘못된 접근입니다.");
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("board_posts")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) {
          setError("게시글을 찾을 수 없습니다.");
        } else {
          setPost(data);
          console.log("게시글 데이터:", data);

          // 현재 로그인한 사용자 정보 가져오기
          const currentUser = await getHeaderUser();
          console.log("현재 사용자:", currentUser);
          console.log("게시글 user_id:", data.user_id);

          if (currentUser) {
            // user_id가 일치하는지 확인
            const isUserAuthor = currentUser.id === data.user_id;
            console.log("작성자 여부:", isUserAuthor);
            setIsAuthor(isUserAuthor);
          }

          // 이전글, 다음글 가져오기
          fetchPrevNextPosts(id, data.page_id);

          // 좋아요 수와 댓글 수 가져오기
          try {
            // 좋아요 수 가져오기
            const { count: likeCount } = await supabase
              .from("board_like")
              .select("*", { count: "exact", head: true })
              .eq("post_id", id);

            setLikeCount(likeCount || 0);

            // 댓글 수 가져오기
            const { count: commentCount } = await supabase
              .from("board_comments")
              .select("*", { count: "exact", head: true })
              .eq("post_id", id);

            setCommentCount(commentCount || 0);

            // 현재 사용자의 좋아요 여부 확인
            const userData = await getHeaderUser();
            if (userData?.username) {
              const { data: likeData } = await supabase
                .from("board_like")
                .select("id")
                .eq("post_id", id)
                .eq("user_id", userData.username)
                .maybeSingle();

              setLiked(!!likeData);
            }

            // 해당 게시글의 cms_pages 정보를 통해 메뉴 정보 가져오기
            if (post && post.page_id) {
              try {
                // 1. 게시글의 page_id로 cms_pages 정보 가져오기
                const { data: pageData, error: pageError } = await supabase
                  .from("cms_pages")
                  .select("title, slug, section_id, category_id")
                  .eq("id", post.page_id)
                  .single();

                if (pageError) throw pageError;

                if (pageData) {
                  // 2. cms_pages 정보를 바탕으로 cms_menus에서 메뉴 찾기
                  const { data: menuData, error: menuError } = await supabase
                    .from("cms_menus")
                    .select("title, url, parent_id")
                    .eq("page_id", post.page_id)
                    .eq("is_active", true)
                    .order("order_num")
                    .limit(1);

                  if (menuError) throw menuError;

                  if (menuData && menuData.length > 0) {
                    // 게시글에 직접 연결된 메뉴 정보 사용
                    setMenuInfo(menuData[0]);
                  } else {
                    // 메뉴를 찾지 못한 경우 cms_pages 정보로 대체
                    setMenuInfo({
                      title: pageData.title,
                      url: `/page/${post.page_id}`,
                    });
                  }
                }
              } catch (err) {
                console.error("메뉴 정보 가져오기 오류:", err);

                // 오류 발생 시 URL 경로를 통해 메뉴 추정
                const segments = pathname.split("/").filter(Boolean);
                if (segments.length > 0) {
                  const boardType = segments[0]; // board, notice 등
                  const { data: menuData } = await supabase
                    .from("cms_menus")
                    .select("title, url")
                    .eq("is_active", true)
                    .ilike("url", `/${boardType}%`)
                    .order("order_num")
                    .limit(1);

                  if (menuData && menuData.length > 0) {
                    setMenuInfo(menuData[0]);
                  }
                }
              }
            }
          } catch (err) {
            console.error("좋아요/댓글 정보 가져오기 오류:", err);
          }
        }
      } catch (err) {
        console.error("게시글 로드 오류:", err);
        setError("게시글을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [params]);

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

  // useEffect에서 user 상태 관리
  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const userData = await getHeaderUser();
        if (isMounted) {
          setUser(userData);
        }
      } catch (error) {
        console.error("사용자 정보 로드 오류:", error);
      }
    }

    loadUser();

    const handler = async () => {
      await loadUser();
    };

    window.addEventListener("storage", handler);
    return () => {
      isMounted = false;
      window.removeEventListener("storage", handler);
    };
  }, []);

  // useEffect에서 user 상태가 변경될 때마다 작성자 여부 체크
  useEffect(() => {
    if (user && post) {
      console.log("작성자 체크:", {
        userId: user.id,
        postUserId: post.user_id,
        isMatch: user.id === post.user_id,
      });
      setIsAuthor(user.id === post.user_id);
    } else {
      setIsAuthor(false);
    }
  }, [user, post]);

  // 게시글/작성자 정보 로드 useEffect 내부에 추가
  useEffect(() => {
    if (post?.user_id) {
      supabase
        .from("users")
        .select("avatar_url")
        .eq("id", post.user_id)
        .single()
        .then(({ data }) => {
          setAuthorAvatar(data?.avatar_url || null);
        });
    } else {
      setAuthorAvatar(null);
    }
  }, [post?.user_id]);

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

  // 삭제 핸들러
  async function handleDelete() {
    if (!post) return;
    if (!window.confirm("정말로 이 글을 삭제하시겠습니까?")) return;
    const { error } = await supabase
      .from("board_posts")
      .delete()
      .eq("id", post.id);
    if (error) {
      alert("삭제 중 오류가 발생했습니다: " + error.message);
      return;
    }
    alert("삭제되었습니다.");
    router.back(); // 또는 router.push("/board") 등 원하는 경로로 이동
  }

  // 이전 경로를 가져오는 함수
  function getParentPath() {
    if (typeof pathname !== "string") return "/";
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 1) {
      return "/" + segments.slice(0, -1).join("/");
    }
    return "/";
  }

  // 목록으로 이동
  function handleGoList(e?: React.MouseEvent) {
    if (e) e.preventDefault();
    router.push(getParentPath());
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

  // 좋아요 토글 함수
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
      if (liked) {
        // 좋아요 삭제
        const { error } = await supabase
          .from("board_like")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.username);

        if (error) throw error;

        setLikeCount((prev) => Math.max(0, prev - 1));
        setLiked(false);
      } else {
        // 좋아요 추가
        const { error } = await supabase.from("board_like").insert({
          post_id: post.id,
          user_id: user.username,
        });

        if (error) {
          // 이미 좋아요한 경우 무시
          if (error.code === "23505") return;
          throw error;
        }

        setLikeCount((prev) => prev + 1);
        setLiked(true);
      }
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
        console.log("Supabase 세션 사용자:", userData);
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
              console.log("스토리지 사용자:", user);
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
                console.log("스토리지 사용자 검증 실패");
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
      console.log("게시글 내용이 없습니다.");
      return;
    }

    console.log("첨부파일 추출 시작");
    console.log("게시글 ID:", post.id);
    console.log("게시글 내용 일부:", post.content.substring(0, 200) + "...");

    const extractedAttachments: IAttachment[] = [];

    // 정규표현식을 사용하여 이미지 및 파일 URL 추출
    // href와 src 속성 모두 처리
    const regex = /(?:href|src)=["'](https?:\/\/[^"']+)["']/g;
    let match;
    const urls = new Set<string>();

    while ((match = regex.exec(post.content)) !== null) {
      const url = match[1];
      console.log("추출된 URL:", url);

      if (url.includes("supabase") && !urls.has(url)) {
        urls.add(url);

        // URL에서 파일명 추출
        const urlParts = url.split("/");
        const fileName = urlParts[urlParts.length - 1];
        const decodedFileName = decodeURIComponent(fileName);

        // 파일 확장자 추출
        const fileExt = decodedFileName.split(".").pop()?.toLowerCase() || "";
        console.log("파일 이름:", decodedFileName, "확장자:", fileExt);

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
          console.log("첨부파일 추가:", decodedFileName);
        } else {
          console.log("이미지 파일이라 건너뜨:", decodedFileName);
        }
      }
    }

    // 추가 방법: 직접 a 태그의 href 값을 처리
    const anchorRegex =
      /<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([^<]+)<\/a>/g;
    while ((match = anchorRegex.exec(post.content)) !== null) {
      const url = match[1];
      const linkText = match[2];
      console.log("링크 추출:", url, linkText);

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
          console.log("링크에서 첨부파일 추가:", decodedFileName);
        }
      }
    }

    console.log("추출된 첨부파일 수:", extractedAttachments.length);
    setAttachments(extractedAttachments);
  }

  // 게시글에 연결된 첨부파일 가져오기
  async function fetchAttachments(postId: string, content?: string) {
    try {
      console.log("첨부파일 가져오기 시도:", postId);

      // 게시글 내용에서 파일 URL 추출
      const contentToProcess = content || post?.content;
      if (contentToProcess) {
        console.log("게시글 내용 처리 시작");
        const fileUrls: string[] = [];

        // 1. 모든 a 태그 추출
        const anchorRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/g;
        let match;

        while ((match = anchorRegex.exec(contentToProcess)) !== null) {
          const url = match[1];
          const text = match[2];
          console.log("추출된 링크:", url, text);

          // 파일 확장자가 있는 URL만 추출
          if (url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt)$/i)) {
            fileUrls.push(url);
            console.log("첨부파일 URL 추가:", url);
          }
        }

        // 2. href 속성에서 추출
        const hrefRegex =
          /href=["']([^"']+\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt))["']/gi;
        while ((match = hrefRegex.exec(contentToProcess)) !== null) {
          const url = match[1];
          if (!fileUrls.includes(url)) {
            fileUrls.push(url);
            console.log("href에서 첨부파일 URL 추가:", url);
          }
        }

        // 3. 직접 URL 추출
        const urlRegex =
          /(https?:\/\/[^\s"'<>]+\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt))/gi;
        while ((match = urlRegex.exec(contentToProcess)) !== null) {
          const url = match[1];
          if (!fileUrls.includes(url)) {
            fileUrls.push(url);
            console.log("직접 URL에서 첨부파일 추가:", url);
          }
        }

        console.log("추출된 파일 URL:", fileUrls);

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

        console.log("추출된 첨부파일:", extractedAttachments);
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

      <Card className="my-0 sm:my-8 sm:shadow-md border-0 sm:border sm:border-gray-200 mx-0 sm:mx-auto w-full max-w-full overflow-hidden shadow-none bg-transparent sm:bg-white relative pb-16 sm:pb-0">
        {/* 수정, 삭제 버튼과 이전글, 다음글, 목록 버튼 한 줄에 배치 - 모바일에서는 숨김 */}
        <div className="hidden sm:flex justify-between items-center px-0 sm:px-6 py-4 sm:py-6 border-b border-gray-100 space-x-2">
          {/* 수정, 삭제 버튼 - 작성자인 경우에만 표시 */}
          <div className="flex gap-2">
            {isAuthor && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`${pathname}/edit`)}
                  className="p-3 bg-gray-200 text-gray-500 hover:bg-amber-50"
                >
                  수정
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="p-3 bg-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50"
                >
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
              onClick={() =>
                prevPost && router.push(`${getListInfo().path}/${prevPost.id}`)
              }
            >
              이전글
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-3 text-gray-500 bg-gray-200 hover:text-gray-700 disabled:opacity-50"
              disabled={!nextPost}
              onClick={() =>
                nextPost && router.push(`${getListInfo().path}/${nextPost.id}`)
              }
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
        <CardHeader className="px-2 sm:px-8 py-2 space-y-2">
          {/* 카테고리 정보 표시 */}
          <div className="">
            {menuInfo ? (
              <Link
                href={menuInfo.url}
                className="text-sm text-green-600 hover:text-green-700 transition-colors font-medium flex items-center"
              >
                {menuInfo.title} <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            ) : (
              <Link
                href={getListInfo().path}
                className="text-sm text-green-600 hover:text-green-700 transition-colors font-medium flex items-center"
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
                    authorAvatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${post.author}`
                  }
                  alt={post.author}
                />
                <AvatarFallback>
                  {post.author.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{post.author}</span>
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
              {/* 더보기 버튼 (추후 확장) */}
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                title="더보기"
              >
                <span className="text-xl">…</span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 sm:px-8">
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
          <div
            ref={contentRef}
            className="min-h-[120px] mb-4 sm:mb-6 board-content prose prose-sm sm:prose max-w-none overflow-x-hidden"
            dangerouslySetInnerHTML={{
              __html: renderContentWithYoutube(post.content),
            }}
          />
          <style jsx global>{`
            .board-content img {
              max-width: 100%;
              height: auto;
              margin: 1rem auto;
              border-radius: 0.375rem;
              display: block;
            }
            .board-content p {
              margin-bottom: 1rem;
              line-height: 1.6;
            }
            .board-content h1,
            .board-content h2,
            .board-content h3 {
              margin-top: 1.5rem;
              margin-bottom: 1rem;
              font-weight: 600;
              line-height: 1.3;
            }
            .board-content h1 {
              font-size: 1.5rem;
            }
            .board-content h2 {
              font-size: 1.25rem;
            }
            .board-content h3 {
              font-size: 1.125rem;
            }
            .board-content ul,
            .board-content ol {
              margin-left: 1.5rem;
              margin-bottom: 1rem;
            }
            .board-content li {
              margin-bottom: 0.5rem;
            }
            .board-content blockquote {
              border-left: 4px solid #e5e7eb;
              padding-left: 1rem;
              margin: 1.5rem 0;
              color: #4b5563;
              font-style: italic;
            }
            .board-content pre {
              background-color: #f3f4f6;
              padding: 1rem;
              border-radius: 0.375rem;
              overflow-x: auto;
              margin: 1.5rem 0;
              font-size: 0.875rem;
            }
            .board-content code {
              background-color: #f3f4f6;
              padding: 0.2rem 0.4rem;
              border-radius: 0.25rem;
              font-size: 0.875em;
            }
            .board-content a {
              color: #2563eb;
              text-decoration: underline;
              text-underline-offset: 2px;
            }
            .board-content a:hover {
              text-decoration: none;
            }
            .board-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 1.5rem 0;
            }
            .board-content th,
            .board-content td {
              border: 1px solid #e5e7eb;
              padding: 0.5rem 0.75rem;
              text-align: left;
            }
            .board-content th {
              background-color: #f9fafb;
              font-weight: 600;
            }
            .board-content .youtube-embed iframe {
              pointer-events: auto !important;
            }
          `}</style>

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
        </CardContent>

        <CardFooter className="px-0 sm:px-6 pt-0 pb-0 border-t-0">
          {/* 버튼들은 CardContent로 이동했습니다 */}
        </CardFooter>

        <div className="px-2 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6 border-t border-gray-100">
          <div id="comments-section">
            <BoardComments
              postId={post.id}
              allowComments={post.allow_comments !== false}
            />
          </div>
        </div>

        {/* 모바일 하단 고정 네비게이션 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-between items-center sm:hidden z-50">
          {/* 왼쪽: 목록으로 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoList}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>목록으로</span>
          </Button>

          {/* 오른쪽: 좋아요, 댓글, 더보기 버튼 */}
          <div className="flex items-center gap-4">
            {/* 좋아요 버튼 */}
            <button
              onClick={toggleLike}
              disabled={likeLoading}
              className="flex flex-col items-center"
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
              className="flex flex-col items-center"
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <span className="text-xs mt-0.5">{commentCount}</span>
            </button>

            {/* 작성자인 경우에만 더보기 메뉴 표시 */}
            {isAuthor && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                >
                  <span className="text-xl">⋮</span>
                </Button>
                {showMobileMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowMobileMenu(false);
                        router.push(`${pathname}/edit`);
                      }}
                      className="w-full justify-start px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowMobileMenu(false);
                        handleDelete();
                      }}
                      className="w-full justify-start px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
