"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { CHART_STYLES } from "@/components/widgets/organization-chart-widget";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/hooks/use-toast";
import { WidgetSettingsComponentProps } from "./types";

export function OrganizationChartSettings({ widget, onSave, editingWidget, setEditingWidget }: WidgetSettingsComponentProps & { editingWidget?: any, setEditingWidget?: any }) {
  const currentWidget = editingWidget || widget;
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [memberImageUploading, setMemberImageUploading] = useState(false);
  const memberFileInputRef = useRef<HTMLInputElement>(null);

  const updateWidget = (updates: any) => {
    if (setEditingWidget) {
      setEditingWidget({
        ...currentWidget,
        ...updates,
      });
    }
  };

  // 조직원 관리 함수들
  const addOrUpdateMember = (memberData: any) => {
    let currentMembers = currentWidget.settings?.custom_data || [];

    if (editingMember && editingMember.id) {
      // 기존 멤버 수정 (id가 있는 경우)
      currentMembers = currentMembers.map((member: any) =>
        member.id === editingMember.id
          ? { ...memberData, id: editingMember.id }
          : member
      );
    } else {
      // 새 멤버 추가 (id가 없거나 editingMember가 빈 객체인 경우)
      const newMember = {
        ...memberData,
        id: Date.now().toString(),
      };
      currentMembers = [...currentMembers, newMember];
    }

    updateWidget({
      settings: {
        ...widget.settings,
        custom_data: currentMembers,
      },
    });

    setEditingMember(null);

    toast({
      title: editingMember && editingMember.id ? "조직원 수정 완료" : "조직원 추가 완료",
      description: `${memberData.name}님이 ${editingMember && editingMember.id ? "수정" : "추가"}되었습니다.`,
    });
  };

  const deleteMember = (memberId: string) => {
    const currentMembers = widget.settings?.custom_data || [];
    const updatedMembers = currentMembers.filter(
      (member: any) => member.id !== memberId
    );

    updateWidget({
      settings: {
        ...widget.settings,
        custom_data: updatedMembers,
      },
    });

    toast({
      title: "조직원 삭제 완료",
      description: "조직원이 삭제되었습니다.",
    });
  };

  // 조직원 순서 변경 함수 (위/아래 이동)
  const moveMember = (index: number, direction: "up" | "down") => {
    const currentData = [...(widget.settings?.custom_data || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= currentData.length) return;

    // 두 요소의 위치를 바꿈
    [currentData[index], currentData[newIndex]] = [
      currentData[newIndex],
      currentData[index],
    ];

    updateWidget({
      settings: {
        ...widget.settings,
        custom_data: currentData,
      },
    });

    toast({
      title: "순서 변경",
      description: `조직원이 ${direction === "up" ? "위로" : "아래로"} 이동되었습니다.`,
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">조직도 설정</h4>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">기본 설정</TabsTrigger>
          <TabsTrigger value="people">인사 관리</TabsTrigger>
          <TabsTrigger value="display">표시 옵션</TabsTrigger>
          <TabsTrigger value="style">스타일링</TabsTrigger>
        </TabsList>

        {/* 기본 설정 탭 */}
        <TabsContent value="basic" className="space-y-4 pt-4">
          <div>
            <Label htmlFor="chart-style">조직도 스타일</Label>
            <Select
              value={widget.settings?.chart_style || CHART_STYLES.TREE}
              onValueChange={(value) => {
                updateWidget({
                  settings: {
                    ...widget.settings,
                    chart_style: value,
                  },
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CHART_STYLES.TREE}>
                  트리형 (수직)
                </SelectItem>
                <SelectItem value={CHART_STYLES.HORIZONTAL}>
                  수평형
                </SelectItem>
                <SelectItem value={CHART_STYLES.COMPACT}>
                  컴팩트형
                </SelectItem>
                <SelectItem value={CHART_STYLES.CARDS}>
                  카드형 (그리드)
                </SelectItem>
                <SelectItem value={CHART_STYLES.DETAILED}>
                  상세라인형
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              조직도의 표시 방식을 선택합니다.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-description">조직도 설명</Label>
            <textarea
              id="org-description"
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={widget.settings?.description || ""}
              placeholder="조직도에 대한 간단한 설명을 입력하세요"
              onChange={(e) =>
                updateWidget({
                  settings: {
                    ...widget.settings,
                    description: e.target.value,
                  },
                })
              }
            />
          </div>
        </TabsContent>

        {/* 인사 관리 탭 */}
        <TabsContent value="people" className="space-y-4 pt-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-sm">
                현재 조직원 ({(widget.settings?.custom_data || []).length}명)
              </h5>
              <Button
                size="sm"
                onClick={() =>
                  setEditingMember(editingMember ? null : {})
                }
                className="h-7"
              >
                {editingMember && !editingMember.id
                  ? "취소"
                  : "+ 조직원 추가"}
              </Button>
            </div>

            {/* 조직원 목록 */}
            {(widget.settings?.custom_data || []).length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(widget.settings?.custom_data || []).map(
                  (member: any, index: number) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 bg-white rounded border"
                    >
                      {/* 프로필 이미지 */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                        {member.profile_image ? (
                          <img
                            src={member.profile_image}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                            {member.name?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>

                      {/* 멤버 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {member.position} | Level {member.level || 0}
                        </p>
                      </div>

                      {/* 컨트롤 버튼들 */}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveMember(index, "up")}
                          disabled={index === 0}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveMember(index, "down")}
                          disabled={index === (widget.settings?.custom_data || []).length - 1}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingMember(member)}
                          className="h-7 px-2"
                        >
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMember(member.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-6">
                조직원이 없습니다. 조직원을 추가해주세요.
              </p>
            )}
          </div>

          {/* 조직원 추가/수정 폼 */}
          {editingMember && (
            <MemberForm
              editingMember={editingMember}
              onSave={addOrUpdateMember}
              onCancel={() => setEditingMember(null)}
              memberImageUploading={memberImageUploading}
              setMemberImageUploading={setMemberImageUploading}
              memberFileInputRef={memberFileInputRef}
            />
          )}
        </TabsContent>

        {/* 표시 옵션 탭 */}
        <TabsContent value="display" className="space-y-4 pt-4">
          <p className="text-sm text-gray-500">
            표시 옵션 설정은 개발 중입니다.
          </p>
        </TabsContent>

        {/* 스타일링 탭 */}
        <TabsContent value="style" className="space-y-4 pt-4">
          <p className="text-sm text-gray-500">
            스타일링 설정은 개발 중입니다.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 멤버 추가/수정 폼 컴포넌트
interface MemberFormProps {
  editingMember: any;
  onSave: (memberData: any) => void;
  onCancel: () => void;
  memberImageUploading: boolean;
  setMemberImageUploading: (loading: boolean) => void;
  memberFileInputRef: React.RefObject<HTMLInputElement | null>;
}

function MemberForm({
  editingMember,
  onSave,
  onCancel,
  memberImageUploading,
  setMemberImageUploading,
  memberFileInputRef,
}: MemberFormProps) {
  const [name, setName] = useState(editingMember?.name || "");
  const [position, setPosition] = useState(editingMember?.position || "");
  const [department, setDepartment] = useState(editingMember?.department || "");
  const [email, setEmail] = useState(editingMember?.email || "");
  const [phone, setPhone] = useState(editingMember?.phone || "");
  const [level, setLevel] = useState(editingMember?.level || 0);
  const [profileImage, setProfileImage] = useState(editingMember?.profile_image || "");

  const handleImageUpload = async (file: File) => {
    try {
      setMemberImageUploading(true);
      const supabase = createClient();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `org_${timestamp}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      setProfileImage(publicUrl);
      
      toast({
        title: "이미지 업로드 성공",
        description: "프로필 이미지가 업로드되었습니다.",
      });
    } catch (error) {
      console.error("이미지 업로드 중 오류 발생:", error);
      toast({
        title: "이미지 업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setMemberImageUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "이름을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    const memberData = {
      name,
      position,
      department,
      email,
      phone,
      level,
      profile_image: profileImage,
    };

    onSave(memberData);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
      <h5 className="font-medium text-sm mb-4">
        {editingMember.id ? "조직원 정보 수정" : "새 조직원 추가"}
      </h5>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="member-name">이름 *</Label>
          <Input
            id="member-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="member-position">직책</Label>
          <Input
            id="member-position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="팀장"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="member-department">부서</Label>
          <Input
            id="member-department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="개발팀"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="member-level">레벨</Label>
          <Select value={level.toString()} onValueChange={(value) => setLevel(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="레벨 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Level 0 (최고 경영진)</SelectItem>
              <SelectItem value="1">Level 1 (임원진)</SelectItem>
              <SelectItem value="2">Level 2 (부서장)</SelectItem>
              <SelectItem value="3">Level 3 (팀장)</SelectItem>
              <SelectItem value="4">Level 4 (팀원)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="member-email">이메일</Label>
          <Input
            id="member-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hong@company.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="member-phone">연락처</Label>
          <Input
            id="member-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
          />
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <Label>프로필 이미지</Label>
        <div className="flex items-center gap-3">
          {profileImage && (
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
              <img
                src={profileImage}
                alt="프로필 미리보기"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => memberFileInputRef.current?.click()}
              disabled={memberImageUploading}
            >
              {memberImageUploading ? "업로드 중..." : "이미지 선택"}
            </Button>
            <input
              type="file"
              ref={memberFileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button onClick={handleSubmit} className="flex-1">
          {editingMember.id ? "수정 완료" : "추가하기"}
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          취소
        </Button>
      </div>
    </div>
  );
}