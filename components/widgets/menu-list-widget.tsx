"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { IWidget } from "@/types";
import useSWR from "swr";

interface Menu {
  id: string;
  title: string;
  url: string;
  parent_id: string | null;
}

interface MenuListWidgetProps {
  widget: IWidget;
}

interface UseMenuListResult {
  parentMenu: Menu | null;
  childMenus: Menu[];
}

function useMenuList(widget: IWidget, pathname: string) {
  return useSWR<UseMenuListResult>(
    ["menuList", widget.settings?.parent_menu_id, pathname],
    async () => {
      const supabase = createClient();
      let parentMenuId = widget.settings?.parent_menu_id;
      let tempParentMenu: Menu | null = null;
      if (parentMenuId) {
        const { data, error } = await supabase
          .from("cms_menus")
          .select("id, title, url, parent_id")
          .eq("id", parentMenuId)
          .single();
        if (error) throw error;
        tempParentMenu = data;
      } else {
        const { data: currentMenu, error: currentMenuError } = await supabase
          .from("cms_menus")
          .select("id, title, url, parent_id")
          .eq("url", pathname)
          .single();
        if (currentMenuError) {
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
          const { data: parentData, error: parentErr } = await supabase
            .from("cms_menus")
            .select("id, title, url, parent_id")
            .eq("id", currentMenu.parent_id)
            .single();
          if (parentErr) throw parentErr;
          tempParentMenu = parentData;
        } else {
          tempParentMenu = currentMenu;
        }
      }
      let childMenus: Menu[] = [];
      if (tempParentMenu) {
        const { data: children, error: childrenError } = await supabase
          .from("cms_menus")
          .select("id, title, url, parent_id")
          .eq("parent_id", tempParentMenu.id)
          .eq("is_active", true)
          .order("order_num", { ascending: true });
        if (childrenError) throw childrenError;
        childMenus = children || [];
      }
      return { parentMenu: tempParentMenu, childMenus };
    },
    {
      // 전역 설정 사용
    }
  );
}

export default function MenuListWidget({ widget }: MenuListWidgetProps) {
  const pathname = usePathname();
  const { data, error, isLoading } = useMenuList(widget, pathname);
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
  if (error) {
    return (
      <div className="p-4 text-red-500">메뉴 로딩 오류: {error.message}</div>
    );
  }
  const parentMenu = data?.parentMenu;
  const childMenus = data?.childMenus || [];

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
        <div className="text-lg font-semibold mb-3 text-gray-800">
          {parentMenu.title}
        </div>
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
