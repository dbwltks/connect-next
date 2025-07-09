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
import { Edit, Eye, EyeOff, Plus, Trash } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { createClient } from "@/utils/supabase/client";
import { Section } from "./section-manager";
import { Category } from "./category-manager";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

// 페이지 타입 정의
export type Page = {
  id: string;
  title: string;
  slug: string;
  sectionId: string;
  categoryId: string;
  pageType: string;
  content?: string;
  views: number;
  isActive: boolean;
  isPublic?: boolean;
  menuOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
};

interface PageManagerProps {
  pageId?: string;
  templateId?: string;
}

export default function PageManager({ pageId, templateId }: PageManagerProps) {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  const [pages, setPages] = useState<Page[]>([]);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadSections();
    loadCategories();
    loadPages();
  }, []);

  // 섹션 선택 시 해당 섹션의 카테고리만 필터링
  useEffect(() => {
    if (editingPage?.sectionId && editingPage.sectionId !== "_none") {
      setFilteredCategories(
        categories.filter(
          (category) => category.sectionId === editingPage.sectionId
        )
      );
    } else {
      setFilteredCategories([]);
    }
  }, [editingPage?.sectionId, categories]);

  // 섹션 불러오기
  const loadSections = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cms_sections")
        .select("*")
        .order("order", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setSections(
          data.map((item: any) => ({
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
      }
    } catch (error) {
      console.error("Error loading sections:", error);
      toast({
        title: "오류",
        description: "섹션을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 카테고리 불러오기
  const loadCategories = async () => {
    try {
      const supabase = createClient();
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
            name: item.title, // name 필드 추가 (title과 동일하게 매핑)
            sectionId: item.section_id,
            description: item.description,
            isActive: item.is_active,
            order: item.order,
          }))
        );
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

  // 페이지 불러오기
  const loadPages = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cms_pages")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapDbPageToPage = (dbPage: any): Page => ({
          id: dbPage.id,
          title: dbPage.title,
          slug: dbPage.slug || "",
          sectionId: dbPage.section_id || "_none",
          categoryId: dbPage.category_id || "_none",
          pageType: dbPage.page_type || "board",
          content: dbPage.content || "",
          views: dbPage.views || 0,
          isActive: dbPage.is_active,
          isPublic: dbPage.is_public,
          menuOrder: dbPage.menu_order || 0,
          metaTitle: dbPage.meta_title || "",
          metaDescription: dbPage.meta_description || "",
          metaKeywords: dbPage.meta_keywords || "",
        });

        setPages(data.map(mapDbPageToPage));
      } else {
        setPages([]);
      }
    } catch (error) {
      console.error("Error loading pages:", error);
      toast({
        title: "오류",
        description: "페이지를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 페이지 활성화/비활성화 토글
  const handleTogglePage = async (id: string, isActive: boolean) => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      const { error } = await supabase
        .from("cms_pages")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;

      // 로컬 상태 업데이트
      setPages(
        pages.map((page: any) => (page.id === id ? { ...page, isActive } : page))
      );

      toast({
        title: "성공",
        description: `페이지가 ${isActive ? "활성화" : "비활성화"}되었습니다.`,
      });
    } catch (error) {
      console.error("Error toggling page:", error);
      toast({
        title: "오류",
        description: "페이지 상태 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 편집
  const handleEditPage = (id: string) => {
    const page = pages.find((p) => p.id === id);
    if (page) {
      setEditingPageId(id);
      setEditingPage({ ...page });
      setShowEditDialog(true);
    }
  };

  // 페이지 삭제
  const handleDeletePage = async (id: string) => {
    if (!confirm("정말로 이 페이지를 삭제하시겠습니까?")) return;

    try {
      setIsLoading(true);
      const supabase = createClient();

      const { error } = await supabase.from("cms_pages").delete().eq("id", id);

      if (error) throw error;

      setPages(pages.filter((page) => page.id !== id));

      toast({
        title: "성공",
        description: "페이지가 삭제되었습니다.",
      });
    } catch (error) {
      console.error("Error deleting page:", error);
      toast({
        title: "오류",
        description: "페이지 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 새 페이지 추가
  const handleAddPage = () => {
    // UUID 생성 - 서버에서 생성되도록 빈 값으로 설정
    const newId = crypto.randomUUID();
    const timestamp = Date.now().toString().slice(-6);

    const newPage: Page = {
      id: newId,
      title: "새 페이지",
      slug: `page-${timestamp}`, // 기본 슬러그 값 설정
      sectionId: "_none",
      categoryId: "_none",
      pageType: "content", // 기본값으로 콘텐츠 타입으로 변경
      content: "",
      views: 0, // 새 페이지는 처음에 조회수 0으로 설정
      isActive: true,
      isPublic: true,
      menuOrder: 0,
    };

    setEditingPageId(null);
    setEditingPage(newPage);
    setShowEditDialog(true);
  };

  // 페이지 저장
  const handleSavePage = async () => {
    if (!editingPage) return;

    try {
      setIsLoading(true);
      const supabase = createClient();

      // 저장할 데이터 객체 생성
      const pageData: any = {
        id: editingPage.id,
        title: editingPage.title,
        // 슬러그 생성 - 제목을 소문자로 변환하고 공백을 하이픈으로 대체
        // 한글을 영어로 변환하지 않고 영어와 숫자만 유지
        slug:
          editingPage.slug ||
          editingPage.title
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/^-+|-+$/g, "") || // 슬러그 앞뒤의 하이픈 제거
          `page-${Date.now().toString().slice(-6)}`, // 슬러그가 비어있으면 기본값 생성
        section_id:
          editingPage.sectionId === "_none" ? null : editingPage.sectionId,
        category_id:
          editingPage.categoryId === "_none" ? null : editingPage.categoryId,
        page_type: editingPage.pageType,
        content: editingPage.content || "",
        is_active: editingPage.isActive,
        is_public:
          editingPage.isPublic !== undefined ? editingPage.isPublic : true,
        meta_title: editingPage.metaTitle || editingPage.title,
        meta_description: editingPage.metaDescription || "",
        meta_keywords: editingPage.metaKeywords || "",
      };

      console.log("Saving page:", pageData);

      let result;

      if (editingPageId) {
        // 기존 페이지 업데이트
        result = await supabase
          .from("cms_pages")
          .update(pageData)
          .eq("id", editingPageId);
      } else {
        // 새 페이지 추가
        // 새 페이지는 처음에 조회수 0으로 설정
        pageData.views = 0;

        result = await supabase.from("cms_pages").insert(pageData);
      }

      if (result.error) {
        console.error("Database error:", result.error);
        // slug 중복 오류 처리
        if (
          result.error.message &&
          result.error.message.includes(
            "duplicate key value violates unique constraint"
          )
        ) {
          // 슬러그에 타임스태프 추가
          pageData.slug = `${pageData.slug}-${Date.now().toString().slice(-6)}`;

          // 다시 저장 시도
          if (editingPageId) {
            result = await supabase
              .from("cms_pages")
              .update(pageData)
              .eq("id", editingPageId);
          } else {
            result = await supabase.from("cms_pages").insert(pageData);
          }

          if (result.error) {
            console.error("Second attempt failed:", result.error);
            throw result.error;
          }
        } else {
          throw result.error;
        }
      }

      toast({
        title: "성공",
        description: "페이지가 저장되었습니다.",
      });

      setShowEditDialog(false);
      loadPages();
    } catch (error: any) {
      console.error("Error saving page:", error);
      toast({
        title: "오류",
        description: `페이지 저장 중 오류가 발생했습니다: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 편집 다이얼로그 렌더링 - 더 간소화된 버전
  const renderEditPageDialog = () => {
    if (!editingPage) return null;

    const updateEditingPage = (field: string, value: any) => {
      if (!editingPage) return;

      // 제목이 변경되고 슬러그가 직접 입력되지 않았다면 자동으로 슬러그 업데이트
      if (
        field === "title" &&
        (!editingPage.slug ||
          editingPage.slug ===
            `page-${Date.now().toString().slice(-6)}`.substring(0, 12))
      ) {
        const newSlug = value
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .replace(/^-+|-+$/g, "");

        setEditingPage({
          ...editingPage,
          title: value,
          slug: newSlug || `page-${Date.now().toString().slice(-6)}`,
        });
      } else {
        setEditingPage({
          ...editingPage,
          [field]: value,
        });
      }
    };

    return (
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>페이지 {editingPageId ? "편집" : "추가"}</DialogTitle>
            <DialogDescription>
              카테고리에 연결할 페이지 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="page-title">페이지 제목</Label>
              <Input
                id="page-title"
                value={editingPage.title}
                onChange={(e) => updateEditingPage("title", e.target.value)}
                placeholder="페이지 제목을 입력하세요"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="page-section">섹션</Label>
              <Select
                value={editingPage.sectionId}
                onValueChange={(value) => updateEditingPage("sectionId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="섹션 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">선택 안함</SelectItem>
                  {sections.map((section: any) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="page-category">카테고리</Label>
              <Select
                value={editingPage.categoryId}
                onValueChange={(value) =>
                  updateEditingPage("categoryId", value)
                }
                disabled={
                  !editingPage.sectionId || editingPage.sectionId === "_none"
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      editingPage.sectionId && editingPage.sectionId !== "_none"
                        ? "카테고리 선택"
                        : "먼저 섹션을 선택하세요"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">선택 안함</SelectItem>
                  {filteredCategories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="page-type">페이지 타입</Label>
              <Select
                value={editingPage.pageType}
                onValueChange={(value) => updateEditingPage("pageType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="페이지 타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="board">
                    게시판 (테이블 목록 형식)
                  </SelectItem>
                  <SelectItem value="widget">
                    위젯 페이지 (레이아웃으로 구성)
                  </SelectItem>
                  <SelectItem value="content">콘텐츠 (일반 페이지)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="page-views">조회수</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="page-views"
                  type="number"
                  value={editingPage.views}
                  readOnly
                  disabled
                  className="bg-gray-100"
                />
                <span className="text-xs text-gray-500">
                  (사용자가 실제로 본 횟수로 자동 업데이트됩니다)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="page-active"
                  checked={editingPage.isActive}
                  onCheckedChange={(checked) =>
                    updateEditingPage("isActive", checked)
                  }
                />
                <Label htmlFor="page-active">활성화</Label>
              </div>
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
            <Button type="button" onClick={handleSavePage} disabled={isLoading}>
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // 섹션 이름 가져오기
  const getSectionName = (sectionId?: string) => {
    if (!sectionId || sectionId === "_none") return "-";
    const section = sections.find((s) => s.id === sectionId);
    return section ? section.title : "-";
  };

  // 카테고리 이름 가져오기
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId || categoryId === "_none") return "-";
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.title : "-";
  };

  return (
    <div className="space-y-6">
      {renderEditPageDialog()}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>페이지 관리</CardTitle>
              <CardDescription>웹사이트의 페이지를 관리하세요.</CardDescription>
            </div>
            <Button onClick={handleAddPage}>
              <Plus className="h-4 w-4 mr-2" />
              페이지 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>페이지 목록</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>섹션</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>페이지 타입</TableHead>
                <TableHead>조회수</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.length > 0 ? (
                pages.map((page: any) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="max-w-[200px] truncate font-mono text-xs">
                        {page.id.substring(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">{page.title}</div>
                    </TableCell>
                    <TableCell>{getSectionName(page.sectionId)}</TableCell>
                    <TableCell>{getCategoryName(page.categoryId)}</TableCell>
                    <TableCell>{page.pageType}</TableCell>
                    <TableCell className="text-center">{page.views}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant={
                                  page.isActive ? "default" : "secondary"
                                }
                              >
                                {page.isActive ? (
                                  <Eye className="h-3 w-3 mr-1" />
                                ) : (
                                  <EyeOff className="h-3 w-3 mr-1" />
                                )}
                                {page.isActive ? "활성" : "비활성"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {page.isActive
                                  ? "페이지가 활성화되어 있습니다"
                                  : "페이지가 비활성화되어 있습니다"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleTogglePage(page.id, !page.isActive)
                          }
                        >
                          {page.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPage(page.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePage(page.id)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    페이지가 없습니다. 새 페이지를 추가해보세요.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
