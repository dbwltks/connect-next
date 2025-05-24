"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { supabase } from "@/db";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

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
    async function generateBreadcrumbs() {
      setLoading(true);
      try {
        // 모든 메뉴 항목 가져오기
        const { data: menuItems, error } = await supabase
          .from("cms_menus")
          .select("id, title, url, parent_id")
          .eq("is_active", true);

        if (error) throw error;

        // 현재 경로에 해당하는 메뉴 항목 찾기
        const currentPath = pathname === "/" ? "/" : pathname;
        let currentMenuItem = menuItems?.find(
          (item) => item.url === currentPath
        );

        // 현재 경로에 해당하는 메뉴 항목이 없는 경우
        if (!currentMenuItem && currentPath !== "/") {
          // URL 경로의 일부가 일치하는 메뉴 항목 찾기 (부분 일치)
          currentMenuItem = menuItems?.find((item) => 
            currentPath.startsWith(item.url) && item.url !== "/"
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
          // 부모 메뉴 항목들을 찾아 경로 구성
          const parentItems: IMenuItem[] = [];
          let parentId = currentMenuItem.parent_id;

          // 부모 항목들 찾기
          while (parentId) {
            const parentItem = menuItems?.find((item) => item.id === parentId);
            if (parentItem) {
              parentItems.unshift(parentItem); // 상위 항목부터 추가
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
          // 메뉴에 없는 경로인 경우 현재 경로 기반으로 표시
          const pathSegments = currentPath.split("/").filter(Boolean);
          
          // 경로 세그먼트 기반으로 브레드크럼 생성
          let currentUrl = "";
          pathSegments.forEach((segment, index) => {
            currentUrl += `/${segment}`;
            const isLast = index === pathSegments.length - 1;
            
            // 마지막 세그먼트이고 currentTitle이 제공된 경우 해당 제목 사용
            const title = isLast && currentTitle 
              ? currentTitle 
              : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
            
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
        // 오류 발생 시 기본 홈 경로만 표시
        setBreadcrumbs([
          {
            title: homeTitle,
            url: homeUrl,
            isLast: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    generateBreadcrumbs();
  }, [pathname, homeTitle, homeUrl, currentTitle]);

  if (loading) {
    return (
      <Card className={`shadow-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${className}`}>
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
    <Card className={`shadow-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${className}`}>
      <CardContent className="p-3">
        <nav aria-label="breadcrumb" className="text-sm">
          <ol className="flex flex-wrap items-center">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center">
                {index === 0 ? (
                  <Link href={item.url} title={item.title} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                    <Home className="h-4 w-4" />
                  </Link>
                ) : (
                  <ChevronRight className="mx-1 h-4 w-4 text-gray-400 dark:text-gray-500" />
                )}
                {item.isLast ? (
                  <span className="font-medium text-gray-800 dark:text-gray-200">{item.title}</span>
                ) : index === 0 ? (
                  null // 홈 항목은 아이콘만 표시하고 텍스트는 표시하지 않음
                ) : (
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
