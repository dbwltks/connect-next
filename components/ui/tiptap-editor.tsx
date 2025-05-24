"use client";

import {
  useEditor,
  EditorContent,
  Editor,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  NodeViewProps,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Typography from "@tiptap/extension-typography";
import { Node, Extension } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Code,
  Quote,
  Undo,
  Redo,
  Loader2,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  File,
  FileText,
  FileSpreadsheet,
  Presentation,
  Type,
  Palette,
  Minus,
  Square,
  Plus,
  Maximize,
  MinusCircle,
  PlusCircle,
  RotateCcw,
  Minimize,
} from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { supabase } from "@/db";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastViewport,
  ToastTitle,
} from "./toast";

// 토스트 상태 관리를 위한 이벤트 시스템
const toastEventTarget = new EventTarget();

// 토스트 표시 함수
const showToast = ({
  title,
  description,
  variant = "default",
}: {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}) => {
  const event = new CustomEvent("showToast", {
    detail: { title, description, variant },
  });
  toastEventTarget.dispatchEvent(event);
};

// 유튜브 영상 ID 추출 함수
const extractYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;

  try {
    // URL에서 파라미터 제거 (si 등)
    const cleanUrl = url.split("?")[0];

    // 일반 유튜브 링크 (watch?v=XXXX)
    let match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match && match[1]) return match[1];

    // 유튜브 임베드 링크 (embed/XXXX)
    match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) return match[1];

    // 유튜브 쇼트 링크 (youtu.be/XXXX)
    match = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) return match[1];

    // 유튜브 쇼트 링크 (youtu.be/XXXX?si=...)
    match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})\?/);
    if (match && match[1]) return match[1];

    // 유튜브 영상 ID만 있는 경우 처리
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

    return null;
  } catch (error) {
    return null;
  }
};

// 파일 정보 타입 정의
interface IFileInfo {
  url: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

// TipTap 에디터 Props 타입 정의
interface TipTapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  thumbnailUrl?: string;
  onThumbnailChange?: (url: string) => void;
  onUploadedFilesChange?: (files: IFileInfo[]) => void;
  allowComments?: boolean;
  setAllowComments?: (checked: boolean) => void;
  loading?: boolean;
  category?: string;
  pageId?: string | number;
}

// 폰트 크기 확장 기능 - TextStyle 확장을 사용하여 구현
const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
});

// 스타일 문자열을 객체로 변환하는 헬퍼 함수
const parseStyleString = (styleStr: string): any => {
  if (!styleStr) return {};

  const styles: any = {};
  const declarations = styleStr.split(";").filter(Boolean);

  declarations.forEach((declaration) => {
    const [property, value] = declaration.split(":").map((s) => s.trim());
    if (property && value) {
      // CSS 속성명을 camelCase로 변환
      const camelProperty = property.replace(/-([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );
      styles[camelProperty] = value;
    }
  });

  return styles;
};

// 이미지 크기 조정 컴포넌트 (원래 방식)
const ImageResizeComponent = (props: NodeViewProps) => {
  const { node, updateAttributes, selected } = props;
  const [showResizeOptions, setShowResizeOptions] = useState(false);

  const decreaseSize = () => {
    const currentWidth = node.attrs.width ? parseInt(node.attrs.width) : 100;
    const newWidth = Math.max(currentWidth - 10, 30);
    updateAttributes({ width: `${newWidth}%` });
  };

  const increaseSize = () => {
    const currentWidth = node.attrs.width ? parseInt(node.attrs.width) : 100;
    const newWidth = Math.min(currentWidth + 10, 100);
    updateAttributes({ width: `${newWidth}%` });
  };

  const resetSize = () => {
    updateAttributes({ width: null });
  };

  const makeSmall = () => {
    updateAttributes({ width: "30%" });
  };

  const makeMedium = () => {
    updateAttributes({ width: "50%" });
  };

  const makeLarge = () => {
    updateAttributes({ width: "100%" });
  };

  const makeFullWidth = () => {
    updateAttributes({ width: "100%" });
  };

  const centerImage = () => {
    updateAttributes({ align: "center" });
  };

  const leftAlign = () => {
    updateAttributes({ align: "left" });
  };

  const rightAlign = () => {
    updateAttributes({ align: "right" });
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const img = e.currentTarget.querySelector("img");
    if (!img) return;

    const clone = img.cloneNode(true) as HTMLImageElement;
    clone.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      width: 100px;
      height: auto;
      opacity: 0.6;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, 50, 50);
    requestAnimationFrame(() => {
      document.body.removeChild(clone);
    });
  };

  return (
    <NodeViewWrapper
      as="div"
      className={`image-component ${selected ? "ring-2 ring-blue-500" : ""}`}
      style={{ position: "static" }}
    >
      <div
        style={{
          textAlign: node.attrs.align || "center",
          position: "static",
        }}
      >
        <div
          className={`
            inline-block
            ${selected ? "ring-2 ring-blue-500/50" : ""}
            hover:ring-2 hover:ring-blue-500/20
            relative
          `}
          contentEditable={false}
          draggable="true"
          onDragStart={handleDragStart}
          data-drag-handle
        >
          <img
            src={node.attrs.src}
            alt={node.attrs.alt || ""}
            className={`
              inline-block
              transition-all duration-200
              ${node.attrs.class || ""}
            `}
            style={{
              width: node.attrs.width || "auto",
              maxWidth: "100%",
              height: node.attrs.height || "auto",
              cursor: "grab",
              ...parseStyleString(node.attrs.style || ""),
            }}
            onClick={() => setShowResizeOptions(!showResizeOptions)}
            draggable={false}
          />
          {showResizeOptions && (
            <div
              className="absolute top-2 right-2 bg-white border border-gray-200 rounded-md shadow-lg p-2"
              style={{ zIndex: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      decreaseSize();
                    }}
                    className="h-8 w-8 p-0"
                    title="크기 줄이기"
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      increaseSize();
                    }}
                    className="h-8 w-8 p-0"
                    title="크기 늘리기"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetSize();
                    }}
                    className="h-8 w-8 p-0"
                    title="원본 크기로 복원"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      makeSmall();
                    }}
                    className="h-8 w-8 p-0"
                    title="작게"
                  >
                    <Minimize className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      makeMedium();
                    }}
                    className="text-xs h-8 w-8 p-0"
                    title="중간"
                  >
                    M
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      makeLarge();
                    }}
                    className="h-8 w-8 p-0"
                    title="크게"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      centerImage();
                    }}
                    className="h-8 w-8 p-0"
                    title="가운데 정렬"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      leftAlign();
                    }}
                    className="h-8 w-8 p-0"
                    title="왼쪽 정렬"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      rightAlign();
                    }}
                    className="h-8 w-8 p-0"
                    title="오른쪽 정렬"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      makeFullWidth();
                    }}
                    className="text-xs h-8 w-8 p-0"
                    title="전체 너비"
                  >
                    W
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowResizeOptions(false);
                    }}
                    className="text-xs h-8 w-8 p-0 text-red-500"
                    title="닫기"
                  >
                    X
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

// 유튜브 확장 정의
const YouTube = Node.create({
  name: "youtube",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: {
        default: null,
      },
      videoId: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },
  parseHTML() {
    return [
      // 1. 새로운 방식 (빠름, data-video-id 사용)
      {
        tag: "div[data-video-id]",
        getAttrs: (node) => {
          const videoId = node.getAttribute("data-video-id");
          return videoId
            ? {
                videoId,
                src: `https://www.youtube.com/embed/${videoId}`,
                width: 560,
              }
            : false;
        },
      },
      // 2. 기존 방식 (호환성용, 단순화)
      {
        tag: "div[data-youtube-video]",
        getAttrs: (node) => {
          const iframe = node.querySelector("iframe");
          if (!iframe) return false;
          const src = iframe.getAttribute("src");
          const videoId = src ? extractYoutubeVideoId(src) : null;
          return videoId
            ? {
                videoId,
                src,
                width: 560,
              }
            : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const { videoId } = HTMLAttributes;

    return [
      "div",
      {
        "data-youtube-video": "",
        "data-video-id": videoId,
        class: "youtube-embed",
      },
      [
        "iframe",
        {
          width: "100%",
          src: `https://www.youtube.com/embed/${videoId}`,
          frameborder: "0",
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true",
          style: "width: 100%; aspect-ratio: 16/9; pointer-events: none;",
        },
      ],
    ];
  },
});

const MenuBar = ({
  editor,
  onThumbnailSelect,
  onImageUploaded,
  selectedThumbnail,
  setUploadedFiles,
  category = "unknown",
  pageId = "unknown",
  uploadedFiles,
}: {
  editor: Editor | null;
  onThumbnailSelect?: (url: string) => void;
  onImageUploaded?: (
    url: string,
    fileName?: string,
    fileSize?: string,
    fileType?: string
  ) => void;
  selectedThumbnail?: string;
  setUploadedFiles?: (files: IFileInfo[]) => void;
  category?: string;
  pageId?: string | number;
  uploadedFiles: IFileInfo[];
}) => {
  const [isLinkInputVisible, setIsLinkInputVisible] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPreview, setLinkPreview] = useState<{
    type: "youtube" | "image" | "link" | null;
    data: any;
  }>({ type: null, data: null });
  const [isFontFamilyMenuOpen, setIsFontFamilyMenuOpen] = useState(false);
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 유튜브 링크 처리
  const handleYoutubeLink = (url: string) => {
    const videoId = extractYoutubeVideoId(url);
    if (videoId) {
      return {
        type: "youtube" as const,
        data: {
          videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          fallbackThumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        },
      };
    }
    return null;
  };

  // 이미지 링크 처리
  const handleImageLink = async (url: string) => {
    const imagePattern = /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i;
    if (imagePattern.test(url)) {
      try {
        const response = await fetch(url, { method: "HEAD" });
        const contentType = response.headers.get("content-type");
        if (contentType?.startsWith("image/")) {
          return {
            type: "image" as const,
            data: { src: url },
          };
        }
      } catch (error) {
        console.error("이미지 확인 실패:", error);
      }
    }
    return null;
  };

  // 링크 분석 함수
  const analyzeLinkUrl = useCallback(async (url: string) => {
    if (!url) {
      setLinkPreview({ type: null, data: null });
      return;
    }

    try {
      // URL 정규화
      const validUrl = url.startsWith("http") ? url : `https://${url}`;
      const normalizedUrl = new URL(validUrl).toString();

      // 1. 유튜브 체크
      const youtubePreview = handleYoutubeLink(normalizedUrl);
      if (youtubePreview) {
        setLinkPreview(youtubePreview);
        return;
      }

      // 2. 이미지 체크
      try {
        const imagePreview = await handleImageLink(normalizedUrl);
        if (imagePreview) {
          setLinkPreview(imagePreview);
          return;
        }
      } catch (error) {
        console.error("이미지 확인 실패:", error);
      }

      // 3. 일반 링크
      setLinkPreview({
        type: "link",
        data: { href: normalizedUrl },
      });
    } catch (error) {
      console.error("링크 분석 오류:", error);
      showToast({
        title: "오류",
        description: "올바른 URL 형식이 아닙니다.",
        variant: "destructive",
      });
      setLinkPreview({ type: null, data: null });
    }
  }, []);

  // 링크 추가 함수
  const addLink = useCallback(() => {
    if (!linkUrl || !linkPreview.type || !editor) {
      showToast({
        title: "오류",
        description: "링크 정보가 올바르지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      switch (linkPreview.type) {
        case "youtube": {
          const videoId = handleYoutubeLink(linkUrl)?.data.videoId;
          if (!videoId) {
            showToast({
              title: "오류",
              description: "유효한 유튜브 링크가 아닙니다.",
              variant: "destructive",
            });
            return;
          }

          // 현재 줄 끝으로 이동 후 새 줄에 유튜브 영상 삽입
          editor
            .chain()
            .focus()
            .command(({ tr, state }) => {
              const { selection } = state;
              const pos = selection.to;

              // 현재 줄 끝에 새 줄과 유튜브 영상 추가
              tr.insert(pos, state.schema.nodes.paragraph.create());
              tr.insert(
                pos + 1,
                state.schema.nodes.youtube.create({
                  src: `https://www.youtube.com/embed/${videoId}`,
                  videoId: videoId,
                  width: "100%",
                })
              );

              return true;
            })
            .run();
          break;
        }
        case "image":
          if (!linkPreview.data.src) {
            throw new Error("이미지 URL이 올바르지 않습니다.");
          }

          // 현재 줄 끝으로 이동 후 새 줄에 이미지 삽입
          editor
            .chain()
            .focus()
            .command(({ tr, state }) => {
              const { selection } = state;
              const pos = selection.to;

              // 현재 줄 끝에 새 줄과 이미지 추가
              tr.insert(pos, state.schema.nodes.paragraph.create());
              tr.insert(
                pos + 1,
                state.schema.nodes.image.create({
                  src: linkPreview.data.src,
                })
              );

              return true;
            })
            .run();
          break;

        case "link":
          if (!linkPreview.data.href) {
            throw new Error("링크 URL이 올바르지 않습니다.");
          }

          // 현재 위치에 링크 텍스트 삽입
          editor
            .chain()
            .focus()
            .insertContent(" ")
            .setLink({ href: linkPreview.data.href })
            .insertContent(linkPreview.data.href)
            .run();
          break;

        default:
          throw new Error("지원하지 않는 링크 타입입니다.");
      }

      // 입력 필드 초기화
      setLinkUrl("");
      setLinkPreview({ type: null, data: null });
      setIsLinkInputVisible(false);

      showToast({
        title: "성공",
        description: "링크가 추가되었습니다.",
      });
    } catch (error) {
      console.error("링크 추가 오류:", error);
      showToast({
        title: "오류",
        description:
          error instanceof Error
            ? error.message
            : "링크를 추가하는 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    }
  }, [editor, linkUrl, linkPreview]);

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0 || !editor) return;
      setIsUploadingImage(true);
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
        const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
          fileExt
        );
        if (!isImage) continue;

        // 파일명에 타임스탬프 추가하여 유니크하게 생성
        const timestamp = Date.now();
        const fileName = `${timestamp}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;

        // 경로에 draft 상태 표시 추가
        const filePath = `${category}/${pageId}/drafts/${yyyy}/${mm}/${fileName}`;

        try {
          const { data, error } = await supabase.storage
            .from("images")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: true,
              metadata: {
                originalName: file.name,
                fileSize: file.size,
                uploadTime: timestamp,
                status: "draft",
                category: category,
                pageId: pageId,
              },
            });
          if (error) {
            showToast({
              title: "이미지 업로드 실패",
              description: `${file.name}: ${error.message}`,
              variant: "destructive",
            });
            continue;
          }
          const { data: publicUrlData } = supabase.storage
            .from("images")
            .getPublicUrl(filePath);
          const publicUrl = publicUrlData.publicUrl;
          if (!publicUrl) {
            showToast({
              title: "URL 생성 실패",
              description: "이미지 URL을 가져오지 못했습니다.",
              variant: "destructive",
            });
            continue;
          }
          // 에디터에 삽입
          editor
            .chain()
            .focus()
            .insertContent({ type: "image", attrs: { src: publicUrl } })
            .run();
          // 파일관리에도 추가 (구조 통일)
          const fileInfo = {
            url: publicUrl,
            name: file.name, // 원본 파일명
            size: `${(file.size / 1024).toFixed(1)}KB`,
            type: fileExt,
            uploadedAt: new Date().toISOString(),
          };
          if (typeof setUploadedFiles === "function")
            setUploadedFiles(
              uploadedFiles.filter((file) => file.url !== publicUrl)
            );
          if (typeof onImageUploaded === "function")
            onImageUploaded(
              publicUrl,
              file.name,
              `${(file.size / 1024).toFixed(1)}KB`,
              fileExt
            );
          showToast({
            title: "이미지 업로드 완료",
            description: `${file.name} 이미지가 업로드되었습니다.`,
            variant: "default",
          });
        } catch (uploadError) {
          showToast({
            title: "이미지 업로드 예외 발생",
            description: `${file.name}: ${uploadError instanceof Error ? uploadError.message : "알 수 없는 오류"}`,
            variant: "destructive",
          });
        }
      }
      setIsUploadingImage(false);
      event.target.value = "";
    },
    [editor, onImageUploaded, setUploadedFiles, category, pageId, uploadedFiles]
  );

  // 파일 업로드 핸들러 (문서/파일만)
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      setIsUploadingFile(true);
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
        const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
          fileExt
        );
        if (isImage) continue; // 이미지는 무시
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
        const filePath = `${category}/${pageId}/${yyyy}/${mm}/${fileName}`;
        try {
          const { data, error } = await supabase.storage
            .from("docs")
            .upload(filePath, file, { cacheControl: "3600", upsert: true });
          if (error) {
            showToast({
              title: "파일 업로드 실패",
              description: `${file.name}: ${error.message}`,
              variant: "destructive",
            });
            continue;
          }
          const { data: publicUrlData } = supabase.storage
            .from("docs")
            .getPublicUrl(filePath);
          const publicUrl = publicUrlData.publicUrl;
          if (!publicUrl) {
            showToast({
              title: "URL 생성 실패",
              description: "파일 URL을 가져오지 못했습니다.",
              variant: "destructive",
            });
            continue;
          }
          // 파일관리(사이드바)에만 추가 (구조 통일)
          const fileInfo = {
            url: publicUrl,
            name: file.name, // 원본 파일명
            size: `${(file.size / 1024).toFixed(1)}KB`,
            type: fileExt,
            uploadedAt: new Date().toISOString(),
          };
          if (typeof setUploadedFiles === "function")
            setUploadedFiles(
              uploadedFiles.filter((file) => file.url !== publicUrl)
            );
          if (typeof onImageUploaded === "function")
            onImageUploaded(
              publicUrl,
              file.name,
              `${(file.size / 1024).toFixed(1)}KB`,
              fileExt
            );
          showToast({
            title: "파일 업로드 완료",
            description: `${file.name} 파일이 업로드되었습니다.`,
            variant: "default",
          });
        } catch (uploadError) {
          showToast({
            title: "파일 업로드 예외 발생",
            description: `${file.name}: ${uploadError instanceof Error ? uploadError.message : "알 수 없는 오류"}`,
            variant: "destructive",
          });
        }
      }
      setIsUploadingFile(false);
      event.target.value = "";
    },
    [onImageUploaded, setUploadedFiles, category, pageId, uploadedFiles]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (linkUrl.trim()) {
        analyzeLinkUrl(linkUrl.trim());
      } else {
        setLinkPreview({ type: null, data: null });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [linkUrl, analyzeLinkUrl]);

  if (!editor) {
    return null;
  }

  // 링크 입력 UI
  const renderLinkInput = () => {
    if (!isLinkInputVisible) return null;

    return (
      <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-md p-3 z-10 w-96">
        <div className="flex items-center gap-2 mb-2">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="링크 주소를 입력하세요"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && addLink()}
          />
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={addLink}
            disabled={!linkPreview.type}
          >
            추가
          </Button>
        </div>

        {/* 미리보기 */}
        {linkPreview.type && (
          <div className="mt-2 border-t border-gray-100 pt-2">
            {linkPreview.type === "youtube" && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500">유튜브 영상</div>
                <div
                  className="relative w-full aspect-video bg-black rounded-md overflow-hidden"
                  style={{ pointerEvents: "none" }}
                >
                  <iframe
                    src={linkPreview.data.embedUrl}
                    width="100%"
                    height="100%"
                    className="w-full h-full"
                    style={{ pointerEvents: "none" }}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="유튜브 미리보기"
                  />
                </div>
              </div>
            )}

            {linkPreview.type === "image" && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500">이미지</div>
                <div className="max-h-48 rounded-md overflow-hidden">
                  <img
                    src={linkPreview.data.src}
                    alt="이미지 미리보기"
                    className="max-w-full max-h-48 object-contain"
                  />
                </div>
              </div>
            )}

            {linkPreview.type === "link" && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <span className="truncate">{linkPreview.data.href}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50 flex flex-col">
      {/* 상단 영역: 파일 관련 기능 */}
      <div className="p-1 border-b border-gray-200 flex items-center gap-1">
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => setIsLinkInputVisible(!isLinkInputVisible)}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          {renderLinkInput()}
        </div>

        <div className="relative">
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploadingImage}
            title="이미지 업로드"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            multiple
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingFile}
            title="파일 업로드"
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        <div className="ml-auto flex items-center">
          <Button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            variant="ghost"
            size="sm"
            className="h-8 px-2"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            variant="ghost"
            size="sm"
            className="h-8 px-2"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 하단 영역: 서식 관련 기능 */}
      <div className="p-1 flex flex-wrap gap-1 items-center">
        {/* 폰트 선택 */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 flex items-center gap-1"
            onClick={() => setIsFontFamilyMenuOpen(!isFontFamilyMenuOpen)}
          >
            <Type className="h-4 w-4" />
            <span className="text-xs">폰트</span>
          </Button>
          {isFontFamilyMenuOpen && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-md p-2 z-10 w-48">
              {[
                { name: "기본", value: "sans-serif" },
                { name: "고딕", value: "Arial, sans-serif" },
                { name: "명조", value: "Georgia, serif" },
                { name: "필기체", value: "cursive" },
                { name: "모노스페이스", value: "monospace" },
                { name: "나눔고딕", value: "Nanum Gothic, sans-serif" },
                { name: "나눔명조", value: "Nanum Myeongjo, serif" },
                { name: "나눔펜", value: "Nanum Pen Script, cursive" },
              ].map((font) => (
                <Button
                  key={font.value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full text-left justify-start"
                  style={{ fontFamily: font.value }}
                  onClick={() => {
                    // FontFamily 확장을 사용하여 fontFamily 설정
                    editor.chain().focus().setFontFamily(font.value).run();
                    setIsFontFamilyMenuOpen(false);
                  }}
                >
                  {font.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* 색상 선택 */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 flex items-center gap-1"
            onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
          >
            <Palette className="h-4 w-4" />
            <span className="text-xs">색상</span>
          </Button>
          {isColorMenuOpen && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-md p-2 z-10 w-48">
              <div className="grid grid-cols-4 gap-1">
                {[
                  "#000000",
                  "#434343",
                  "#666666",
                  "#999999",
                  "#b7b7b7",
                  "#cccccc",
                  "#d9d9d9",
                  "#efefef",
                  "#f3f3f3",
                  "#ffffff",
                  "#980000",
                  "#ff0000",
                  "#ff9900",
                  "#ffff00",
                  "#00ff00",
                  "#00ffff",
                  "#4a86e8",
                  "#0000ff",
                  "#9900ff",
                  "#ff00ff",
                  "#e6b8af",
                  "#f4cccc",
                  "#fce5cd",
                  "#fff2cc",
                  "#d9ead3",
                  "#d0e0e3",
                  "#c9daf8",
                  "#cfe2f3",
                  "#d9d2e9",
                  "#ead1dc",
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded-sm border border-gray-300 cursor-pointer"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setIsColorMenuOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          variant={
            editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 px-2"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          variant={
            editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 px-2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          variant={editor.isActive("code") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
        >
          <Quote className="h-4 w-4" />
        </Button>

        {/* 정렬 버튼 */}
        <Button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          variant={
            editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 px-2"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          variant={
            editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 px-2"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          variant={
            editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 px-2"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          variant={
            editor.isActive({ textAlign: "justify" }) ? "secondary" : "ghost"
          }
          size="sm"
          className="h-8 px-2"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// 파일 관리 컴포넌트
const FileManager = ({
  uploadedFiles,
  setUploadedFiles,
  selectedThumbnail,
  setSelectedThumbnail,
  onThumbnailChange,
  editor,
}: {
  uploadedFiles: IFileInfo[];
  setUploadedFiles: (files: IFileInfo[]) => void;
  selectedThumbnail?: string;
  setSelectedThumbnail: (url?: string) => void;
  onThumbnailChange?: (url: string) => void;
  editor: Editor | null;
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
    [onThumbnailChange, setSelectedThumbnail]
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
              onClick={() => {
                // 삭제 로직 (기존과 동일)
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
                  description: "파일이 삭제되었습니다.",
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

// TipTapEditor 메인 컴포넌트
const TipTapEditor = forwardRef(function TipTapEditor(
  props: TipTapEditorProps & {
    uploadedFiles: IFileInfo[];
    setUploadedFiles: (files: IFileInfo[]) => void;
  },
  ref
) {
  const {
    content,
    onChange,
    placeholder,
    thumbnailUrl,
    onThumbnailChange,
    onUploadedFilesChange,
    allowComments,
    setAllowComments,
    loading,
    category: _category = "unknown",
    pageId: _pageId = "unknown",
    uploadedFiles,
    setUploadedFiles,
  } = props;

  console.log("TipTapEditor props.uploadedFiles:", uploadedFiles);

  const category = _category;
  const pageId = _pageId;
  const [selectedThumbnail, setSelectedThumbnail] = useState<
    string | undefined
  >(thumbnailUrl);
  const [initialContentProcessed, setInitialContentProcessed] = useState(false);
  const [toastState, setToastState] = useState<{
    open: boolean;
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
  }>({
    open: false,
  });

  // 토스트 이벤트 리스너 설정
  useEffect(() => {
    const handleToast = (event: Event) => {
      const { title, description, variant } = (event as CustomEvent).detail;
      setToastState({
        open: true,
        title,
        description,
        variant,
      });
    };

    toastEventTarget.addEventListener("showToast", handleToast);
    return () => {
      toastEventTarget.removeEventListener("showToast", handleToast);
    };
  }, []);

  // TipTap 에디터 초기화
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-blue-500 underline",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: "left",
      }),
      TextStyle,
      Color,
      FontFamily,
      Typography,
      FontSize,
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: (element) =>
                element.getAttribute("width") || element.style.width,
              renderHTML: (attributes) => {
                if (!attributes.width) return {};
                return {
                  width: attributes.width,
                  style: `width: ${attributes.width}`,
                };
              },
            },
            height: {
              default: null,
              parseHTML: (element) =>
                element.getAttribute("height") || element.style.height,
              renderHTML: (attributes) => {
                if (!attributes.height) return {};
                return {
                  height: attributes.height,
                  style: `height: ${attributes.height}`,
                };
              },
            },
            align: {
              default: null,
              parseHTML: (element) => element.getAttribute("align"),
              renderHTML: (attributes) => {
                if (!attributes.align) return {};
                return {
                  align: attributes.align,
                };
              },
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(ImageResizeComponent);
        },
        draggable: true,
        selectable: true,
        allowGapCursor: true,
        priority: 50,
        addKeyboardShortcuts() {
          return {
            Backspace: () => {
              const { state } = this.editor;
              const { selection } = state;
              const pos = selection.$head.pos;
              const node = state.doc.nodeAt(pos - 1);

              if (node?.type.name === "image") {
                const imageUrl = node.attrs.src;
                if (typeof setUploadedFiles === "function") {
                  setUploadedFiles(
                    uploadedFiles.filter((file) => file.url !== imageUrl)
                  );
                }
                if (selectedThumbnail === imageUrl) {
                  setSelectedThumbnail(undefined);
                  if (onThumbnailChange) {
                    onThumbnailChange("");
                  }
                }
                showToast({
                  title: "이미지 삭제",
                  description: "이미지가 삭제되었습니다.",
                  variant: "default",
                });
                return true;
              }
              return false;
            },
            Delete: () => {
              const { state } = this.editor;
              const { selection } = state;
              const pos = selection.$head.pos;
              const node = state.doc.nodeAt(pos);

              if (node?.type.name === "image") {
                const imageUrl = node.attrs.src;
                if (typeof setUploadedFiles === "function") {
                  setUploadedFiles(
                    uploadedFiles.filter((file) => file.url !== imageUrl)
                  );
                }
                if (selectedThumbnail === imageUrl) {
                  setSelectedThumbnail(undefined);
                  if (onThumbnailChange) {
                    onThumbnailChange("");
                  }
                }
                showToast({
                  title: "이미지 삭제",
                  description: "이미지가 삭제되었습니다.",
                  variant: "default",
                });
                return true;
              }
              return false;
            },
          };
        },
      }),
      YouTube,
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: "focus:outline-none p-4",
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved) return true;

        const coordinates = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });

        if (!coordinates) return true;

        // 이미지 노드인 경우에만 처리
        if (slice.content.firstChild?.type.name === "image") {
          const tr = view.state.tr;

          // 원본 이미지 찾기
          let sourcePos: number | null = null;
          view.state.doc.descendants((node, pos) => {
            if (
              node.type.name === "image" &&
              node.attrs.src === slice.content.firstChild?.attrs.src
            ) {
              sourcePos = pos;
              return false;
            }
          });

          if (sourcePos !== null) {
            // 원본 삭제
            tr.delete(sourcePos, sourcePos + slice.content.size);

            // 새 위치에 삽입
            tr.insert(coordinates.pos, slice.content);

            view.dispatch(tr);
            return true;
          }
        }

        return true;
      },
    },
  });

  // 이미지 업로드 후 파일 목록에 추가 (구조 통일)
  const handleImageUploaded = useCallback(
    (url: string, fileName?: string, fileSize?: string, fileType?: string) => {
      if (!editor?.commands) return;
      const exists = uploadedFiles.some((file) => file.url === url);
      if (exists) return;
      const safeName = fileName || url.split("/").pop() || "image";
      const safeType =
        fileType || safeName.split(".").pop()?.toLowerCase() || "";
      const safeSize = fileSize || "크기 알 수 없음";
      const newFile: IFileInfo = {
        url,
        name: safeName,
        size: safeSize,
        type: safeType,
        uploadedAt: new Date().toISOString(),
      };
      const newFiles = [...uploadedFiles, newFile];
      if (typeof onUploadedFilesChange === "function")
        onUploadedFilesChange(newFiles);
      // 이미지인 경우 에디터에 삽입
      const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
        safeType
      );
      if (isImage && editor) {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: {
              src: url,
              "data-original-name": safeName,
              "data-file-size": safeSize,
              "data-file-type": safeType,
            },
          })
          .run();
      }
      if (typeof setUploadedFiles === "function") setUploadedFiles(newFiles);
    },
    [editor, onUploadedFilesChange, uploadedFiles]
  );

  // 외부에서 썸네일 URL이 변경되면 상태 업데이트
  useEffect(() => {
    if (thumbnailUrl !== selectedThumbnail) {
      setSelectedThumbnail(thumbnailUrl);
    }
  }, [thumbnailUrl, selectedThumbnail]);

  useImperativeHandle(ref, () => ({
    editor,
  }));

  // content prop이 바뀔 때마다 에디터 내용 동기화
  useEffect(() => {
    if (editor && content !== undefined) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // 사이드바 파일 업로드 핸들러 (문서, PDF 등만)
  const handleSidebarFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      // 날짜 변수 추가 (linter 오류 해결)
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
        const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
          fileExt
        );
        if (isImage) continue; // 이미지는 무시

        // Supabase Storage에 업로드 (board-files 버킷)
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
        const bucketName = "docs";
        const filePath = `${category}/${pageId}/${yyyy}/${mm}/${fileName}`;
        try {
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: true,
            });
          if (error) {
            showToast({
              title: "파일 업로드 실패",
              description: `${file.name}: ${error.message}`,
              variant: "destructive",
            });
            continue;
          }
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          const publicUrl = publicUrlData.publicUrl;
          if (!publicUrl) {
            showToast({
              title: "URL 생성 실패",
              description: "파일 URL을 가져오지 못했습니다.",
              variant: "destructive",
            });
            continue;
          }
          // 파일 정보 생성 및 uploadedFiles에 추가
          const fileInfo = {
            url: publicUrl,
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)}KB`,
            type: fileExt,
            uploadedAt: new Date().toISOString(),
          };
          if (typeof setUploadedFiles === "function")
            setUploadedFiles(
              uploadedFiles.filter((file) => file.url !== publicUrl)
            );
          showToast({
            title: "파일 업로드 완료",
            description: `${file.name} 파일이 업로드되었습니다.`,
            variant: "default",
          });
        } catch (uploadError) {
          showToast({
            title: "파일 업로드 예외 발생",
            description: `${file.name}: ${uploadError instanceof Error ? uploadError.message : "알 수 없는 오류"}`,
            variant: "destructive",
          });
        }
      }
      // 파일 input 초기화
      event.target.value = "";
    },
    [onUploadedFilesChange, uploadedFiles, category, pageId]
  );

  return (
    <div className="flex flex-col gap-4">
      <ToastProvider>
        <Toast
          open={toastState.open}
          onOpenChange={(open) => setToastState((prev) => ({ ...prev, open }))}
        >
          {toastState.title && <ToastTitle>{toastState.title}</ToastTitle>}
          {toastState.description && (
            <ToastDescription>{toastState.description}</ToastDescription>
          )}
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>

      {/* 에디터 + 사이드바 영역 */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 에디터 영역 */}
        <div className="flex-1 min-w-0 border border-gray-200 rounded-md overflow-hidden">
          {/* 에디터 내부에서만 sticky */}
          <div className="sticky top-0 z-20 bg-gray-50">
            <MenuBar
              editor={editor}
              onThumbnailSelect={onThumbnailChange}
              onImageUploaded={handleImageUploaded}
              selectedThumbnail={selectedThumbnail}
              setUploadedFiles={setUploadedFiles}
              category={category}
              pageId={pageId}
              uploadedFiles={uploadedFiles}
            />
          </div>
          <div className="relative" onClick={() => editor?.commands.focus()}>
            {editor ? (
              <EditorContent
                editor={editor}
                className="min-h-[300px] lg:min-h-[500px]"
                tabIndex={0}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </div>
        {/* 사이드바: 업로드된 파일 + 댓글 허용 */}
        <div className="w-full lg:w-[320px] lg:min-w-[220px] lg:max-w-[400px]">
          {/* 업로드된 파일 카드 */}
          <div className="border border-gray-200 rounded-md p-3 lg:p-4 mb-3 lg:mb-4 bg-white">
            <h3 className="text-sm font-semibold mb-2">업로드된 파일</h3>
            {uploadedFiles.length > 0 ? (
              <FileManager
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                selectedThumbnail={selectedThumbnail}
                setSelectedThumbnail={setSelectedThumbnail}
                onThumbnailChange={onThumbnailChange}
                editor={editor}
              />
            ) : (
              <div className="flex items-center justify-center h-[80px] lg:h-[100px] text-gray-500 text-center text-sm">
                업로드된 파일이 없습니다.
              </div>
            )}
          </div>
          {/* 댓글 허용 카드 */}
          <div className="border border-gray-200 rounded-md p-3 lg:p-4 bg-white">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allow-comments"
                checked={allowComments}
                onChange={(e) =>
                  setAllowComments && setAllowComments(e.target.checked)
                }
                disabled={loading}
                className="accent-blue-500"
              />
              <label
                htmlFor="allow-comments"
                className="text-sm font-medium cursor-pointer"
              >
                댓글 허용
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TipTapEditor;
