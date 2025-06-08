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
}

export default function Breadcrumb({
  className = "",
  homeTitle = "홈",
  homeUrl = "/",
  currentTitle,
}: BreadcrumbProps) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<IBreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Breadcrumb: useEffect triggered. Pathname:", pathname);
    async function generateBreadcrumbs() {
      console.log("Breadcrumb: generateBreadcrumbs started.");
      setLoading(true);
      try {
        console.log("Breadcrumb: Attempting to fetch menu items from Supabase..."); // <--- 추가된 로그
        // 모든 메뉴 항목 가져오기
        const { data: menuItemsData, error: supabaseError } = await supabase
          .from("cms_menus")
          .select("id, title, url, parent_id")
          .eq("is_active", true);
        
        console.log("Breadcrumb: Supabase call finished."); // <--- 추가된 로그
        console.log("Breadcrumb: Supabase data received:", menuItemsData); // <--- 추가된 로그
        console.log("Breadcrumb: Supabase error received:", supabaseError); // <--- 추가된 로그

        if (supabaseError) {
          console.error("Breadcrumb: Supabase error fetching menu items:", supabaseError);
          throw supabaseError;
        }
        
        if (!menuItemsData) {
          console.warn("Breadcrumb: No menu items data returned from Supabase.");
          setBreadcrumbs([{ title: homeTitle, url: homeUrl, isLast: true }]);
          setLoading(false);
          return;
        }
        console.log(`Breadcrumb: Fetched ${menuItemsData.length} menu items.`);

        const menuItems: IMenuItem[] = menuItemsData; // 타입 명시

        // Optimization: Create a map for faster lookups by ID
        const menuItemMap = new Map<string, IMenuItem>();
        menuItems.forEach(item => menuItemMap.set(item.id, item));

        // 현재 경로에 해당하는 메뉴 항목 찾기
        const currentPath = pathname === "/" ? "/" : pathname;
        let currentMenuItem = menuItems.find(
          (item) => item.url === currentPath
        );

        // 현재 경로에 해당하는 메뉴 항목이 없는 경우 (부분 일치)
        if (!currentMenuItem && currentPath !== "/") {
          currentMenuItem = menuItems.find(
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
          const visitedParentIds = new Set<string>(); // Prevent infinite loops

          console.log("Breadcrumb: Building parent hierarchy for", currentMenuItem.title);
          while (parentId) {
            if (visitedParentIds.has(parentId)) {
              console.error("Breadcrumb: Circular dependency detected for parentId:", parentId);
              break; 
            }
            visitedParentIds.add(parentId);

            const parentItem = menuItemMap.get(parentId); // Use map for O(1) lookup
            if (parentItem) {
              parentItems.unshift(parentItem); 
              parentId = parentItem.parent_id;
            } else {
              console.warn("Breadcrumb: Parent item not found in map for parentId:", parentId);
              break;
            }
          }
          console.log("Breadcrumb: Parent items found:", parentItems.map(p => p.title));

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
          console.log("Breadcrumb: Current menu item not found. Generating from path segments.");
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
        console.log("Breadcrumb: Breadcrumbs generated:", breadcrumbItems.map(b => b.title));
      } catch (error) {
        console.error("브레드크럼 생성 오류:", error);
        setBreadcrumbs([
          { title: homeTitle, url: homeUrl, isLast: true },
        ]);
      } finally {
        console.log("Breadcrumb: generateBreadcrumbs finished. setLoading(false).");
        setLoading(false);
      }
    }

    generateBreadcrumbs();
  }, [pathname, homeTitle, homeUrl, currentTitle]);

  if (loading) {
    return (
      <Card
        className={`shadow-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${className}`}
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
    <Card
      className={`shadow-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${className}`}
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
                ) : index === 0 ? null : ( // 홈 항목은 아이콘만 표시하고 텍스트는 표시하지 않음
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
    </Card>
  );
}
