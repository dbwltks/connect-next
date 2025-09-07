"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import BannerSlider from "@/components/home/banner-slider";
import type { Banner } from "@/components/home/main-banner";

interface BannerWidgetProps {
  widget: any;
  banners: any[];
  menuId?: string | null;
}

export function BannerWidget({ widget, banners = [], menuId }: BannerWidgetProps) {
  const [clientBanners, setClientBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  
  console.log("🔄 BannerWidget render:", { loading, bannersCount: clientBanners.length, widget: widget?.id });
  const pathname = usePathname();

  useEffect(() => {
    async function fetchBanners() {
      const supabase = createClient();

      console.log("🔍 BannerWidget Debug:", {
        pathname,
        widgetSettings: widget?.settings,
        menuIdProp: menuId,
        widgetMenuId: widget?.menu_id
      });

      // 배너 매니저 방식 사용: 위젯 설정의 menu_id만 사용

      let query = supabase.from("cms_banners").select("*").eq("is_active", true);

      // 배너 매니저 방식 그대로 사용: widget.settings.menu_id 기반
      let targetMenuId = null;
      
      if (widget?.settings?.menu_id === "global") {
        // 전체 사이트 배너 강제 선택
        targetMenuId = null;
        console.log("🌍 Using global banners (menu_id is null)");
      } else if (widget?.settings?.menu_id === "auto" || !widget?.settings?.menu_id) {
        // 자동 선택: 전체 사이트 배너 (배너 매니저에서 "전체 사이트 (공통 배너)" 선택과 동일)
        targetMenuId = null;
        console.log("🤖 Auto-selecting: using global banners (menu_id is null)");
      } else {
        // 특정 메뉴 ID 선택 (배너 매니저와 동일한 방식)
        targetMenuId = widget.settings.menu_id;
        console.log("🎯 Using specific menu ID (same as banner manager):", targetMenuId);
      }
      
      if (targetMenuId) {
        query = query.eq("menu_id", targetMenuId);
        console.log("🔍 Searching for banners with menu_id:", targetMenuId);
      } else {
        query = query.is("menu_id", null);
        console.log("🔍 Searching for global banners (menu_id is null)");
      }

      const { data, error } = await query.order("order_num", {
        ascending: true,
      });

      console.log("📊 Banner query result:", { data, error, count: data?.length || 0 });

      if (error) {
        console.error("❌ 배너 로딩 오류:", error);
        setClientBanners([]);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        console.log("❌ No banners found, trying fallback to global banners");
        
        // 배너가 없으면 전체 사이트 배너를 fallback으로 시도
        if (targetMenuId !== null) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("cms_banners")
            .select("*")
            .eq("is_active", true)
            .is("menu_id", null)
            .order("order_num", { ascending: true });
          
          console.log("🔄 Fallback to global banners:", { fallbackData, fallbackError });
          
          if (fallbackData && fallbackData.length > 0) {
            const mappedFallbackBanners = fallbackData.map((b: any) => ({
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
            setClientBanners(mappedFallbackBanners);
            setLoading(false);
            return;
          }
        }
        
        // fallback도 실패했으면 빈 배열로 설정
        setClientBanners([]);
        setLoading(false);
        return;
      }

      const mappedBanners = data.map((b: any) => ({
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

      console.log("✅ Successfully loaded banners:", mappedBanners);
      setClientBanners(mappedBanners);
      setLoading(false);
    }

    fetchBanners();
  }, [widget?.settings?.menu_id]);

  // 로딩 중일 때 스켈레톤 표시
  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded"></div>;
  }

  if (clientBanners.length === 0) {
    // 배너가 없을 때 항상 안내 메시지 표시
    const isSpecificPageSelected = widget?.settings?.menu_id && widget?.settings?.menu_id !== "auto" && widget?.settings?.menu_id !== "global";
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="text-blue-600 mb-2">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          {isSpecificPageSelected ? '선택한 페이지에 배너가 없습니다' : '배너 설정이 필요합니다'}
        </h3>
        <p className="text-blue-700 mb-4">
          {isSpecificPageSelected 
            ? '선택한 페이지에 해당하는 배너가 없습니다. 배너 관리에서 해당 페이지용 배너를 추가하거나 다른 페이지를 선택해주세요.'
            : '현재 페이지에 해당하는 배너가 없습니다. 위젯 설정에서 표시할 배너를 선택해주세요.'
          }
        </p>
        <p className="text-sm text-blue-600">
          {isSpecificPageSelected
            ? '📋 배너 관리에서 배너 추가 또는 ⚙️ 위젯 설정에서 다른 페이지 선택'
            : '⚙️ 위젯 설정 → "표시할 페이지/메뉴 선택"에서 설정 가능'
          }
        </p>
      </div>
    );
  }

  console.log("🎨 Passing banners to BannerSlider:", clientBanners);
  return <BannerSlider banners={clientBanners} />;
}