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

// 타입 정의
type ChurchInfo = {
  id?: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  pastor_name: string;
  pastor_message: string;
  vision_statement: string;
  mission_statement: string;
  logo_url: string;
  banner_url: string;
  social_links: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
  service_times: {
    sunday1?: string;
    sunday2?: string;
    wednesday?: string;
    friday?: string;
  };
};

type Banner = {
  id?: string;
  title: string;
  subtitle: string;
  image_url: string;
  has_button: boolean;
  button_text?: string;
  button_url?: string;
  is_active: boolean;
  order_num: number;
};

type Section = {
  id?: string;
  title: string;
  content: string;
  image_url?: string;
  order: number;
  is_active: boolean;
  section_type: "welcome" | "about" | "services" | "events" | "custom";
};

export default function HomepageManagementPage() {
  // 상태 관리
  const [activeTab, setActiveTab] = useState("layout");
  const [isLoading, setIsLoading] = useState(false);
  const [churchInfo, setChurchInfo] = useState<ChurchInfo>({
    name: "커넥트 교회",
    description: "하나님과 사람, 사람과 사람을 연결하는 교회",
    address: "서울시 강남구 테헤란로 123",
    phone: "02-123-4567",
    email: "info@connect-church.com",
    pastor_name: "홍길동 목사",
    pastor_message: "하나님의 사랑으로 모든 이들을 환영합니다.",
    vision_statement: "모든 사람이 하나님과 연결되는 교회",
    mission_statement: "복음을 전하고 제자를 양육하며 지역사회를 섬기는 교회",
    logo_url: "",
    banner_url: "",
    social_links: {
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      youtube: "https://youtube.com",
    },
    service_times: {
      sunday1: "오전 9:00",
      sunday2: "오전 11:00",
      wednesday: "오후 7:30",
      friday: "오후 8:00",
    },
  });

  const [banners, setBanners] = useState<Banner[]>([
    {
      title: "주일 예배에 오신 것을 환영합니다",
      subtitle: "매주 일요일 오전 9시, 11시",
      image_url: "/images/church-banner.jpg",
      has_button: false,
      is_active: true,
      order_num: 1,
    },
  ]);

  const [sections, setSections] = useState<Section[]>([
    {
      title: "환영합니다",
      content:
        "커넥트 교회에 오신 것을 환영합니다. 저희 교회는 하나님의 사랑을 나누고 모든 사람들이 예수 그리스도를 통해 하나님과 연결되도록 돕는 것을 목표로 합니다.",
      image_url: "/images/welcome.jpg",
      order: 1,
      is_active: true,
      section_type: "welcome",
    },
    {
      title: "예배 시간",
      content:
        "주일 1부: 오전 9:00\n주일 2부: 오전 11:00\n수요 예배: 오후 7:30\n금요 기도회: 오후 8:00",
      image_url: "/images/services.jpg",
      order: 2,
      is_active: true,
      section_type: "services",
    },
  ]);

  const [newBanner, setNewBanner] = useState<Banner>({
    title: "",
    subtitle: "",
    image_url: "",
    has_button: false,
    button_text: "",
    button_url: "",
    is_active: true,
    order_num: 1,
  });

  const [newSection, setNewSection] = useState<Section>({
    title: "",
    content: "",
    image_url: "",
    order: 1,
    is_active: true,
    section_type: "custom",
  });

  // 교회 정보 가져오기
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("cms_banners")
          .select("*")
          .order("order_num", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // 데이터베이스 필드를 그대로 사용 (필드명이 일치함)
          setBanners(data);
          console.log("배너 데이터 로드 성공:", data);
        }
      } catch (error) {
        console.error("배너 가져오기 오류:", error);
      }
    };

    const fetchSections = async () => {
      try {
        const { data, error } = await supabase
          .from("cms_sections")
          .select("*")
          .order("order", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setSections(data);
        }
      } catch (error) {
        console.error("섹션 가져오기 오류:", error);
        // 오류가 발생해도 기본 섹션 데이터 유지
        // 기존 상태를 변경하지 않음
      }
    };
    fetchBanners();
    fetchSections();
  }, []);

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
            {/* 메뉴 관리 탭 */}
            {/* 레이아웃 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg p-6 mt-0 border-0 space-y-4 mt-0"
              value="layout"
            >
              <LayoutManager />
            </TabsContent>

            {/* 메뉴 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg p-6 mt-0 border-0 space-y-4 mt-0"
              value="menus"
            >
              <MenuManager />
            </TabsContent>
            {/* 배너 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg p-6 mt-0 border-0 space-y-4 mt-0"
              value="banners"
            >
              <BannerManager />
            </TabsContent>
            {/* 섹션 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg p-6 mt-0 border-0 space-y-4 mt-0"
              value="sections"
            >
              <SectionManager />
            </TabsContent>
            {/* 카테고리 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg p-6 mt-0 border-0 space-y-4 mt-0"
              value="categories"
            >
              <CategoryManager />
            </TabsContent>
            {/* 페이지 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg p-6 mt-0 border-0 space-y-4 mt-0"
              value="pages"
            >
              <PageManager />
            </TabsContent>
            {/* 푸터 관리 탭 */}
            <TabsContent
              className="bg-white dark:bg-gray-900 rounded-b-lg p-6 mt-0 border-0 space-y-4 mt-0"
              value="footer"
            >
              <FooterManager />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
