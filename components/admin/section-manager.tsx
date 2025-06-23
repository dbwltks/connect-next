"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit, Trash, Plus } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { supabase } from "@/db";

// 섹션 타입 정의 (단순화)
export type SectionType = string;

export type Category = {
  id: string;
  name: string;
  display_type?: string;
  // 필요하면 추가 필드 작성
};

export type Section = {
  id: string;
  title: string; // 섹션 제목
  name: string; // 섹션 이름 (시스템용)
  description: string; // 섹션 설명
  type: SectionType;
  isActive: boolean;
  content?: string;
  content_type?: "html" | "text" | "image"; // 콘텐츠 타입
  full_width?: boolean; // 전체 폭 사용 여부
  order: number;
  settings?: Record<string, any>;
  // 데이터베이스 관련 필드
  dbTable?: string; // 데이터베이스 테이블 이름
  pageType?: string; // 페이지 타입
  pageId?: string; // 페이지 ID 추가
  category?: Category; // 카테고리 정보 추가
};

// 드래그 가능한 섹션 아이템 컴포넌트
function SortableItem({
  section,
  onToggle,
  onEdit,
  onDelete,
}: {
  section: Section;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div {...attributes} {...listeners} className="cursor-grab">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{section.title}</span>
                <span className="text-xs text-gray-500">{section.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`active-${section.id}`}
                checked={section.isActive}
                onCheckedChange={(checked) => onToggle(section.id, checked)}
              />
              <Label htmlFor={`active-${section.id}`} className="sr-only">
                활성화
              </Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(section.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(section.id)}
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

interface SectionManagerProps {
  pageId?: string;
  templateId?: string;
}

export default function SectionManager({
  pageId,
  templateId,
}: SectionManagerProps) {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // DnD 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 컴포넌트 마운트 시 섹션 로드
  useEffect(() => {
    loadSections();
  }, []);

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // 순서 업데이트
        return newItems.map((item, index) => ({
          ...item,
          order: index,
        }));
      });
    }
  };

  // 섹션 활성화/비활성화 토글
  const handleToggleSection = (id: string, isActive: boolean) => {
    setSections(
      sections.map((section) =>
        section.id === id ? { ...section, isActive } : section
      )
    );
  };

  // 섹션 편집
  const handleEditSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (section) {
      setEditingSection(section);
      setEditingSectionId(id);
      setShowEditDialog(true);
    }
  };

  // 섹션 삭제
  const handleDeleteSection = (id: string) => {
    setSections(sections.filter((section) => section.id !== id));
  };

  // 새 섹션 추가 - 바로 섹션 설정 다이얼로그로 이동
  const handleAddSection = () => {
    const newSection: Section = {
      id: crypto.randomUUID(),
      title: "새 섹션",
      name: "new-section",
      description: "새 섹션에 대한 설명을 입력하세요.",
      type: "custom",
      isActive: true,
      order: sections.length,
      settings: {},
      dbTable: "boards",
      pageType: "board",
    };

    setEditingSection(newSection);
    setShowEditDialog(true);
  };

  // 섹션 저장
  const handleSaveSections = async () => {
    setIsLoading(true);

    try {
      // 기존 섹션 ID 목록 가져오기
      const { data: existingSections } = await supabase
        .from("cms_sections")
        .select("id");

      const existingIds = (existingSections || []).map((s) => s.id);

      // 삭제할 섹션과 추가/업데이트할 섹션 분류
      const currentIds = sections.map((s) => s.id);
      const idsToDelete = existingIds.filter((id) => !currentIds.includes(id));

      // 삭제할 섹션이 있으면 삭제
      if (idsToDelete.length > 0) {
        await supabase.from("cms_sections").delete().in("id", idsToDelete);
      }

      // 섹션 추가 또는 업데이트
      for (const section of sections) {
        // 데이터베이스 로그 확인
        console.log("Saving section:", section);

        // 저장할 데이터 객체 생성
        const sectionData = {
          id: section.id,
          title: section.title,
          name: section.name,
          description: section.description,
          is_active: section.isActive,
          order: section.order,
          settings: section.settings || {},
          db_table: section.dbTable || "",
          page_type: section.pageType || "",
        };

        console.log("Sending data to database:", sectionData);

        const { error } = await supabase
          .from("cms_sections")
          .upsert(sectionData, {
            onConflict: "id",
          });

        if (error) {
          console.error("Error saving section:", error);
          toast({
            title: "오류",
            description: `섹션 저장 중 오류가 발생했습니다: ${error.message}`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        console.log("Section saved successfully");
      }

      toast({
        title: "섹션 저장됨",
        description: "섹션이 성공적으로 저장되었습니다.",
      });

      // 성공적으로 저장한 후 섹션 다시 로드
      await loadSections();
    } catch (error) {
      console.error("섹션 저장 오류:", error);
      toast({
        title: "저장 실패",
        description: "섹션을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 섹션 불러오기
  const loadSections = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("cms_sections")
        .select("*")
        .order("order");

      if (error) throw error;

      if (data && data.length > 0) {
        setSections(
          data.map((item) => ({
            id: item.id,
            title: item.title,
            name: item.name,
            description: item.description,
            type: item.type || "custom",
            isActive: item.is_active,
            content: item.content,
            order: item.order,
            settings: item.settings,
            dbTable: item.db_table,
            pageType: item.page_type,
          }))
        );
      } else {
        // 섹션이 없는 경우 기본 섹션 생성
        const defaultSection: Section = {
          id: crypto.randomUUID(),
          title: "게시판 섹션",
          name: "board-section",
          description: "게시판 내용을 표시하는 섹션입니다.",
          type: "custom",
          isActive: true,
          content: "",
          order: 0,
          settings: {},
          dbTable: "boards",
          pageType: "board",
        };

        setSections([defaultSection]);
      }
    } catch (error) {
      console.error("섹션 로드 오류:", error);
      toast({
        title: "로드 실패",
        description: "섹션을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 섹션 편집 다이얼로그 렌더링
  const renderEditSectionDialog = () => {
    if (!showEditDialog || !editingSection) return null;

    const updateEditingSection = (field: string, value: any) => {
      if (!editingSection) return;
      setEditingSection({
        ...editingSection,
        [field]: value,
      });
    };

    const saveEditingSection = () => {
      if (!editingSection) return;

      setSections((prevSections) => {
        const exists = prevSections.some(
          (section) => section.id === editingSection.id
        );
        if (exists) {
          // 기존 섹션 업데이트
          return prevSections.map((section) =>
            section.id === editingSection.id ? editingSection : section
          );
        } else {
          // 새 섹션 추가
          return [...prevSections, editingSection];
        }
      });

      setShowEditDialog(false);
      setEditingSection(null);
      setEditingSectionId(null);

      toast({
        title: "섹션 업데이트됨",
        description:
          "섹션이 업데이트되었습니다. 변경 사항을 저장하려면 '저장' 버튼을 클릭하세요.",
      });
    };

    return (
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>섹션 설정</DialogTitle>
            <DialogDescription>섹션 정보를 수정하세요.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="section-title">제목</Label>
              <Input
                id="section-title"
                value={editingSection.title}
                onChange={(e) => updateEditingSection("title", e.target.value)}
                placeholder="섹션 제목을 입력하세요"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="section-name">이름 (시스템용)</Label>
              <Input
                id="section-name"
                value={editingSection.name}
                onChange={(e) => updateEditingSection("name", e.target.value)}
                placeholder="섹션 이름을 입력하세요"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="section-description">설명</Label>
              <Input
                id="section-description"
                value={editingSection.description || ""}
                onChange={(e) =>
                  updateEditingSection("description", e.target.value)
                }
                placeholder="섹션에 대한 설명을 입력하세요"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="section-dbTable">데이터베이스 테이블</Label>
              <Select
                value={editingSection.dbTable || ""}
                onValueChange={(value) =>
                  updateEditingSection("dbTable", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="테이블 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pages">
                    Pages (페이지 HTML 코드)
                  </SelectItem>
                  <SelectItem value="boards">Boards</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="sermons">Sermons</SelectItem>
                  <SelectItem value="members">Members</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="section-pageType">화면 타입</Label>
              <Select
                value={editingSection.pageType || ""}
                onValueChange={(value) =>
                  updateEditingSection("pageType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="화면 타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="board">
                    Board (테이블 목록 형식)
                  </SelectItem>
                  <SelectItem value="gallery">
                    Gallery (사진 카드 형식)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditDialog(false)}
            >
              취소
            </Button>
            <Button type="button" onClick={saveEditingSection}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {renderEditSectionDialog()}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>섹션 관리</CardTitle>
              <CardDescription>
                페이지 섹션의 순서와 표시 여부를 관리하세요.
              </CardDescription>
            </div>
            <Button onClick={handleAddSection}>
              <Plus className="h-4 w-4 mr-2" />
              섹션 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-sm text-gray-500">
              아래 섹션을 드래그하여 순서를 변경하거나, 활성화/비활성화하여 표시
              여부를 관리할 수 있습니다.
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <SortableItem
                    key={section.id}
                    section={section}
                    onToggle={handleToggleSection}
                    onEdit={handleEditSection}
                    onDelete={handleDeleteSection}
                  />
                ))}
            </SortableContext>
          </DndContext>

          {sections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>섹션이 없습니다. 새 섹션을 추가해보세요.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveSections} disabled={isLoading}>
            {isLoading ? "저장 중..." : "섹션 저장"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
