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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import {
  X,
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  Settings,
  BookOpen,
} from "lucide-react";
import {
  getHeaderUser,
  fetchDrafts,
  deleteDraft as serviceDeleteDraft,
  saveBoardPost as serviceSaveBoardPost,
  getBoardPost as serviceGetBoardPost,
} from "@/services/boardService";
import {
  BIBLE_VERSIONS,
  BIBLE_BOOKS,
  getBibleVerses,
  getBibleChapters,
  getBibleVerseCount,
  formatBibleVerses,
  formatBibleVersesWithSub,
  getBibleBookName,
} from "@/services/bibleService";
import { useAuth } from "@/contexts/auth-context";

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
  pageId?: string;
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

  // 더 엄격한 정리: 모든 HTML 태그와 공백 제거
  const cleaned = html
    .replace(/<p><br\s*\/?><\/p>/gi, "") // <p><br></p> 또는 <p><br/></p>
    .replace(/<p><\/p>/gi, "") // 빈 <p></p>
    .replace(/<br\s*\/?>/gi, "") // 모든 <br> 태그
    .replace(/<[^>]*>/g, "") // 모든 HTML 태그 제거
    .replace(/&nbsp;/g, "") // &nbsp; 제거
    .replace(/\s+/g, "") // 모든 공백 제거
    .trim();

  console.log("isContentEmpty 체크:", {
    original: html,
    cleaned: cleaned,
    isEmpty: cleaned.length === 0,
  });

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

// FileManager 컴포넌트 - TipTapEditor에서 옮겨옴
const FileManager = ({
  uploadedFiles,
  setUploadedFiles,
  selectedThumbnail,
  setSelectedThumbnail,
  onThumbnailChange,
  editor,
  showToast,
}: {
  uploadedFiles: IFileInfo[];
  setUploadedFiles: (files: IFileInfo[]) => void;
  selectedThumbnail?: string;
  setSelectedThumbnail: (url?: string) => void;
  onThumbnailChange?: (url: string) => void;
  editor: any;
  showToast: (props: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
}) => {
  // 파일 타입에 따른 아이콘 결정
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(type)) {
      return null;
    }
    if (type === "pdf") return <FileText className="w-12 h-12 text-red-500" />;
    if (["doc", "docx"].includes(type))
      return <FileText className="w-12 h-12 text-blue-500" />;
    if (["xls", "xlsx"].includes(type))
      return <FileSpreadsheet className="w-12 h-12 text-green-500" />;
    if (["ppt", "pptx"].includes(type))
      return <Presentation className="w-12 h-12 text-orange-500" />;
    return <File className="w-12 h-12 text-gray-500" />;
  };

  // 썸네일 선택 핸들러
  const handleThumbnailSelect = useCallback(
    (url: string) => {
      setSelectedThumbnail(url);
      if (onThumbnailChange) {
        onThumbnailChange(url);
        showToast({
          title: "썸네일 설정 완료",
          description: "선택한 이미지가 썸네일로 지정되었습니다.",
          variant: "default",
        });
      }
    },
    [onThumbnailChange, setSelectedThumbnail, showToast]
  );

  if (uploadedFiles.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {uploadedFiles.map((file, index) => {
        const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
          (file.type || "").toLowerCase()
        );
        const isThumbnail = selectedThumbnail === file.url;
        return (
          <div
            key={index}
            className={`flex items-center justify-between border rounded px-3 py-2 bg-gray-50 hover:bg-gray-100 ${isThumbnail ? "border-blue-500 ring-2 ring-blue-200" : ""}`}
          >
            <div className="flex items-center gap-2 w-full">
              {/* 이미지는 미리보기, 파일은 아무것도 안 보임 */}
              {isImage && (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-10 h-10 object-cover rounded"
                />
              )}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-sm break-all truncate max-w-[160px]">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500">{file.size}</span>
              </div>
              {/* 썸네일 지정 버튼(이미지 파일만) */}
              {isImage && (
                <button
                  type="button"
                  className={`ml-2 px-2 py-1 text-xs rounded border ${isThumbnail ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 text-gray-600 hover:bg-blue-50"}`}
                  onClick={() => handleThumbnailSelect(file.url)}
                  disabled={isThumbnail}
                >
                  {isThumbnail ? "대표" : "썸네일로 지정"}
                </button>
              )}
            </div>
            <button
              type="button"
              className="ml-2 text-red-500 hover:text-red-700 text-lg font-bold"
              onClick={async () => {
                // 1. Storage 경로 추출
                const url = file.url;
                // 예: https://<project>.supabase.co/storage/v1/object/public/images/2024/07/abc.jpg
                const match = url.match(
                  /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/
                );
                if (!match) {
                  showToast({
                    title: "삭제 실패",
                    description: "Storage 경로를 추출할 수 없습니다.",
                    variant: "destructive",
                  });
                  return;
                }
                const bucket = match[1];
                const filePath = match[2];
                // 2. Storage에서 삭제
                const { error: removeError } = await supabase.storage
                  .from(bucket)
                  .remove([filePath]);
                if (removeError) {
                  showToast({
                    title: "삭제 실패",
                    description: removeError.message,
                    variant: "destructive",
                  });
                  return;
                }
                // 3. UI에서 제거 및 토스트
                if (editor) {
                  const content = editor.getHTML();
                  const escapedUrl = file.url.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                  );
                  const regex = new RegExp(
                    `<img[^>]*src=\"${escapedUrl}\"[^>]*>`,
                    "g"
                  );
                  const newContent = content.replace(regex, "");
                  editor.commands.setContent(newContent);
                }
                const currentFiles = [...uploadedFiles];
                const fileIndex = currentFiles.findIndex(
                  (item) => item.url === file.url
                );
                if (fileIndex !== -1) {
                  currentFiles.splice(fileIndex, 1);
                  if (typeof setUploadedFiles === "function")
                    setUploadedFiles(currentFiles);
                }
                if (selectedThumbnail === file.url) {
                  const remainingFiles = uploadedFiles.filter(
                    (item) => item.url !== file.url
                  );
                  setSelectedThumbnail(undefined);
                  if (onThumbnailChange) {
                    onThumbnailChange(remainingFiles[0]?.url || "");
                  }
                }
                showToast({
                  title: "파일 삭제",
                  description: "파일이 스토리지에서도 삭제되었습니다.",
                  variant: "default",
                });
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default function BoardWrite({
  pageId: initialPageId,
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
  // Page and Category selection state
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>(
    initialPageId
  );
  const [boardPages, setBoardPages] = useState<{ id: string; title: string }[]>(
    []
  );
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
  const [description, setDescription] = useState(""); // 상세 설명 상태 추가
  const isSubmitButtonClickedRef = useRef(false);

  // Media state
  const [thumbnailImage, setThumbnailImage] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<IFileInfo[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [youtubeId, setYoutubeId] = useState<string>("");
  // 숨김(관리자만 보기) 상태 추가
  const [isHidden, setIsHidden] = useState<boolean>(false);
  // 관리자 설정 상태 추가
  const [isNotice, setIsNotice] = useState<boolean>(false);
  const [publishDate, setPublishDate] = useState<string>("");
  const [showAdminSettings, setShowAdminSettings] = useState<boolean>(false);

  // 성경 관련 상태 추가
  const [showBibleInsert, setShowBibleInsert] = useState<boolean>(false);
  const [selectedBibleVersion, setSelectedBibleVersion] =
    useState<keyof typeof BIBLE_VERSIONS>("kor_old");
  const [selectedBibleSubVersion, setSelectedBibleSubVersion] = useState<
    keyof typeof BIBLE_VERSIONS | null
  >(null); // 대역 번역본
  const [showBothVersions, setShowBothVersions] = useState<boolean>(false); // 본문-대역 표시 여부
  const [selectedBibleBook, setSelectedBibleBook] = useState<number>(1);
  const [selectedBibleChapter, setSelectedBibleChapter] = useState<number>(1);
  const [selectedStartVerse, setSelectedStartVerse] = useState<number>(1);
  const [selectedEndVerse, setSelectedEndVerse] = useState<number>(1);
  const [availableChapters, setAvailableChapters] = useState<number[]>([]);
  const [availableVerses, setAvailableVerses] = useState<number>(1);
  const [bibleLoading, setBibleLoading] = useState<boolean>(false);

  // 다른 장 포함 관련 상태
  const [includeOtherChapter, setIncludeOtherChapter] =
    useState<boolean>(false);
  const [selectedEndChapter, setSelectedEndChapter] = useState<number>(1);
  const [endChapterVerses, setEndChapterVerses] = useState<number>(1);

  // useAuth 훅 사용
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";

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

  useEffect(() => {
    const fetchBoardPages = async () => {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("id, title")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching board pages:", error);
        showToast({
          title: "게시판 목록 로딩 실패",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setBoardPages(data || []);
        // 쿼리스트링에서 pageId 추출
        let pageIdFromQuery = undefined;
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          pageIdFromQuery = params.get("pageId");
        }
        // 우선순위: initialPageId > 쿼리 pageId > 첫 번째 게시판
        if (initialPageId && (data || []).some((p) => p.id === initialPageId)) {
          setSelectedPageId(initialPageId);
        } else if (
          pageIdFromQuery &&
          (data || []).some((p) => p.id === pageIdFromQuery)
        ) {
          setSelectedPageId(pageIdFromQuery);
        } else if ((data || []).length > 0) {
          setSelectedPageId((data || [])[0].id);
        }
      }
    };
    fetchBoardPages();
  }, []);

  // 임시등록 목록 불러오기 (DB 기반, 현재 게시판+유저 기준)
  const loadDrafts = async () => {
    if (!selectedPageId) {
      setDrafts([]);
      return [];
    }
    try {
      const user = await getHeaderUser();
      if (!user || !user.id) {
        setDrafts([]);
        return [];
      }
      const data = await fetchDrafts({
        userId: user.id,
        pageId: selectedPageId,
        categoryId,
      });
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

  // 임시등록 수동 실행 (DB에 status='draft'로 저장)
  const handleManualSave = async () => {
    if (!selectedPageId) {
      showToast({
        title: "선택 필요",
        description: "먼저 게시판을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (drafts.length >= 5) {
      showToast({
        title: "임시등록 한도 초과",
        description:
          "임시등록은 최대 5개까지 가능합니다. 기존 임시등록을 삭제 후 시도해 주세요.",
        variant: "destructive",
      });
      return;
    }
    setPostId(undefined); // 항상 새 draft로 저장
    await savePost("draft");
    await loadDrafts();
  };

  // 임시등록 삭제 (DB 기반)
  const deleteDraft = async (draftKey: string) => {
    try {
      await serviceDeleteDraft({ draftId: draftKey });
      setDrafts((prev) => prev.filter((d) => d.key !== draftKey));
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

  // 임시등록 목록 토글
  const toggleDraftList = () => {
    if (!showDraftList) {
      loadDrafts();
    }
    setShowDraftList((prev) => !prev);
  };

  // 특정임시등록 불러오기 (DB 기반)
  const loadDraftItem = async (draftKey?: string) => {
    try {
      const draft = drafts.find((d) => d.key === draftKey);
      if (!draft) throw new Error("임시등록을 찾을 수 없습니다.");
      const parsedData = draft.data;
      if (parsedData.title) setTitle(parsedData.title);
      if (parsedData.content) {
        setContent(parsedData.content);
        if (editorRef.current?.editor) {
          editorRef.current.editor.commands.setContent(parsedData.content);
        }
      }
      if (parsedData.thumbnail_image)
        setThumbnailImage(parsedData.thumbnail_image);
      if (parsedData.allow_comments !== undefined)
        setAllowComments(parsedData.allow_comments);
      if (parsedData.pageId) setSelectedPageId(parsedData.pageId);
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
    } catch (error) {
      console.error("임시등록 불러오기 오류:", error);
      showToast({
        title: "오류 발생",
        description: "임시등록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 게시글 데이터 로드 함수 (수정 모드)
  const loadPostData = async () => {
    try {
      setLoading(true);
      if (postId) {
        // DB에서 게시글 가져오기
        const data = await serviceGetBoardPost({ postId });

        if (!data) {
          console.error("게시글 데이터 없음");
          setError("게시글 데이터를 가져올 수 없습니다.");
          return;
        }

        // 데이터 설정
        setTitle(data.title || "");
        setContent(data.content || "");
        setThumbnailImage(data.thumbnail || data.thumbnail_image || "");
        setAllowComments(data.allow_comments !== false);
        setDescription(data.description || ""); // 상세 설명 로드
        setIsHidden(data.status === "hidden"); // 숨김 상태 반영
        setIsNotice(data.is_notice === true); // 공지사항 상태 반영
        setPublishDate(
          data.published_at
            ? new Date(data.published_at).toISOString().slice(0, 16)
            : ""
        ); // 게시일 반영
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
        setUploadedFiles(files);
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
      // 토스트 추가
      showToast({
        title: "썸네일 설정 완료",
        description: "선택한 이미지가 썸네일로 지정되었습니다.",
      });
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

  //임시등록 목록을 표시하는 모달 (DB 기반, 현재 게시판 기준)
  const DraftListModal = () => {
    if (!showDraftList) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">임시등록 목록</h3>
              <span className="text-xs text-gray-400">{drafts.length}/5</span>
            </div>
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
                        onClick={async () => {
                          await loadDraftItem(draft.key);
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
    // 수정 모드에서 status가 hidden이면 isHidden true로
    if (
      propInitialData &&
      typeof propInitialData === "object" &&
      "status" in propInitialData
    ) {
      setIsHidden(propInitialData.status === "hidden");
    }
  }, [propIsEditMode, propPostId, propInitialData]);

  // status를 인자로 받아 저장하는 함수
  // 임시 폴더의 파일들을 정식 폴더로 이동하고 URL 매핑 반환
  const moveFilesFromTemp = async (files: IFileInfo[]) => {
    const movedFiles: IFileInfo[] = [];
    const urlMapping: { [oldUrl: string]: string } = {}; // 이전 URL -> 새 URL 매핑

    for (const file of files) {
      if (file.url.includes("/temp/")) {
        try {
          // temp 경로에서 정식 경로로 변경
          const tempPath = file.url.split(
            "/storage/v1/object/public/board/"
          )[1];
          const newPath = tempPath.replace("temp/", "");

          // 파일 복사
          const { data: downloadData, error: downloadError } =
            await supabase.storage.from("board").download(tempPath);

          if (downloadError) {
            console.error("파일 다운로드 실패:", downloadError);
            movedFiles.push(file); // 실패시 원본 유지
            continue;
          }

          // 새 위치에 업로드
          const { error: uploadError } = await supabase.storage
            .from("board")
            .upload(newPath, downloadData, { upsert: true });

          if (uploadError) {
            console.error("파일 업로드 실패:", uploadError);
            movedFiles.push(file); // 실패시 원본 유지
            continue;
          }

          // 새 URL 생성
          const { data: publicUrlData } = supabase.storage
            .from("board")
            .getPublicUrl(newPath);

          // URL 매핑 저장
          urlMapping[file.url] = publicUrlData.publicUrl;

          // 임시 파일 삭제
          await supabase.storage.from("board").remove([tempPath]);

          // 새 파일 정보로 추가
          movedFiles.push({
            ...file,
            url: publicUrlData.publicUrl,
          });
        } catch (error) {
          console.error("파일 이동 중 오류:", error);
          movedFiles.push(file); // 실패시 원본 유지
        }
      } else {
        // 이미 정식 경로인 파일은 그대로 유지
        movedFiles.push(file);
      }
    }

    return { movedFiles, urlMapping };
  };

  const savePost = async (statusArg: "draft" | "published") => {
    const html = editorRef.current?.editor?.getHTML() || "";

    if (!selectedPageId) {
      setError("게시판을 선택해야 합니다.");
      showToast({
        title: "선택 필요",
        description: "게시글을 등록할 게시판을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

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

    // 사용자 정보 가져오기 및 디버깅
    console.log("[BoardWrite] 사용자 정보 가져오기 시작");
    const user = await getHeaderUser();
    console.log(
      "[BoardWrite] 가져온 사용자 정보:",
      JSON.stringify(user, null, 2)
    );

    if (!user || !user.id) {
      console.error("[BoardWrite] 사용자 정보 또는 ID가 없음");
      setError("로그인 후 작성 가능합니다. 사용자 ID를 가져올 수 없습니다.");
      setLoading(false);
      showToast({
        title: "오류",
        description: "사용자 정보를 가져올 수 없습니다. 다시 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }
    const userId = user.id;
    console.log("[BoardWrite] 사용할 userId:", userId);
    let newId = postId;
    try {
      // 게시글이 정식 발행되는 경우 임시 파일들을 정식 폴더로 이동
      let finalUploadedFiles = uploadedFiles;
      let finalThumbnailImage = thumbnailImage;
      let finalContent = html;

      if (statusArg === "published") {
        // 업로드된 파일들 이동 및 URL 매핑 얻기
        const { movedFiles, urlMapping } =
          await moveFilesFromTemp(uploadedFiles);
        finalUploadedFiles = movedFiles;
        setUploadedFiles(finalUploadedFiles);

        // 썸네일 이미지도 temp에서 정식 폴더로 이동
        if (thumbnailImage && thumbnailImage.includes("/temp/")) {
          try {
            const tempPath = thumbnailImage.split(
              "/storage/v1/object/public/board/"
            )[1];
            const newPath = tempPath.replace("temp/", "");

            // 파일 복사
            const { data: downloadData, error: downloadError } =
              await supabase.storage.from("board").download(tempPath);

            if (!downloadError && downloadData) {
              // 새 위치에 업로드
              const { error: uploadError } = await supabase.storage
                .from("board")
                .upload(newPath, downloadData, { upsert: true });

              if (!uploadError) {
                // 새 URL 생성
                const { data: publicUrlData } = supabase.storage
                  .from("board")
                  .getPublicUrl(newPath);

                finalThumbnailImage = publicUrlData.publicUrl;
                setThumbnailImage(finalThumbnailImage);

                // 썸네일 URL 매핑에도 추가
                urlMapping[thumbnailImage] = finalThumbnailImage;

                // 임시 파일 삭제
                await supabase.storage.from("board").remove([tempPath]);
              }
            }
          } catch (error) {
            console.error("썸네일 이미지 이동 중 오류:", error);
            // 실패해도 계속 진행
          }
        }

        // 에디터 내용에서 temp URL들을 정식 URL로 교체
        finalContent = html;
        for (const [oldUrl, newUrl] of Object.entries(urlMapping)) {
          const escapedOldUrl = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(escapedOldUrl, "g");
          finalContent = finalContent.replace(regex, newUrl);
        }

        // 에디터에도 업데이트된 내용 반영
        if (editorRef.current?.editor && finalContent !== html) {
          editorRef.current.editor.commands.setContent(finalContent);
        }

        console.log("파일 이동 및 URL 교체 완료:", {
          originalFilesCount: uploadedFiles.length,
          movedFilesCount: finalUploadedFiles.length,
          urlMappingCount: Object.keys(urlMapping).length,
          contentChanged: finalContent !== html,
          thumbnailChanged: finalThumbnailImage !== thumbnailImage,
        });
      }

      // 게시글 저장(등록) 시 number 자동 할당
      let nextNumber = 1;
      if (!isEditMode && !postId) {
        try {
          const { data: maxData } = await supabase
            .from("board_posts")
            .select("number")
            .eq("page_id", selectedPageId)
            .order("number", { ascending: false })
            .limit(1)
            .single();
          nextNumber = (maxData?.number || 0) + 1;
        } catch {}
      }
      console.log("[BoardWrite] serviceSaveBoardPost 호출 전 데이터:", {
        postId,
        isEditMode,
        title: title.substring(0, 20) + (title.length > 20 ? "..." : ""),
        contentLength: html.length,
        allowComments,
        thumbnailImage: thumbnailImage ? "있음" : "없음",
        uploadedFilesCount: uploadedFiles.length,
        userId, // 중요: userId가 전달되는지 확인
        pageId: selectedPageId,
        categoryId,
        status:
          statusArg === "draft" ? "draft" : isHidden ? "hidden" : "published",
        number: nextNumber,
      });

      // 파일 데이터 JSON화
      const filesJson = JSON.stringify(uploadedFiles);

      // saveBoardPost 함수 정확히 호출
      const result = await serviceSaveBoardPost({
        postId,
        isEditMode,
        title,
        content: finalContent, // temp URL이 정식 URL로 교체된 내용 사용
        allowComments,
        thumbnailImage: finalThumbnailImage,
        uploadedFiles: finalUploadedFiles,
        userId,
        pageId: selectedPageId,
        categoryId,
        status:
          statusArg === "draft" ? "draft" : isHidden ? "hidden" : "published",
        number: nextNumber,
        description: description.trim(), // 상세 설명 추가
        isNotice, // 공지사항 설정 추가
        publishedAt: publishDate ? new Date(publishDate).toISOString() : null, // 게시일 추가
      });

      console.log("[BoardWrite] serviceSaveBoardPost 결과:", result);
      newId = result.id;
      setPostId(newId);
    } catch (error: any) {
      console.error("게시글 저장 중 오류 발생:", error);
      setError("게시글 저장 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }
    setLoading(false);
    if (statusArg === "draft") {
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
      if (isEditMode) {
        // 수정 모드: 뒤로 가기 또는 상세 페이지로 이동
        showToast({
          title: "수정 완료",
          description: "게시글이 성공적으로 수정되었습니다.",
          variant: "default",
        });
        setTimeout(() => {
          router.back();
        }, 1000);
      } else if (newId) {
        // 신규 작성 모드: 상세 페이지로 이동
        const params = new URLSearchParams(window.location.search);
        params.set("post", newId);
        if (selectedPageId) params.set("pageId", selectedPageId);
        // 현재 경로에서 write 부분 제거
        const basePath = window.location.pathname.replace(/\/write$/, "");
        router.push(`${basePath}?${params.toString()}`);
      } else {
        setTitle("");
        setContent("");
        setSuccess(true);
        if (onSuccess) onSuccess();
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

  // 게시판(페이지) 선택이 바뀔 때마다 임시등록 목록 자동 갱신
  useEffect(() => {
    loadDrafts();
  }, [selectedPageId]);

  // 임시 파일 정리 함수
  const cleanupTempFiles = async () => {
    const tempFiles = uploadedFiles.filter((file) =>
      file.url.includes("/temp/")
    );

    if (tempFiles.length > 0) {
      for (const file of tempFiles) {
        try {
          const tempPath = file.url.split(
            "/storage/v1/object/public/board/"
          )[1];
          await supabase.storage.from("board").remove([tempPath]);
        } catch (error) {
          console.error("임시 파일 삭제 실패:", error);
        }
      }
    }
  };

  // 작성 중인 내용이 있는지 확인하는 함수
  const hasContent = useCallback(() => {
    const html = editorRef.current?.editor?.getHTML() || "";
    const hasTitle = title.trim().length > 0;
    const hasContentText = !isContentEmpty(html);
    const hasFiles = uploadedFiles.length > 0;

    // 디버깅용 로그
    console.log("hasContent 체크:", {
      title: `"${title}"`,
      hasTitle,
      html: `"${html}"`,
      hasContentText,
      hasFiles,
      uploadedFilesLength: uploadedFiles.length,
      result: hasTitle || hasContentText || hasFiles,
    });

    return hasTitle || hasContentText || hasFiles;
  }, [title, uploadedFiles]);

  // 취소 버튼 클릭 핸들러
  const handleCancel = async () => {
    if (hasContent()) {
      const confirmed = window.confirm(
        "작성 중인 내용이 있습니다. 정말로 취소하시겠습니까?\n작성된 내용과 업로드된 파일이 모두 삭제됩니다."
      );
      if (!confirmed) return;
    }

    await cleanupTempFiles();
    router.back();
  };

  // beforeunload 이벤트로 임시 파일 정리 및 작성 중 확인
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      // hasContent 함수를 사용하여 일관된 검사
      if (hasContent()) {
        // 임시 파일들 삭제 시도
        const tempFiles = uploadedFiles.filter((file) =>
          file.url.includes("/temp/")
        );

        if (tempFiles.length > 0) {
          for (const file of tempFiles) {
            try {
              const tempPath = file.url.split(
                "/storage/v1/object/public/board/"
              )[1];
              await supabase.storage.from("board").remove([tempPath]);
            } catch (error) {
              console.error("임시 파일 삭제 실패:", error);
            }
          }
        }

        // 브라우저에 확인 메시지 표시
        event.preventDefault();
        event.returnValue =
          "작성 중인 내용이 있습니다. 페이지를 나가면 작성된 내용과 업로드된 파일이 모두 삭제됩니다.";
        return event.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [uploadedFiles, title, hasContent]);

  // 성경 관련 함수들

  const insertBibleIntoEditor = async () => {
    if (!editorRef.current?.editor) {
      showToast({
        title: "오류 발생",
        description: "에디터가 준비되지 않았습니다.",
        variant: "destructive",
      });
      return;
    }

    setBibleLoading(true);

    try {
      let allMainVerses: any[] = [];
      let allSubVerses: any[] = [];

      if (includeOtherChapter && selectedEndChapter !== selectedBibleChapter) {
        // 다른 장 포함인 경우: 여러 장에 걸친 구절들을 가져오기
        for (
          let chapter = selectedBibleChapter;
          chapter <= selectedEndChapter;
          chapter++
        ) {
          let startVerse: number;
          let endVerse: number | undefined;

          if (chapter === selectedBibleChapter) {
            // 시작 장: 선택한 시작절부터 해당 장의 끝까지
            startVerse = selectedStartVerse;
            // 해당 장의 마지막 절 번호를 구해서 명시적으로 설정
            const chapterVerseCount = await getBibleVerseCount(
              selectedBibleBook,
              chapter,
              selectedBibleVersion
            );
            endVerse = chapterVerseCount;
          } else if (chapter === selectedEndChapter) {
            // 끝 장: 1절부터 선택한 끝절까지
            startVerse = 1;
            endVerse = selectedEndVerse;
          } else {
            // 중간 장들: 1절부터 해당 장의 끝까지 모든 절
            startVerse = 1;
            // 해당 장의 마지막 절 번호를 구해서 명시적으로 설정
            const chapterVerseCount = await getBibleVerseCount(
              selectedBibleBook,
              chapter,
              selectedBibleVersion
            );
            endVerse = chapterVerseCount;
          }

          const mainVerses = await getBibleVerses({
            version: selectedBibleVersion,
            book: selectedBibleBook,
            chapter: chapter,
            startVerse: startVerse,
            endVerse: endVerse,
          });

          if (mainVerses && mainVerses.length > 0) {
            allMainVerses.push(...mainVerses);
          }

          // 대역이 선택된 경우
          if (showBothVersions && selectedBibleSubVersion) {
            try {
              const subVerses = await getBibleVerses({
                version: selectedBibleSubVersion,
                book: selectedBibleBook,
                chapter: chapter,
                startVerse: startVerse,
                endVerse: endVerse,
              });
              if (subVerses && subVerses.length > 0) {
                allSubVerses.push(...subVerses);
              }
            } catch (error) {
              console.error(`대역 구절 가져오기 실패 (${chapter}장):`, error);
            }
          }
        }
      } else {
        // 같은 장 내에서의 절 범위인 경우
        const mainVerses = await getBibleVerses({
          version: selectedBibleVersion,
          book: selectedBibleBook,
          chapter: selectedBibleChapter,
          startVerse: selectedStartVerse,
          endVerse:
            selectedEndVerse !== selectedStartVerse
              ? selectedEndVerse
              : undefined,
        });

        if (mainVerses && mainVerses.length > 0) {
          allMainVerses = mainVerses as any[];
        }

        // 대역이 선택된 경우
        if (showBothVersions && selectedBibleSubVersion) {
          try {
            const subVerses = await getBibleVerses({
              version: selectedBibleSubVersion,
              book: selectedBibleBook,
              chapter: selectedBibleChapter,
              startVerse: selectedStartVerse,
              endVerse:
                selectedEndVerse !== selectedStartVerse
                  ? selectedEndVerse
                  : undefined,
            });
            if (subVerses && subVerses.length > 0) {
              allSubVerses = subVerses as any[];
            }
          } catch (error) {
            console.error("대역 구절 가져오기 실패:", error);
          }
        }
      }

      if (!allMainVerses || allMainVerses.length === 0) {
        showToast({
          title: "성경 구절 없음",
          description: "선택한 성경 구절을 찾을 수 없습니다.",
          variant: "destructive",
        });
        return;
      }

      // 본문만 또는 본문-대역 포맷팅
      let formattedHtml;

      if (includeOtherChapter && selectedEndChapter !== selectedBibleChapter) {
        // 다른 장 포함인 경우: 각 장별로 포맷팅
        let htmlContent = "";
        let currentChapter = selectedBibleChapter;
        let verseIndex = 0;

        while (
          currentChapter <= selectedEndChapter &&
          verseIndex < allMainVerses.length
        ) {
          const chapterVerses = [];
          const chapterSubVerses = [];

          // 현재 장의 구절들만 추출
          while (
            verseIndex < allMainVerses.length &&
            allMainVerses[verseIndex].chapter === currentChapter
          ) {
            chapterVerses.push(allMainVerses[verseIndex]);
            if (allSubVerses.length > verseIndex) {
              chapterSubVerses.push(allSubVerses[verseIndex]);
            }
            verseIndex++;
          }

          if (chapterVerses.length > 0) {
            const chapterHtml =
              showBothVersions && chapterSubVerses.length > 0
                ? formatBibleVersesWithSub(
                    chapterVerses,
                    chapterSubVerses,
                    selectedBibleBook,
                    currentChapter,
                    selectedBibleVersion,
                    selectedBibleSubVersion!
                  )
                : formatBibleVerses(
                    chapterVerses,
                    selectedBibleBook,
                    currentChapter,
                    selectedBibleVersion
                  );

            htmlContent += chapterHtml;
            if (currentChapter < selectedEndChapter) {
              htmlContent += "<br>";
            }
          }

          currentChapter++;
        }

        formattedHtml = htmlContent;
      } else {
        // 같은 장 내에서의 절 범위인 경우
        formattedHtml =
          showBothVersions && allSubVerses.length > 0
            ? formatBibleVersesWithSub(
                allMainVerses,
                allSubVerses,
                selectedBibleBook,
                selectedBibleChapter,
                selectedBibleVersion,
                selectedBibleSubVersion!
              )
            : formatBibleVerses(
                allMainVerses,
                selectedBibleBook,
                selectedBibleChapter,
                selectedBibleVersion
              );
      }

      editorRef.current.editor.commands.insertContent(formattedHtml);
      setShowBibleInsert(false);

      const versionText =
        showBothVersions && selectedBibleSubVersion
          ? `${BIBLE_VERSIONS[selectedBibleVersion].name} + ${BIBLE_VERSIONS[selectedBibleSubVersion].name}`
          : BIBLE_VERSIONS[selectedBibleVersion].name;

      const rangeText =
        includeOtherChapter && selectedEndChapter !== selectedBibleChapter
          ? `${selectedBibleChapter}:${selectedStartVerse} - ${selectedEndChapter}:${selectedEndVerse}`
          : `${selectedBibleChapter}:${selectedStartVerse}${selectedEndVerse !== selectedStartVerse ? `-${selectedEndVerse}` : ""}`;

      showToast({
        title: "성경 구절 삽입 완료",
        description: `${getBibleBookName(selectedBibleBook, selectedBibleVersion)} ${rangeText} (${versionText}) 삽입됨`,
        variant: "default",
      });
    } catch (error) {
      showToast({
        title: "오류 발생",
        description: "성경 구절을 가져오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setBibleLoading(false);
    }
  };

  // 성경 책 선택 시 장 목록 업데이트 (선택된 번역본 기준)
  useEffect(() => {
    if (showBibleInsert && selectedBibleBook) {
      getBibleChapters(selectedBibleBook, selectedBibleVersion).then(
        (chapters) => {
          setAvailableChapters(chapters);
          if (chapters.length > 0) {
            setSelectedBibleChapter(chapters[0]);
          }
        }
      );
    }
  }, [selectedBibleBook, selectedBibleVersion, showBibleInsert]);

  // 장 선택 시 절 개수 조회
  useEffect(() => {
    if (showBibleInsert && selectedBibleChapter && selectedBibleBook) {
      getBibleVerseCount(
        selectedBibleBook,
        selectedBibleChapter,
        selectedBibleVersion
      ).then((verseCount) => {
        setAvailableVerses(verseCount);
        setSelectedStartVerse(1);
        // 끝절을 시작절과 동일하게 설정 (단일 절 선택)
        setSelectedEndVerse(1);
      });
    }
  }, [
    selectedBibleChapter,
    selectedBibleBook,
    selectedBibleVersion,
    showBibleInsert,
  ]);

  // 끝 장 선택 시 해당 장의 절 개수 조회
  useEffect(() => {
    if (
      showBibleInsert &&
      includeOtherChapter &&
      selectedEndChapter &&
      selectedBibleBook
    ) {
      getBibleVerseCount(
        selectedBibleBook,
        selectedEndChapter,
        selectedBibleVersion
      ).then((verseCount) => {
        setEndChapterVerses(verseCount);
        // 끝 장이 변경되면 끝절을 해당 장의 마지막 절로 설정
        setSelectedEndVerse(verseCount);
      });
    }
  }, [
    selectedEndChapter,
    selectedBibleBook,
    selectedBibleVersion,
    showBibleInsert,
    includeOtherChapter,
  ]);

  // 다른 장 포함 옵션이 해제되면 끝 장을 시작 장과 동일하게 설정
  useEffect(() => {
    if (!includeOtherChapter) {
      setSelectedEndChapter(selectedBibleChapter);
      setSelectedEndVerse(selectedStartVerse);
    }
  }, [includeOtherChapter, selectedBibleChapter, selectedStartVerse]);

  // 전역 링크 클릭 가로채기
  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 링크 요소 찾기 (a 태그, button with onclick, 또는 클릭 가능한 요소)
      const linkElement = target.closest('a, button[onclick], [role="button"]');
      if (!linkElement) return;

      // 현재 게시글 작성 폼 내부의 버튼들은 제외
      const currentForm = document.querySelector("form");
      if (currentForm && currentForm.contains(linkElement)) return;

      // 모달 내부 버튼들은 제외
      const isModalButton = target.closest(
        '[role="dialog"], .modal, [data-modal]'
      );
      if (isModalButton) return;

      // a 태그인 경우 href 확인
      if (linkElement.tagName === "A") {
        const href = linkElement.getAttribute("href");
        if (
          !href ||
          href.startsWith("#") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:")
        )
          return;

        // 외부 링크는 제외
        if (href.startsWith("http") && !href.includes(window.location.hostname))
          return;

        // 같은 페이지로의 이동은 제외
        if (href === window.location.pathname + window.location.search) return;
      }

      // 작성 중인 내용이 있는지 확인
      if (hasContent()) {
        event.preventDefault();
        event.stopPropagation();

        const confirmed = window.confirm(
          "작성 중인 내용이 있습니다. 정말로 이 페이지를 나가시겠습니까?\n작성된 내용과 업로드된 파일이 모두 삭제됩니다."
        );

        if (confirmed) {
          // 임시 파일 정리
          cleanupTempFiles().then(() => {
            // 이벤트 리스너를 일시적으로 제거하고 원래 클릭 실행
            document.removeEventListener("click", handleLinkClick, true);

            // a 태그인 경우 href로 이동
            if (linkElement.tagName === "A") {
              const hrefAttr = linkElement.getAttribute("href");
              if (hrefAttr) {
                window.location.href = hrefAttr;
              }
            } else {
              // 버튼이나 다른 요소인 경우 클릭 이벤트 재실행
              const clonedEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                shiftKey: event.shiftKey,
              });
              linkElement.dispatchEvent(clonedEvent);
            }
          });
        }
      }
    };

    // 캡처 단계에서 이벤트 리스너 등록 (모든 클릭을 먼저 감지)
    document.addEventListener("click", handleLinkClick, true);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [hasContent, cleanupTempFiles]);

  // 관리자 설정 다이얼로그 컴포넌트
  const AdminSettingsDialog = () => {
    return (
      <Dialog open={showAdminSettings} onOpenChange={setShowAdminSettings}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>관리자 설정</DialogTitle>
            <DialogDescription>
              게시글의 고급 설정을 관리합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 숨김 설정 */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="admin-hidden"
                checked={isHidden}
                onCheckedChange={(checked) => setIsHidden(checked === true)}
              />
              <Label htmlFor="admin-hidden" className="text-sm font-medium">
                숨김 (관리자만 보기)
              </Label>
            </div>

            {/* 공지 설정 */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="admin-notice"
                checked={isNotice}
                onCheckedChange={(checked) => setIsNotice(checked === true)}
              />
              <Label htmlFor="admin-notice" className="text-sm font-medium">
                공지사항으로 설정
              </Label>
            </div>

            {/* 게시일 설정 */}
            <div className="space-y-2">
              <Label htmlFor="publish-date" className="text-sm font-medium">
                게시일 설정 (선택사항)
              </Label>
              <Input
                id="publish-date"
                type="datetime-local"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                게시일을 설정하지 않으면 생성일 기준으로 정렬됩니다.
              </p>
            </div>

            {/* 성경 구절 삽입 */}
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                성경 구절 삽입
              </Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAdminSettings(false); // 관리자 설정창 닫기
                  setShowBibleInsert(true); // 성경 선택창 열기
                }}
                className="w-full flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                성경 구절 선택하기
              </Button>
              <p className="text-xs text-gray-500">
                원하는 성경 구절을 선택하여 에디터에 자동으로 삽입할 수
                있습니다.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdminSettings(false)}
            >
              취소
            </Button>
            <Button type="button" onClick={() => setShowAdminSettings(false)}>
              적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

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
          className="w-full mx-auto bg-white sm:rounded-lg sm:shadow-lg sm:border border-gray-200 "
          onSubmit={handleFormSubmit}
        >
          {/* 헤더 및 액션 버튼 영역 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 py-4 sm:p-6 border-b border-gray-200 gap-4 sm:gap-0">
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
              {/* 관리자 설정 버튼 */}
              {(() => {
                console.log("[BoardWrite] 현재 userRole:", isAdmin);
                console.log("[BoardWrite] 관리자 버튼 표시 조건:", isAdmin);
                return isAdmin;
              })() && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAdminSettings(true)}
                  className="col-span-1 sm:col-auto h-9 sm:h-10"
                  title="관리자 설정"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}

              {/* 임시등록 버튼(텍스트/숫자 분리 클릭) */}
              {!isEditMode && (
                <div className="flex items-center border rounded h-9 sm:h-10 col-span-4 sm:col-auto">
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
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
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

          {/* AdminSettingsDialog 팝업 렌더링 */}
          <AdminSettingsDialog />

          {/* 성경 선택 다이얼로그 */}
          <Dialog open={showBibleInsert} onOpenChange={setShowBibleInsert}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>성경 구절 선택</DialogTitle>
                <DialogDescription>
                  원하는 성경 구절을 선택하면 에디터에 자동으로 삽입됩니다.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* 성경 번역본 선택 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">기본 역본</Label>
                  <Select
                    value={selectedBibleVersion}
                    onValueChange={(value) => {
                      console.log(`🔄 번역본 선택: ${value}`);
                      setSelectedBibleVersion(
                        value as keyof typeof BIBLE_VERSIONS
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BIBLE_VERSIONS).map(([key, version]) => (
                        <SelectItem key={key} value={key}>
                          {version.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 본문-대역 옵션 */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-both-versions"
                      checked={showBothVersions}
                      onCheckedChange={(checked) => {
                        setShowBothVersions(checked === true);
                        if (checked === false) {
                          setSelectedBibleSubVersion(null);
                        }
                      }}
                    />
                    <Label
                      htmlFor="show-both-versions"
                      className="text-sm font-medium"
                    >
                      본문과 대역 함께 표시
                    </Label>
                  </div>

                  {/* 대역 번역본 선택 (본문-대역 옵션이 활성화된 경우만 표시) */}
                  {showBothVersions && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">
                        대조 역본
                      </Label>
                      <Select
                        value={selectedBibleSubVersion || ""}
                        onValueChange={(value) => {
                          setSelectedBibleSubVersion(
                            value
                              ? (value as keyof typeof BIBLE_VERSIONS)
                              : null
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="대역 번역본을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(BIBLE_VERSIONS)
                            .filter(([key]) => key !== selectedBibleVersion) // 본문과 다른 번역본만 표시
                            .map(([key, version]) => (
                              <SelectItem key={key} value={key}>
                                {version.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* 성경 책 선택 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">성경 책</Label>
                  <Select
                    value={selectedBibleBook.toString()}
                    onValueChange={(value) => {
                      const newBookNum = parseInt(value);
                      console.log(`📚 성경 책 선택: ${value} → ${newBookNum}`);
                      setSelectedBibleBook(newBookNum);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {Object.entries(BIBLE_BOOKS).map(
                        ([bookNum, bookName]) => (
                          <SelectItem key={bookNum} value={bookNum}>
                            {bookName}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* 다른 장 포함 옵션 */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-other-chapter"
                      checked={includeOtherChapter}
                      onCheckedChange={(checked) => {
                        setIncludeOtherChapter(checked === true);
                        if (checked === false) {
                          // 다른 장 포함을 해제하면 끝 장을 시작 장과 동일하게 설정
                          setSelectedEndChapter(selectedBibleChapter);
                          setSelectedEndVerse(selectedStartVerse);
                        } else {
                          // 다른 장 포함을 활성화하면 끝 장을 시작 장 + 1로 설정
                          const nextChapter = selectedBibleChapter + 1;
                          if (
                            nextChapter <=
                            availableChapters[availableChapters.length - 1]
                          ) {
                            setSelectedEndChapter(nextChapter);
                          }
                        }
                      }}
                    />
                    <Label
                      htmlFor="include-other-chapter"
                      className="text-sm font-medium"
                    >
                      다른 장 포함 (여러 장에 걸친 구절 선택)
                    </Label>
                  </div>
                </div>

                {/* 시작 장과 절 선택 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">시작 장</Label>
                    <Select
                      value={selectedBibleChapter.toString()}
                      onValueChange={(value) => {
                        const newChapter = parseInt(value);
                        setSelectedBibleChapter(newChapter);
                        // 다른 장 포함이 비활성화된 경우 끝 장도 함께 변경
                        if (!includeOtherChapter) {
                          setSelectedEndChapter(newChapter);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {availableChapters.map((chapter) => (
                          <SelectItem key={chapter} value={chapter.toString()}>
                            {chapter}장
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      시작 절 (총 {availableVerses}절)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max={availableVerses}
                      value={selectedStartVerse}
                      onChange={(e) => {
                        const newStartVerse = parseInt(e.target.value) || 1;
                        setSelectedStartVerse(newStartVerse);
                        // 다른 장 포함이 비활성화된 경우 끝절도 함께 변경
                        if (!includeOtherChapter) {
                          setSelectedEndVerse(newStartVerse);
                        }
                      }}
                      className="w-full"
                      placeholder="시작 절"
                    />
                  </div>
                </div>

                {/* 끝 장과 절 선택 (다른 장 포함이 활성화된 경우만 표시) */}
                {includeOtherChapter && (
                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">끝 장</Label>
                      <Select
                        value={selectedEndChapter.toString()}
                        onValueChange={(value) =>
                          setSelectedEndChapter(parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {availableChapters
                            .filter(
                              (chapter) => chapter >= selectedBibleChapter
                            )
                            .map((chapter) => (
                              <SelectItem
                                key={chapter}
                                value={chapter.toString()}
                              >
                                {chapter}장
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        끝 절 (총 {endChapterVerses}절)
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max={endChapterVerses}
                        value={selectedEndVerse}
                        onChange={(e) =>
                          setSelectedEndVerse(parseInt(e.target.value) || 1)
                        }
                        className="w-full"
                        placeholder="끝 절"
                      />
                    </div>
                  </div>
                )}

                {/* 단일 장 내에서의 절 범위 선택 (다른 장 포함이 비활성화된 경우) */}
                {!includeOtherChapter && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      끝 절 (같은 장 내에서 범위 선택)
                    </Label>
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-gray-600 min-w-fit">
                        {selectedStartVerse}절
                      </span>
                      <span className="text-sm text-gray-500">~</span>
                      <Input
                        type="number"
                        min={selectedStartVerse}
                        max={availableVerses}
                        value={selectedEndVerse}
                        onChange={(e) => {
                          const newEndVerse =
                            parseInt(e.target.value) || selectedStartVerse;
                          setSelectedEndVerse(
                            Math.max(newEndVerse, selectedStartVerse)
                          );
                        }}
                        className="flex-1"
                        placeholder="끝 절"
                      />
                      <span className="text-xs text-gray-500 min-w-fit">
                        (최대 {availableVerses}절)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      단일 절을 선택하려면 시작 절과 동일한 번호를 입력하세요.
                    </p>
                  </div>
                )}

                {/* 미리보기 영역 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">선택 구절</Label>
                  <div className="p-3 border rounded-md bg-gray-50 text-sm">
                    {getBibleBookName(selectedBibleBook, selectedBibleVersion)}{" "}
                    {includeOtherChapter &&
                    selectedEndChapter !== selectedBibleChapter ? (
                      // 다른 장 포함인 경우
                      <>
                        {selectedBibleChapter}:{selectedStartVerse} -{" "}
                        {selectedEndChapter}:{selectedEndVerse}
                      </>
                    ) : (
                      // 같은 장 내에서 절 범위인 경우
                      <>
                        {selectedBibleChapter}:{selectedStartVerse}
                        {selectedEndVerse !== selectedStartVerse &&
                          `-${selectedEndVerse}`}
                      </>
                    )}{" "}
                    {showBothVersions && selectedBibleSubVersion ? (
                      <span>
                        ({BIBLE_VERSIONS[selectedBibleVersion].name} +{" "}
                        {BIBLE_VERSIONS[selectedBibleSubVersion].name})
                      </span>
                    ) : (
                      <span>({BIBLE_VERSIONS[selectedBibleVersion].name})</span>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBibleInsert(false)}
                  disabled={bibleLoading}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  onClick={insertBibleIntoEditor}
                  disabled={
                    bibleLoading ||
                    (showBothVersions && !selectedBibleSubVersion)
                  }
                >
                  {bibleLoading ? "삽입 중..." : "에디터에 삽입"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 입력 영역 */}
          <div className="p-2 sm:p-6">
            {/* 게시판 선택 */}
            {!isEditMode && (
              <div className="space-y-2 mb-4">
                <Label htmlFor="page-select"></Label>
                <Select
                  value={selectedPageId}
                  onValueChange={(value) => setSelectedPageId(value)}
                  disabled={loading || isEditMode}
                >
                  <SelectTrigger id="page-select" className="w-full">
                    <SelectValue placeholder="게시판을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {!initialPageId && boardPages.length > 0 && (
                      <>
                        <SelectItem value="placeholder" disabled>
                          게시판을 선택하세요
                        </SelectItem>
                        <SelectSeparator />
                      </>
                    )}
                    {boardPages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title}
                      </SelectItem>
                    ))}
                    {boardPages.length === 0 && (
                      <SelectItem value="no-pages" disabled>
                        선택 가능한 게시판이 없습니다.
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isEditMode || selectedPageId ? (
              <>
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

                {/* TipTap 에디터 + 사이드바 영역 */}
                <div className="lg:flex lg:gap-4">
                  {/* TipTap 에디터 */}
                  <div className="flex-1 mb-4 lg:mb-0">
                    <div className="relative min-h-[300px] sm:min-h-[400px]">
                      <TipTapEditor
                        ref={editorRef}
                        content={content}
                        placeholder="내용을 입력하세요..."
                        thumbnailUrl={thumbnailImage}
                        onThumbnailChange={handleThumbnailSelect}
                        onUploadedFilesChange={handleUploadedFilesChange}
                        category={initialCategoryId}
                        pageId={selectedPageId}
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
                      <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md mt-4">
                        {error}
                      </div>
                    )}

                    {/* 성공 메시지 */}
                    {success && (
                      <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md mt-4">
                        {lastSaved
                          ? "임시등록되었습니다."
                          : "글이 등록되었습니다."}
                      </div>
                    )}
                  </div>

                  {/* 사이드바: 업로드된 파일 + 댓글 허용 */}
                  <div className="lg:w-[320px] lg:min-w-[220px] lg:max-w-[400px] mt-4 sticky lg:top-24 transition-all duration-300">
                    {/* 업로드된 파일 카드 */}
                    <div className="border border-gray-200 rounded-md p-3 lg:p-4 mb-3 bg-white">
                      <h3 className="text-sm font-semibold mb-2">
                        업로드된 파일
                      </h3>
                      {uploadedFiles.length > 0 ? (
                        <FileManager
                          uploadedFiles={uploadedFiles}
                          setUploadedFiles={setUploadedFiles}
                          selectedThumbnail={thumbnailImage}
                          setSelectedThumbnail={(url) =>
                            setThumbnailImage(url || "")
                          }
                          onThumbnailChange={handleThumbnailSelect}
                          editor={editorRef.current?.editor}
                          showToast={showToast}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-[80px] lg:h-[100px] text-gray-500 text-center text-sm">
                          업로드된 파일이 없습니다.
                        </div>
                      )}
                    </div>

                    {/* 상세 설명 카드 */}
                    <div className="border border-gray-200 rounded-md p-3 lg:p-4 mb-3 bg-white">
                      <h3 className="text-sm font-semibold mb-2">상세 설명</h3>
                      <textarea
                        placeholder="게시글에 대한 추가 설명을 입력해주세요."
                        className="w-full h-24 p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    {/* 댓글 허용 카드 */}
                    <div className="border border-gray-200 rounded-md p-3 lg:p-4 bg-white">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="allow-comments"
                          checked={allowComments}
                          onChange={(e) => setAllowComments(e.target.checked)}
                          disabled={loading}
                          className="accent-blue-500"
                        />
                        <label
                          htmlFor="allow-comments"
                          className="text-sm font-medium"
                        >
                          댓글 허용
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-md my-4">
                <p>게시글을 작성할 게시판을 먼저 선택해주세요.</p>
              </div>
            )}
          </div>
        </form>
      </div>
    </ToastProvider>
  );
}
