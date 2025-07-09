import { createClient } from "@/utils/supabase/server";
import MainBanner from "@/components/home/main-banner";
import HomepageWidgets from "@/components/home/homepage-widgets";

export default async function HomePage() {
  const supabase = await createClient();

  let { data: widgets } = await supabase
    .from("cms_layout")
    .select("*")
    .is("page_id", null)
    .eq("is_active", true)
    .order("order", { ascending: true });
  if (!widgets) widgets = [];

  return (
    <>
      <MainBanner menuId={null} />
      <main className="flex-1 flex flex-col gap-12">
        <div className="my-6 sm:my-0">
          <HomepageWidgets widgets={widgets} />
        </div>
      </main>
    </>
  );
}
