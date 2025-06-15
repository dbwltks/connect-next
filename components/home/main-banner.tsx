import { createClient } from "@/utils/supabase/server";
import BannerSlider from "./banner-slider";

export type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string; // 이미지 또는 유튜브 링크 모두 가능
  hasButton: boolean;
  buttonText?: string;
  buttonUrl?: string;
  isActive: boolean;
  fullWidth?: boolean;
  html_content?: string;
  use_html?: boolean;
  image_height?: string; // 'original' | '400px' | '20vh' 등
  overlay_opacity?: string; // 오버레이 투명도(0~1)
};

export default async function MainBanner({
  menuId,
}: {
  menuId?: string | null;
}) {
  const supabase = await createClient();

  // Supabase에서 활성화된 배너 가져오기
  let query = supabase.from("cms_banners").select("*").eq("is_active", true);

  // 메뉴 ID가 있으면 해당 메뉴의 배너만 가져오기
  if (menuId) {
    query = query.eq("menu_id", menuId);
  } else {
    // 메뉴 ID가 없으면 전체 사이트 배너(menu_id가 null인 배너)만 가져오기
    query = query.is("menu_id", null);
  }

  const { data, error } = await query.order("order_num", {
    ascending: true,
  });

  if (error) {
    console.error("배너 로딩 오류:", error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const banners = data.map((b: any) => ({
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
    image_height: b.image_height || "original",
    overlay_opacity: b.overlay_opacity || "0.4",
  }));

  return <BannerSlider banners={banners} />;
}
