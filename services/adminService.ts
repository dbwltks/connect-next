import { createClient } from "@/utils/supabase/client";

// 메뉴 목록
export async function fetchMenus() {
  const supabase = createClient();
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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cms_categories")
    .select("*")
    .order("order", { ascending: true });
  if (error) throw error;
  return data || [];
}

// 섹션 목록
export async function fetchSections() {
  try {
    console.log("fetchSections 호출됨");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cms_sections")
      .select("*")
      .order("order", { ascending: true });

    if (error) {
      console.error("fetchSections 에러:", error);
      throw error;
    }

    console.log("fetchSections 원본 데이터:", data);

    const transformedData = (data || []).map((item) => ({
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
    }));

    console.log("fetchSections 변환된 데이터:", transformedData);
    return transformedData;
  } catch (error) {
    console.error("fetchSections 실패:", error);
    throw error;
  }
}

// 페이지 목록
export async function fetchPages() {
  const supabase = createClient();
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

// 배너 목록
export async function fetchBanners() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cms_banners")
    .select("*")
    .order("order_num", { ascending: true });
  if (error) throw error;
  return (data || []).map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle || "",
    imageUrl: item.image_url,
    isActive: item.is_active,
    order_num: item.order_num ?? 0,
    button_text: item.button_text ?? "",
    button_url: item.button_url ?? "",
    has_button: item.has_button ?? false,
    full_width: item.full_width ?? false,
    menu_id: item.menu_id,
    html_content: item.html_content || "",
    use_html: item.use_html ?? false,
    image_height: item.image_height || "100%",
    overlay_opacity: item.overlay_opacity || "0.4",
  }));
}
