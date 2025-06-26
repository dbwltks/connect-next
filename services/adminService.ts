import { supabase } from "@/db";

// 메뉴 목록
export async function fetchMenus() {
  const { data, error } = await supabase
    .from("cms_menus")
    .select("*")
    .order("order_num", { ascending: true });
  if (error) throw error;
  return (data || []).map((item) => ({
    ...item,
    isActive: item.is_active,
    parentId: item.parent_id,
    menuOrder: item.order_num,
    pageId: item.page_id || null,
  }));
}

// 카테고리 목록
export async function fetchCategories() {
  const { data, error } = await supabase
    .from("cms_categories")
    .select("*")
    .order("order_num", { ascending: true });
  if (error) throw error;
  return data || [];
}

// 섹션 목록
export async function fetchSections() {
  const { data, error } = await supabase
    .from("cms_sections")
    .select("*")
    .order("order", { ascending: true });
  if (error) throw error;
  return (data || []).map((item) => ({
    ...item,
    isActive: item.is_active,
  }));
}

// 페이지 목록
export async function fetchPages() {
  const { data, error } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("is_active", true)
    .order("title", { ascending: true });
  if (error) throw error;
  return (data || []).map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug || "",
    sectionId: item.section_id,
    categoryId: item.category_id,
    pageType: item.page_type,
    views: item.views || 0,
    isActive: item.is_active,
  }));
}
