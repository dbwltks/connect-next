import { createClient } from "@/utils/supabase/server";
import NewHomepage from "@/components/home/new-homepage";

export default async function NewMainPage() {
  const supabase = await createClient();

  // 홈페이지에 해당하는 메뉴 찾기
  const { data: homeMenu } = await supabase
    .from("cms_menus")
    .select("id")
    .eq("url", "/")
    .eq("is_active", true)
    .single();

  // 배너 데이터 가져오기
  let bannerQuery = supabase
    .from("cms_banners")
    .select("*")
    .eq("is_active", true);

  if (homeMenu?.id) {
    bannerQuery = bannerQuery.eq("menu_id", homeMenu.id);
  } else {
    bannerQuery = bannerQuery.is("menu_id", null);
  }

  const { data: bannersData } = await bannerQuery.order("order_num", {
    ascending: true,
  });

  const banners = bannersData?.map((b: any) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle || "",
    imageUrl: b.image_url,
    hasButton: b.has_button || false,
    buttonText: b.button_text || "",
    buttonUrl: b.button_url || "",
  })) || [];

  // 위젯 데이터 가져오기
  let { data: widgets } = await supabase
    .from("cms_layout")
    .select("*")
    .is("page_id", null)
    .eq("is_active", true)
    .order("order", { ascending: true });

  if (!widgets) widgets = [];

  return <NewHomepage banners={banners} widgets={widgets} />;
}
