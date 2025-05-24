"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { supabase } from "@/db";

interface ServiceTime {
  id: string;
  name: string;
  time: string;
}

interface Address {
  id: string;
  name: string;
  value: string;
}

interface Phone {
  id: string;
  name: string;
  value: string;
}

interface FooterMenuItem {
  id: string;
  title: string;
  url: string;
  order_num: number;
  is_active: boolean;
  open_in_new_tab: boolean;
  parent_id?: string; // 부모 메뉴 ID (상위 메뉴의 경우 null 또는 undefined)
}

interface FooterSettings {
  church_name: string;
  church_slogan: string;
  address?: string; // 이전 버전 호환용
  phone?: string; // 이전 버전 호환용
  addresses: Address[];
  phones: Phone[];
  email: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  service_times: ServiceTime[];
  copyright_text: string;
}

export default function Footer() {
  const [isLoading, setIsLoading] = useState(true);
  const [footerMenus, setFooterMenus] = useState<FooterMenuItem[]>([
    {
      id: "1",
      title: "교회 소개",
      url: "/about",
      order_num: 1,
      is_active: true,
      open_in_new_tab: false,
    },
    {
      id: "2",
      title: "설교 말씀",
      url: "/sermons",
      order_num: 2,
      is_active: true,
      open_in_new_tab: false,
    },
    {
      id: "3",
      title: "교회 일정",
      url: "/events",
      order_num: 3,
      is_active: true,
      open_in_new_tab: false,
    },
    {
      id: "4",
      title: "소그룹 안내",
      url: "/groups",
      order_num: 4,
      is_active: true,
      open_in_new_tab: false,
    },
  ]);
  const [settings, setSettings] = useState<FooterSettings>({
    church_name: "커넥트 교회",
    church_slogan: "하나님과 사람, 사람과 사람을 연결하는 교회",
    address: "서울시 강남구 테헤란로 123",
    phone: "02-123-4567",
    addresses: [
      { id: "1", name: "본교회", value: "서울시 강남구 테헤란로 123" },
    ],
    phones: [{ id: "1", name: "대표번호", value: "02-123-4567" }],
    email: "info@connect-church.com",
    facebook_url: "https://facebook.com",
    instagram_url: "https://instagram.com",
    youtube_url: "https://youtube.com",
    service_times: [
      { id: "1", name: "주일 1부 예배", time: "오전 9:00" },
      { id: "2", name: "주일 2부 예배", time: "오전 11:00" },
      { id: "3", name: "수요 예배", time: "오후 7:30" },
      { id: "4", name: "금요 기도회", time: "오후 8:00" },
    ],
    copyright_text: "© {year} 커넥트 교회. All rights reserved.",
  });

  // 푸터 설정과 메뉴 불러오기 - 단순화된 버전
  useEffect(() => {
    // 기본 메뉴 설정 - 언제나 사용 가능하도록 설정
    const defaultMenus = [
      {
        id: "1",
        title: "교회 소개",
        url: "/about",
        order_num: 1,
        is_active: true,
        open_in_new_tab: false,
      },
      {
        id: "2",
        title: "설교 말씀",
        url: "/sermons",
        order_num: 2,
        is_active: true,
        open_in_new_tab: false,
      },
      {
        id: "3",
        title: "교회 일정",
        url: "/events",
        order_num: 3,
        is_active: true,
        open_in_new_tab: false,
      },
      {
        id: "4",
        title: "소그룹 안내",
        url: "/groups",
        order_num: 4,
        is_active: true,
        open_in_new_tab: false,
      },
    ];

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // 1. 푸터 설정 불러오기
        const { data: footerData, error: footerError } = await supabase
          .from("cms_footer")
          .select("*")
          .limit(1)
          .single();

        if (!footerError && footerData) {
          // service_times가 없거나 비어있는 배열인 경우 기본값 사용
          if (
            !footerData.service_times ||
            footerData.service_times.length === 0
          ) {
            footerData.service_times = settings.service_times;
          }
          setSettings(footerData);
        }

        // 2. 푸터 메뉴 불러오기 시도
        try {
          // 직접 푸터 메뉴 조회
          const { data: directMenus, error: directError } = await supabase
            .from("cms_menus")
            .select("*")
            .eq("is_active", true)
            .order("order_num", { ascending: true });

          if (directError) {
            console.error("메뉴 조회 오류:", directError);
            return;
          }

          // 일단 기본 메뉴 사용 - 언제나 화면에 무언가 표시되도록
          setFooterMenus(defaultMenus);

          if (!directMenus || directMenus.length === 0) {
            return; // 메뉴 데이터가 없으면 기본 메뉴 사용
          }

          // 메뉴 데이터 구조화 - 상위 메뉴와 하위 메뉴 모두 포함
          // 1. 상위 메뉴 찾기 (parent_id가 없는 항목)
          const parentMenus = directMenus.filter(
            (menu) => !menu.parent_id && menu.is_active === true
          );

          // 2. 구조화된 메뉴 데이터 생성
          const structuredMenus = [];

          // 각 상위 메뉴에 대해 처리
          for (const parentMenu of parentMenus) {
            // 상위 메뉴 추가
            structuredMenus.push(parentMenu);

            // 해당 상위 메뉴의 하위 메뉴 찾기
            const childMenus = directMenus.filter(
              (menu) =>
                menu.parent_id === parentMenu.id && menu.is_active === true
            );

            // 하위 메뉴가 있으면 추가
            if (childMenus && childMenus.length > 0) {
              structuredMenus.push(...childMenus);
            }
          }

          // 메뉴가 있으면 설정
          if (structuredMenus.length > 0) {
            setFooterMenus(structuredMenus); // 모든 메뉴 표시
            return;
          }

          // 3. 만약 구조화된 메뉴가 없는 경우, 모든 메뉴 사용
          if (directMenus.length > 0) {
            setFooterMenus(directMenus.slice(0, 12)); // 최대 12개만 표시
          }
        } catch (menuError) {
          console.error("메뉴 불러오기 오류:", menuError);
          // 기본 메뉴를 사용하므로 추가 조치 필요 없음
        }
      } catch (error) {
        console.error("푸터 데이터 불러오기 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 데이터 변환을 위한 객체
  const info = {
    name: settings.church_name,
    slogan: settings.church_slogan,
    address: settings.address,
    phone: settings.phone,
    addresses: settings.addresses || [],
    phones: settings.phones || [],
    email: settings.email,
    social_links: {
      facebook: settings.facebook_url,
      instagram: settings.instagram_url,
      youtube: settings.youtube_url,
    },
    service_times: settings.service_times,
  };

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t">
      <div className="container py-8">
        {/* 상단 그리드 - 메인 콘텐츠 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 교회 정보 */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              {info.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {info.slogan}
            </p>
            <div className="flex space-x-3 mt-2">
              <a
                href={info.social_links.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="hover:opacity-80 transition-opacity"
              >
                <Facebook className="h-4 w-4 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" />
              </a>
              <a
                href={info.social_links.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="hover:opacity-80 transition-opacity"
              >
                <Instagram className="h-4 w-4 text-gray-600 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400" />
              </a>
              <a
                href={info.social_links.youtube}
                target="_blank"
                rel="noreferrer"
                aria-label="Youtube"
                className="hover:opacity-80 transition-opacity"
              >
                <Youtube className="h-4 w-4 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" />
              </a>
            </div>
          </div>

          {/* 예배 시간 */}
          <div>
            <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">
              예배 시간
            </h3>
            <ul className="space-y-1">
              {info.service_times.map((service: ServiceTime) => (
                <li
                  key={service.id}
                  className="text-xs text-gray-600 dark:text-gray-400 py-0.5"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {service.name}:
                  </span>{" "}
                  {service.time}
                </li>
              ))}
            </ul>
          </div>

          {/* 연락처 */}
          <div>
            <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">
              주소 및 연락처
            </h3>
            <ul className="space-y-2">
              {/* 주소 정보 */}
              {info.addresses.map((address: Address) => (
                <li key={address.id} className="flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-600 mt-0.5" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {address.name && (
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {address.name}:{" "}
                      </span>
                    )}
                    {address.value}
                  </span>
                </li>
              ))}

              {/* 전화번호 정보 */}
              {info.phones.map((phone: Phone) => (
                <li key={phone.id} className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {phone.name}:
                    </span>{" "}
                    {phone.value}
                  </span>
                </li>
              ))}

              {/* 이메일 */}
              <li className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-blue-600" />
                <a
                  href={`mailto:${info.email}`}
                  className="text-xs text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  {info.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 바로가기 메뉴 - 하단으로 이동 */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 pb-4">
          <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-gray-200">
            바로가기
          </h3>

          {footerMenus && footerMenus.length > 0 ? (
            // 데이터베이스에서 가져온 메뉴 표시
            <div>
              {/* 상위 메뉴와 하위 메뉴 표시 - 유동적 레이아웃 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-4">
                {(() => {
                  // 1. 하위 메뉴가 있는 상위 메뉴 ID 목록 추출
                  const parentIdsWithChildren = new Set(
                    footerMenus
                      .filter((menu) => menu.parent_id)
                      .map((menu) => menu.parent_id)
                  );

                  // 2. 하위 메뉴가 있는 상위 메뉴들의 그룹 생성
                  const menuGroupsWithChildren = Array.from(
                    parentIdsWithChildren
                  )
                    .map((parentId) => {
                      const parentMenu = footerMenus.find(
                        (menu) => menu.id === parentId
                      );
                      if (!parentMenu) return null;

                      const childMenus = footerMenus.filter(
                        (menu) => menu.parent_id === parentId
                      );

                      return {
                        parent: parentMenu,
                        children: childMenus,
                      };
                    })
                    .filter(
                      (
                        group
                      ): group is {
                        parent: FooterMenuItem;
                        children: FooterMenuItem[];
                      } => group !== null
                    );

                  // 3. 하위 메뉴가 없는 상위 메뉴들의 그룹 생성
                  const menuGroupsWithoutChildren = footerMenus
                    .filter(
                      (menu) =>
                        !menu.parent_id && !parentIdsWithChildren.has(menu.id)
                    )
                    .map((menu) => ({
                      parent: menu,
                      children: [] as FooterMenuItem[],
                    }));

                  // 4. 모든 메뉴 그룹 합치기
                  const allMenuGroups = [
                    ...menuGroupsWithChildren,
                    ...menuGroupsWithoutChildren,
                  ];

                  // 5. 메뉴 정렬 (order_num 기준)
                  allMenuGroups.sort((a, b) => {
                    const orderA = a.parent.order_num || 0;
                    const orderB = b.parent.order_num || 0;
                    return orderA - orderB;
                  });

                  return allMenuGroups.map(
                    (group: {
                      parent: FooterMenuItem;
                      children: FooterMenuItem[];
                    }) => (
                      <div key={group.parent.id} className="mb-2">
                        {/* 상위 메뉴 */}
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 py-0.5">
                          {group.parent.url ? (
                            group.parent.open_in_new_tab ? (
                              <a
                                href={group.parent.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                {group.parent.title}
                              </a>
                            ) : (
                              <Link
                                href={group.parent.url}
                                className="hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                {group.parent.title}
                              </Link>
                            )
                          ) : (
                            group.parent.title
                          )}
                        </div>

                        {/* 하위 메뉴 */}
                        {group.children.length > 0 &&
                          group.children.map((childMenu: FooterMenuItem) => (
                            <div key={childMenu.id}>
                              {childMenu.open_in_new_tab ? (
                                <a
                                  href={childMenu.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs pl-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 block py-0.5"
                                >
                                  - {childMenu.title}
                                </a>
                              ) : (
                                <Link
                                  href={childMenu.url || "#"}
                                  className="text-xs pl-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 block py-0.5"
                                >
                                  - {childMenu.title}
                                </Link>
                              )}
                            </div>
                          ))}
                      </div>
                    )
                  );
                })()}
              </div>
            </div>
          ) : (
            // 기본 메뉴 (데이터가 없을 경우)
            <div>
              {/* 상위 메뉴 */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                <div>
                  <Link
                    href="/about"
                    className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block py-0.5"
                  >
                    교회 소개
                  </Link>
                </div>
                <div>
                  <Link
                    href="/sermons"
                    className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block py-0.5"
                  >
                    설교 말씀
                  </Link>
                </div>
                <div>
                  <Link
                    href="/events"
                    className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block py-0.5"
                  >
                    교회 일정
                  </Link>
                </div>
                <div>
                  <Link
                    href="/groups"
                    className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block py-0.5"
                  >
                    소그룹 안내
                  </Link>
                </div>
              </div>

              {/* 하위 메뉴 예시 - 유동적 레이아웃 */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div className="mb-2 min-w-[120px] max-w-[180px]">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 py-0.5">
                    교회 소개
                  </div>
                  <div>
                    <Link
                      href="/about/vision"
                      className="text-xs pl-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 block py-0.5"
                    >
                      - 교회 비전
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="/about/pastor"
                      className="text-xs pl-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 block py-0.5"
                    >
                      - 담임 목사
                    </Link>
                  </div>
                </div>
                <div className="mb-2 min-w-[120px] max-w-[180px]">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 py-0.5">
                    설교 말씀
                  </div>
                  <div>
                    <Link
                      href="/sermons/latest"
                      className="text-xs pl-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 block py-0.5"
                    >
                      - 최근 설교
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 저작권 및 설정 */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {settings.copyright_text.replace(
              "{year}",
              new Date().getFullYear().toString()
            )}
          </p>
          <div className="mt-3 md:mt-0 flex items-center gap-3">
            <ThemeSwitcher />
            <Link
              href="/privacy"
              className="text-xs text-gray-500 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400"
            >
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
