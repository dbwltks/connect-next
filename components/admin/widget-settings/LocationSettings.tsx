"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WidgetSettingsComponentProps } from "./types";

export function LocationSettings({ widget, onSave, pages = [] }: WidgetSettingsComponentProps) {
  const updateWidget = (updates: any) => {
    const updatedWidget = {
      ...widget,
      ...updates,
    };
    onSave(updatedWidget);
  };

  return (
    <div className="space-y-4 border rounded-md p-3 bg-gray-50">
      <h4 className="font-medium text-sm">위치 정보 설정</h4>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="location">위치</TabsTrigger>
          <TabsTrigger value="contact">연락처</TabsTrigger>
        </TabsList>

        {/* 기본 정보 설정 탭 */}
        <TabsContent value="info" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="location-title">위치 섹션 제목</Label>
            <Input
              id="location-title"
              value={widget.display_options?.location_title || ""}
              placeholder="위치 정보"
              onChange={(e) =>
                updateWidget({
                  display_options: {
                    ...widget.display_options,
                    location_title: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location-subtitle">위치 섹션 부제목</Label>
            <Input
              id="location-subtitle"
              value={widget.display_options?.location_subtitle || ""}
              placeholder="저희 위치와 연락처 정보입니다"
              onChange={(e) =>
                updateWidget({
                  display_options: {
                    ...widget.display_options,
                    location_subtitle: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location-page">
              연결할 페이지 선택 (선택사항)
            </Label>
            <Select
              value={widget.display_options?.page_id || ""}
              onValueChange={(value) =>
                updateWidget({
                  display_options: {
                    ...widget.display_options,
                    page_id: value,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="페이지 선택" />
              </SelectTrigger>
              <SelectContent>
                {pages.map((page: any) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              문의하기 버튼을 클릭했을 때 이동할 페이지를 선택하세요
            </p>
          </div>
        </TabsContent>

        {/* 위치 설정 탭 */}
        <TabsContent value="location" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="location-address">주소</Label>
            <textarea
              id="location-address"
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={widget.display_options?.address || ""}
              placeholder="상세 주소를 입력하세요"
              onChange={(e) =>
                updateWidget({
                  display_options: {
                    ...widget.display_options,
                    address: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location-map-url">지도 링크 URL</Label>
            <Input
              id="location-map-url"
              value={widget.display_options?.map_url || ""}
              placeholder="https://maps.google.com/..."
              onChange={(e) =>
                updateWidget({
                  display_options: {
                    ...widget.display_options,
                    map_url: e.target.value,
                  },
                })
              }
            />
            <p className="text-xs text-gray-500">
              지도 보기 링크로 사용됩니다 (예: 네이버 지도, 구글 지도 등 링크)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location-embed-map-url">
              임베드 지도 코드
            </Label>
            <textarea
              id="location-embed-map-url"
              className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={widget.display_options?.embed_map_url || ""}
              placeholder="<iframe src='https://www.google.com/maps/embed?...' width='600' height='450' style='border:0;' allowfullscreen='' loading='lazy' referrerpolicy='no-referrer-when-downgrade'></iframe>"
              onChange={(e) =>
                updateWidget({
                  display_options: {
                    ...widget.display_options,
                    embed_map_url: e.target.value,
                  },
                })
              }
            />
            <p className="text-xs text-gray-500">
              구글 지도 &gt; 공유 &gt; 지도 퍼가기에서 제공하는 iframe
              코드 전체를 붙여넣으세요. (iframe 태그 전체를 그대로
              복사하여 붙여넣으면 됩니다)
            </p>
          </div>
        </TabsContent>

        {/* 연락처 설정 탭 */}
        <TabsContent value="contact" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="location-phone">전화번호</Label>
            <Input
              id="location-phone"
              value={widget.display_options?.phone || ""}
              placeholder="02-1234-5678"
              onChange={(e) =>
                updateWidget({
                  display_options: {
                    ...widget.display_options,
                    phone: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location-email">이메일</Label>
            <Input
              id="location-email"
              type="email"
              value={widget.display_options?.email || ""}
              placeholder="contact@example.com"
              onChange={(e) =>
                updateWidget({
                  display_options: {
                    ...widget.display_options,
                    email: e.target.value,
                  },
                })
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}