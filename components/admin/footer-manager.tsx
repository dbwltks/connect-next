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
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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

interface IFooterSettings {
  id: string;
  church_name: string;
  church_slogan: string;
  addresses: Address[];
  phones: Phone[];
  email: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  service_times: ServiceTime[];
  copyright_text: string;
  logo_url?: string;
  logo_or_name?: "logo" | "name";
  logo_fit?: "contain" | "cover";
  logo_height?: number;
}

export default function FooterManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<IFooterSettings>({
    id: "",
    church_name: "",
    church_slogan: "",
    addresses: [],
    phones: [],
    email: "",
    facebook_url: "",
    instagram_url: "",
    youtube_url: "",
    service_times: [],
    copyright_text: "",
    logo_url: "",
    logo_or_name: "name",
    logo_fit: "contain",
    logo_height: 40,
  });
  const [showLogoDialog, setShowLogoDialog] = useState(false);

  // 푸터 설정 불러오기
  useEffect(() => {
    async function fetchFooterSettings() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("cms_footer")
          .select("*")
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          setSettings({
            ...data,
            logo_url: data.settings?.logo_url || "",
            logo_or_name: data.settings?.logo_or_name || "name",
            logo_fit: data.settings?.logo_fit || "contain",
            logo_height: data.settings?.logo_height || 40,
          });
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
  }, []);

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

  // 예배 시간 변경 처리
  const handleServiceTimeChange = (
    id: string,
    field: "name" | "time",
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      service_times: prev.service_times.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  // 예배 시간 추가
  const addServiceTime = () => {
    setSettings((prev) => ({
      ...prev,
      service_times: [
        ...prev.service_times,
        { id: crypto.randomUUID(), name: "새 예배", time: "시간 입력" },
      ],
    }));
  };

  // 예배 시간 삭제
  const removeServiceTime = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      service_times: prev.service_times.filter((item) => item.id !== id),
    }));
  };

  // 주소 추가
  const addAddress = () => {
    setSettings((prev) => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        { id: crypto.randomUUID(), name: "", value: "" },
      ],
    }));
  };

  // 주소 삭제
  const removeAddress = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((item) => item.id !== id),
    }));
  };

  // 주소 변경 처리
  const handleAddressChange = (
    id: string,
    field: "name" | "value",
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      addresses: prev.addresses.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  // 전화번호 추가
  const addPhone = () => {
    setSettings((prev) => ({
      ...prev,
      phones: [
        ...prev.phones,
        { id: crypto.randomUUID(), name: "", value: "" },
      ],
    }));
  };

  // 전화번호 삭제
  const removePhone = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      phones: prev.phones.filter((item) => item.id !== id),
    }));
  };

  // 전화번호 변경 처리
  const handlePhoneChange = (
    id: string,
    field: "name" | "value",
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      phones: prev.phones.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  // 로고 업로드 핸들러
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Supabase Storage 업로드 예시
    const fileExt = file.name.split(".").pop();
    const fileName = `footer-logo-${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from("admin")
      .upload(`footer/${fileName}`, file, { upsert: true });
    if (error) {
      toast({
        title: "로고 업로드 실패",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    // public URL 생성
    const { data: urlData } = supabase.storage
      .from("admin")
      .getPublicUrl(`footer/${fileName}`);
    setSettings((prev) => ({ ...prev, logo_url: urlData?.publicUrl || "" }));
    toast({
      title: "로고 업로드 완료",
      description: "로고가 업로드되었습니다.",
    });
  };

  // 푸터 설정 저장
  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log("저장 시도 데이터:", {
        id: settings.id,
        church_name: settings.church_name,
        addresses: settings.addresses,
        phones: settings.phones,
        service_times: settings.service_times,
      });

      // service_times 검증 - 각 항목에 id가 없는 경우 추가
      const validServiceTimes = settings.service_times.map((item) => {
        if (!item.id) {
          return { ...item, id: crypto.randomUUID() };
        }
        return item;
      });

      // addresses 검증
      const validAddresses = settings.addresses.map((item) => {
        if (!item.id) {
          return { ...item, id: crypto.randomUUID() };
        }
        return item;
      });

      // phones 검증
      const validPhones = settings.phones.map((item) => {
        if (!item.id) {
          return { ...item, id: crypto.randomUUID() };
        }
        return item;
      });

      // 저장할 데이터 준비
      const dataToSave = {
        church_name: settings.church_name,
        church_slogan: settings.church_slogan,
        addresses: validAddresses,
        phones: validPhones,
        email: settings.email,
        facebook_url: settings.facebook_url,
        instagram_url: settings.instagram_url,
        youtube_url: settings.youtube_url,
        service_times: validServiceTimes,
        copyright_text: settings.copyright_text,
        settings: {
          logo_url: settings.logo_url,
          logo_or_name: settings.logo_or_name,
          logo_fit: settings.logo_fit,
          logo_height: settings.logo_height,
        },
      };

      let result;

      // ID가 없으면 새로 추가, 있으면 업데이트
      if (!settings.id) {
        result = await supabase.from("cms_footer").insert(dataToSave).select();
      } else {
        result = await supabase
          .from("cms_footer")
          .update(dataToSave)
          .eq("id", settings.id)
          .select();
      }

      if (result.error) {
        throw result.error;
      }

      // 성공 메시지 표시
      toast({
        title: "성공",
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
        <h2 className="text-2xl font-bold tracking-tight">푸터 관리</h2>
        <p className="text-muted-foreground mt-2">
          웹사이트 하단에 표시되는 푸터 정보를 관리합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>사이트명과 슬로건을 설정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="church_name">사이트명</Label>
              <Input
                id="church_name"
                name="church_name"
                value={settings.church_name}
                onChange={handleChange}
                placeholder="교회 이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="church_slogan">슬로건</Label>
              <Textarea
                id="church_slogan"
                name="church_slogan"
                value={settings.church_slogan}
                onChange={handleChange}
                placeholder="교회 슬로건을 입력하세요"
                className="resize-y min-h-[80px]"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLogoDialog(true)}
            >
              로고 설정
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 로고 설정 팝업 */}
      <Dialog open={showLogoDialog} onOpenChange={setShowLogoDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>로고 설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo_upload">로고 이미지</Label>
              <Input
                id="logo_upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
              />
            </div>
            {settings.logo_url && (
              <div className="mt-2">
                <img
                  src={settings.logo_url}
                  alt="로고 미리보기"
                  style={{
                    height: settings.logo_height
                      ? `${settings.logo_height}px`
                      : "40px",
                    width: "auto",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>로고/사이트명 표시</Label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="logo_or_name"
                    value="logo"
                    checked={settings.logo_or_name === "logo"}
                    onChange={() =>
                      setSettings((prev) => ({ ...prev, logo_or_name: "logo" }))
                    }
                  />
                  로고로 표시
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="logo_or_name"
                    value="name"
                    checked={settings.logo_or_name === "name"}
                    onChange={() =>
                      setSettings((prev) => ({ ...prev, logo_or_name: "name" }))
                    }
                  />
                  사이트명으로 표시
                </label>
              </div>
            </div>
            <div className="flex gap-4 mt-2 items-center">
              <Label className="text-xs">로고 비율</Label>
              <select
                value={settings.logo_fit}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    logo_fit: e.target.value as "contain" | "cover",
                  }))
                }
                className="border rounded px-2 py-1 text-xs"
              >
                <option value="contain">원본 비율(Contain)</option>
                <option value="cover">꽉 채우기(Cover)</option>
              </select>
              <Label className="text-xs ml-4">로고 높이(px)</Label>
              <Input
                type="number"
                min={20}
                max={200}
                value={settings.logo_height}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    logo_height: Number(e.target.value),
                  }))
                }
                className="w-20 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowLogoDialog(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>연락처 정보</CardTitle>
              <CardDescription>
                주소와 연락처 정보를 설정합니다.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 주소 정보 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-base font-medium">주소</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addAddress}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                주소 추가
              </Button>
            </div>

            {settings.addresses.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                주소 정보가 없습니다. 주소 추가 버튼을 클릭하여 주소를
                추가하세요.
              </div>
            ) : (
              <div className="space-y-4">
                {settings.addresses.map((address) => (
                  <div key={address.id} className="flex items-start gap-2">
                    <div className="grid gap-4 sm:grid-cols-2 flex-1">
                      <div className="space-y-2">
                        <Label htmlFor={`address-name-${address.id}`}>
                          이름
                        </Label>
                        <Input
                          value={address.name}
                          onChange={(e) =>
                            handleAddressChange(
                              address.id,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="주소 이름 (예: 본교회, 지교회)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`address-value-${address.id}`}>
                          주소
                        </Label>
                        <Input
                          value={address.value}
                          onChange={(e) =>
                            handleAddressChange(
                              address.id,
                              "value",
                              e.target.value
                            )
                          }
                          placeholder="주소를 입력하세요"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeAddress(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 전화번호 정보 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-base font-medium">전화번호</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addPhone}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                번호 추가
              </Button>
            </div>

            {settings.phones.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                전화번호 정보가 없습니다. 번호 추가 버튼을 클릭하여 전화번호를
                추가하세요.
              </div>
            ) : (
              <div className="space-y-3">
                {settings.phones.map((phone) => (
                  <div key={phone.id} className="flex items-start gap-2">
                    <div className="grid gap-4 sm:grid-cols-2 flex-1">
                      <div className="space-y-2">
                        <Label htmlFor={`phone-name-${phone.id}`}>이름</Label>
                        <Input
                          value={phone.name}
                          onChange={(e) =>
                            handlePhoneChange(phone.id, "name", e.target.value)
                          }
                          placeholder="전화번호 이름 (예: 대표번호)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`phone-value-${phone.id}`}>
                          전화번호
                        </Label>
                        <Input
                          value={phone.value}
                          onChange={(e) =>
                            handlePhoneChange(phone.id, "value", e.target.value)
                          }
                          placeholder="전화번호를 입력하세요"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removePhone(phone.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 이메일 */}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>소셜 미디어</CardTitle>
          <CardDescription>소셜 미디어 링크를 설정합니다.</CardDescription>
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>예배 시간</CardTitle>
              <CardDescription>교회 예배 시간을 설정합니다.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addServiceTime}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              예배 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.service_times.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              예배 시간 정보가 없습니다. 예배 추가 버튼을 클릭하여 예배 시간을
              추가하세요.
            </div>
          ) : (
            <div className="space-y-4">
              {settings.service_times.map((service, index) => (
                <div key={service.id} className="flex items-start gap-2">
                  <div className="grid gap-4 sm:grid-cols-2 flex-1">
                    <div className="space-y-2">
                      <Label htmlFor={`service-name-${service.id}`}>
                        예배 이름
                      </Label>
                      <Input
                        id={`service-name-${service.id}`}
                        value={service.name}
                        onChange={(e) =>
                          handleServiceTimeChange(
                            service.id,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="예: 주일 예배"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`service-time-${service.id}`}>
                        예배 시간
                      </Label>
                      <Input
                        id={`service-time-${service.id}`}
                        value={service.time}
                        onChange={(e) =>
                          handleServiceTimeChange(
                            service.id,
                            "time",
                            e.target.value
                          )
                        }
                        placeholder="예: 오전 11:00"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeServiceTime(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
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
