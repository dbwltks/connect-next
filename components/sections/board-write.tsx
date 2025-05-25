"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
} from "@/components/ui/toast";
import dynamic from "next/dynamic";
import { X } from "lucide-react";

// TipTap 에디터 컴포넌트를 동적으로 불러옴 (SSR 방지)
// 동적 임포트 방식을 수정하여 ChunkLoadError 해결
const TipTapEditor = dynamic(
  () => import("@/components/ui/tiptap-editor").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full bg-gray-100 animate-pulse rounded"></div>
    ),
  }
);

interface IFileInfo {
  url: string;
  name: string;
  size?: string;
  type?: string;
  uploadedAt?: string;
}

interface BoardWriteProps {
  pageId: string;
  categoryId?: string;
  onSuccess?: () => void;
  postId?: string; // 수정 모드에서 사용할 게시글 ID
  initialData?: {
    title?: string;
    content?: string;
    allow_comments?: boolean;
    files?: string; // 파일 정보 JSON 문자열
  }; // 수정 모드에서 사용할 초기 데이터
  isEditMode?: boolean; // 수정 모드 여부
  onThumbnailChange?: (url: string) => void; // 썸네일 변경 시 호출할 콜백
}

// 본문 내용이 실제로 비었는지 검사하는 함수
function isContentEmpty(html: string) {
  if (!html) return true;
  const cleaned = html
    .replace(/<p><br><\/p>/gi, "")
    .replace(/<p><\/p>/gi, "")
    .replace(/<br\s*\/?>(\s*)/gi, "")
    .replace(/\s+/g, "");
  return cleaned.length === 0;
}

// 파일 정보 보정 함수
function normalizeFileInfo(file: any): IFileInfo {
  return {
    url: file.url,
    name: file.name || (file.url ? file.url.split("/").pop() : "파일"),
    size: file.size || "크기 알 수 없음",
    type: file.type || "",
    uploadedAt: file.uploadedAt
      ? String(file.uploadedAt)
      : new Date().toISOString(),
  };
}

export default function BoardWrite({
  pageId,
  categoryId: initialCategoryId,
  onSuccess,
  postId: propPostId,
  initialData: propInitialData,
  isEditMode: propIsEditMode = false,
  onThumbnailChange,
}: BoardWriteProps) {
  const router = useRouter();
  // 내부 상태로 관리
  const [postId, setPostId] = useState<string | undefined>(propPostId);
  const [isEditMode, setIsEditMode] = useState<boolean>(propIsEditMode);
  const [initialData, setInitialData] = useState<any>(propInitialData);
  // Form state
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [categoryId] = useState<string | undefined>(initialCategoryId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [allowComments, setAllowComments] = useState(
    initialData?.allow_comments !== false
  );

  // Draft and save state
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showDraftList, setShowDraftList] = useState(false);
  const [drafts, setDrafts] = useState<Array<{ key: string; data: any }>>([]);
  const isSubmitButtonClickedRef = useRef(false);

  // Media state
  const [thumbnailImage, setThumbnailImage] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<IFileInfo[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [youtubeId, setYoutubeId] = useState<string>("");

  // Refs
  const editorRef = useRef<any>(null);

  // 토스트 상태 관리
  const [toastState, setToastState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }>({ open: false, title: "", description: "", variant: "default" });
  const showToast = (args: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => {
    setToastState({ open: true, ...args });
    setTimeout(() => setToastState((s) => ({ ...s, open: false })), 3000);
  };

  // 로컬 스토리지 키 생성 (페이지와 카테고리별 구분)
  const getStorageKey = () => `board_draft_${pageId}_${categoryId || "none"}`;

  //임시등록 목록 불러오기 (board_posts의 status='draft')
  const loadDrafts = async () => {
    try {
      const user = await getHeaderUser();
      if (!user || !user.id) return setDrafts([]);
      const { data, error } = await supabase
        .from("board_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("page_id", pageId)
        .eq("category_id", categoryId)
        .eq("status", "draft")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setDrafts(
        (data || []).map((d: any) => ({
          key: d.id,
          data: {
            title: d.title || "",
            content:
              typeof d.content === "string" ? d.content : (d.content ?? ""),
            files: (() => {
              if (!d.files) return [];
              if (typeof d.files === "string") {
                try {
                  return JSON.parse(d.files);
                } catch {
                  return [];
                }
              }
              if (Array.isArray(d.files)) return d.files;
              return [];
            })(),
            thumbnail_image: d.thumbnail_image || "",
            allow_comments:
              typeof d.allow_comments === "boolean"
                ? d.allow_comments
                : d.allow_comments !== false,
            savedAt: d.updated_at || d.created_at,
            pageId: d.page_id,
            categoryId: d.category_id,
          },
        }))
      );
      return data;
    } catch (e) {
      console.error("임시등록 목록 불러오기 오류:", e);
      showToast({
        title: "오류 발생",
        description: "임시등록 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      setDrafts([]);
      return [];
    }
  };

  //임시등록 수동 실행 (board_posts에 status='draft'로 저장)
  const handleManualSave = async () => {
    if (drafts.length >= 5) {
      showToast({
        title: "임시등록 한도 초과",
        description:
          "임시등록은 최대 5개까지 가능합니다. 기존 임시등록을 삭제 후 시도해 주세요.",
        variant: "destructive",
      });
      return;
    }
    await savePost("draft");
  };

  //임시등록 삭제 (board_posts에서 status='draft' row 삭제)
  const deleteDraft = async (draftKey: string) => {
    try {
      const { error } = await supabase
        .from("board_posts")
        .delete()
        .eq("id", draftKey)
        .eq("status", "draft");
      if (error) throw error;
      setDrafts(drafts.filter((d) => d.key !== draftKey));
      showToast({
        title: "삭제 완료",
        description: "선택한 임시등록이 삭제되었습니다.",
        variant: "default",
      });
    } catch (error) {
      console.error("임시등록 삭제 오류:", error);
      showToast({
        title: "오류 발생",
        description: "임시등록을 삭제하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  //임시등록 목록 토글
  const toggleDraftList = () => {
    if (!showDraftList) {
      loadDrafts();
    }
    setShowDraftList(!showDraftList);
  };

  // 특정임시등록 불러오기 (기본 저장된 데이터)
  const loadDraftItem = (draftKey?: string) => {
    try {
      const key = draftKey || getStorageKey();
      const savedData = localStorage.getItem(key);

      if (!savedData) {
        throw new Error("임시등록을 찾을 수 없습니다.");
      }

      const parsedData = JSON.parse(savedData);
      console.log("불러온임시등록 데이터:", {
        ...parsedData,
        files: parsedData.files
          ? parsedData.files.map((f: any) => ({
              name: f.name,
              type: f.type,
              size: f.size,
              url: f.url ? "..." : "empty", // URL은 너무 길어서 축약
            }))
          : [],
      });

      // 상태 업데이트
      if (parsedData.title) setTitle(parsedData.title);
      if (parsedData.content) {
        setContent(parsedData.content);
        // TipTap 에디터 내용 업데이트
        if (editorRef.current?.editor) {
          editorRef.current.editor.commands.setContent(parsedData.content);
        }
      }
      if (parsedData.thumbnailImage)
        setThumbnailImage(parsedData.thumbnailImage);
      if (parsedData.allowComments !== undefined)
        setAllowComments(parsedData.allowComments);

      // 파일 정보 로드
      if (parsedData.files && Array.isArray(parsedData.files)) {
        const validFiles = parsedData.files.filter(
          (file: any) =>
            file &&
            typeof file === "object" &&
            file.url &&
            typeof file.url === "string" &&
            file.name &&
            typeof file.name === "string"
        );
        setUploadedFiles(validFiles.map(normalizeFileInfo));
      } else {
        setUploadedFiles([]);
      }

      setLastSaved(
        parsedData.savedAt || new Date(parsedData.timestamp).toLocaleString()
      );
      setShowDraftList(false);

      showToast({
        title: "임시등록 불러오기 완료",
        description: "임시등록을 불러왔습니다.",
        variant: "default",
      });

      if (
        parsedData.pageId !== pageId ||
        parsedData.categoryId !== categoryId
      ) {
        showToast({
          title: "불러오기 실패",
          description: "현재 페이지/카테고리와 맞지 않는 임시저장입니다.",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("임시등록 불러오기 오류:", error);
      showToast({
        title: "오류 발생",
        description: "임시등록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  async function getHeaderUser() {
    try {
      // 먼저 Supabase 세션 확인
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        // Supabase 사용자 정보가 있으면 사용
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, full_name")
          .eq("id", session.user.id)
          .single();

        return {
          id: session.user.id,
          username:
            profile?.username || session.user.email?.split("@")[0] || "익명",
          email: session.user.email,
        };
      }

      // Supabase 세션이 없으면 로컬/세션 스토리지 확인
      if (typeof window === "undefined") return null;
      const stored =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("사용자 정보 조회 오류:", error);
      return null;
    }
  }

  // status를 인자로 받아 저장하는 함수
  const savePost = async (status: "draft" | "published") => {
    const html = editorRef.current?.editor?.getHTML() || "";
    if (!title.trim() || isContentEmpty(html)) {
      setError("제목과 내용을 입력하세요.");
      showToast({
        title: "입력 필요",
        description: "제목과 내용을 모두 입력해 주세요.",
        variant: "destructive",
      });
      return;
    }
    setError(null);
    setSuccess(false);
    setLoading(true);
    const user = await getHeaderUser();
    if (!user) {
      setError("로그인 후 작성 가능합니다.");
      setLoading(false);
      return;
    }
    const author = user.username || user.email?.split("@")[0] || "익명";
    const userId = user.id;
    let result;
    let newId = postId;
    try {
      const filesJson = JSON.stringify(uploadedFiles);
      // 게시글 저장(등록) 시 number 자동 할당
      let nextNumber = 1;
      if (!isEditMode && !postId) {
        try {
          const { data: maxData } = await supabase
            .from("board_posts")
            .select("number")
            .eq("page_id", pageId)
            .order("number", { ascending: false })
            .limit(1)
            .single();
          nextNumber = (maxData?.number || 0) + 1;
        } catch {}
      }
      if (isEditMode && postId) {
        // 수정모드: 기존 글 update
        result = await supabase
          .from("board_posts")
          .update({
            title,
            content: html,
            allow_comments: allowComments,
            thumbnail_image: thumbnailImage,
            files: filesJson,
            updated_at: new Date().toISOString(),
            author,
            user_id: userId,
            status,
          })
          .eq("id", postId);
      } else if (postId) {
        // 임시저장/불러오기: 기존 draft update
        result = await supabase
          .from("board_posts")
          .update({
            title,
            content: html,
            allow_comments: allowComments,
            thumbnail_image: thumbnailImage,
            files: filesJson,
            updated_at: new Date().toISOString(),
            author,
            user_id: userId,
            status,
          })
          .eq("id", postId);
      } else {
        // 새 글 작성(임시저장 or 등록)
        const insertResult = await supabase
          .from("board_posts")
          .insert([
            {
              title,
              content: html,
              author,
              user_id: userId,
              page_id: pageId,
              category_id: categoryId,
              allow_comments: allowComments,
              thumbnail_image: thumbnailImage || null,
              files: filesJson,
              number: nextNumber,
              status,
            },
          ])
          .select("id")
          .single();
        result = insertResult;
        newId = insertResult.data?.id;
        setPostId(newId); // 새로 insert된 경우 postId 상태 갱신
      }
    } catch (error) {
      console.error("게시글 저장 중 오류 발생:", error);
      setError("게시글 저장 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }
    setLoading(false);
    if (result.error) {
      setError(result.error.message || "저장 중 오류 발생");
    } else {
      if (status === "draft") {
        setSuccess(true);
        await loadDrafts();
        showToast({
          title: "임시등록 완료",
          description: "내용이 임시등록되었습니다.",
          variant: "default",
        });
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        if (newId) {
          // 상세페이지로 이동 (현재 경로에서 write 또는 edit 부분 제거)
          const basePath = window.location.pathname.replace(
            /\/(write|edit(\/[^/]+)?)$/,
            ""
          );
          // basePath가 이미 id로 끝나면 중복 추가하지 않음
          if (basePath.endsWith(`/${newId}`)) {
            router.push(basePath);
          } else {
            router.push(`${basePath}/${newId}`);
          }
        } else {
          // 성공 메시지 표시
          setTitle("");
          setContent("");
          setSuccess(true);
          if (onSuccess) onSuccess();
        }
      }
    }
  };

  // 등록 버튼
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePost("published");
  };

  useEffect(() => {
    if (isEditMode && postId && (!initialData || !initialData.files)) {
      loadPostData();
    } else if (isEditMode && initialData?.files) {
      try {
        const parsedFiles = JSON.parse(initialData.files);
        if (Array.isArray(parsedFiles)) {
          setUploadedFiles(parsedFiles.map(normalizeFileInfo));
          // 이미지가 있고 썸네일이 없으면 첫 번째 이미지를 자동 지정
          if (!thumbnailImage) {
            const firstImage = parsedFiles.find((f: any) =>
              ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
                (f.type || "").toLowerCase()
              )
            );
            if (firstImage) setThumbnailImage(firstImage.url);
          }
          console.log("초기 파일 정보 로드됨:", parsedFiles);
        }
      } catch (error) {
        console.error("파일 정보 파싱 오류:", error);
        setUploadedFiles([]);
      }
    }
    loadDrafts();
  }, [isEditMode, postId, initialData]);

  // 게시글 데이터 로드 함수 (수정 모드)
  const loadPostData = async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("board_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title || "");
        setContent(data.content || "");
        setAllowComments(data.allow_comments !== false);
        setThumbnailImage(data.thumbnail_image || "");

        // 파일 정보 로드 (보정 적용)
        let parsedFiles: any[] = [];
        if (data.files) {
          try {
            parsedFiles =
              typeof data.files === "string"
                ? JSON.parse(data.files)
                : data.files;
          } catch (error) {
            parsedFiles = [];
            console.error("파일 정보 파싱 오류:", error);
          }
        }
        if (!Array.isArray(parsedFiles)) parsedFiles = [];
        const files = parsedFiles.map(normalizeFileInfo);
        console.log("수정모드 파일 정보 loaded:", files);
        setUploadedFiles(files);
        // 이미지가 있고 썸네일이 없으면 첫 번째 이미지를 자동 지정
        if (!thumbnailImage) {
          const firstImage = files.find((f) =>
            ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
              (f.type || "").toLowerCase()
            )
          );
          if (firstImage) setThumbnailImage(firstImage.url);
        }
      }
    } catch (err) {
      console.error("게시글 로드 오류:", err);
      setError("게시글을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 업로드된 파일 정보 업데이트 핸들러
  const handleUploadedFilesChange = (files: IFileInfo[]) => {
    setUploadedFiles(files);
    // 이미지가 있고 썸네일이 없으면 첫 번째 이미지를 자동 지정
    if (!thumbnailImage) {
      const firstImage = files.find((f) =>
        ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
          (f.type || "").toLowerCase()
        )
      );
      if (firstImage) setThumbnailImage(firstImage.url);
    }
  };

  // 썸네일 변경 핸들러 (이미지 갤러리에서 썸네일 선택 시 호출)
  const handleThumbnailSelect = useCallback(
    (url: string) => {
      setThumbnailImage(url);
      if (onThumbnailChange) {
        onThumbnailChange(url);
      }
    },
    [onThumbnailChange]
  );

  // 이미지 업로드 완료 핸들러 (에디터 내부에서 이미지 업로드 시 호출)
  const handleImageUploaded = (
    url: string,
    fileName?: string,
    fileSize?: string,
    fileType?: string
  ): boolean => {
    if (!url) {
      console.error("유효하지 않은 URL입니다.");
      showToast({
        title: "업로드 실패",
        description: "파일 URL이 유효하지 않습니다.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const newFile: IFileInfo = {
        url,
        name: fileName || `file-${Date.now()}`,
        size: fileSize || "0",
        type: fileType || "application/octet-stream",
        uploadedAt: new Date().toISOString(),
      };

      console.log("새 파일 추가:", {
        name: newFile.name,
        type: newFile.type,
        size: newFile.size,
        url: url.substring(0, 50) + "...", // URL 일부만 표시
      });

      // 상태 업데이트
      setUploadedFiles((prevFiles) => {
        const updatedFiles = [...prevFiles, newFile];
        console.log(
          "업데이트된 파일 목록:",
          updatedFiles.map((f) => f.name)
        );
        return updatedFiles;
      });

      showToast({
        title: "파일 업로드 완료",
        description: `${newFile.name} 파일이 업로드되었습니다.`,
        variant: "default",
      });

      return true; // 성공 시 true 반환
    } catch (error) {
      console.error("파일 업로드 처리 중 오류 발생:", error);
      showToast({
        title: "업로드 실패",
        description: "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return false; // 실패 시 false 반환
    }
  };

  // 파일 삭제 핸들러
  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);
      return newFiles;
    });

    showToast({
      title: "파일 삭제",
      description: "파일이 삭제되었습니다.",
      variant: "default",
    });
  };

  //임시등록 함수 (자동저장 제거)
  const saveDraft = async (newContent: string) => {
    try {
      const key = getStorageKey();
      const now = new Date();

      // uploadedFiles가 배열이 아닌 경우 빈 배열로 초기화
      const filesToSave = Array.isArray(uploadedFiles) ? uploadedFiles : [];

      const draftData = {
        title,
        content: newContent || content,
        savedAt: now.toISOString(),
        thumbnailImage,
        files: filesToSave, // 파일 정보 저장
        allowComments,
        pageId,
        categoryId,
      };

      console.log("임시등록 데이터:", {
        ...draftData,
        files: filesToSave.map((f) => ({
          name: f.name,
          type: f.type,
          size: f.size,
          url: f.url ? "..." : "empty", // URL은 너무 길어서 축약
        })),
      });

      localStorage.setItem(key, JSON.stringify(draftData));
      setLastSaved(now.toLocaleString());

      return true;
    } catch (e) {
      console.error("임시등록 오류:", e);
      setError("임시등록 중 오류가 발생했습니다.");
      return false;
    }
  };

  //임시등록 목록을 표시하는 모달 (DB 기반)
  const DraftListModal = () => {
    if (!showDraftList) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">임시등록 목록</h3>
            <button
              onClick={() => setShowDraftList(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {drafts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              저장된임시등록이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.key}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {draft.data.title || "제목 없음"}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {draft.data.savedAt
                          ? new Date(draft.data.savedAt).toLocaleString()
                          : ""}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTitle(draft.data.title || "");
                          setContent(draft.data.content || "");
                          if (editorRef.current?.editor) {
                            editorRef.current.editor.commands.setContent(
                              draft.data.content || ""
                            );
                          }
                          setAllowComments(draft.data.allow_comments !== false);
                          setThumbnailImage(draft.data.thumbnail_image || "");
                          // 파일 정복원 (문자열/배열 모두 지원)
                          let files = [];
                          if (draft.data.files) {
                            if (typeof draft.data.files === "string") {
                              try {
                                files = JSON.parse(draft.data.files);
                              } catch {
                                files = [];
                              }
                            } else if (Array.isArray(draft.data.files)) {
                              files = draft.data.files;
                            }
                          }
                          setUploadedFiles(files.map(normalizeFileInfo));
                          setShowDraftList(false);
                          setPostId(draft.key); // uuid 세팅
                          setIsEditMode(false); // 임시저장 불러오기는 항상 새글모드
                          setInitialData({
                            title: draft.data.title,
                            content: draft.data.content,
                            allow_comments: draft.data.allow_comments,
                            files: JSON.stringify(draft.data.files),
                          });
                          showToast({
                            title: "임시등록 불러오기 완료",
                            description: "임시등록된 내용을 불러왔습니다.",
                            variant: "default",
                          });
                        }}
                      >
                        불러오기
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteDraft(draft.key)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  console.log("TipTapEditor에 넘기는 uploadedFiles:", uploadedFiles);

  // props → 내부 상태 동기화
  useEffect(() => {
    setIsEditMode(propIsEditMode);
    setPostId(propPostId);
    setInitialData(propInitialData);
  }, [propIsEditMode, propPostId, propInitialData]);

  return (
    <ToastProvider>
      <ToastViewport />
      <Toast
        open={toastState.open}
        onOpenChange={(open) => setToastState((s) => ({ ...s, open }))}
        variant={toastState.variant}
        className="z-[9999]"
      >
        <ToastTitle>{toastState.title}</ToastTitle>
        {toastState.description && (
          <ToastDescription>{toastState.description}</ToastDescription>
        )}
      </Toast>
      <div className="container mx-auto py-4 sm:py-6 px-0 sm:px-4">
        <form
          className="w-full mx-auto bg-white sm:rounded-lg sm:shadow-lg sm:border border-gray-200 overflow-hidden"
          onSubmit={handleFormSubmit}
        >
          {/* 헤더 및 액션 버튼 영역 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-4 sm:p-6 border-b border-gray-200 gap-4 sm:gap-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                {isEditMode ? "게시글 수정" : "새 게시글 작성"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode
                  ? "게시글 내용을 수정합니다."
                  : "새로운 게시글을 작성합니다."}
              </p>
            </div>

            {/* 액션 버튼 영역 - 우측 */}
            <div className="grid grid-cols-8 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* 임시등록 버튼(텍스트/숫자 분리 클릭) */}
              {!isEditMode && (
                <div className="flex items-center border rounded h-9 sm:h-10 overflow-hidden col-span-4 sm:col-auto">
                  <button
                    type="button"
                    onClick={handleManualSave}
                    className="h-9 sm:h-10 px-3 sm:px-4 text-sm font-medium hover:bg-gray-100 focus:bg-gray-100 transition border-r border-gray-200 flex-1"
                    disabled={drafts.length >= 5}
                  >
                    임시등록
                  </button>
                  <button
                    type="button"
                    onClick={toggleDraftList}
                    className="h-9 sm:h-10 px-2 sm:px-4 text-sm font-bold hover:bg-gray-100 bg-gray-50 focus:bg-gray-100 transition min-w-[40px] sm:min-w-[48px]"
                    aria-label="임시등록 개수 보기"
                  >
                    {drafts.length}
                  </button>
                  <span className="ml-2 text-xs text-gray-400">
                    {drafts.length}/5
                  </span>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="col-span-2 sm:col-auto h-9 sm:h-10 px-3 sm:px-4"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="col-span-2 sm:col-auto h-9 sm:h-10 px-3 sm:px-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  isSubmitButtonClickedRef.current = true;
                }}
              >
                등록
              </Button>
            </div>
          </div>

          {/* DraftListModal 팝업 렌더링 */}
          <DraftListModal />

          {/* 입력 영역 */}
          <div className="p-2 sm:p-6">
            {/* 제목 입력 */}
            <div className="space-y-2">
              <Input
                id="title"
                placeholder="제목을 입력해 주세요."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                required
                className="w-full text-base sm:text-sm px-2 rounded-none sm:rounded-md border-0 border-b sm:border"
              />
            </div>

            {/* TipTap 에디터 */}
            <div className="">
              <div className="relative min-h-[300px] sm:min-h-[400px]">
                <TipTapEditor
                  ref={editorRef}
                  content={content}
                  placeholder="내용을 입력하세요..."
                  thumbnailUrl={thumbnailImage}
                  onThumbnailChange={handleThumbnailSelect}
                  onUploadedFilesChange={handleUploadedFilesChange}
                  category={initialCategoryId}
                  pageId={postId}
                  uploadedFiles={uploadedFiles.map((file) => ({
                    ...file,
                    size: String(file.size || "크기 알 수 없음"),
                    type: String(file.type || ""),
                    uploadedAt: String(file.uploadedAt || ""),
                  }))}
                  setUploadedFiles={setUploadedFiles}
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              {/* 성공 메시지 */}
              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                  {lastSaved ? "임시등록되었습니다." : "글이 등록되었습니다."}
                </div>
              )}

              {/* 구분선 */}
              <div className="border-t border-gray-100"></div>
            </div>
          </div>
        </form>
      </div>
    </ToastProvider>
  );
}
