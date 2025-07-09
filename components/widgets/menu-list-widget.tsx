"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IWidget } from "@/types";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
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

// SWR 페처 함수 분리
async function fetchMenuList(
  parentMenuId?: string, 
  pathname?: string
): Promise<UseMenuListResult> {
  const result = await api.menus.getMenuList(parentMenuId, pathname);
  return {
    parentMenu: result.parentMenu || null,
    childMenus: result.childMenus || []
  };
}

export default function MenuListWidget({ widget }: MenuListWidgetProps) {
  const pathname = usePathname();
  const parentMenuId = widget.settings?.parent_menu_id;
  
  // SWR을 사용한 데이터 페칭
  const { data, error, isLoading } = useSWR(
    ['menuList', parentMenuId, pathname],
    () => fetchMenuList(parentMenuId, pathname),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );
  // 로딩 상태
  if (isLoading) {
    return (
      <aside className="p-4 bg-white rounded-lg backdrop-blur-sm border border-gray-50">
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="space-y-1">
          {[...Array(4)].map((_, i: any) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </aside>
    );
  }
  // 에러 상태
  if (error) {
    return (
      <aside className="p-4 bg-white rounded-lg backdrop-blur-sm border border-red-200">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          {widget.title || "메뉴 목록"}
        </h3>
        <div className="text-center">
          <div className="text-red-600">
            <div className="text-lg mb-1">❌</div>
            <div className="font-medium mb-1">메뉴를 불러올 수 없습니다</div>
            <div className="text-sm text-red-500">{error.message}</div>
          </div>
        </div>
      </aside>
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
          {childMenus.map((menu: any) => {
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
