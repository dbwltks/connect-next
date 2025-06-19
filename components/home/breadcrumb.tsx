"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { supabase } from "@/db";
import { Card, CardContent } from "@/components/ui/card";

// 브레드크럼 항목 타입 정의
interface IBreadcrumbItem {
  title: string;
  url: string;
  isLast: boolean;
}

// 메뉴 항목 타입 정의
interface IMenuItem {
  id: string;
  title: string;
  url: string;
  parent_id: string | null;
}

interface BreadcrumbProps {
  className?: string;
  homeTitle?: string;
  homeUrl?: string;
  currentTitle?: string; // 현재 페이지 제목 (URL에서 찾을 수 없는 경우 사용)
  menuItems?: IMenuItem[]; // SSR에서 전달받은 메뉴 데이터
}

export default function Breadcrumb({
  className = "",
  homeTitle = "홈",
  homeUrl = "/",
  currentTitle,
  menuItems,
}: BreadcrumbProps) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<IBreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function generateBreadcrumbs(menuData: IMenuItem[] | undefined) {
      setLoading(true);
      try {
        let menuItemsData = menuData;
        // SSR에서 menuItems가 없으면 CSR에서 fetch (fallback)
        if (!menuItemsData) {
          const { data: fetchedMenus, error: supabaseError } = await supabase
            .from("cms_menus")
            .select("id, title, url, parent_id")
            .eq("is_active", true);
          if (supabaseError) {
            console.error("Error fetching menu items:", supabaseError);
            throw supabaseError;
          }
          menuItemsData = fetchedMenus || [];
        }
        if (!menuItemsData || menuItemsData.length === 0) {
          setBreadcrumbs([{ title: homeTitle, url: homeUrl, isLast: true }]);
          return;
        }
        // Optimization: Create a map for faster lookups by ID
        const menuItemMap = new Map<string, IMenuItem>();
        menuItemsData.forEach((item) => menuItemMap.set(item.id, item));
        // 현재 경로에 해당하는 메뉴 항목 찾기
        const currentPath = pathname === "/" ? "/" : pathname;
        let currentMenuItem = menuItemsData.find(
          (item) => item.url === currentPath
        );
        // 현재 경로에 해당하는 메뉴 항목이 없는 경우 (부분 일치)
        if (!currentMenuItem && currentPath !== "/") {
          currentMenuItem = menuItemsData.find(
            (item) => currentPath.startsWith(item.url) && item.url !== "/"
          );
        }
        const breadcrumbItems: IBreadcrumbItem[] = [];
        // 홈 항목 추가
        breadcrumbItems.push({
          title: homeTitle,
          url: homeUrl,
          isLast: currentPath === homeUrl,
        });
        // 현재 메뉴 항목이 있는 경우 계층 구조 생성
        if (currentMenuItem) {
          const parentItems: IMenuItem[] = [];
          let parentId = currentMenuItem.parent_id;
          const visitedParentIds = new Set<string>();
          while (parentId) {
            if (visitedParentIds.has(parentId)) {
              break;
            }
            visitedParentIds.add(parentId);
            const parentItem = menuItemMap.get(parentId);
            if (parentItem) {
              parentItems.unshift(parentItem);
              parentId = parentItem.parent_id;
            } else {
              break;
            }
          }
          // 부모 항목들 브레드크럼에 추가
          parentItems.forEach((item) => {
            breadcrumbItems.push({
              title: item.title,
              url: item.url,
              isLast: false,
            });
          });
          // 현재 항목 추가
          breadcrumbItems.push({
            title: currentMenuItem.title,
            url: currentMenuItem.url,
            isLast: true,
          });
        } else if (currentPath !== homeUrl) {
          const pathSegments = currentPath.split("/").filter(Boolean);
          let currentUrl = "";
          pathSegments.forEach((segment, index) => {
            currentUrl += `/${segment}`;
            const isLast = index === pathSegments.length - 1;
            const title =
              isLast && currentTitle
                ? currentTitle
                : segment.charAt(0).toUpperCase() +
                  segment.slice(1).replace(/-/g, " ");
            breadcrumbItems.push({
              title,
              url: currentUrl,
              isLast,
            });
          });
        }
        setBreadcrumbs(breadcrumbItems);
      } catch (error) {
        console.error("브레드크럼 생성 오류:", error);
        setBreadcrumbs([{ title: homeTitle, url: homeUrl, isLast: true }]);
      } finally {
        setLoading(false);
      }
    }
    generateBreadcrumbs(menuItems);
  }, [pathname, homeTitle, homeUrl, currentTitle, menuItems]);

  if (loading) {
    return (
      <Card
        className={`sm:rounded-lg sm:shadow-sm sm:border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 ${className}`}
      >
        <CardContent className="p-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <span className="animate-pulse">로딩 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (breadcrumbs.length <= 1) {
    return null; // 홈 페이지만 있는 경우 표시하지 않음
  }

  return (
    <div
      className={`sm:rounded-lg sm:shadow-sm sm:border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 ${className}`}
    >
      <CardContent className="p-3">
        <nav aria-label="breadcrumb" className="text-sm">
          <ol className="flex flex-wrap items-center">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center">
                {index === 0 ? (
                  <Link
                    href={item.url}
                    title={item.title}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Home className="h-4 w-4" />
                  </Link>
                ) : (
                  <ChevronRight className="mx-1 h-4 w-4 text-gray-400 dark:text-gray-500" />
                )}
                {item.isLast ? (
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {item.title}
                  </span>
                ) : index === 0 ? null : (
                  <Link
                    href={item.url}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                  >
                    {item.title}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </CardContent>
    </div>
  );
}
