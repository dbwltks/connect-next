"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import React from "react";
import Image from "next/image";
import BannerBlock from "@/components/blocks/BannerBlock";

// dnd-kit 라이브러리 import
import { DndContext, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";

// UI 컴포넌트 import
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// lucide-react 아이콘 import
import { 
  ArrowUpDown, 
  BarChart3, 
  Calendar, 
  Clock, 
  Image as ImageIcon, 
  LayoutGrid, 
  MessageSquare, 
  Plus, 
  Settings, 
  Text, 
  Trash2, 
  Users, 
  Youtube 
} from "lucide-react";

// 블록 기본 인터페이스
interface IBlock {
  id: string;
  type: string;  // 'banner', 'media', 'text' 등
  order: number; // 블록 순서
  config: any;   // 블록별 설정
}

// 블록 타입별 설정 인터페이스
interface IBannerBlockConfig {
  selectedBannerIds: string[];
  // 기타 배너 관련 설정
}

interface IMediaBlockConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  pageSource: string;
  itemCount: number;
  sortOrder: string;
  showFeatured: boolean;
  moreButtonText: string;
}

interface ITextBlockConfig {
  title: string;
  content: string;
  textAlign: string;
}

// 블록 관리자 컴포넌트
export default function BlockManager({ pageId = "main" }: { pageId?: string }) {

  
  // 블록 목록 상태
  const [blocks, setBlocks] = useState<IBlock[]>([]);
  // 블록 추가 Dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  // 편집중인 블록 id
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  // 선택된 블록 id
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  
  // 선택된 블록 객체 참조
  const selectedBlock = blocks.find(block => block.id === selectedBlockId) || null;

  // 드래그앤드롭 센서
  const sensors = useSensors(useSensor(PointerSensor));

  // 블록 추가 Dialog 오픈
  const handleAddBlock = (type: string) => {
    const newBlock: IBlock = {
      id: Date.now().toString(),
      type,
      order: blocks.length + 1,
      config: getDefaultConfigForType(type)
    };
    setBlocks([...blocks, newBlock]);
    setShowAddDialog(false);
    setEditingBlockId(newBlock.id); // 추가 후 바로 편집
  };

  // 블록 편집 Dialog 오픈/닫기
  const openEditDialog = (id: string) => setEditingBlockId(id);
  const closeEditDialog = () => setEditingBlockId(null);

  // 블록 편집 저장
  const handleSaveBlockEdit = (updatedBlock: IBlock) => {
    setBlocks(blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b));
    closeEditDialog();
    toast({ title: "저장 완료", description: "블록이 저장되었습니다." });
  };

  // 블록 삭제
  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
    toast({ title: "삭제 완료", description: "블록이 삭제되었습니다." });
  };

  // 드래그앤드롭 리스너
  const dragListeners = {
    ...useSortable({ id: "drag-handle" }).listeners,
  };

  // 드래그앤드롭 완료 핸들러
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((b, idx) => ({ ...b, order: idx + 1 }));
      setBlocks(newBlocks);
    }
  };

  // 블록 타입 정의 등 기존 코드 유지


  // 블록 타입 정의
  const blockTypes = [
    {
      value: "banner",
      label: "배너",
      icon: ImageIcon,
    },
    {
      value: "media",
      label: "미디어",
      icon: Youtube,
    },
    {
      value: "text",
      label: "텍스트",
      icon: Text,
    },
    // 추가 블록 타입들...
  ];

  // 배너 데이터 가져오기
  useEffect(() => {
    async function fetchBanners() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("cms_banners")
          .select("*")
          .eq("is_active", true)
          .is("menu_id", null)
          .order("order_num", { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          // snake_case → camelCase 변환
          setBannerOptions(
            data.map((b: any) => ({
              id: b.id,
              title: b.title,
              subtitle: b.subtitle || "",
              imageUrl: b.image_url,
              hasButton: b.has_button || false,
              buttonText: b.button_text || "",
              buttonUrl: b.button_url || "",
              isActive: b.is_active,
              fullWidth: b.full_width || false,
              html_content: b.html_content || "",
              use_html: b.use_html || false,
            }))
          );
        }
      } catch (error) {
        console.error("배너 데이터 가져오기 오류:", error);
      }
    }

    fetchBanners();
  }, []);

  // 블록 데이터 가져오기
  useEffect(() => {
    fetchBlocks();
  }, [pageId]);

  // 블록 데이터 불러오기 함수
  const fetchBlocks = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cms_page_blocks")
        .select("*")
        .eq("page_id", pageId)
        .order("order_num", { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setBlocks(data.map(item => ({
          id: item.id,
          type: item.type,
          order: item.order_num,
          config: item.config
        })));
      } else {
        // 기본 블록 설정 (데이터가 없을 경우)
        setBlocks([
          { 
            id: '1', 
            type: 'banner', 
            order: 1, 
            config: { 
              selectedBannerIds: bannerOptions.length > 0 ? [bannerOptions[0].id] : [] 
            } 
          },
          { 
            id: '2', 
            type: 'media', 
            order: 2, 
            config: { 
              sectionTitle: '최신 미디어',
              sectionSubtitle: '다양한 미디어를 만나보세요',
              pageSource: 'sermon',
              itemCount: 5,
              sortOrder: 'latest',
              showFeatured: true,
              moreButtonText: '더 많은 미디어 보기'
            } 
          },
        ]);
      }
    } catch (error) {
      console.error('블록 불러오기 중 오류:', error);
      toast({
        title: "데이터 로딩 실패",
        description: "블록 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 블록 타입별 기본 설정 가져오기
  const getDefaultConfigForType = (type: string) => {
    switch (type) {
      case 'banner':
        return { 
          selectedBannerIds: bannerOptions.length > 0 ? [bannerOptions[0].id] : [] 
        };
      case 'media':
        return { 
          sectionTitle: '최신 미디어',
          sectionSubtitle: '다양한 미디어를 만나보세요',
          pageSource: 'sermon',
          itemCount: 5,
          sortOrder: 'latest',
          showFeatured: true,
          moreButtonText: '더 많은 미디어 보기'
        };
      case 'text':
        return {
          title: '섹션 제목',
          content: '여기에 내용을 입력하세요',
          textAlign: 'left'
        };
      default:
        return {};
    }
  };

  // 블록 추가 함수
  const addBlock = (type: string) => {
    const newBlock: IBlock = {
      id: Date.now().toString(),
      type,
      order: blocks.length + 1,
      config: getDefaultConfigForType(type)
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  // 이전 removeBlock 함수는 상단에 통합되었습니다

  // 블록 순서 변경 함수
  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(block => block.id === id);
    if (index === -1) return;
    
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      
      // 순서 업데이트
      const updatedBlocks = newBlocks.map((block, idx) => ({
        ...block,
        order: idx + 1
      }));
      
      setBlocks(updatedBlocks);
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      
      // 순서 업데이트
      const updatedBlocks = newBlocks.map((block, idx) => ({
        ...block,
        order: idx + 1
      }));
      
      setBlocks(updatedBlocks);
    }
  };

  // 블록 설정 업데이트 함수
  const updateBlockConfig = (id: string, config: any) => {
    setBlocks(blocks.map(block => 
      block.id === id 
        ? { ...block, config: { ...block.config, ...config } } 
        : block
    ));
  };

  // 변경사항 저장 함수
  const saveBlocks = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // 기존 블록 삭제
      await supabase
        .from('cms_page_blocks')
        .delete()
        .eq('page_id', pageId);
      
      // 새 블록 추가
      const { error } = await supabase
        .from('cms_page_blocks')
        .upsert(
          blocks.map(block => ({
            id: block.id,
            page_id: pageId,
            type: block.type,
            order_num: block.order,
            config: block.config
          }))
        );
        
      if (error) throw error;
      
      toast({
        title: "저장 완료",
        description: "페이지 블록이 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error('블록 저장 중 오류:', error);
      toast({
        title: "저장 실패",
        description: "페이지 블록 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 블록 렌더러 컴포넌트
  const BlockRenderer = ({ block }: { block: IBlock }) => {
    switch (block.type) {
      case 'banner': {
        const config = block.config as IBannerBlockConfig;
        const selectedBanners = bannerOptions.filter(b => 
          config.selectedBannerIds?.includes(b.id)
        );
        
        if (selectedBanners.length === 0) {
          return (
            <div className="flex items-center justify-center h-40 w-full bg-gray-100 rounded-lg">
              <span className="text-gray-400">선택된 배너가 없습니다</span>
            </div>
          );
        }
        
        return (
          <div className="w-full overflow-hidden rounded-lg">
            <BannerBlock banners={selectedBanners} mode="preview" />
          </div>
        );
      }
      case 'media':
        return (
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-bold">{block.config.sectionTitle}</h3>
            <p className="text-sm text-gray-500">{block.config.sectionSubtitle}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[...Array(Math.min(block.config.itemCount, 4))].map((_, i) => (
                <div key={i} className="bg-gray-200 h-24 rounded-md flex items-center justify-center">
                  <Youtube className="w-8 h-8 text-gray-400" />
                </div>
              ))}
            </div>
            <div className="mt-2 text-right">
              <span className="text-sm text-blue-500">{block.config.moreButtonText}</span>
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-bold">{block.config.title}</h3>
            <div className={`mt-2 text-${block.config.textAlign}`}>
              {block.config.content}
            </div>
          </div>
        );
      default:
        return <div>지원되지 않는 블록 타입</div>;
    }
  };

  // 블록 에디터 컴포넌트
  const BlockEditor = ({ block, onSave, onCancel }: { block: IBlock, onSave?: (block: IBlock) => void, onCancel?: () => void }) => {
    if (!block) return null;
    
    switch (block.type) {
      case 'banner':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">배너 블록 설정</h3>
            <div>
              <Label>배너 선택</Label>
              <div className="mt-2 space-y-2">
                {bannerOptions.map(banner => (
                  <div key={banner.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`banner-${banner.id}`}
                      checked={(block.config.selectedBannerIds || []).includes(banner.id)}
                      onCheckedChange={(checked) => {
                        const currentIds = block.config.selectedBannerIds || [];
                        let newIds;
                        
                        if (checked) {
                          newIds = [...currentIds, banner.id];
                        } else {
                          newIds = currentIds.filter((id: string) => id !== banner.id);
                        }
                        
                        updateBlockConfig(block.id, {
                          selectedBannerIds: newIds
                        });
                      }}
                    />
                    <Label htmlFor={`banner-${banner.id}`} className="cursor-pointer">
                      {banner.title}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'media':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">미디어 블록 설정</h3>
            <div>
              <Label htmlFor="sectionTitle">섹션 제목</Label>
              <Input
                id="sectionTitle"
                value={block.config.sectionTitle || "최신 미디어"}
                onChange={(e) => updateBlockConfig(block.id, {
                  sectionTitle: e.target.value
                })}
              />
            </div>
            <div>
              <Label htmlFor="sectionSubtitle">섹션 부제목</Label>
              <Input
                id="sectionSubtitle"
                value={block.config.sectionSubtitle || "다양한 미디어를 만나보세요"}
                onChange={(e) => updateBlockConfig(block.id, {
                  sectionSubtitle: e.target.value
                })}
              />
            </div>
            <div>
              <Label htmlFor="pageSource">페이지 소스</Label>
              <Select
                value={block.config.pageSource || "sermon"}
                onValueChange={(value) => updateBlockConfig(block.id, {
                  pageSource: value
                })}
              >
                <SelectTrigger id="pageSource">
                  <SelectValue placeholder="페이지 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sermon">설교 영상</SelectItem>
                  <SelectItem value="worship">찬양 영상</SelectItem>
                  <SelectItem value="event">교회 행사</SelectItem>
                  <SelectItem value="news">교회 소식</SelectItem>
                  <SelectItem value="testimony">간증</SelectItem>
                  <SelectItem value="gallery">갤러리</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="itemCount">표시할 항목 수</Label>
              <Select
                value={String(block.config.itemCount || "5")}
                onValueChange={(value) => updateBlockConfig(block.id, {
                  itemCount: parseInt(value)
                })}
              >
                <SelectTrigger id="itemCount">
                  <SelectValue placeholder="표시할 항목 수" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3개</SelectItem>
                  <SelectItem value="5">5개</SelectItem>
                  <SelectItem value="8">8개</SelectItem>
                  <SelectItem value="10">10개</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortOrder">정렬 방식</Label>
              <Select
                value={block.config.sortOrder || "latest"}
                onValueChange={(value) => updateBlockConfig(block.id, {
                  sortOrder: value
                })}
              >
                <SelectTrigger id="sortOrder">
                  <SelectValue placeholder="정렬 방식" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="popular">인기순</SelectItem>
                  <SelectItem value="featured">주요 콘텐츠 우선</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showFeatured"
                checked={block.config.showFeatured !== false}
                onCheckedChange={(checked) => updateBlockConfig(block.id, {
                  showFeatured: checked === true
                })}
              />
              <Label htmlFor="showFeatured" className="cursor-pointer">
                주요 콘텐츠 표시하기
              </Label>
            </div>
            <div>
              <Label htmlFor="moreButtonText">더보기 버튼 텍스트</Label>
              <Input
                id="moreButtonText"
                value={block.config.moreButtonText || "더 많은 미디어 보기"}
                onChange={(e) => updateBlockConfig(block.id, {
                  moreButtonText: e.target.value
                })}
              />
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">텍스트 블록 설정</h3>
            <div>
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={block.config.title || ""}
                onChange={(e) => updateBlockConfig(block.id, {
                  title: e.target.value
                })}
              />
            </div>
            <div>
              <Label htmlFor="content">내용</Label>
              <textarea
                id="content"
                className="w-full min-h-[100px] p-2 border rounded-md"
                value={block.config.content || ""}
                onChange={(e) => updateBlockConfig(block.id, {
                  content: e.target.value
                })}
              />
            </div>
            <div>
              <Label htmlFor="textAlign">텍스트 정렬</Label>
              <Select
                value={block.config.textAlign || "left"}
                onValueChange={(value) => updateBlockConfig(block.id, {
                  textAlign: value
                })}
              >
                <SelectTrigger id="textAlign">
                  <SelectValue placeholder="텍스트 정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">왼쪽</SelectItem>
                  <SelectItem value="center">가운데</SelectItem>
                  <SelectItem value="right">오른쪽</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      default:
        return <div>지원되지 않는 블록 타입</div>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">페이지 블록 관리</h1>
        <Button onClick={saveBlocks} disabled={isLoading}>
          {isLoading ? "저장 중..." : "변경사항 저장"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 블록 목록 */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>블록 목록</CardTitle>
              <CardDescription>
                블록을 추가하고 순서를 변경할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className={`p-3 border rounded-lg flex items-center justify-between ${
                      selectedBlockId === block.id ? "border-blue-500 bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const BlockIcon = blockTypes.find(t => t.value === block.type)?.icon || Settings;
                        return <BlockIcon className="w-5 h-5" />;
                      })()}
                      <span>{blockTypes.find(t => t.value === block.type)?.label || block.type}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveBlock(block.id, 'up')}
                        disabled={block.order === 1}
                      >
                        <ArrowUpDown className="w-4 h-4 rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveBlock(block.id, 'down')}
                        disabled={block.order === blocks.length}
                      >
                        <ArrowUpDown className="w-4 h-4 rotate-270" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedBlockId(block.id)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBlock(block.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        블록 추가
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>블록 추가</DialogTitle>
                        <DialogDescription>
                          추가할 블록 유형을 선택하세요.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        {blockTypes.map((type) => (
                          <Button
                            key={type.value}
                            variant="outline"
                            className="h-20 flex flex-col items-center justify-center"
                            onClick={() => {
                              addBlock(type.value);
                              document.querySelector("[data-state='open'] button[data-state='closed']")?.click();
                            }}
                          >
                            <type.icon className="w-6 h-6 mb-1" />
                            <span>{type.label}</span>
                          </Button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 블록 편집 및 미리보기 */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedBlock
                  ? `${blockTypes.find(t => t.value === selectedBlock.type)?.label || selectedBlock.type} 블록 편집`
                  : "블록 편집"}
              </CardTitle>
              <CardDescription>
                {selectedBlock
                  ? "블록 설정을 변경하여 커스터마이징하세요."
                  : "왼쪽에서 블록을 선택하여 편집하세요."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedBlock ? (
                <div className="space-y-6">
  {selectedBlock ? <BlockEditor block={selectedBlock} onSave={handleSaveBlockEdit} onCancel={closeEditDialog} /> : <div className="flex items-center justify-center h-40 text-gray-400">
                  왼쪽에서 블록을 선택하여 편집하세요.
                </div>}
</div>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400">
                  왼쪽에서 블록을 선택하여 편집하세요.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 전체 페이지 미리보기 + 블록 관리 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>전체 페이지 미리보기</CardTitle>
          <CardDescription>
            드래그앤드롭으로 블록 순서 변경, 블록 위에 마우스 올리면 편집/삭제/드래그 가능. 블록 추가는 하단 버튼 이용.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.id)}>
              <div className="space-y-6">
                {blocks.length > 0 ? (
                  blocks
                    .sort((a, b) => a.order - b.order)
                    .map((block, idx) => (
                      <SortableBlockCard
                        key={block.id}
                        block={block}
                        index={idx}
                        onEdit={() => openEditDialog(block.id)}
                        onDelete={() => removeBlock(block.id)}
                        listeners={dragListeners}
                      >
                        <BlockRenderer block={block} />
                      </SortableBlockCard>
                    ))
                ) : (
                  <div className="flex items-center justify-center h-40 text-gray-400">
                    블록이 없습니다. 블록을 추가하여 페이지를 구성하세요.
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
          {/* 블록 추가 버튼 */}
          <div className="mt-8 flex justify-center">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">
                  <Plus className="w-5 h-5 mr-2" /> 블록 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>블록 추가</DialogTitle>
                  <DialogDescription>추가할 블록 유형을 선택하세요.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  {blockTypes.map((type) => (
                    <Button
                      key={type.value}
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center"
                      onClick={() => handleAddBlock(type.value)}
                    >
                      <type.icon className="w-6 h-6 mb-1" />
                      <span>{type.label}</span>
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {/* 블록 편집 Dialog */}
          <Dialog open={!!editingBlockId} onOpenChange={closeEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>블록 편집</DialogTitle>
                <DialogDescription>블록 설정을 변경하세요.</DialogDescription>
              </DialogHeader>
              {editingBlockId && (
                <BlockEditor block={blocks.find(b => b.id === editingBlockId)!} onSave={handleSaveBlockEdit} onCancel={closeEditDialog} />
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

// 드래그앤드롭용 SortableBlockCard, dragListeners, handleDragEnd 등은 파일 상단에 추가 구현 필요
