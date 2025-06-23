"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/db";
import { IWidget } from "@/types";

interface Menu {
  id: string;
  title: string;
  url: string;
  parent_id: string | null;
}

interface MenuListWidgetProps {
  widget: IWidget;
}

export default function MenuListWidget({ widget }: MenuListWidgetProps) {
  const [childMenus, setChildMenus] = useState<Menu[]>([]);
  const [parentMenu, setParentMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchMenus = async () => {
      // 위젯 설정에서 parent_menu_id를 가져옴
      // 또는 현재 경로를 기반으로 동적으로 부모 메뉴를 찾을 수도 있음 (고급 기능)
      let parentMenuId = widget.settings?.parent_menu_id;
      let tempParentMenu = null;

      setIsLoading(true);

      try {
        // 1. 명시적으로 부모 메뉴 ID가 설정된 경우
        if (parentMenuId) {
          const { data, error } = await supabase
            .from("cms_menus")
            .select("id, title, url, parent_id")
            .eq("id", parentMenuId)
            .single();
          if (error) throw error;
          tempParentMenu = data;
        } else {
          // 2. 부모 메뉴 ID가 설정되지 않은 경우, 현재 URL을 기반으로 동적 탐색
          const { data: currentMenu, error: currentMenuError } = await supabase
            .from("cms_menus")
            .select("id, title, url, parent_id")
            .eq("url", pathname)
            .single();

          if (currentMenuError) {
            // 현재 URL에 정확히 일치하는 메뉴가 없는 경우, 상위 경로로 탐색
            let parentPath = pathname;
            while (parentPath.includes("/")) {
              parentPath = parentPath.substring(0, parentPath.lastIndexOf("/"));
              if (!parentPath) break;

              const { data: foundMenu } = await supabase
                .from("cms_menus")
                .select("id, title, url, parent_id")
                .eq("url", parentPath)
                .single();

              if (foundMenu) {
                tempParentMenu = foundMenu;
                break;
              }
            }
          } else if (currentMenu?.parent_id) {
            // 현재 메뉴에 부모가 있으면 그 부모를 사용
            const { data: parentData, error: parentErr } = await supabase
              .from("cms_menus")
              .select("id, title, url, parent_id")
              .eq("id", currentMenu.parent_id)
              .single();
            if (parentErr) throw parentErr;
            tempParentMenu = parentData;
          } else {
            // 현재 메뉴가 최상위 메뉴이면 자신을 부모로 사용
            tempParentMenu = currentMenu;
          }
        }

        setParentMenu(tempParentMenu);

        // 최종적으로 결정된 부모 메뉴의 자식들을 가져옴
        if (tempParentMenu) {
          const { data: children, error: childrenError } = await supabase
            .from("cms_menus")
            .select("id, title, url, parent_id")
            .eq("parent_id", tempParentMenu.id)
            .eq("is_active", true)
            .order("order_num", { ascending: true });

          if (childrenError) throw childrenError;
          setChildMenus(children || []);
        } else {
          setChildMenus([]);
        }
      } catch (error) {
        console.error("메뉴 위젯 데이터 로딩 오류:", error);
        setChildMenus([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenus();
  }, [widget.settings?.parent_menu_id, pathname]);

  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm">
        <div className="w-3/4 h-6 mb-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-2">
          <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-5/6 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // 표시할 자식 메뉴가 없으면 위젯을 렌더링하지 않음
  if (childMenus.length === 0) {
    return (
      <aside className="p-4 bg-white rounded-lg backdrop-blur-sm border border-gray-50">
        {parentMenu ? (
          <h3 className="text-lg font-semibold mb-3 text-gray-800 px-3">
            {parentMenu.title}
          </h3>
        ) : (
          <h3 className="text-lg font-semibold mb-3 text-gray-800 px-3">
            {widget.title || "메뉴 목록"}
          </h3>
        )}
        <div className="px-3 py-2 text-sm text-gray-500">
          {parentMenu
            ? "표시할 하위 메뉴가 없습니다."
            : "표시할 메뉴를 찾을 수 없습니다. 위젯 설정을 확인하세요."}
        </div>
      </aside>
    );
  }

  return (
    <aside className="p-4 bg-white rounded-lg backdrop-blur-sm border border-gray-50">
      {parentMenu && (
        <h3 className="text-lg font-semibold mb-3 text-gray-800 px-3">
          {parentMenu.title}
        </h3>
      )}
      <nav>
        <ul className="space-y-1">
          {childMenus.map((menu) => {
            // 현재 경로가 메뉴 URL로 시작하는지 확인하여 하위 경로에서도 활성화되도록 함
            const isActive =
              pathname === menu.url || pathname.startsWith(menu.url + "/");
            return (
              <li key={menu.id}>
                <Link
                  href={menu.url}
                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-gray-600 hover:bg-gray-200/70"
                  }`}
                >
                  {menu.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
