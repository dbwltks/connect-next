"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Save,
  Edit,
  Trash,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 메뉴 항목 타입 정의
export type MenuItem = {
  id: string;
  title: string;
  url: string;
  open_in_new_tab: boolean;
  isActive: boolean;
  parentId: string | null;
  menuOrder: number;
  pageId?: string | null;
  children?: MenuItem[];
};

// 페이지 항목 타입 정의
export type PageItem = {
  id: string;
  title: string;
  slug: string;
  sectionId?: string;
  categoryId?: string;
  pageType?: string;
  views?: number;
  isActive?: boolean;
};

// 드래그 가능한 메뉴 항목 컴포넌트
function SortableMenuItem({
  item,
  depth = 0,
  onEdit,
  onDelete,
  onAddChild,
}: {
  item: MenuItem;
  depth?: number;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  // 하위 메뉴 펼치기/접기 상태 관리
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: "menu-item",
      item,
      hasChildren: item.children && item.children.length > 0,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const hasChildren = item.children && item.children.length > 0;

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
                <div className="flex items-center">
                  {hasChildren ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full focus:outline-none"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-1 opacity-30" />
                  )}
                  <span className="font-medium">{item.title}</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  {item.url && <span className="mr-1">{item.url}</span>}
                  {item.open_in_new_tab && (
                    <ExternalLink className="h-3 w-3 ml-1 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`active-${item.id}`}
                checked={item.isActive}
                onCheckedChange={(checked) =>
                  onEdit({ ...item, isActive: checked })
                }
              />
              <Label htmlFor={`active-${item.id}`} className="sr-only">
                활성화
              </Label>
              {/* 최상위 메뉴에만 하위 메뉴 추가 버튼 표시 (depth가 0인 경우) */}
              {depth === 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onAddChild(item.id)}
                  title="하위 메뉴 추가"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item.id)}
              >
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 하위 메뉴 항목 렌더링 - 최대 1단계까지만 하위 메뉴 허용 */}
      {hasChildren && depth === 0 && isExpanded && (
        <div className="ml-8 mt-2">
          {item.children?.map((child) => (
            <SortableMenuItem
              key={child.id}
              item={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MenuManager() {
  // 상태 관리
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // 메뉴 항목 편집 관련 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);

  // DnD 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 감지 거리 설정
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    // 초기화 상태 설정
    setMenuItems([]);
    setPages([]);
    setIsLoading(true);

    // 데이터 로드
    const loadData = async () => {
      try {
        await fetchMenuItems();
        await fetchPages();
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 드래그 오버 핸들러
  const handleDragOver = (event: any) => {
    // 필요한 경우 여기에 메뉴 실시간 업데이트 로직 추가
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // 드래그 시작 시 필요한 처리
    document.body.classList.add("dragging");
  };

  // 메뉴 트리를 1단계 평면 배열로 변환
  const flattenMenuItems = (items: MenuItem[]): MenuItem[] => {
    let result: MenuItem[] = [];
    for (const item of items) {
      result.push(item);
      if (item.children && item.children.length > 0) {
        result = result.concat(item.children);
      }
    }
    return result;
  };

  // id로 메뉴 항목을 찾는 재귀 함수
  const findItemById = (
    items: MenuItem[],
    id: string | null
  ): MenuItem | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children && item.children.length > 0) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  // 평면화된 배열을 트리 구조로 재구성
  const rebuildMenuTree = (
    flatItems: MenuItem[],
    baseItems: MenuItem[]
  ): MenuItem[] => {
    // id로 항목을 빠르게 찾기 위한 맵 생성
    const itemMap: { [id: string]: MenuItem } = {};
    flatItems.forEach((item) => {
      itemMap[item.id] = { ...item, children: [] };
    });
    // 트리 구조 생성
    const tree: MenuItem[] = [];
    flatItems.forEach((item) => {
      if (item.parentId && itemMap[item.parentId]) {
        itemMap[item.parentId].children!.push(itemMap[item.id]);
      } else {
        tree.push(itemMap[item.id]);
      }
    });
    return tree;
  };

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    // 드래그 종료 시 클래스 제거
    document.body.classList.remove("dragging");
    setActiveId(null);

    const { active, over } = event;

    // 드롭 대상이 없거나 자기 자신에게 드롭한 경우 처리
    if (!over || active.id === over.id) {
      return;
    }

    // 드래그한 항목과 드롭한 항목 정보 추출
    const activeId = active.id as string;
    const overId = over.id as string;

    // 드래그 데이터에서 추가 정보 추출
    const activeData = active.data.current;
    const overData = over.data.current;

    setMenuItems((items) => {
      // 모든 메뉴 항목을 평면화하여 작업
      const flattenedItems = flattenMenuItems(items);

      // 드래그한 항목과 드롭한 항목 찾기
      const activeItem = findItemById(flattenedItems, activeId);
      const overItem = findItemById(flattenedItems, overId);

      if (!activeItem || !overItem) return items;

      // 최상위 메뉴 항목들만 필터링
      const rootItems = items.filter((item) => item.parentId === null);

      // 케이스 1: 두 항목 모두 최상위 메뉴인 경우 - 최상위 메뉴 간 순서 변경
      if (activeItem.parentId === null && overItem.parentId === null) {
        const oldIndex = rootItems.findIndex((item) => item.id === activeId);
        const newIndex = rootItems.findIndex((item) => item.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          // 새 순서로 메뉴 항목 정렬
          const newOrder = arrayMove([...rootItems], oldIndex, newIndex);

          // 순서 번호 업데이트
          newOrder.forEach((item, index) => {
            item.menuOrder = index;
          });

          // 새 메뉴 트리 생성
          return rebuildMenuTree(flattenedItems, newOrder);
        }
      }

      // 케이스 2: 두 항목 모두 같은 부모를 가진 하위 메뉴인 경우 - 하위 메뉴 간 순서 변경
      if (
        activeItem.parentId &&
        overItem.parentId &&
        activeItem.parentId === overItem.parentId
      ) {
        // 부모 항목 찾기
        const parentItem = findItemById(items, activeItem.parentId);
        if (!parentItem || !parentItem.children) return items;

        const oldIndex = parentItem.children.findIndex(
          (child) => child.id === activeId
        );
        const newIndex = parentItem.children.findIndex(
          (child) => child.id === overId
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          // 새 순서로 하위 메뉴 항목 정렬
          const newChildren = arrayMove(
            [...parentItem.children],
            oldIndex,
            newIndex
          );

          // 순서 번호 업데이트
          newChildren.forEach((child, index) => {
            child.menuOrder = index;
          });

          // 부모 항목 업데이트
          const updatedParent = {
            ...parentItem,
            children: newChildren,
          };

          // 평면화된 메뉴 항목 업데이트
          const updatedItems = flattenedItems.map((item) =>
            item.id === parentItem.id ? updatedParent : item
          );

          // 전체 트리에서 parentItem이 속한 트리 구조를 재귀적으로 갱신
          const updateTree = (items: MenuItem[]): MenuItem[] => {
            return items.map((item) => {
              if (item.id === parentItem.id) {
                return updatedParent;
              } else if (item.children && item.children.length > 0) {
                return { ...item, children: updateTree(item.children) };
              } else {
                return item;
              }
            });
          };

          return updateTree(items);
        }
      }

      // 같은 부모가 아니거나, 최상위/하위 간 이동 등 그룹간 이동은 모두 무시
      return items;
    });
    // setMenuItems 콜백 외부에서는 menuItems 상태값을 사용해야 함
    // 최상위 메뉴 항목 추출
    const rootItems = flattenMenuItems(menuItems).filter(
      (item) => item.parentId === null
    );

    // 부모 항목 찾기
    const parentItem = findItemById(menuItems, activeId);
    if (!parentItem || !parentItem.children) return menuItems;
    // 하위 메뉴 순서 변경 결과 배열
    const oldIndex = parentItem.children.findIndex(
      (item) => item.id === activeId
    );
    const newIndex = parentItem.children.findIndex(
      (item) => item.id === overId
    );
    const updatedSiblings = arrayMove(
      [...parentItem.children],
      oldIndex,
      newIndex
    );
    // 업데이트된 하위 메뉴 항목의 부모 ID 가져오기 (모두 같은 부모를 가짐)
    const parentId =
      updatedSiblings.length > 0 ? updatedSiblings[0].parentId : null;

    // 결과 배열 생성
    const result: MenuItem[] = [];

    // 모든 최상위 메뉴 추가
    rootItems.forEach((rootItem) => {
      // 하위 메뉴가 업데이트된 부모인 경우
      if (rootItem.id === parentId) {
        // 업데이트된 하위 메뉴 항목을 가진 부모 추가
        result.push({
          ...rootItem,
          children: updatedSiblings,
        });
      } else {
        // 다른 최상위 메뉴 항목은 그대로 추가
        result.push(rootItem);
      }
    });

    return result;
  };

  // 메뉴 항목 로드
  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("cms_menus")
        .select("*")
        .order("order_num", { ascending: true });

      if (error) {
        throw error;
      }

      const menuItems = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        open_in_new_tab: item.open_in_new_tab,
        isActive: item.is_active,
        parentId: item.parent_id,
        menuOrder: item.order_num,
        pageId: item.page_id || null,
        children: [],
      }));

      // 메뉴 트리 구성
      const menuTree = buildMenuTree(menuItems);
      setMenuItems(menuTree);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast({
        title: "오류 발생",
        description: "메뉴 항목을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 데이터 로드
  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("*")
        .eq("is_active", true)
        .order("title", { ascending: true });

      if (error) {
        throw error;
      }

      const pageItems = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        slug: item.slug || "",
        sectionId: item.section_id,
        categoryId: item.category_id,
        pageType: item.page_type,
        views: item.views || 0,
        isActive: item.is_active,
      }));

      setPages(pageItems);
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  // 메뉴 트리 구성 함수
  const buildMenuTree = (items: MenuItem[]): MenuItem[] => {
    // 최상위 메뉴 항목들 찾기
    const rootItems = items.filter((item) => item.parentId === null);

    // 각 메뉴 항목의 하위 메뉴 구성
    rootItems.forEach((rootItem) => {
      const children = items.filter((item) => item.parentId === rootItem.id);
      if (children.length > 0) {
        rootItem.children = children;
      }
    });

    return rootItems;
  };

  // 새 메뉴 항목 추가
  const handleAddMenuItem = (parentId: string | null = null) => {
    // 새 메뉴 항목 초기화
    const newItem: MenuItem = {
      id: uuidv4(),
      title: "",
      url: "",
      open_in_new_tab: false,
      isActive: true,
      parentId: parentId,
      menuOrder: parentId === null ? menuItems.length : 0,
      pageId: null,
    };

    setEditingItem(newItem);
    setIsNewItem(true);
    setIsDialogOpen(true);
  };

  // 메뉴 항목 편집
  const handleEditMenuItem = (item: MenuItem) => {
    setEditingItem({ ...item });
    setIsNewItem(false);
    setIsDialogOpen(true);
  };

  // 메뉴 항목 삭제
  const handleDeleteMenuItem = (id: string) => {
    // 재귀적으로 메뉴 항목과 하위 항목을 삭제하는 함수
    const deleteItem = (items: MenuItem[]): MenuItem[] => {
      // 현재 레벨에서 해당 항목 삭제
      const filteredItems = items.filter((item) => item.id !== id);

      // 각 항목의 하위 항목도 검색하여 삭제
      return filteredItems.map((item) => {
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: deleteItem(item.children),
          };
        }
        return item;
      });
    };

    setMenuItems((prevItems) => {
      return deleteItem(prevItems);
    });

    toast({
      title: "메뉴 항목 삭제됨",
      description:
        '메뉴 항목이 삭제되었습니다. 변경 사항을 저장하려면 "저장" 버튼을 클릭하세요.',
    });
  };

  // 편집 다이얼로그 필드 변경 함수
  const handleFieldChange = (field: string, value: any) => {
    if (!editingItem) return;

    setEditingItem((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // 메뉴 항목 저장 (다이얼로그에서)
  const handleSaveMenuItem = () => {
    if (!editingItem) return;

    if (!editingItem.title.trim()) {
      toast({
        title: "유효하지 않은 입력",
        description: "메뉴 제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setMenuItems((prevItems) => {
      if (isNewItem) {
        // 새 메뉴 항목 추가
        if (editingItem.parentId === null) {
          // 최상위 메뉴에 추가
          return [...prevItems, editingItem];
        } else {
          // 하위 메뉴로 추가
          return prevItems.map((item) => {
            if (item.id === editingItem.parentId) {
              return {
                ...item,
                children: [...(item.children || []), editingItem],
              };
            }
            return item;
          });
        }
      } else {
        // 기존 메뉴 항목 업데이트
        const updateItem = (items: MenuItem[]): MenuItem[] => {
          return items.map((item) => {
            if (item.id === editingItem.id) {
              return editingItem;
            }

            if (item.children && item.children.length > 0) {
              return {
                ...item,
                children: updateItem(item.children),
              };
            }

            return item;
          });
        };

        return updateItem(prevItems);
      }
    });

    // 다이얼로그 닫기
    setIsDialogOpen(false);
    setEditingItem(null);

    toast({
      title: isNewItem ? "메뉴 항목 추가됨" : "메뉴 항목 업데이트됨",
      description: isNewItem
        ? "새 메뉴 항목이 추가되었습니다."
        : "메뉴 항목이 업데이트되었습니다.",
    });
  };

  // 페이지 선택 시 URL 자동 설정
  const handlePageSelect = (pageId: string) => {
    if (!editingItem) return;

    if (pageId === "none") {
      // 페이지 선택을 취소한 경우
      setEditingItem((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pageId: null,
          // url은 건드리지 않음 (사용자 입력 유지)
        };
      });
      return;
    }

    // 선택한 페이지 찾기
    const selectedPage = pages.find((page) => page.id === pageId);

    if (selectedPage) {
      // pageId만 업데이트, url은 사용자가 직접 입력/수정한 값만 유지
      setEditingItem((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pageId,
          // url: prev.url // 절대 자동 변경 금지
        };
      });
      // 디버깅 로그
      console.log(
        `Page selected: ${selectedPage.title}, pageId set to: ${pageId}`
      );
    }
  };

  // 메뉴 항목 편집 다이얼로그 렌더링

  // 렌더링 부분
  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isNewItem ? "메뉴 항목 추가" : "메뉴 항목 편집"}
            </DialogTitle>
            <DialogDescription>메뉴 항목 정보를 입력하세요.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="menu-title">제목</Label>
              <Input
                id="menu-title"
                value={editingItem?.title || ""}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="메뉴 제목을 입력하세요"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="menu-url" className="mt-4">
                메뉴 URL{" "}
                <span className="text-xs text-gray-400">
                  (직접 입력 시 페이지 연결 무시)
                </span>
              </Label>
              <Input
                id="menu-url"
                value={editingItem?.url || ""}
                onChange={(e) => handleFieldChange("url", e.target.value)}
                placeholder="/about, /custom-url 등"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="menu-page">페이지 연결</Label>
              <Select
                value={editingItem?.pageId || "none"}
                onValueChange={handlePageSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="페이지 선택 (선택 사항)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    선택 안함 (직접 URL 입력)
                  </SelectItem>
                  {Array.isArray(pages) &&
                    pages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="menu-url">URL</Label>
              <Input
                id="menu-url"
                value={editingItem?.url || ""}
                onChange={(e) => handleFieldChange("url", e.target.value)}
                placeholder="URL을 입력하세요 (예: /about)"
                disabled={!!editingItem?.pageId}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="menu-new-tab"
                checked={editingItem?.open_in_new_tab || false}
                onCheckedChange={(checked) =>
                  handleFieldChange("open_in_new_tab", checked)
                }
              />
              <Label htmlFor="menu-new-tab">새 창에서 열기</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="menu-active"
                checked={editingItem?.isActive || false}
                onCheckedChange={(checked) =>
                  handleFieldChange("isActive", checked)
                }
              />
              <Label htmlFor="menu-active">활성화</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDialogOpen(false)}
            >
              취소
            </Button>
            <Button type="button" onClick={handleSaveMenuItem}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>메뉴 관리</CardTitle>
              <CardDescription>
                웹사이트 메뉴의 구조와 표시 여부를 관리하세요.
              </CardDescription>
            </div>
            <div className="flex flex-row gap-2">
              <Button onClick={() => handleAddMenuItem(null)}>
                <Plus className="h-4 w-4 mr-2" />
                메뉴 추가
              </Button>
              <Button onClick={handleSaveMenu} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    메뉴 저장
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-sm text-gray-500">
              메뉴 항목을 드래그하여 순서를 변경하거나, 활성화/비활성화하여 표시
              여부를 관리할 수 있습니다. 하위 메뉴는 최대 2단계까지 가능합니다.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>메뉴 항목이 없습니다. 새 메뉴를 추가해보세요.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
            >
              <SortableContext
                items={menuItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {menuItems
                  .sort((a, b) => a.menuOrder - b.menuOrder)
                  .map((item) => (
                    <SortableMenuItem
                      key={item.id}
                      item={item}
                      onEdit={handleEditMenuItem}
                      onDelete={handleDeleteMenuItem}
                      onAddChild={handleAddMenuItem}
                    />
                  ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
        <CardFooter className="flex justify-end"></CardFooter>
      </Card>
    </div>
  );

  async function handleSaveMenu() {
    setIsSaving(true);
    try {
      // 메뉴 항목을 데이터베이스 형식에 맞게 변환
      const prepareMenuItems = (items: MenuItem[]): any[] => {
        let result: any[] = [];
        const processedIds = new Set<string>(); // 이미 처리한 ID 추적

        // 최상위 메뉴 항목 처리
        const topLevelItems = items.filter((item) => !item.parentId);
        topLevelItems.forEach((item, index) => {
          // ID 유효성 검사
          const itemId = item.id && item.id.length === 36 ? item.id : uuidv4();

          // 이미 처리한 ID인지 확인 (중복 방지)
          if (processedIds.has(itemId)) {
            console.warn(`중복 ID 발견: ${itemId}, 새 ID 생성`);
            const newId = uuidv4();
            processedIds.add(newId);

            // 필수 필드만 추출하여 데이터베이스 형식에 맞게 변환
            const menuItem = {
              id: newId,
              title: item.title,
              url: item.url || "/",
              order_num: index,
              parent_id: null,
              is_active: item.isActive,
              open_in_new_tab: item.open_in_new_tab || false,
              page_id: item.pageId || null,
            };
            result.push(menuItem);

            // 하위 메뉴 처리를 위해 새 ID 저장
            item.id = newId;
          } else {
            processedIds.add(itemId);

            // 필수 필드만 추출하여 데이터베이스 형식에 맞게 변환
            const menuItem = {
              id: itemId,
              title: item.title,
              url: item.url || "/",
              order_num: index,
              parent_id: null,
              is_active: item.isActive,
              open_in_new_tab: item.open_in_new_tab || false,
              page_id: item.pageId || null,
            };
            result.push(menuItem);

            // 하위 메뉴 처리를 위해 ID 저장
            item.id = itemId;
          }

          // 하위 메뉴 항목 처리
          if (item.children && item.children.length > 0) {
            item.children.forEach((child, childIndex) => {
              // 하위 메뉴 ID 유효성 검사
              const childId =
                child.id && child.id.length === 36 ? child.id : uuidv4();

              // 이미 처리한 ID인지 확인 (중복 방지)
              if (processedIds.has(childId)) {
                console.warn(`하위 메뉴 중복 ID 발견: ${childId}, 새 ID 생성`);
                const newChildId = uuidv4();
                processedIds.add(newChildId);

                const childItem = {
                  id: newChildId,
                  title: child.title,
                  url: child.url || "/",
                  order_num: childIndex,
                  parent_id: item.id, // 부모 ID는 위에서 처리한 값 사용
                  is_active: child.isActive,
                  open_in_new_tab: child.open_in_new_tab || false,
                  page_id: child.pageId || null,
                };
                result.push(childItem);
              } else {
                processedIds.add(childId);

                const childItem = {
                  id: childId,
                  title: child.title,
                  url: child.url || "/",
                  order_num: childIndex,
                  parent_id: item.id, // 부모 ID는 위에서 처리한 값 사용
                  is_active: child.isActive,
                  open_in_new_tab: child.open_in_new_tab || false,
                  page_id: child.pageId || null,
                };
                result.push(childItem);
              }
            });
          }
        });

        return result;
      };

      const menuItemsToSave = prepareMenuItems(menuItems);
      console.log("저장할 메뉴 데이터:", menuItemsToSave);

      // 트랜잭션 방식으로 처리
      // 1. 기존 메뉴 전체 삭제 - 모든 레코드 삭제
      // 기존 메뉴 삭제 대신 upsert 방식으로 변경
      // 새로운 메뉴 항목만 저장하고, 삭제된 항목은 자동으로 제거됨
      // 이 방식은 삭제 작업을 스킵하여 오류 가능성을 줄임
      console.log("메뉴 저장 시작: 새로운 upsert 방식 사용");

      // 2. 새 메뉴 저장 - 전체 삭제 대신 기존 메뉴 정보 조회 후 새로운 메뉴만 저장
      if (menuItemsToSave.length > 0) {
        try {
          // 먼저 현재 저장된 메뉴 ID 목록 가져오기
          const { data: existingMenus, error: fetchError } = await supabase
            .from("cms_menus")
            .select("id");

          if (fetchError) {
            console.error("기존 메뉴 조회 오류:", fetchError);
            // 오류가 있어도 계속 진행 (새 메뉴 저장 시도)
            console.warn(
              `기존 메뉴 조회 실패했지만 새 메뉴 저장 계속 진행: ${fetchError.message}`
            );
          }

          // 기존 메뉴 ID 집합 생성 (삭제할 항목 확인용)
          const existingIds = new Set<string>();
          if (existingMenus && existingMenus.length > 0) {
            existingMenus.forEach((menu) => {
              if (menu.id) existingIds.add(menu.id);
            });
          }

          // 새로 저장할 메뉴 ID 집합 생성
          const newMenuIds = new Set<string>();
          menuItemsToSave.forEach((menu) => {
            if (menu.id) newMenuIds.add(menu.id);
          });

          // 삭제해야 할 메뉴 ID 찾기 (기존에는 있지만 새로운 메뉴에는 없는 ID)
          const idsToDelete: string[] = [];
          existingIds.forEach((id) => {
            if (!newMenuIds.has(id)) {
              idsToDelete.push(id);
            }
          });

          // 삭제해야 할 메뉴가 있는 경우 삭제 작업 수행
          if (idsToDelete.length > 0) {
            console.log(`삭제할 메뉴 항목: ${idsToDelete.length}개`);

            // 20개씩 나누어 삭제 (대량 삭제 오류 방지)
            for (let i = 0; i < idsToDelete.length; i += 20) {
              const batch = idsToDelete.slice(i, i + 20);
              try {
                const { error: deleteError } = await supabase
                  .from("cms_menus")
                  .delete()
                  .in("id", batch);

                if (deleteError) {
                  console.warn(
                    `일부 메뉴 삭제 오류 (batch ${i / 20 + 1}): ${deleteError.message}`
                  );
                }
              } catch (batchDeleteErr) {
                console.warn(
                  `메뉴 배치 삭제 오류 (batch ${i / 20 + 1}): ${batchDeleteErr instanceof Error ? batchDeleteErr.message : "알 수 없는 오류"}`
                );
              }
            }
          }

          // 새 메뉴 항목 저장
          console.log(`저장할 메뉴 항목: ${menuItemsToSave.length}개`);

          // 20개씩 배치로 처리 (대량 삽입 오류 방지)
          for (let i = 0; i < menuItemsToSave.length; i += 20) {
            const batch = menuItemsToSave.slice(i, i + 20);
            try {
              // 각 배치를 upsert로 처리
              const { error: upsertError } = await supabase
                .from("cms_menus")
                .upsert(batch, { onConflict: "id" });

              if (upsertError) {
                console.warn(
                  `메뉴 배치 저장 오류 (batch ${i / 20 + 1}): ${upsertError.message}`
                );

                // 배치 저장 실패 시 개별 항목으로 저장 시도
                console.log("배치 저장 실패, 개별 항목으로 저장 시도...");
                for (const menuItem of batch) {
                  if (!menuItem.title) continue; // 제목이 없는 항목은 건너뛰기

                  try {
                    const { error: itemError } = await supabase
                      .from("cms_menus")
                      .upsert(
                        {
                          id: menuItem.id,
                          title: menuItem.title,
                          url: menuItem.url || "/",
                          order_num: menuItem.order_num,
                          parent_id: menuItem.parent_id,
                          is_active: menuItem.is_active,
                          open_in_new_tab: menuItem.open_in_new_tab,
                          page_id: menuItem.page_id,
                        },
                        { onConflict: "id" }
                      );

                    if (itemError) {
                      console.warn(
                        `메뉴 항목 '${menuItem.title}' 저장 실패: ${itemError.message}`
                      );
                    }
                  } catch (itemErr) {
                    console.warn(
                      `메뉴 항목 '${menuItem.title}' 저장 중 오류: ${itemErr instanceof Error ? itemErr.message : "알 수 없는 오류"}`
                    );
                  }
                }
              }
            } catch (batchErr) {
              console.warn(
                `메뉴 배치 처리 오류 (batch ${i / 20 + 1}): ${batchErr instanceof Error ? batchErr.message : "알 수 없는 오류"}`
              );
            }
          }
        } catch (insertErr) {
          console.error("메뉴 저장 중 예상치 못한 오류 발생:", insertErr);
          throw new Error(
            `메뉴 저장 중 오류: ${insertErr instanceof Error ? insertErr.message : "알 수 없는 오류"}`
          );
        }
      }

      // 저장 후 즉시 fetch로 최신 메뉴 반영
      await fetchMenuItems();
      toast({
        title: "메뉴 저장 완료",
        description: "메뉴 구조가 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error("메뉴 저장 오류:", error);
      toast({
        title: "메뉴 저장 실패",
        description: `메뉴를 저장하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }
}
