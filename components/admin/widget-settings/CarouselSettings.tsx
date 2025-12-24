"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { CAROUSEL_TYPES } from "@/components/widgets/carousel-widget";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/hooks/use-toast";
import { WidgetSettingsComponentProps } from "./types";
import ImageBrowser from "@/components/ui/image-browser";

export function CarouselSettings({ widget, onSave, pages = [], editingWidget, setEditingWidget }: WidgetSettingsComponentProps & { editingWidget?: any, setEditingWidget?: any }) {
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const [carouselUploading, setCarouselUploading] = useState(false);
  const [currentMode, setCurrentMode] = useState<"desktop" | "mobile">("desktop");
  const carouselFileInputRef = useRef<HTMLInputElement>(null);

  const updateWidget = (updates: any) => {
    const updatedWidget = {
      ...editingWidget,
      ...updates,
    };
    setEditingWidget?.(updatedWidget);
  };

  // 이미지 업로드 처리
  const handleImageUpload = async (file: File, mode: "desktop" | "mobile") => {
    setCarouselUploading(true);
    try {
      const supabase = createClient();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `carousel_${mode}_${timestamp}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      const newImage = {
        image_url: publicUrl,
        title: "",
        description: "",
        link_url: "",
      };

      const currentImages = widget.settings?.[`${mode}_images`] || [];
      if (currentImages.length >= 8) {
        toast({
          title: "이미지 개수 제한",
          description: "최대 8개까지만 추가할 수 있습니다.",
          variant: "destructive",
        });
        return;
      }

      updateWidget({
        settings: {
          ...widget.settings,
          [`${mode}_images`]: [...currentImages, newImage],
        },
      });

      toast({
        title: "이미지 업로드 성공",
        description: `${mode === "desktop" ? "데스크톱" : "모바일"} 이미지가 추가되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setCarouselUploading(false);
    }
  };

  // 이미지 순서 변경
  const moveImage = (mode: "desktop" | "mobile", index: number, direction: "left" | "right") => {
    const images = [...(widget.settings?.[`${mode}_images`] || [])];
    const newIndex = direction === "left" ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= images.length) return;
    
    [images[index], images[newIndex]] = [images[newIndex], images[index]];
    
    updateWidget({
      settings: {
        ...widget.settings,
        [`${mode}_images`]: images,
      },
    });
  };

  // 이미지 삭제
  const deleteImage = (mode: "desktop" | "mobile", index: number) => {
    const images = [...(widget.settings?.[`${mode}_images`] || [])];
    images.splice(index, 1);
    
    updateWidget({
      settings: {
        ...widget.settings,
        [`${mode}_images`]: images,
      },
    });
  };

  // URL로 이미지 추가
  const addImageFromUrl = (mode: "desktop" | "mobile", url: string) => {
    if (!url.trim()) return;

    const currentImages = widget.settings?.[`${mode}_images`] || [];
    if (currentImages.length >= 8) {
      toast({
        title: "이미지 개수 제한",
        description: "최대 8개까지만 추가할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    const newImage = {
      image_url: url,
      title: "",
      description: "",
      link_url: "",
    };

    updateWidget({
      settings: {
        ...widget.settings,
        [`${mode}_images`]: [...currentImages, newImage],
      },
    });

    toast({
      title: "이미지 추가 성공",
      description: "URL에서 이미지가 추가되었습니다.",
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">캐러셀 슬라이드 설정</h4>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">기본 설정</TabsTrigger>
          <TabsTrigger value="data">데이터 관리</TabsTrigger>
          <TabsTrigger value="display">표시 옵션</TabsTrigger>
        </TabsList>

        {/* 기본 설정 탭 */}
        <TabsContent value="basic" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="carousel-title">위젯 제목</Label>
            <Input
              id="carousel-title"
              value={editingWidget.title || ""}
              placeholder="캐러셀"
              onChange={(e) =>
                updateWidget({
                  title: e.target.value,
                })
              }
            />
            <p className="text-xs text-gray-500">
              '제목 표시' 옵션이 활성화되어 있을 때 표시되는 제목입니다.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="carousel-type">캐러셀 타입</Label>
            <Select
              value={editingWidget.settings?.carousel_type || CAROUSEL_TYPES.BASIC}
              onValueChange={(value) =>
                updateWidget({
                  settings: {
                    ...editingWidget.settings,
                    carousel_type: value,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="캐러셀 타입 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CAROUSEL_TYPES.BASIC}>
                  기본 슬라이드형
                </SelectItem>
                <SelectItem value={CAROUSEL_TYPES.GALLERY}>
                  갤러리 카드형
                </SelectItem>
                <SelectItem value={CAROUSEL_TYPES.FULLSCREEN}>
                  풀스크린 모드
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              기본: 전체 너비 슬라이드, 갤러리: 카드형 가로 스크롤,
              풀스크린: 썸네일 클릭 시 전체 화면 보기
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carousel-data-source">데이터 소스</Label>
            <Select
              value={editingWidget.settings?.data_source || "sample"}
              onValueChange={(value) =>
                updateWidget({
                  settings: {
                    ...editingWidget.settings,
                    data_source: value,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="데이터 소스 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sample">기본 샘플 이미지</SelectItem>
                <SelectItem value="page">페이지 콘텐츠</SelectItem>
                <SelectItem value="custom">직접 이미지 관리</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              샘플: 기본 더미 이미지, 페이지: 선택한 페이지의 게시물,
              직접: 업로드한 이미지들
            </p>
          </div>
        </TabsContent>

        {/* 데이터 관리 탭 */}
        <TabsContent value="data" className="space-y-4 pt-4">
          {/* 페이지 선택 (페이지 콘텐츠 모드일 때만) */}
          {widget.settings?.data_source === "page" && (
            <div className="space-y-2">
              <Label htmlFor="carousel-page">콘텐츠 페이지 선택</Label>
              <Select
                value={widget.display_options?.page_id || ""}
                onValueChange={(value) =>
                  updateWidget({
                    display_options: {
                      ...widget.display_options,
                      page_id: value,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="페이지 선택" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((page: any) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                선택한 페이지의 썸네일이 있는 게시물들이 캐러셀에 표시됩니다.
              </p>
            </div>
          )}

          {/* 직접 이미지 관리 (커스텀 모드일 때만) */}
          {widget.settings?.data_source === "custom" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>이미지 관리</Label>
                <div className="text-xs text-gray-500">
                  데스크톱 {(widget.settings?.desktop_images || []).length}개 | 
                  모바일 {(widget.settings?.mobile_images || []).length}개
                </div>
              </div>

              {/* 데스크톱/모바일 이미지 관리 탭 */}
              <Tabs defaultValue="desktop" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="desktop">데스크톱 이미지</TabsTrigger>
                  <TabsTrigger value="mobile">모바일 이미지</TabsTrigger>
                </TabsList>

                {/* 데스크톱 이미지 탭 */}
                <TabsContent value="desktop" className="space-y-3 pt-4">
                  <ImageManager
                    mode="desktop"
                    images={editingWidget.settings?.desktop_images || []}
                    carouselUploading={carouselUploading}
                    carouselFileInputRef={carouselFileInputRef}
                    onImageUpload={handleImageUpload}
                    onMoveImage={moveImage}
                    onDeleteImage={deleteImage}
                    onAddImageFromUrl={addImageFromUrl}
                    onShowImageBrowser={() => {
                      setCurrentMode("desktop");
                      setShowImageBrowser(true);
                    }}
                  />
                </TabsContent>

                {/* 모바일 이미지 탭 */}
                <TabsContent value="mobile" className="space-y-3 pt-4">
                  <ImageManager
                    mode="mobile"
                    images={editingWidget.settings?.mobile_images || []}
                    carouselUploading={carouselUploading}
                    carouselFileInputRef={carouselFileInputRef}
                    onImageUpload={handleImageUpload}
                    onMoveImage={moveImage}
                    onDeleteImage={deleteImage}
                    onAddImageFromUrl={addImageFromUrl}
                    onShowImageBrowser={() => {
                      setCurrentMode("mobile");
                      setShowImageBrowser(true);
                    }}
                  />
                </TabsContent>
              </Tabs>

              {/* 파일 입력 (숨김) */}
              <input
                type="file"
                ref={carouselFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const mode = widget.settings?.currentMode || "desktop";
                    handleImageUpload(file, mode as "desktop" | "mobile");
                  }
                }}
              />
            </div>
          )}
        </TabsContent>

        {/* 표시 옵션 탭 */}
        <TabsContent value="display" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="carousel-show-title"
                  checked={widget.settings?.show_title ?? true}
                  onCheckedChange={(checked) =>
                    updateWidget({
                      settings: {
                        ...widget.settings,
                        show_title: checked === true,
                      },
                    })
                  }
                />
                <Label htmlFor="carousel-show-title">제목 표시</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="carousel-auto-play"
                  checked={widget.settings?.auto_play ?? true}
                  onCheckedChange={(checked) =>
                    updateWidget({
                      settings: {
                        ...widget.settings,
                        auto_play: checked === true,
                      },
                    })
                  }
                />
                <Label htmlFor="carousel-auto-play">자동 재생</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="carousel-show-dots"
                  checked={widget.settings?.show_dots ?? true}
                  onCheckedChange={(checked) =>
                    updateWidget({
                      settings: {
                        ...widget.settings,
                        show_dots: checked === true,
                      },
                    })
                  }
                />
                <Label htmlFor="carousel-show-dots">도트 표시</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="carousel-show-arrows"
                  checked={widget.settings?.show_arrows ?? true}
                  onCheckedChange={(checked) =>
                    updateWidget({
                      settings: {
                        ...widget.settings,
                        show_arrows: checked === true,
                      },
                    })
                  }
                />
                <Label htmlFor="carousel-show-arrows">화살표 표시</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="carousel-transparent-background"
                  checked={widget.settings?.transparent_background ?? false}
                  onCheckedChange={(checked) =>
                    updateWidget({
                      settings: {
                        ...widget.settings,
                        transparent_background: checked === true,
                      },
                    })
                  }
                />
                <Label htmlFor="carousel-transparent-background">
                  투명 배경 사용
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                갤러리형에서 카드 배경을 투명하게 만듭니다
              </p>

              {/* 카드 표시 옵션 */}
              <div className="pt-2 border-t border-gray-200">
                <Label className="text-sm font-medium mb-2 block">
                  카드 표시 옵션
                </Label>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="carousel-show-card-title"
                    checked={widget.settings?.show_card_title ?? true}
                    onCheckedChange={(checked) =>
                      updateWidget({
                        settings: {
                          ...widget.settings,
                          show_card_title: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor="carousel-show-card-title">
                    카드 제목 표시
                  </Label>
                </div>

                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="carousel-show-card-description"
                    checked={widget.settings?.show_card_description ?? true}
                    onCheckedChange={(checked) =>
                      updateWidget({
                        settings: {
                          ...widget.settings,
                          show_card_description: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor="carousel-show-card-description">
                    카드 설명 표시
                  </Label>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  개별 카드의 제목과 설명 표시를 제어합니다
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carousel-auto-play-delay">
                자동 재생 간격 (초)
              </Label>
              <Input
                id="carousel-auto-play-delay"
                type="number"
                min="1"
                max="30"
                value={(widget.settings?.auto_play_delay || 5000) / 1000}
                onChange={(e) => {
                  const seconds = parseInt(e.target.value) || 5;
                  updateWidget({
                    settings: {
                      ...widget.settings,
                      auto_play_delay: seconds * 1000,
                    },
                  });
                }}
                disabled={!widget.settings?.auto_play}
              />
              <p className="text-xs text-gray-500">
                자동 재생이 활성화된 경우 슬라이드 전환 간격을 설정합니다.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h5 className="font-medium text-sm mb-3">추가 설정</h5>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• 캐러셀 타입에 따라 표시 방식이 달라집니다</p>
              <p>• 자동 재생은 사용자가 마우스를 올리면 일시 정지됩니다</p>
              <p>• 풀스크린 모드에서는 썸네일 클릭 시 전체 화면으로 확대됩니다</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 이미지 브라우저 */}
      <ImageBrowser
        isOpen={showImageBrowser}
        onClose={() => setShowImageBrowser(false)}
        onImageSelect={(imageUrl: string) => {
          const currentImages = editingWidget.settings?.[`${currentMode}_images`] || [];
          if (currentImages.length >= 8) {
            toast({
              title: "이미지 개수 제한",
              description: "최대 8개까지만 추가할 수 있습니다.",
              variant: "destructive",
            });
            return;
          }

          const newImage = {
            image_url: imageUrl,
            title: "",
            description: "",
            link_url: "",
          };

          updateWidget({
            settings: {
              ...editingWidget.settings,
              [`${currentMode}_images`]: [...currentImages, newImage],
            },
          });

          toast({
            title: "이미지 추가 성공",
            description: `${currentMode === "desktop" ? "데스크톱" : "모바일"} 이미지가 추가되었습니다.`,
          });

          setShowImageBrowser(false);
        }}
      />
    </div>
  );
}

// 이미지 매니저 컴포넌트
interface ImageManagerProps {
  mode: "desktop" | "mobile";
  images: any[];
  carouselUploading: boolean;
  carouselFileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (file: File, mode: "desktop" | "mobile") => void;
  onMoveImage: (mode: "desktop" | "mobile", index: number, direction: "left" | "right") => void;
  onDeleteImage: (mode: "desktop" | "mobile", index: number) => void;
  onAddImageFromUrl: (mode: "desktop" | "mobile", url: string) => void;
  onShowImageBrowser: () => void;
}

function ImageManager({
  mode,
  images,
  carouselUploading,
  carouselFileInputRef,
  onImageUpload,
  onMoveImage,
  onDeleteImage,
  onAddImageFromUrl,
  onShowImageBrowser,
}: ImageManagerProps) {
  const [urlInput, setUrlInput] = useState("");
  const colorClass = mode === "desktop" ? "blue" : "green";

  const handleUrlAdd = () => {
    if (urlInput.trim()) {
      onAddImageFromUrl(mode, urlInput.trim());
      setUrlInput("");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {mode === "desktop" ? "데스크톱" : "모바일"}에서 표시될 이미지들을 관리합니다
        </p>
        <div className={`text-xs text-${colorClass}-600 font-medium`}>
          {images.length}개 이미지
        </div>
      </div>

      {/* 이미지 추가 버튼들 */}
      <div className={`bg-${colorClass}-50 p-3 rounded-lg space-y-2`}>
        <Label className={`text-sm font-medium text-${colorClass}-800`}>
          {mode === "desktop" ? "데스크톱" : "모바일"} 이미지 추가/변경
        </Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => carouselFileInputRef.current?.click()}
            disabled={carouselUploading || images.length >= 8}
            className="flex-1"
          >
            {carouselUploading ? "업로드 중..." : "파일 업로드"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onShowImageBrowser}
            disabled={images.length >= 8}
            className="flex-1"
          >
            📁 서버 이미지
          </Button>
        </div>

        {/* URL 입력 */}
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="이미지 URL을 입력하세요"
            className="text-sm"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlAdd()}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleUrlAdd}
            disabled={images.length >= 8}
          >
            추가
          </Button>
        </div>
      </div>

      {/* 이미지 미리보기 */}
      <div className="space-y-2">
        <Label className={`text-sm font-medium text-${colorClass}-800`}>
          {mode === "desktop" ? "데스크톱" : "모바일"} 이미지 미리보기
        </Label>
        <div className={`bg-white p-3 rounded-lg border border-${colorClass}-200`}>
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img: any, index: number) => (
                <div
                  key={`${mode}-preview-${index}`}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 border-${colorClass}-200 hover:border-${colorClass}-400 transition-all aspect-video`}
                >
                  <img
                    src={img.image_url}
                    alt={img.title || `${mode} 이미지 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute bottom-1 left-1 bg-${colorClass}-600 text-white text-xs px-1.5 py-0.5 rounded`}>
                    {index + 1}
                  </div>

                  {/* 왼쪽 이동 버튼 */}
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveImage(mode, index, "left");
                    }}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>

                  {/* 오른쪽 이동 버튼 */}
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                    disabled={index === images.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveImage(mode, index, "right");
                    }}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>

                  {/* 삭제 버튼 */}
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteImage(mode, index);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">
                {mode === "desktop" ? "데스크톱" : "모바일"}용 이미지가 없습니다
              </p>
              <p className="text-xs mt-1">위에서 이미지를 추가해주세요</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}