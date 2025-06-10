"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/db";
import { toast } from "@/components/ui/toaster";
import { Plus, Trash2, Upload, Image, Link as LinkIcon } from "lucide-react";
import MenuManager from "@/components/admin/menu-manager";
import SectionManager from "@/components/admin/section-manager";
import CategoryManager from "@/components/admin/category-manager";
import PageManager from "@/components/admin/page-manager";
import BannerManager from "@/components/admin/banner-manager";
import FooterManager from "@/components/admin/footer-manager";
import LayoutManager from "@/components/admin/layout-manager";

export default function HomepageManagementPage() {
  // 상태 관리
  const [activeTab, setActiveTab] = useState("sections");
  
  // 초기에 모든 컴포넌트를 로드하도록 설정
  const [componentsLoaded, setComponentsLoaded] = useState({
    layout: true, // 처음부터 모든 탭의 컴포넌트를 로드하도록 true로 초기화
    menus: true,
    banners: true,
    sections: true,
    categories: true,
    pages: true,
    footer: true,
  });

  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            홈페이지 CMS 관리
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            홈페이지 콘텐츠와 레이아웃을 관리합니다.
          </p>
        </div>

        <Card className="w-full min-w-0 p-0 shadow-none border border-gray-200 dark:border-gray-800">
          <Tabs
            defaultValue="sections"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="flex w-full gap-1 overflow-x-auto whitespace-nowrap rounded-t-lg bg-white dark:bg-gray-900 p-0 border-0">
              <TabsTrigger
                className="min-w-[72px] px-3 py-2 text-sm font-medium rounded-none border-b-2 border-transparent transition-colors data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-gray-50 data-[state=active]:font-bold"
                value="layout"
              >
                레이아웃
              </TabsTrigger>

              <TabsTrigger
                className="min-w-[72px] px-3 py-2 text-sm font-medium rounded-none border-b-2 border-transparent transition-colors data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-gray-50 data-[state=active]:font-bold"
                value="sections"
              >
                섹션
              </TabsTrigger>
              <TabsTrigger
                className="min-w-[72px] px-3 py-2 text-sm font-medium rounded-none border-b-2 border-transparent transition-colors data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-gray-50 data-[state=active]:font-bold"
                value="categories"
              >
                카테고리
              </TabsTrigger>
              <TabsTrigger
                className="min-w-[72px] px-3 py-2 text-sm font-medium rounded-none border-b-2 border-transparent transition-colors data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-gray-50 data-[state=active]:font-bold"
                value="pages"
              >
                페이지
              </TabsTrigger>
              <TabsTrigger
                className="min-w-[72px] px-3 py-2 text-sm font-medium rounded-none border-b-2 border-transparent transition-colors data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-gray-50 data-[state=active]:font-bold"
                value="menus"
              >
                메뉴
              </TabsTrigger>
              <TabsTrigger
                className="min-w-[72px] px-3 py-2 text-sm font-medium rounded-none border-b-2 border-transparent transition-colors data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-gray-50 data-[state=active]:font-bold"
                value="banners"
              >
                배너
              </TabsTrigger>
              <TabsTrigger
                className="min-w-[72px] px-3 py-2 text-sm font-medium rounded-none border-b-2 border-transparent transition-colors data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-gray-50 data-[state=active]:font-bold"
                value="footer"
              >
                푸터
              </TabsTrigger>
            </TabsList>
            <div className="border-b border-gray-200 dark:border-gray-800" />
            {/* 모든 컴포넌트를 항상 렌더링하고 CSS로 표시 여부를 제어 */}
            {/* 탭의 활성화 여부에 따라 display 속성으로 표시/숨김만 전환 */}
            
            {/* 레이아웃 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg pt-4 px-6 pb-6 border-0"
              value="layout"
            >
              <div>
                <LayoutManager />
              </div>
            </TabsContent>

            {/* 메뉴 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg pt-4 px-6 pb-6 border-0"
              value="menus"
            >
              <div>
                <MenuManager />
              </div>
            </TabsContent>
            
            {/* 배너 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg pt-4 px-6 pb-6 border-0"
              value="banners"
            >
              <div>
                <BannerManager />
              </div>
            </TabsContent>
            
            {/* 섹션 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg pt-4 px-6 pb-6 border-0"
              value="sections"
            >
              <div>
                <SectionManager />
              </div>
            </TabsContent>
            
            {/* 카테고리 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg pt-4 px-6 pb-6 border-0"
              value="categories"
            >
              <div>
                <CategoryManager />
              </div>
            </TabsContent>
            
            {/* 페이지 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg pt-4 px-6 pb-6 border-0"
              value="pages"
            >
              <div>
                <PageManager />
              </div>
            </TabsContent>
            
            {/* 푸터 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg pt-4 px-6 pb-6 border-0"
              value="footer"
            >
              <div>
                <FooterManager />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
