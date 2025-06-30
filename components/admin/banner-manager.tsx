"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 as Trash, Edit, Plus } from "lucide-react";
import { supabase } from "@/db";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ImageBrowser from "@/components/ui/image-browser";
import useSWR from "swr";
import { fetchMenus, fetchBanners } from "@/services/adminService";

// 메뉴 타입
export type Menu = {
  id: string;
  name: string;
  url: string;
};

// 배너 타입
export type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  isActive: boolean;
  order_num: number;
  button_text?: string;
  button_url?: string;
  has_button?: boolean;
  full_width?: boolean;
  menu_id?: string | null; // 메뉴 ID (null이면 전체 사이트에 표시)
  html_content?: string; // HTML 콘텐츠
  use_html?: boolean; // HTML 사용 여부
  image_height?: string; // 'original', '100%', '320px', '20vh' 등
  overlay_opacity?: string; // 오버레이 투명도(0~1)
};

// 이미지 타입
export type CmsImage = {
  id: string;
  title: string;
  description?: string;
  url: string;
  created_at: string;
};

// 유튜브 링크 판별 및 ID 추출 함수 추가
function isYoutubeUrl(url: string) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url);
}

function extractYoutubeId(url: string): string | null {
  const regExp = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// 정렬 가능한 배너 아이템
function SortableBannerItem({
  banner,
  onToggle,
  onEdit,
  onDelete,
}: {
  banner: Banner;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical
                className="h-4 w-4 cursor-move text-gray-400"
                {...attributes}
                {...listeners}
              />
              <div
                className="w-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center mr-3 relative"
                style={{
                  height:
                    banner.image_height && banner.image_height !== "original"
                      ? banner.image_height
                      : "3rem",
                }}
              >
                {banner.imageUrl ? (
                  isYoutubeUrl(banner.imageUrl) &&
                  extractYoutubeId(banner.imageUrl) ? (
                    <>
                      {/* 유튜브 영상 배경 */}
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYoutubeId(banner.imageUrl)}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${extractYoutubeId(banner.imageUrl)}&modestbranding=1&iv_load_policy=3&fs=0`}
                        title={banner.title}
                        width="100%"
                        height="100%"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          zIndex: 1,
                          border: 0,
                          pointerEvents: "none",
                        }}
                        frameBorder={0}
                        allow="autoplay; encrypted-media"
                        allowFullScreen={false}
                      />
                      {/* 오버레이 및 텍스트/HTML */}
                      <div
                        className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center"
                        style={{
                          zIndex: 2,
                          background: `rgba(0,0,0,${banner.overlay_opacity || 0.4})`,
                          color: "white",
                          textAlign: "center",
                          padding: 4,
                        }}
                      >
                        {banner.use_html && banner.html_content ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: banner.html_content,
                            }}
                          />
                        ) : (
                          <>
                            <div className="font-medium text-sm truncate w-full">
                              {banner.title}
                            </div>
                            {banner.subtitle && (
                              <div className="text-xs text-gray-200 truncate w-full">
                                {banner.subtitle}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="object-cover w-full"
                      style={{
                        height:
                          banner.image_height &&
                          banner.image_height !== "original"
                            ? banner.image_height
                            : "100%",
                        width: "100%",
                      }}
                    />
                  )
                ) : (
                  <span className="text-gray-300 text-xs">이미지 없음</span>
                )}
              </div>
              <div>
                <div className="font-medium">{banner.title}</div>
                {banner.subtitle && (
                  <div className="text-xs text-gray-500">{banner.subtitle}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={banner.isActive}
                onCheckedChange={(checked) => onToggle(banner.id, checked)}
                id={`active-${banner.id}`}
              />
              <Label htmlFor={`active-${banner.id}`} className="sr-only">
                활성화
              </Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(banner.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(banner.id)}
              >
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// tiptap 기반 커스텀 에디터 컴포넌트
function TiptapEditor({
  content,
  onChange,
  placeholder,
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({ levels: [1, 2, 3] }),
      Bold,
      Italic,
      Underline,
      Link,
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rounded border min-h-[120px] px-2 py-2 bg-white",
        placeholder: placeholder || "",
      },
    },
  });
  // content prop이 바뀌면 editor 내용도 동기화
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", false);
    }
    // eslint-disable-next-line
  }, [content]);

  // 메뉴바(툴바) 렌더링
  return (
    <div>
      {editor && (
        <div className="flex gap-1 mb-2 flex-wrap">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={
              editor.isActive("bold")
                ? "font-bold bg-gray-200 px-2 rounded"
                : "px-2"
            }
          >
            <b>B</b>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={
              editor.isActive("italic")
                ? "italic bg-gray-200 px-2 rounded"
                : "px-2"
            }
          >
            <i>I</i>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={
              editor.isActive("underline")
                ? "underline bg-gray-200 px-2 rounded"
                : "px-2"
            }
          >
            U
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={
              editor.isActive("heading", { level: 1 })
                ? "bg-gray-200 px-2 rounded font-bold"
                : "px-2"
            }
          >
            H1
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={
              editor.isActive("heading", { level: 2 })
                ? "bg-gray-200 px-2 rounded font-bold"
                : "px-2"
            }
          >
            H2
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={
              editor.isActive("heading", { level: 3 })
                ? "bg-gray-200 px-2 rounded font-bold"
                : "px-2"
            }
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => {
              const url = window.prompt("링크 주소 입력:");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            className={
              editor.isActive("link")
                ? "text-blue-600 bg-gray-200 px-2 rounded"
                : "px-2"
            }
          >
            🔗
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="px-2"
          >
            ⛔링크해제
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [allBanners, setAllBanners] = useState<Banner[]>([]); // 모든 배너 저장
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImageBrowserDialog, setShowImageBrowserDialog] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savedImages, setSavedImages] = useState<CmsImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 관리
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // SWR로 메뉴와 배너 데이터 가져오기
  const {
    data: menusData,
    error: menusError,
    isLoading: isMenusLoading,
    mutate: mutateMenus,
  } = useSWR("admin-menus", fetchMenus, {
    revalidateOnFocus: false,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    onError: (err) => console.error("메뉴 로딩 에러:", err),
  });
  const {
    data: bannersData,
    error: bannersError,
    isLoading: isBannersLoading,
    mutate: mutateBanners,
  } = useSWR(`admin-banners-${selectedMenuId || "all"}`, fetchBanners, {
    revalidateOnFocus: false,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    onError: (err) => console.error("배너 로딩 에러:", err),
  });

  // SWR 데이터가 바뀔 때마다 상태 업데이트
  useEffect(() => {
    console.log(
      "메뉴 로딩 상태:",
      isMenusLoading,
      "데이터:",
      menusData,
      "에러:",
      menusError
    );

    if (isMenusLoading) return;

    if (menusError) {
      console.error("메뉴 로딩 실패:", menusError);
      setMenus([]);
      return;
    }

    if (menusData && Array.isArray(menusData)) {
      setMenus(
        menusData.map((menu) => ({
          id: menu.id,
          name: menu.title,
          url: menu.url,
        }))
      );
    }
  }, [menusData, menusError, isMenusLoading]);

  useEffect(() => {
    console.log(
      "배너 로딩 상태:",
      isBannersLoading,
      "데이터:",
      bannersData,
      "에러:",
      bannersError
    );

    if (isBannersLoading) return;

    if (bannersError) {
      console.error("배너 로딩 실패:", bannersError);
      setAllBanners([]);
      setBanners([]);
      return;
    }

    if (bannersData && Array.isArray(bannersData)) {
      setAllBanners(bannersData);

      // 선택된 메뉴에 따라 배너 필터링
      if (selectedMenuId) {
        setBanners(
          bannersData.filter((banner) => banner.menu_id === selectedMenuId)
        );
      } else {
        setBanners(bannersData.filter((banner) => banner.menu_id === null));
      }
    }
  }, [bannersData, bannersError, selectedMenuId, isBannersLoading]);

  // 메뉴 선택 변경 시 배너 필터링
  const handleMenuChange = (menuId: string | null) => {
    setSelectedMenuId(menuId);

    if (menuId) {
      setBanners(allBanners.filter((banner) => banner.menu_id === menuId));
    } else {
      setBanners(allBanners.filter((banner) => banner.menu_id === null));
    }
  };

  // 드래그 종료 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id);
      const newIndex = banners.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const newBanners = arrayMove(banners, oldIndex, newIndex).map(
        (b, idx) => ({ ...b, order_num: idx })
      );
      setBanners(newBanners);

      // 전체 배너 목록에서도 순서 업데이트
      const updatedAllBanners = [...allBanners];
      for (const banner of newBanners) {
        const index = updatedAllBanners.findIndex((b) => b.id === banner.id);
        if (index !== -1) {
          updatedAllBanners[index] = {
            ...updatedAllBanners[index],
            order_num: banner.order_num,
          };
        }
      }
      setAllBanners(updatedAllBanners);
    }
  };

  // 배너 저장 (전체 저장)
  const handleSaveBanners = async () => {
    setIsLoading(true);
    try {
      // 1. 기존 배너 id 목록 조회
      const { data: existingBanners } = await supabase
        .from("cms_banners")
        .select("id");
      const existingIds = (existingBanners || []).map((b) => b.id);

      // 2. 삭제/업데이트/추가 분리
      const currentIds = allBanners.map((b) => b.id);
      const idsToDelete = existingIds.filter((id) => !currentIds.includes(id));

      // 3. 삭제
      if (idsToDelete.length > 0) {
        await supabase.from("cms_banners").delete().in("id", idsToDelete);
      }

      // 4. 추가/업데이트 (upsert)
      for (const banner of allBanners) {
        const { error: upsertError } = await supabase
          .from("cms_banners")
          .upsert(
            {
              id: banner.id,
              title: banner.title,
              subtitle: banner.subtitle,
              image_url: banner.imageUrl,
              is_active: banner.isActive,
              order_num: banner.order_num,
              button_text: banner.button_text,
              button_url: banner.button_url,
              has_button: banner.has_button,
              full_width: banner.full_width,
              menu_id: banner.menu_id,
              html_content: banner.html_content,
              use_html: banner.use_html,
              image_height:
                !banner.image_height || banner.image_height === ""
                  ? "original"
                  : banner.image_height,
              overlay_opacity: banner.overlay_opacity || "0.4",
            },
            {
              onConflict: "id",
            }
          );
        if (upsertError) {
          console.error("Error saving banner:", upsertError);
          toast({
            title: "오류",
            description: `배너 저장 중 오류가 발생했습니다: ${upsertError.message}`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }
      toast({
        title: "성공",
        description: "배너가 저장되었습니다.",
      });
      // 배너 다시 로드
      await mutateBanners();
    } catch (error) {
      console.error("Error saving banners:", error);
      toast({
        title: "오류",
        description: "배너 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 새 배너 추가 - 다이얼로그 열기
  const handleAddBanner = () => {
    const newId = crypto.randomUUID();

    const newBanner: Banner = {
      id: newId,
      title: "",
      subtitle: "",
      imageUrl: "",
      isActive: true,
      order_num: banners.length,
      has_button: false,
      full_width: false,
      use_html: false,
      image_height: "original",
      overlay_opacity: "0.4", // 기본값 설정
    };

    // 다이얼로그를 열고 새 배너를 편집 상태로 설정
    // 실제로는 다이얼로그에서 '저장'을 눌러야만 목록에 추가됨
    setEditingBanner(newBanner);
    setEditingBannerId(null);
    setShowEditDialog(true);
  };

  // 배너 편집 - 다이얼로그 열기
  const handleEditBanner = (id: string) => {
    const banner = banners.find((b) => b.id === id);
    if (banner) {
      // 오버레이 투명도가 없으면 기본값 설정
      const bannerWithDefaults = {
        ...banner,
        overlay_opacity: banner.overlay_opacity || "0.4",
        image_height: banner.image_height || "original",
      };
      setEditingBanner(bannerWithDefaults);
      setEditingBannerId(id);
      setShowEditDialog(true);
    }
  };

  // 배너 활성화 토글
  const handleToggleBanner = (id: string, isActive: boolean) => {
    // 현재 표시 중인 배너 목록 업데이트
    setBanners(
      banners.map((banner) =>
        banner.id === id ? { ...banner, isActive } : banner
      )
    );

    // 전체 배너 목록도 업데이트
    setAllBanners(
      allBanners.map((banner) =>
        banner.id === id ? { ...banner, isActive } : banner
      )
    );
  };

  // 배너 삭제 (메모리상)
  const handleDeleteBanner = (id: string) => {
    setBanners(banners.filter((banner) => banner.id !== id));
    setAllBanners(allBanners.filter((banner) => banner.id !== id));
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>배너 관리</CardTitle>
          <CardDescription>
            웹사이트에 표시될 배너를 관리합니다. 메뉴를 선택하여 특정 페이지의
            배너를 관리할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row items-start gap-4">
            <div className="w-full md:w-2/3">
              <Label htmlFor="menu-select" className="mb-2 block">
                메뉴 선택
              </Label>
              <select
                id="menu-select"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedMenuId || ""}
                onChange={(e) => handleMenuChange(e.target.value || null)}
              >
                <option value="">메인 홈 (홈 배너)</option>
                {menus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name} ({menu.url})
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 md:mt-auto">
              <Button onClick={handleAddBanner} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" /> 새 배너 추가
              </Button>
            </div>
          </div>

          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-sm text-gray-500">
              배너를 드래그하여 순서를 변경하거나, 활성화/비활성화하여 표시
              여부를 관리할 수 있습니다.
            </p>
          </div>

          {isBannersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">배너 데이터를 불러오는 중...</p>
            </div>
          ) : bannersError ? (
            <div className="text-center py-8 text-red-500">
              <p className="mb-2">
                배너 데이터를 불러오는 중 오류가 발생했습니다.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {bannersError.message}
              </p>
              <Button onClick={() => mutateBanners()}>다시 시도</Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={banners.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {banners.length > 0 ? (
                  banners.map((banner) => (
                    <SortableBannerItem
                      key={banner.id}
                      banner={banner}
                      onToggle={handleToggleBanner}
                      onEdit={handleEditBanner}
                      onDelete={handleDeleteBanner}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    배너가 없습니다. 새 배너를 추가해보세요.
                  </div>
                )}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveBanners} disabled={isLoading}>
            {isLoading ? "저장 중..." : "변경사항 저장"}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBannerId ? "배너 수정" : "새 배너 추가"}
            </DialogTitle>
            <DialogDescription>
              배너 정보를 입력하세요. 이미지는 16:9 비율이 권장됩니다.
            </DialogDescription>
          </DialogHeader>
          {editingBanner && (
            <div className="grid gap-4 py-4">
              {/* 제목/부제목 HTML 입력 지원 */}
              <div className="flex items-center gap-2 mb-2">
                <Switch
                  checked={editingBanner.use_html ?? false}
                  onCheckedChange={(checked) =>
                    setEditingBanner({ ...editingBanner, use_html: checked })
                  }
                  id="banner-use-html"
                />
                <Label htmlFor="banner-use-html">
                  제목/부제목 HTML 직접 입력
                </Label>
              </div>
              {editingBanner.use_html ? (
                <div className="mb-2">
                  <Label className="mb-1">배너 HTML 직접 입력</Label>
                  <div className="text-xs text-gray-500 mb-2">
                    예시:{" "}
                    <span className="text-gray-400">
                      {
                        "<h1>교회에 오신 것을 환영합니다!</h1><p>예배는 매주 일요일 11시입니다.</p>"
                      }
                    </span>
                    <br />
                    아래 입력란에 원하는 HTML 코드를 직접 작성해 주세요.
                  </div>
                  <Textarea
                    className="min-h-[180px] font-mono"
                    value={editingBanner.html_content || ""}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        html_content: e.target.value,
                      })
                    }
                    placeholder="여기에 <h1>...</h1><p>...</p> 등 HTML 전체 코드를 입력하세요"
                  />
                </div>
              ) : (
                <>
                  <Input
                    value={editingBanner.title}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        title: e.target.value,
                      })
                    }
                    placeholder="배너 제목"
                  />
                  <Input
                    value={editingBanner.subtitle || ""}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        subtitle: e.target.value,
                      })
                    }
                    placeholder="배너 부제목 (선택)"
                  />
                </>
              )}
              <div>
                <Label htmlFor="banner-image" className="mb-2 block">
                  배너 이미지
                </Label>
                <div className="flex flex-col gap-2">
                  {editingBanner.imageUrl && (
                    <div
                      className="w-full bg-gray-100 rounded overflow-hidden"
                      style={{
                        height:
                          editingBanner.image_height &&
                          editingBanner.image_height !== "original"
                            ? editingBanner.image_height
                            : "8rem",
                      }}
                    >
                      {isYoutubeUrl(editingBanner.imageUrl) &&
                      extractYoutubeId(editingBanner.imageUrl) ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYoutubeId(editingBanner.imageUrl)}`}
                          title={editingBanner.title}
                          width="100%"
                          height="100%"
                          style={{ minHeight: 80, aspectRatio: "16/9" }}
                          frameBorder={0}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <img
                          src={editingBanner.imageUrl}
                          alt={editingBanner.title}
                          className="object-cover w-full"
                          style={{
                            height:
                              editingBanner.image_height &&
                              editingBanner.image_height !== "original"
                                ? editingBanner.image_height
                                : "100%",
                            width: "100%",
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* 이미지 URL 직접 입력 필드 */}
                  <div className="mb-2">
                    <Label
                      htmlFor="banner-image-url"
                      className="text-sm text-gray-600 mb-1 block"
                    >
                      이미지 URL 직접 입력
                    </Label>
                    <Input
                      id="banner-image-url"
                      placeholder="https://example.com/image.jpg"
                      value={editingBanner.imageUrl || ""}
                      onChange={(e) =>
                        setEditingBanner({
                          ...editingBanner,
                          imageUrl: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center">
                    <div className="h-px flex-grow bg-gray-200"></div>
                    <span className="px-2 text-xs text-gray-500">또는</span>
                    <div className="h-px flex-grow bg-gray-200"></div>
                  </div>

                  {/* 파일 업로드 옵션 */}
                  <div className="mt-2">
                    <Label
                      htmlFor="banner-image-upload"
                      className="text-sm text-gray-600 mb-1 block"
                    >
                      이미지 파일 업로드
                    </Label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        id="banner-image"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingImage(true);
                          try {
                            // 원본 파일 이름 그대로 사용
                            const fileName = file.name;
                            const filePath = `banners/${fileName}`;

                            // 파일을 Supabase Storage에 업로드
                            const { error: uploadError, data } =
                              await supabase.storage
                                .from("homepage-banners")
                                .upload(filePath, file, {
                                  cacheControl: "3600",
                                  upsert: true,
                                });

                            if (uploadError) {
                              console.error("업로드 오류:", uploadError);
                              throw uploadError;
                            }

                            // 업로드된 파일의 공개 URL 가져오기
                            const { data: publicUrlData } = supabase.storage
                              .from("homepage-banners")
                              .getPublicUrl(filePath);

                            console.log("업로드 성공:", publicUrlData);

                            // 배너 이미지 URL 업데이트
                            setEditingBanner({
                              ...editingBanner,
                              imageUrl: publicUrlData.publicUrl,
                            });
                            toast({
                              title: "이미지 업로드 성공",
                              description:
                                "이미지가 성공적으로 업로드되었습니다.",
                            });
                          } catch (err) {
                            console.error("이미지 업로드 오류:", err);
                            toast({
                              title: "이미지 업로드 실패",
                              description:
                                (err as any).message || "업로드 중 오류 발생",
                              variant: "destructive",
                            });
                          } finally {
                            setUploadingImage(false);
                          }
                        }}
                        disabled={uploadingImage}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1"
                      >
                        {uploadingImage ? "업로드 중..." : "파일 선택"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowImageBrowser(true)}
                        className="flex-1"
                      >
                        📁 서버 이미지
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              {editingBanner.has_button && (
                <>
                  <Input
                    value={editingBanner.button_text || ""}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        button_text: e.target.value,
                      })
                    }
                    placeholder="버튼 텍스트 (선택)"
                  />
                  <Input
                    value={editingBanner.button_url || ""}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        button_url: e.target.value,
                      })
                    }
                    placeholder="버튼 링크 URL (선택)"
                  />
                </>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingBanner.has_button ?? false}
                  onCheckedChange={(checked) =>
                    setEditingBanner({ ...editingBanner, has_button: checked })
                  }
                  id="banner-has-button"
                />
                <Label htmlFor="banner-has-button">버튼 표시</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingBanner.full_width ?? false}
                  onCheckedChange={(checked) =>
                    setEditingBanner({ ...editingBanner, full_width: checked })
                  }
                  id="banner-full-width"
                />
                <Label htmlFor="banner-full-width">전체 폭 사용</Label>
              </div>

              {/* 배너 높이/오버레이 설정 */}
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="banner-image-height">이미지 높이</Label>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="banner-image-height"
                      value="original"
                      checked={editingBanner.image_height === "original"}
                      onChange={() =>
                        setEditingBanner({
                          ...editingBanner,
                          image_height: "original",
                        })
                      }
                    />
                    <span>원본</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="banner-image-height"
                      value="fullscreen"
                      checked={editingBanner.image_height === "fullscreen"}
                      onChange={() =>
                        setEditingBanner({
                          ...editingBanner,
                          image_height: "fullscreen",
                        })
                      }
                    />
                    <span>전체 화면</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="banner-image-height"
                      value="custom"
                      checked={
                        editingBanner.image_height !== "original" &&
                        editingBanner.image_height !== "fullscreen"
                      }
                      onChange={() =>
                        setEditingBanner({
                          ...editingBanner,
                          image_height: "400px",
                        })
                      } // 기본값 세팅
                    />
                    <Input
                      className="w-32"
                      placeholder="ex) 400px, 20vh"
                      value={
                        editingBanner.image_height !== "original" &&
                        editingBanner.image_height !== "fullscreen"
                          ? editingBanner.image_height
                          : ""
                      }
                      onChange={(e) =>
                        setEditingBanner({
                          ...editingBanner,
                          image_height: e.target.value,
                        })
                      }
                      disabled={
                        editingBanner.image_height === "original" ||
                        editingBanner.image_height === "fullscreen"
                      }
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="banner-overlay-opacity">
                    오버레이 투명도
                  </Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={editingBanner.overlay_opacity || "0.4"}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        overlay_opacity: e.target.value,
                      })
                    }
                    style={{ width: 120 }}
                  />
                  <span>{editingBanner.overlay_opacity || "0.4"}</span>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="banner-menu" className="mb-2 block">
                  배너 표시 메뉴
                </Label>
                <select
                  id="banner-menu"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={editingBanner.menu_id || ""}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      menu_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">전체 사이트 (공통 배너)</option>
                  {menus.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name} ({menu.url})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingBanner.isActive}
                  onCheckedChange={(checked) =>
                    setEditingBanner({ ...editingBanner, isActive: checked })
                  }
                  id="banner-active"
                />
                <Label htmlFor="banner-active">활성화</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditDialog(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!editingBanner) return;

                try {
                  setIsLoading(true);

                  // id가 없거나 잘못된 경우 uuid 생성
                  let validId =
                    editingBanner.id && editingBanner.id.length === 36
                      ? editingBanner.id
                      : crypto.randomUUID();
                  if (!validId || validId === "") validId = crypto.randomUUID();

                  const newBanner = {
                    ...editingBanner,
                    id: validId,
                    // 직접입력 모드에서는 title/subtitle 대신 html_content만 저장
                    ...(editingBanner.use_html
                      ? {
                          title: "",
                          subtitle: "",
                          html_content: editingBanner.html_content || "",
                        }
                      : {
                          html_content: "",
                        }),
                  };

                  // 1. 새 배너를 데이터베이스에 저장
                  const { error: upsertError } = await supabase
                    .from("cms_banners")
                    .upsert(
                      {
                        id: newBanner.id,
                        title: newBanner.title,
                        subtitle: newBanner.subtitle,
                        image_url: newBanner.imageUrl,
                        is_active: newBanner.isActive,
                        order_num: newBanner.order_num,
                        button_text: newBanner.button_text,
                        button_url: newBanner.button_url,
                        has_button: newBanner.has_button,
                        full_width: newBanner.full_width,
                        menu_id: newBanner.menu_id,
                        html_content: newBanner.html_content,
                        use_html: newBanner.use_html,
                        image_height: newBanner.image_height || "original",
                        overlay_opacity: newBanner.overlay_opacity || "0.4",
                      },
                      { onConflict: "id" }
                    );

                  if (upsertError) throw upsertError;

                  // 2. 로컬 상태 업데이트
                  const updatedAllBanners = allBanners.some(
                    (b) => b.id === newBanner.id
                  )
                    ? allBanners.map((b) =>
                        b.id === newBanner.id ? newBanner : b
                      )
                    : [...allBanners, newBanner];

                  setAllBanners(updatedAllBanners);

                  // 3. 필터링된 배너 목록 업데이트
                  const filteredBanners = selectedMenuId
                    ? updatedAllBanners.filter(
                        (banner) => banner.menu_id === selectedMenuId
                      )
                    : updatedAllBanners.filter(
                        (banner) => banner.menu_id === null
                      );

                  // 4. 배너 목록 새로고침
                  await mutateBanners();

                  toast({
                    title: "성공",
                    description: "배너가 저장되었습니다.",
                  });
                } catch (error) {
                  console.error("배너 저장 오류:", error);
                  toast({
                    title: "오류",
                    description: "배너 저장 중 오류가 발생했습니다.",
                    variant: "destructive",
                  });
                } finally {
                  setIsLoading(false);
                  setShowEditDialog(false);
                  setEditingBanner(null);
                  setEditingBannerId(null);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이미지 브라우저 컴포넌트 */}
      <ImageBrowser
        isOpen={showImageBrowser}
        onClose={() => setShowImageBrowser(false)}
        onImageSelect={(imageUrl: string, imageName?: string) => {
          if (!editingBanner) return;

          setEditingBanner({
            ...editingBanner,
            imageUrl: imageUrl,
          });

          toast({
            title: "이미지 선택 완료",
            description: `${imageName || "이미지"}가 배너에 설정되었습니다.`,
          });
        }}
        buckets={["homepage-banners", "images", "admin"]}
        title="배너 이미지 선택"
      />
    </div>
  );
}
