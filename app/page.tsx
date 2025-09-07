import { createClient } from "@/utils/supabase/server";
import MainBanner from "@/components/home/main-banner";
import HomepageWidgets from "@/components/home/homepage-widgets";

export default async function HomePage() {
  const supabase = await createClient();

  // 홈페이지에 해당하는 메뉴 찾기
  const { data: homeMenu } = await supabase
    .from("cms_menus")
    .select("id")
    .eq("url", "/")
    .eq("is_active", true)
    .single();

  let { data: widgets } = await supabase
    .from("cms_layout")
    .select("*")
    .is("page_id", null)
    .eq("is_active", true)
    .order("order", { ascending: true });
  if (!widgets) widgets = [];

  return (
    <>
      <MainBanner menuId={homeMenu?.id || null} />
      <main className="flex-1 flex flex-col gap-12">
        <div className="my-6 lg:my-0">
          <HomepageWidgets widgets={widgets} menuId={homeMenu?.id || null} />
        </div>
      </main>
    </>
  );
}
