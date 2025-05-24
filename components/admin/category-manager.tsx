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
import { Textarea } from "@/components/ui/textarea";
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
import { Section } from "./section-manager";

// 카테고리 타입 정의
export type Category = {
  id: string;
  title: string; // 카테고리 제목
  name: string; // 카테고리 이름 (시스템용)
  description: string; // 카테고리 설명
  sectionId: string | null; // 상위 섹션 ID (uuid 또는 null)
  displayType?: string; // 디스플레이 타입 ('list' | 'board')
  isActive: boolean;
  order: number;
  settings?: Record<string, any>;
};

// 드래그 가능한 카테고리 아이템 컴포넌트
function SortableItem({
  category,
  onToggle,
  onEdit,
  onDelete,
}: {
  category: Category;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category.id });

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
              <span className="font-medium">{category.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={category.isActive}
                onCheckedChange={(checked) => onToggle(category.id, checked)}
                id={`active-${category.id}`}
              />
              <Label htmlFor={`active-${category.id}`} className="sr-only">
                활성화
              </Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(category.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(category.id)}
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

interface CategoryManagerProps {
  pageId?: string;
  templateId?: string;
}

export default function CategoryManager({
  pageId,
  templateId,
}: CategoryManagerProps) {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);

  // 데이터 로드 함수
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("cms_categories")
        .select("*")
        .order("order", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setCategories(
          data.map((item: any) => ({
            id: item.id,
            title: item.title,
            name: item.name,
            description: item.description,
            sectionId: item.section_id,
            displayType: item.display_type || "list",
            isActive: item.is_active,
            order: item.order,
            settings: item.settings || {},
          }))
        );
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "오류",
        description: "카테고리를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from("cms_sections")
        .select("*")
        .order("order", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setSections(
          data.map((item) => ({
            id: item.id,
            title: item.title,
            name: item.name,
            description: item.description,
            type: item.type || "custom",
            isActive: item.is_active !== undefined ? item.is_active : true,
            order: item.order !== undefined ? item.order : 0,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading sections:", error);
    }
  };

  // DnD 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 컴포넌트 마운트 시 카테고리 로드
  useEffect(() => {
    loadSections();
    loadCategories();
  }, []);

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
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

  // 카테고리 활성화/비활성화 토글
  const handleToggleCategory = (id: string, isActive: boolean) => {
    setCategories(
      categories.map((category) =>
        category.id === id ? { ...category, isActive } : category
      )
    );
  };

  // 카테고리 편집
  const handleEditCategory = (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (category) {
      setEditingCategoryId(id);
      setEditingCategory({ ...category });
      setShowEditDialog(true);
    }
  };

  // 카테고리 삭제
  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((category) => category.id !== id));
  };

  // 새 카테고리 추가 - 바로 카테고리 설정 다이얼로그로 이동
  const handleAddCategory = () => {
    const id = crypto.randomUUID();
    const newCategory: Category = {
      id,
      title: "새 카테고리",
      name: `category-${id.substring(0, 8)}`,
      description: "",
      sectionId: null,
      displayType: "list",
      isActive: true,
      order: categories.length,
      settings: {},
    };

    setEditingCategoryId(newCategory.id);
    setEditingCategory(newCategory);
    setShowEditDialog(true);
  };

  // 카테고리 저장
  const handleSaveCategories = async () => {
    setIsLoading(true);
    try {
      // 1. 기존 카테고리 id 목록 조회
      const { data: existingCategories } = await supabase
        .from("cms_categories")
        .select("id");
      const existingIds = (existingCategories || []).map((c) => c.id);

      // 2. 삭제/업데이트/추가 분리
      const currentIds = categories.map((c) => c.id);
      const idsToDelete = existingIds.filter((id) => !currentIds.includes(id));

      // 3. 삭제
      if (idsToDelete.length > 0) {
        await supabase.from("cms_categories").delete().in("id", idsToDelete);
      }

      // 4. 추가/업데이트 (upsert)
      for (const category of categories) {
        const safeSectionId =
          category.sectionId && category.sectionId.length === 36
            ? category.sectionId
            : null;
        const { error: upsertError } = await supabase
          .from("cms_categories")
          .upsert(
            {
              id: category.id,
              title: category.title,
              name: category.name,
              description: category.description,
              section_id: safeSectionId, // null or uuid
              display_type: category.displayType,
              is_active: category.isActive,
              order: category.order,
              settings: category.settings || {},
            },
            {
              onConflict: "id",
            }
          );

        if (upsertError) {
          console.error("Error saving category:", upsertError);
          toast({
            title: "오류",
            description: `카테고리 저장 중 오류가 발생했습니다: ${upsertError.message}`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      toast({
        title: "성공",
        description: "카테고리가 저장되었습니다.",
      });

      // 카테고리 다시 로드
      await loadCategories();
    } catch (error) {
      console.error("Error saving categories:", error);
      toast({
        title: "오류",
        description: "카테고리 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>카테고리 관리</CardTitle>
              <CardDescription>
                섹션의 하위 카테고리를 관리하세요.
              </CardDescription>
            </div>
            <Button onClick={handleAddCategory}>
              <Plus className="h-4 w-4 mr-2" />
              카테고리 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-sm text-gray-500">
              아래 카테고리를 드래그하여 순서를 변경하거나, 활성화/비활성화하여
              표시 여부를 관리할 수 있습니다.
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {categories
                .sort((a, b) => a.order - b.order)
                .map((category) => (
                  <SortableItem
                    key={category.id}
                    category={category}
                    onToggle={handleToggleCategory}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                  />
                ))}
            </SortableContext>
          </DndContext>

          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>카테고리가 없습니다. 새 카테고리를 추가해보세요.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveCategories} disabled={isLoading}>
            {isLoading ? "저장 중..." : "카테고리 저장"}
          </Button>
        </CardFooter>
      </Card>

      {/* 카테고리 추가/수정 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategoryId ? "카테고리 편집" : "카테고리 추가"}
            </DialogTitle>
            <DialogDescription>카테고리 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-2">
              <Label htmlFor="category-title" className="">
                제목
              </Label>
              <Input
                id="category-title"
                className="mb-3"
                value={editingCategory.title}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    title: e.target.value,
                  })
                }
                placeholder="카테고리명을 입력하세요"
              />
              <Label htmlFor="category-name" className="mb-1">
                이름(시스템용)
              </Label>
              <Input
                id="category-name"
                className="mb-3"
                value={editingCategory.name}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    name: e.target.value,
                  })
                }
                placeholder="예: education, worship, intro 등"
              />
              <Label htmlFor="category-description" className="mb-1">
                설명
              </Label>
              <Input
                id="category-description"
                className="mb-3"
                value={editingCategory.description}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    description: e.target.value,
                  })
                }
                placeholder="카테고리 설명"
              />
              <Label htmlFor="category-displayType" className="mb-1">
                디스플레이 타입
              </Label>
              <Select
                value={editingCategory.displayType || "list"}
                onValueChange={(value) =>
                  setEditingCategory({ ...editingCategory, displayType: value })
                }
              >
                <SelectTrigger id="category-displayType" className="mb-3">
                  <SelectValue placeholder="디스플레이 타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="board">게시판</SelectItem>
                  <SelectItem value="media">미디어</SelectItem>
                  <SelectItem value="content">컨텐츠</SelectItem>
                  <SelectItem value="calendar">캘린더</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="category-section" className="mb-1">
                섹션
              </Label>
              <Select
                value={editingCategory.sectionId ?? undefined}
                onValueChange={(value) =>
                  setEditingCategory({ ...editingCategory, sectionId: value })
                }
              >
                <SelectTrigger id="category-section" className="mb-3">
                  <SelectValue placeholder="섹션 선택" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Switch
                checked={editingCategory.isActive}
                onCheckedChange={(checked) =>
                  setEditingCategory({ ...editingCategory, isActive: checked })
                }
                id="category-active"
              />
              <Label htmlFor="category-active">활성화</Label>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditDialog(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!editingCategory) return;
                // id가 없거나 빈 문자열이거나 잘못된 경우 uuid 생성
                let validId =
                  editingCategory.id && editingCategory.id.length === 36
                    ? editingCategory.id
                    : crypto.randomUUID();
                if (!validId || validId === "") validId = crypto.randomUUID();
                const newCategory = { ...editingCategory, id: validId };
                setCategories((prev) => {
                  const exists = prev.some((c) => c.id === newCategory.id);
                  if (exists) {
                    return prev.map((c) =>
                      c.id === newCategory.id ? newCategory : c
                    );
                  } else {
                    return [...prev, newCategory];
                  }
                });
                setShowEditDialog(false);
                setEditingCategory(null);
                setEditingCategoryId(null);
              }}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
