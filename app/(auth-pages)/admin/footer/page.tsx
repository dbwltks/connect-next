"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { supabase } from "@/db";
import { Loader2, Save } from "lucide-react";

interface IFooterSettings {
  id: string;
  church_name: string;
  church_slogan: string;
  address: string;
  phone: string;
  email: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  sunday_service_1: string;
  sunday_service_2: string;
  wednesday_service: string;
  friday_service: string;
  copyright_text: string;
}

export default function FooterSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<IFooterSettings>({
    id: "",
    church_name: "",
    church_slogan: "",
    address: "",
    phone: "",
    email: "",
    facebook_url: "",
    instagram_url: "",
    youtube_url: "",
    sunday_service_1: "",
    sunday_service_2: "",
    wednesday_service: "",
    friday_service: "",
    copyright_text: "",
  });

  // 푸터 설정 불러오기
  useEffect(() => {
    async function fetchFooterSettings() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("footer_settings")
          .select("*")
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error("푸터 설정을 불러오는 중 오류가 발생했습니다:", error);
        toast({
          title: "오류",
          description: "푸터 설정을 불러오는 중 문제가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchFooterSettings();
  }, [toast]);

  // 입력 필드 변경 처리
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 푸터 설정 저장
  const handleSave = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase.from("footer_settings").upsert({
        id: settings.id,
        church_name: settings.church_name,
        church_slogan: settings.church_slogan,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        facebook_url: settings.facebook_url,
        instagram_url: settings.instagram_url,
        youtube_url: settings.youtube_url,
        sunday_service_1: settings.sunday_service_1,
        sunday_service_2: settings.sunday_service_2,
        wednesday_service: settings.wednesday_service,
        friday_service: settings.friday_service,
        copyright_text: settings.copyright_text,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "저장 완료",
        description: "푸터 설정이 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error("푸터 설정 저장 중 오류가 발생했습니다:", error);
      toast({
        title: "저장 실패",
        description: "푸터 설정을 저장하는 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">푸터 관리</h1>
        <p className="text-muted-foreground mt-2">
          웹사이트 하단에 표시되는 푸터 정보를 관리합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>교회 기본 정보</CardTitle>
          <CardDescription>교회 이름과 슬로건을 설정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="church_name">교회 이름</Label>
              <Input
                id="church_name"
                name="church_name"
                value={settings.church_name}
                onChange={handleChange}
                placeholder="교회 이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="church_slogan">교회 슬로건</Label>
              <Input
                id="church_slogan"
                name="church_slogan"
                value={settings.church_slogan}
                onChange={handleChange}
                placeholder="교회 슬로건을 입력하세요"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>연락처 정보</CardTitle>
          <CardDescription>
            교회 주소와 연락처 정보를 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">주소</Label>
            <Input
              id="address"
              name="address"
              value={settings.address}
              onChange={handleChange}
              placeholder="교회 주소를 입력하세요"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                placeholder="전화번호를 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                placeholder="이메일 주소를 입력하세요"
                type="email"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>소셜 미디어</CardTitle>
          <CardDescription>교회 소셜 미디어 링크를 설정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="facebook_url">페이스북</Label>
              <Input
                id="facebook_url"
                name="facebook_url"
                value={settings.facebook_url}
                onChange={handleChange}
                placeholder="페이스북 URL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_url">인스타그램</Label>
              <Input
                id="instagram_url"
                name="instagram_url"
                value={settings.instagram_url}
                onChange={handleChange}
                placeholder="인스타그램 URL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube_url">유튜브</Label>
              <Input
                id="youtube_url"
                name="youtube_url"
                value={settings.youtube_url}
                onChange={handleChange}
                placeholder="유튜브 URL"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>예배 시간</CardTitle>
          <CardDescription>교회 예배 시간을 설정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sunday_service_1">주일 1부 예배</Label>
              <Input
                id="sunday_service_1"
                name="sunday_service_1"
                value={settings.sunday_service_1}
                onChange={handleChange}
                placeholder="예: 오전 9:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sunday_service_2">주일 2부 예배</Label>
              <Input
                id="sunday_service_2"
                name="sunday_service_2"
                value={settings.sunday_service_2}
                onChange={handleChange}
                placeholder="예: 오전 11:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wednesday_service">수요 예배</Label>
              <Input
                id="wednesday_service"
                name="wednesday_service"
                value={settings.wednesday_service}
                onChange={handleChange}
                placeholder="예: 오후 7:30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="friday_service">금요 기도회</Label>
              <Input
                id="friday_service"
                name="friday_service"
                value={settings.friday_service}
                onChange={handleChange}
                placeholder="예: 오후 8:00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>저작권 정보</CardTitle>
          <CardDescription>
            푸터에 표시될 저작권 정보를 설정합니다. {"{year}"}는 현재 연도로
            자동 대체됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="copyright_text">저작권 텍스트</Label>
            <Input
              id="copyright_text"
              name="copyright_text"
              value={settings.copyright_text}
              onChange={handleChange}
              placeholder="예: © {year} 커넥트 교회. All rights reserved."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? "저장 중..." : "저장하기"}
        </Button>
      </div>
    </div>
  );
}
