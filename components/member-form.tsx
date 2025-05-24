"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronRight } from "lucide-react";

// Member 타입 정의
export type Member = {
  id: string;
  first_name: string;
  last_name: string;
  korean_name?: string;
  gender?: string;
  email?: string;
  phone?: string;
  membership_status: string;
  infant_baptism_date?: string;
  adult_baptism_date?: string;
  membership_date?: string;
  wedding_date?: string;
  wedding_prayer?: string;
  occupation?: string;
  workplace?: string;
  education?: string;
  prayer_requests?: string;
  profile_image_url?: string;
  introducer_name?: string;
  notes?: string;
  address?: {
    street_address?: string;
    address_detail?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country?: string;
  };
};

// 폼 데이터 타입 정의
export type MemberFormData = {
  first_name: string;
  last_name: string;
  korean_name: string;
  gender: string;
  email: string;
  phone: string;
  membership_status: string;
  infant_baptism_date: string;
  adult_baptism_date: string;
  membership_date: string;
  wedding_date: string;
  wedding_prayer: string;
  occupation: string;
  workplace: string;
  education: string;
  prayer_requests: string;
  introducer_name: string;
  notes: string;
  street_address: string;
  address_detail: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
};

// MemberForm 컴포넌트 props 타입 정의
type MemberFormProps = {
  isEditing: boolean;
  formData: MemberFormData;
  setFormData: React.Dispatch<React.SetStateAction<MemberFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
};

export default function MemberForm({
  isEditing,
  formData,
  setFormData,
  onSubmit,
  onCancel,
}: MemberFormProps) {
  // 접었다 펼 수 있는 섹션 상태
  const [expandedSections, setExpandedSections] = useState<{
    baptism: boolean;
    wedding: boolean;
    address: boolean;
    additional: boolean;
  }>({
    baptism: false,
    wedding: false,
    address: false,
    additional: false,
  });

  // 입력 필드 변경 핸들러
  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    handleFieldChange(name, value);
  };

  // 텍스트 영역 변경 핸들러
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 선택 필드 변경 핸들러
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 주소 필드 변경 핸들러
  const handleAddressChange = (
    fieldName: string,
    value: string,
    addressData?: {
      street_address: string;
      address_detail?: string;
      city?: string;
      province?: string;
      postal_code?: string;
      country?: string;
    }
  ) => {
    if (addressData) {
      setFormData((prev) => ({
        ...prev,
        street_address: addressData.street_address || prev.street_address,
        address_detail: addressData.address_detail || prev.address_detail,
        city: addressData.city || prev.city,
        province: addressData.province || prev.province,
        postal_code: addressData.postal_code || prev.postal_code,
        country: addressData.country || prev.country,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 px-2">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">이름 (영문)</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">성 (영문)</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="korean_name">한글 이름</Label>
            <Input
              id="korean_name"
              name="korean_name"
              value={formData.korean_name}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">성별</Label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">선택 안함</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="membership_status">상태</Label>
          <select
            id="membership_status"
            name="membership_status"
            value={formData.membership_status}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="active">활동</option>
            <option value="inactive">비활동</option>
            <option value="visitor">방문자</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="membership_date">첫 방문일</Label>
          <Input
            id="membership_date"
            name="membership_date"
            type="date"
            value={formData.membership_date}
            onChange={handleInputChange}
          />
        </div>
        </div>
        
        {/* 세례 정보 섹션 */}
        <Collapsible
          open={expandedSections.baptism}
          onOpenChange={(open: boolean) => setExpandedSections({...expandedSections, baptism: open})}
          className="border rounded-md p-2"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 sm:p-4 rounded-md">
            <div className="flex items-center gap-2 font-medium">
              {expandedSections.baptism ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              세례 정보
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="infant_baptism_date">유아 세례일</Label>
                <Input
                  id="infant_baptism_date"
                  name="infant_baptism_date"
                  type="date"
                  value={formData.infant_baptism_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adult_baptism_date">성인 세례일</Label>
                <Input
                  id="adult_baptism_date"
                  name="adult_baptism_date"
                  type="date"
                  value={formData.adult_baptism_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* 결혼 정보 섹션 */}
        <Collapsible
          open={expandedSections.wedding}
          onOpenChange={(open: boolean) => setExpandedSections({...expandedSections, wedding: open})}
          className="border rounded-md p-2"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 sm:p-4 rounded-md">
            <div className="flex items-center gap-2 font-medium">
              {expandedSections.wedding ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              결혼 정보
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wedding_date">결혼일</Label>
                <Input
                  id="wedding_date"
                  name="wedding_date"
                  type="date"
                  value={formData.wedding_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wedding_prayer">주례자</Label>
                <Input
                  id="wedding_prayer"
                  name="wedding_prayer"
                  value={formData.wedding_prayer}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* 주소 정보 섹션 */}
        <Collapsible
          open={expandedSections.address}
          onOpenChange={(open: boolean) => setExpandedSections({...expandedSections, address: open})}
          className="border rounded-md p-2"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 sm:p-4 rounded-md">
            <div className="flex items-center gap-2 font-medium">
              {expandedSections.address ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              주소 정보
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-2">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <AddressAutocomplete
                    id={isEditing ? "edit_street_address" : "street_address"}
                    name="street_address"
                    label="주소 검색"
                    value={formData.street_address}
                    onChange={(value, addressData) => handleAddressChange("street_address", value, addressData)}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="address_detail">상세주소</Label>
                  <Input
                    id="address_detail"
                    name="address_detail"
                    value={formData.address_detail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">도시</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">주/도</Label>
                  <Input
                    id="province"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">우편번호</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">국가</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* 추가 정보 섹션 */}
        <Collapsible
          open={expandedSections.additional}
          onOpenChange={(open: boolean) => setExpandedSections({...expandedSections, additional: open})}
          className="border rounded-md p-2"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 sm:p-4 rounded-md">
            <div className="flex items-center gap-2 font-medium">
              {expandedSections.additional ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              추가 정보
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-2">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation">직업</Label>
                  <Input
                    id="occupation"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workplace">직장</Label>
                  <Input
                    id="workplace"
                    name="workplace"
                    value={formData.workplace}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="education">학력</Label>
                  <Input
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="introducer_name">인도자</Label>
                  <Input
                    id="introducer_name"
                    name="introducer_name"
                    value={formData.introducer_name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prayer_requests">기도 요청</Label>
                <Textarea
                  id="prayer_requests"
                  name="prayer_requests"
                  value={formData.prayer_requests}
                  onChange={handleTextareaChange}
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={isEditing ? "edit_notes" : "notes"}>메모</Label>
                <Textarea
                  id={isEditing ? "edit_notes" : "notes"}
                  name="notes"
                  value={formData.notes}
                  onChange={handleTextareaChange}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </form>
  );
}
