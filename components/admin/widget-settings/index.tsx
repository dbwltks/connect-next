"use client";

import { useState, useRef } from "react";
import { IWidget } from "@/types";
import { RecentCommentsSettings } from "./RecentCommentsSettings";
import { PopularPostsSettings } from "./PopularPostsSettings";
import { LoginSettings } from "./LoginSettings";
import { MenuListSettings } from "./MenuListSettings";
import { MediaSettings } from "./MediaSettings";
import { PageSettings } from "./PageSettings";
import { BoardSettings } from "./BoardSettings";
import { BoardSectionSettings } from "./BoardSectionSettings";
import { LocationSettings } from "./LocationSettings";
import { CalendarSettings } from "./CalendarSettings";
import { SimpleCalendarSettings } from "./SimpleCalendarSettings";
import { BannerSettings } from "./BannerSettings";
import { OrganizationChartSettings } from "./OrganizationChartSettings";
import { CarouselSettings } from "./CarouselSettings";
import ContainerSettings from "./ContainerSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/hooks/use-toast";

interface WidgetSettingsRendererProps {
  widget: IWidget;
  onSave: (widget: IWidget) => Promise<void>;
  menuItems?: any[];
  pages?: any[];
  roles?: any[];
  programs?: any[];
}

export function WidgetSettingsRenderer({
  widget,
  onSave,
  menuItems = [],
  pages = [],
  roles = [],
  programs = [],
}: WidgetSettingsRendererProps) {
  // State for widget editing
  const [editingWidget, setEditingWidget] = useState<IWidget>(widget);
  
  
  // State for strip widget
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stripUploading, setStripUploading] = useState(false);

  // Handle save
  const handleSave = async () => {
    await onSave(editingWidget);
    // 저장 후 창 닫기 (부모 컴포넌트에서 setDialogOpen(false) 호출)
  };
  const commonProps = {
    widget: editingWidget,
    onSave: () => Promise.resolve(),  // 자동 저장 방지용 더미 함수
    editingWidget,
    setEditingWidget,
    menuItems,
    pages,
    roles,
    programs,
  };

  // Common widget settings component
  const CommonWidgetSettings = ({ isContainer = false }: { isContainer?: boolean }) => (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">컨테이너 설정</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="widget-width">너비</Label>
          <Select
            value={editingWidget.width?.toString() || "12"}
            onValueChange={(value) =>
              setEditingWidget({
                ...editingWidget,
                width: parseInt(value),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="너비 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">25% (3/12)</SelectItem>
              <SelectItem value="4">33% (4/12)</SelectItem>
              <SelectItem value="6">50% (6/12)</SelectItem>
              <SelectItem value="8">66% (8/12)</SelectItem>
              <SelectItem value="9">75% (9/12)</SelectItem>
              <SelectItem value="12">100% (12/12)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="widget-height">높이 (px)</Label>
          <Input
            id="widget-height"
            type="number"
            placeholder="자동 조절"
            value={editingWidget.height || ""}
            onChange={(e) =>
              setEditingWidget({
                ...editingWidget,
                height: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="use-full-width"
            checked={editingWidget.settings?.use_full_width ?? false}
            onCheckedChange={(checked) =>
              setEditingWidget({
                ...editingWidget,
                settings: {
                  ...editingWidget.settings,
                  use_full_width: checked === true,
                },
              })
            }
          />
          <Label htmlFor="use-full-width">전체 화면 너비 사용</Label>
        </div>
        <p className="text-xs text-gray-500">
          체크하면 위젯이 전체 화면 너비로 표시됩니다.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="container-bg-color">배경색</Label>
        <div className="flex gap-2">
          <Input
            id="container-bg-color"
            type="color"
            value={editingWidget.settings?.background_color || "#ffffff"}
            onChange={(e) =>
              setEditingWidget({
                ...editingWidget,
                settings: {
                  ...editingWidget.settings,
                  background_color: e.target.value,
                },
              })
            }
            className="w-16 h-10 p-1"
          />
          <Input
            placeholder="#ffffff"
            value={editingWidget.settings?.background_color || ""}
            onChange={(e) =>
              setEditingWidget({
                ...editingWidget,
                settings: {
                  ...editingWidget.settings,
                  background_color: e.target.value,
                },
              })
            }
            className="flex-1"
          />
        </div>
      </div>

      {/* 패딩 설정 - 컨테이너면 시각적 UI, 아니면 기본 선택 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">패딩</Label>
        {isContainer ? (
          // 컨테이너용 시각적 패딩 컨트롤
          <div className="mt-3 space-y-3">
            {/* 위쪽 패딩 */}
            <div className="flex items-center justify-center">
              <Input
                type="number"
                min="0"
                max="100"
                value={editingWidget.settings?.padding_top || ""}
                onChange={(e) => {
                  setEditingWidget({
                    ...editingWidget,
                    settings: {
                      ...editingWidget.settings,
                      padding_top: e.target.value === "" ? undefined : parseInt(e.target.value) || 0,
                    },
                  });
                }}
                placeholder="0"
                className="w-16 h-8 text-center text-xs"
              />
            </div>
            
            {/* 좌우 패딩과 중앙 영역 */}
            <div className="flex items-center justify-between">
              {/* 왼쪽 패딩 */}
              <Input
                type="number"
                min="0"
                max="100"
                value={editingWidget.settings?.padding_left || ""}
                onChange={(e) => {
                  setEditingWidget({
                    ...editingWidget,
                    settings: {
                      ...editingWidget.settings,
                      padding_left: e.target.value === "" ? undefined : parseInt(e.target.value) || 0,
                    },
                  });
                }}
                placeholder="0"
                className="w-16 h-8 text-center text-xs"
              />
              
              {/* 중앙 콘텐츠 영역 */}
              <div className="flex-1 h-16 bg-blue-50 border-2 border-dashed border-blue-200 rounded mx-3 flex items-center justify-center">
                <span className="text-xs text-blue-600 font-medium">콘텐츠 영역</span>
              </div>
              
              {/* 오른쪽 패딩 */}
              <Input
                type="number"
                min="0"
                max="100"
                value={editingWidget.settings?.padding_right || ""}
                onChange={(e) => {
                  setEditingWidget({
                    ...editingWidget,
                    settings: {
                      ...editingWidget.settings,
                      padding_right: e.target.value === "" ? undefined : parseInt(e.target.value) || 0,
                    },
                  });
                }}
                placeholder="0"
                className="w-16 h-8 text-center text-xs"
              />
            </div>
            
            {/* 아래쪽 패딩 */}
            <div className="flex items-center justify-center">
              <Input
                type="number"
                min="0"
                max="100"
                value={editingWidget.settings?.padding_bottom || ""}
                onChange={(e) => {
                  setEditingWidget({
                    ...editingWidget,
                    settings: {
                      ...editingWidget.settings,
                      padding_bottom: e.target.value === "" ? undefined : parseInt(e.target.value) || 0,
                    },
                  });
                }}
                placeholder="0"
                className="w-16 h-8 text-center text-xs"
              />
            </div>
          </div>
        ) : (
          // 일반 위젯용 기본 패딩 선택
          <Select
            value={editingWidget.settings?.padding || "normal"}
            onValueChange={(value) =>
              setEditingWidget({
                ...editingWidget,
                settings: {
                  ...editingWidget.settings,
                  padding: value,
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="패딩 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">없음</SelectItem>
              <SelectItem value="small">작게 (8px)</SelectItem>
              <SelectItem value="normal">보통 (16px)</SelectItem>
              <SelectItem value="large">크게 (24px)</SelectItem>
              <SelectItem value="xl">매우 크게 (32px)</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content-align">내용 정렬</Label>
        <Select
          value={editingWidget.settings?.content_align || "left"}
          onValueChange={(value) =>
            setEditingWidget({
              ...editingWidget,
              settings: {
                ...editingWidget.settings,
                content_align: value,
              },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="정렬 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">왼쪽 정렬</SelectItem>
            <SelectItem value="center">가운데 정렬</SelectItem>
            <SelectItem value="right">오른쪽 정렬</SelectItem>
            <SelectItem value="justify">양쪽 정렬</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="container-border">테두리</Label>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={editingWidget.settings?.border_style || "none"}
            onValueChange={(value) =>
              setEditingWidget({
                ...editingWidget,
                settings: {
                  ...editingWidget.settings,
                  border_style: value,
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="테두리 스타일" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">없음</SelectItem>
              <SelectItem value="solid">실선</SelectItem>
              <SelectItem value="dashed">점선</SelectItem>
              <SelectItem value="dotted">점</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="테두리 색상 #cccccc"
            value={editingWidget.settings?.border_color || ""}
            onChange={(e) =>
              setEditingWidget({
                ...editingWidget,
                settings: {
                  ...editingWidget.settings,
                  border_color: e.target.value,
                },
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="border-radius">모서리 둥글기</Label>
        <Select
          value={editingWidget.settings?.border_radius || "none"}
          onValueChange={(value) =>
            setEditingWidget({
              ...editingWidget,
              settings: {
                ...editingWidget.settings,
                border_radius: value,
              },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="둥글기 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">없음</SelectItem>
            <SelectItem value="small">작게 (4px)</SelectItem>
            <SelectItem value="normal">보통 (8px)</SelectItem>
            <SelectItem value="large">크게 (12px)</SelectItem>
            <SelectItem value="xl">매우 크게 (16px)</SelectItem>
            <SelectItem value="full">완전 둥글게</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Widget-specific settings renderer
  const renderSpecificSettings = () => {
    switch (widget.type) {
      case "recent-comments":
        return <RecentCommentsSettings {...commonProps} />;
      case "popular-posts":
        return <PopularPostsSettings {...commonProps} />;
      case "login":
        return <LoginSettings {...commonProps} />;
      case "menu-list":
        return <MenuListSettings {...commonProps} />;
      case "media":
        return <MediaSettings {...commonProps} />;
      case "page":
        return <PageSettings {...commonProps} />;
      case "board":
        return <BoardSettings {...commonProps} />;
      case "board-section":
        return <BoardSectionSettings {...commonProps} />;
      case "location":
        return <LocationSettings {...commonProps} />;
      case "calendar":
        return <CalendarSettings {...commonProps} />;
      case "simple-calendar":
        return <SimpleCalendarSettings {...commonProps} />;
      case "banner":
        return <BannerSettings {...commonProps} />;
      case "organization-chart":
        return <OrganizationChartSettings {...commonProps} />;
      case "carousel":
        return <CarouselSettings {...commonProps} />;
      case "container":
        return <ContainerSettings widget={editingWidget} onSave={() => Promise.resolve()} />;
      default:
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">알 수 없는 위젯</h4>
            <p className="text-sm text-gray-500">
              지원하지 않는 위젯 타입입니다: {widget.type}
            </p>
          </div>
        );
    }
  };

  // Handle strip and programs widgets separately since they have custom layouts
  if (widget.type === "strip" || widget.type === "programs") {
    return (
      <Tabs defaultValue="widget-settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="widget-settings">위젯 설정</TabsTrigger>
          <TabsTrigger value="layout-settings">레이아웃 설정</TabsTrigger>
        </TabsList>
        <TabsContent value="widget-settings" className="space-y-4 mt-4">
          {widget.type === "strip" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="widget-title">제목</Label>
                <Input
                  id="widget-title"
                  value={editingWidget.title}
                  onChange={(e) =>
                    setEditingWidget({
                      ...editingWidget,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <h4 className="font-medium text-sm">스트립(띠 배너) 설정</h4>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-full-width"
                    checked={editingWidget.settings?.use_full_width ?? true}
                    onCheckedChange={(checked) =>
                      setEditingWidget({
                        ...editingWidget,
                        settings: {
                          ...editingWidget.settings,
                          use_full_width: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor="use-full-width">전체 화면 너비 사용</Label>
                </div>
                <p className="text-xs text-gray-500">
                  체크하면 위젯 컨테이너를 벗어나 전체 화면 너비로 표시됩니다.
                  체크하지 않으면 위젯 컨테이너 안에서만 표시됩니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strip-type">타입 선택</Label>
                <Select
                  value={editingWidget.settings?.strip_type || "image"}
                  onValueChange={(value) =>
                    setEditingWidget({
                      ...editingWidget,
                      settings: {
                        ...editingWidget.settings,
                        strip_type: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">이미지 URL/업로드</SelectItem>
                    <SelectItem value="html">HTML 코드</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingWidget.settings?.strip_type === "image" && (
                <div className="space-y-2">
                  <Label htmlFor="strip-image-url">이미지 URL</Label>
                  <Input
                    id="strip-image-url"
                    value={editingWidget.settings?.strip_value || ""}
                    placeholder="https://example.com/banner.jpg"
                    onChange={(e) =>
                      setEditingWidget({
                        ...editingWidget,
                        settings: {
                          ...editingWidget.settings,
                          strip_value: e.target.value,
                        },
                      })
                    }
                  />
                  <div className="flex items-center mt-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setStripUploading(true);
                        try {
                          const supabase = createClient();
                          const fileName = file.name;
                          const filePath = `strip-banners/${Date.now()}_${fileName}`;
                          const { error: uploadError } = await supabase.storage
                            .from("homepage-banners")
                            .upload(filePath, file, {
                              cacheControl: "3600",
                              upsert: true,
                            });
                          if (uploadError) {
                            throw uploadError;
                          }
                          const { data: publicUrlData } = supabase.storage
                            .from("homepage-banners")
                            .getPublicUrl(filePath);
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              strip_value: publicUrlData.publicUrl,
                            },
                          });
                          toast({
                            title: "이미지 업로드 성공",
                            description:
                              "이미지가 성공적으로 업로드되었습니다.",
                          });
                        } catch (err) {
                          toast({
                            title: "이미지 업로드 실패",
                            description:
                              (err as any).message || "업로드 중 오류 발생",
                            variant: "destructive",
                          });
                        } finally {
                          setStripUploading(false);
                        }
                      }}
                      disabled={stripUploading}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={stripUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="ml-2"
                    >
                      {stripUploading ? "업로드 중..." : "파일 업로드"}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Label htmlFor="strip-image-height">이미지 높이</Label>
                    <select
                      id="strip-image-height"
                      className="border rounded px-2 py-1"
                      value={editingWidget.settings?.strip_height || "original"}
                      onChange={(e) =>
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            strip_height: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="original">원본</option>
                      <option value="48px">48px</option>
                      <option value="64px">64px</option>
                      <option value="80px">80px</option>
                      <option value="120px">120px</option>
                      <option value="160px">160px</option>
                      <option value="240px">240px</option>
                      <option value="320px">320px</option>
                      <option value="100vh">100vh</option>
                      <option value="custom">직접입력</option>
                    </select>
                    {editingWidget.settings?.strip_height === "custom" && (
                      <Input
                        className="w-32 ml-2"
                        placeholder="ex) 200px, 20vh"
                        value={
                          editingWidget.settings?.strip_custom_height || ""
                        }
                        onChange={(e) =>
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              strip_custom_height: e.target.value,
                            },
                          })
                        }
                      />
                    )}
                  </div>
                </div>
              )}

              {editingWidget.settings?.strip_type === "html" && (
                <div className="space-y-2">
                  <Label htmlFor="strip-html">HTML 코드</Label>
                  <textarea
                    id="strip-html"
                    className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={editingWidget.settings?.strip_value || ""}
                    placeholder="<div style='color:red;'>띠 배너 HTML</div>"
                    onChange={(e) =>
                      setEditingWidget({
                        ...editingWidget,
                        settings: {
                          ...editingWidget.settings,
                          strip_value: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              )}

              <Button onClick={handleSave} className="w-full">
                저장
              </Button>
            </div>
          ) : (
            // Programs widget
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="widget-title">제목</Label>
                <Input
                  id="widget-title"
                  value={editingWidget.title}
                  onChange={(e) =>
                    setEditingWidget({
                      ...editingWidget,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <h4 className="font-medium text-sm">프로그램 설정</h4>
              
              <div className="space-y-2">
                <Label htmlFor="program-display-count">표시할 프로그램 개수</Label>
                <Select
                  value={(editingWidget.display_options?.item_count || 6).toString()}
                  onValueChange={(value) =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        item_count: parseInt(value),
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="개수 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3개</SelectItem>
                    <SelectItem value="6">6개</SelectItem>
                    <SelectItem value="9">9개</SelectItem>
                    <SelectItem value="12">12개</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>표시 옵션</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-thumbnail"
                      checked={editingWidget.display_options?.show_thumbnail !== false}
                      onCheckedChange={(checked) =>
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            show_thumbnail: checked === true,
                          },
                        })
                      }
                    />
                    <Label htmlFor="show-thumbnail">썸네일 표시</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-date"
                      checked={editingWidget.display_options?.show_date !== false}
                      onCheckedChange={(checked) =>
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            show_date: checked === true,
                          },
                        })
                      }
                    />
                    <Label htmlFor="show-date">날짜 표시</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-excerpt"
                      checked={editingWidget.display_options?.show_excerpt !== false}
                      onCheckedChange={(checked) =>
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            show_excerpt: checked === true,
                          },
                        })
                      }
                    />
                    <Label htmlFor="show-excerpt">프로그램 설명 표시</Label>
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                저장
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="layout-settings" className="space-y-4 mt-4">
          <CommonWidgetSettings />
          <Button onClick={handleSave} className="w-full">
            저장
          </Button>
        </TabsContent>
      </Tabs>
    );
  }

  // For all other widgets, use tab structure
  return (
    <Tabs defaultValue="widget-settings" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="widget-settings">위젯 설정</TabsTrigger>
        <TabsTrigger value="layout-settings">레이아웃 설정</TabsTrigger>
      </TabsList>
      <TabsContent value="widget-settings" className="space-y-4 mt-4">
        {renderSpecificSettings()}
        <Button onClick={handleSave} className="w-full">
          저장
        </Button>
      </TabsContent>
      <TabsContent value="layout-settings" className="space-y-4 mt-4">
        <CommonWidgetSettings isContainer={widget.type === 'container'} />
        <Button onClick={handleSave} className="w-full">
          저장
        </Button>
      </TabsContent>
    </Tabs>
  );
}