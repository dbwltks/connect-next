"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Search, X } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import MemberForm, { Member, MemberFormData } from "@/components/member-form";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<MemberFormData>({
    first_name: "",
    last_name: "",
    korean_name: "",
    gender: "",
    email: "",
    phone: "",
    membership_status: "active",
    infant_baptism_date: "",
    adult_baptism_date: "",
    membership_date: "",
    wedding_date: "",
    wedding_prayer: "",
    occupation: "",
    workplace: "",
    education: "",
    prayer_requests: "",
    introducer_name: "",
    notes: "",
    // 주소 정보
    street_address: "",
    address_detail: "",
    city: "",
    province: "",
    postal_code: "",
    country: "Canada",
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      setLoading(true);
      const { data, error } = await createClient()
        .from("members")
        .select("*")
        .order("first_name", { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setMembers(data);
      }
    } catch (error: any) {
      console.error("교인 목록을 불러오는 중 오류 발생:", error.message);
      toast({
        title: "오류",
        description: "교인 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      korean_name: "",
      gender: "",
      email: "",
      phone: "",
      membership_status: "active",
      infant_baptism_date: "",
      adult_baptism_date: "",
      membership_date: "",
      wedding_date: "",
      wedding_prayer: "",
      occupation: "",
      workplace: "",
      education: "",
      prayer_requests: "",
      introducer_name: "",
      notes: "",
      street_address: "",
      address_detail: "",
      city: "",
      province: "",
      postal_code: "",
      country: "Canada",
    });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: memberData, error: memberError } = await createClient()
        .from("members")
        .insert([
          {
            first_name: formData.first_name,
            last_name: formData.last_name,
            korean_name: formData.korean_name || null,
            gender: formData.gender || null,
            email: formData.email || null,
            phone: formData.phone || null,
            membership_status: formData.membership_status,
            infant_baptism_date: formData.infant_baptism_date || null,
            adult_baptism_date: formData.adult_baptism_date || null,
            membership_date: formData.membership_date || null,
            wedding_date: formData.wedding_date || null,
            wedding_prayer: formData.wedding_prayer || null,
            occupation: formData.occupation || null,
            workplace: formData.workplace || null,
            education: formData.education || null,
            prayer_requests: formData.prayer_requests || null,
            introducer_name: formData.introducer_name || null,
            notes: formData.notes || null,
          },
        ])
        .select()
        .single();

      if (memberError) throw memberError;

      // 주소 정보가 있는 경우 주소 추가
      if (
        formData.street_address &&
        formData.city &&
        formData.province &&
        formData.postal_code
      ) {
        const { data: addressData, error: addressError } = await createClient()
          .from("addresses")
          .insert([
            {
              street_address: formData.street_address,
              address_detail: formData.address_detail || null,
              city: formData.city,
              province: formData.province,
              postal_code: formData.postal_code,
              country: formData.country || "Canada",
            },
          ])
          .select()
          .single();

        if (addressError) throw addressError;

        // 교인과 주소 연결
        const { error: relationError } = await createClient()
          .from("member_addresses")
          .insert([
            {
              member_id: memberData.id,
              address_id: addressData.id,
              is_primary: true,
            },
          ]);

        if (relationError) throw relationError;
      }

      toast({
        title: "교인 추가 성공",
        description: `${formData.first_name} ${formData.last_name} 교인이 추가되었습니다.`,
      });

      resetForm();
      setOpenMemberDialog(false);
      fetchMembers();
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: "교인 추가 실패",
        description: `오류가 발생했습니다: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) return;

    try {
      const { error } = await createClient()
        .from("members")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          korean_name: formData.korean_name || null,
          gender: formData.gender || null,
          email: formData.email || null,
          phone: formData.phone || null,
          membership_status: formData.membership_status,
          infant_baptism_date: formData.infant_baptism_date || null,
          adult_baptism_date: formData.adult_baptism_date || null,
          membership_date: formData.membership_date || null,
          wedding_date: formData.wedding_date || null,
          wedding_prayer: formData.wedding_prayer || null,
          occupation: formData.occupation || null,
          workplace: formData.workplace || null,
          education: formData.education || null,
          prayer_requests: formData.prayer_requests || null,
          introducer_name: formData.introducer_name || null,
          notes: formData.notes || null,
        })
        .eq("id", currentMember.id);

      if (error) {
        throw error;
      }

      toast({
        title: "성공",
        description: "교인 정보가 업데이트되었습니다.",
      });

      resetForm();
      setOpenMemberDialog(false);
      fetchMembers();
    } catch (error: any) {
      console.error("교인 정보 업데이트 중 오류 발생:", error.message);
      toast({
        title: "오류",
        description: "교인 정보를 업데이트하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async () => {
    if (!currentMember) return;

    try {
      const { error } = await createClient()
        .from("members")
        .delete()
        .eq("id", currentMember.id);

      if (error) {
        throw error;
      }

      toast({
        title: "성공",
        description: "교인이 삭제되었습니다.",
      });

      setOpenDeleteDialog(false);
      fetchMembers();
    } catch (error: any) {
      console.error("교인 삭제 중 오류 발생:", error.message);
      toast({
        title: "오류",
        description: "교인을 삭제하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const openEdit = (member: Member) => {
    setCurrentMember(member);
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      korean_name: member.korean_name || "",
      gender: member.gender || "",
      email: member.email || "",
      phone: member.phone || "",
      membership_status: member.membership_status,
      infant_baptism_date: member.infant_baptism_date || "",
      adult_baptism_date: member.adult_baptism_date || "",
      membership_date: member.membership_date || "",
      wedding_date: member.wedding_date || "",
      wedding_prayer: member.wedding_prayer || "",
      occupation: member.occupation || "",
      workplace: member.workplace || "",
      education: member.education || "",
      prayer_requests: member.prayer_requests || "",
      introducer_name: member.introducer_name || "",
      notes: member.notes || "",
      // 주소 정보 (실제로는 관계 테이블에서 가져와야 함)
      street_address: member.address?.street_address || "",
      address_detail: member.address?.address_detail || "",
      city: member.address?.city || "",
      province: member.address?.province || "",
      postal_code: member.address?.postal_code || "",
      country: member.address?.country || "Canada",
    });
    setIsEditing(true);
    setOpenMemberDialog(true);
  };

  const openDelete = (member: Member) => {
    setCurrentMember(member);
    setOpenDeleteDialog(true);
  };

  const filteredMembers = members.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.first_name.toLowerCase().includes(searchLower) ||
      member.last_name.toLowerCase().includes(searchLower) ||
      (member.korean_name &&
        member.korean_name.toLowerCase().includes(searchLower)) ||
      (member.email && member.email.toLowerCase().includes(searchLower)) ||
      (member.phone && member.phone.includes(searchTerm))
    );
  });

  const getMembershipStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "활동";
      case "inactive":
        return "장기결석";
      case "transferred":
        return "이적";
      case "deceased":
        return "사망";
      default:
        return status;
    }
  };

  const getMembershipStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "inactive":
        return "text-yellow-600";
      case "transferred":
        return "text-blue-600";
      case "deceased":
        return "text-gray-600";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto py-4 md:py-6 lg:py-8 px-2 md:px-4 lg:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
            교인 관리
          </h1>
          <p className="text-sm md:text-base text-gray-500">
            교인 정보를 관리하고 조회합니다.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto flex items-center justify-center gap-1"
          onClick={() => {
            resetForm();
            setIsEditing(false);
            setOpenMemberDialog(true);
          }}
        >
          <Plus className="h-4 w-4" />
          교인 추가
        </Button>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="이름, 이메일, 전화번호로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-10"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="rounded-md border min-w-full md:min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">이름</TableHead>
                <TableHead className="hidden sm:table-cell">
                  한글 이름
                </TableHead>
                <TableHead className="hidden md:table-cell">이메일</TableHead>
                <TableHead className="hidden sm:table-cell">전화번호</TableHead>
                <TableHead className="hidden lg:table-cell">
                  멤버십 상태
                </TableHead>
                <TableHead className="hidden lg:table-cell">주소</TableHead>
                <TableHead className="text-right md:text-left">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {searchTerm
                      ? "검색 결과가 없습니다."
                      : "등록된 교인이 없습니다."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div>
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="sm:hidden text-xs text-gray-500">
                        {member.korean_name || ""}
                      </div>
                      <div className="md:hidden text-xs text-gray-500">
                        {member.email || ""}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {member.korean_name || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {member.email || "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {member.phone || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {member.membership_status}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {member.address
                        ? `${member.address.city}, ${member.address.province}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right md:text-left">
                      <div className="flex items-center justify-end md:justify-start gap-1 md:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(member)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDelete(member)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 통합된 회원 다이얼로그 */}
      <Dialog open={openMemberDialog} onOpenChange={setOpenMemberDialog}>
        <DialogContent className="w-[95%] sm:max-w-[700px] md:max-w-[800px] max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "교인 정보 수정" : "새 교인 추가"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "교인의 정보를 수정하세요."
                : "새로운 교인의 정보를 입력하세요."}
            </DialogDescription>
          </DialogHeader>
          <MemberForm
            isEditing={isEditing}
            formData={formData}
            setFormData={setFormData}
            onSubmit={(e) => e.preventDefault()} // 폼 제출 방지
            onCancel={() => setOpenMemberDialog(false)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenMemberDialog(false)}
            >
              취소
            </Button>
            <Button onClick={isEditing ? handleEditMember : handleAddMember}>
              {isEditing ? "저장" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>교인 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 교인을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          {currentMember && (
            <div className="py-4">
              <p>
                <strong>이름:</strong> {currentMember.first_name}{" "}
                {currentMember.last_name}
              </p>
              {currentMember.korean_name && (
                <p>
                  <strong>한글 이름:</strong> {currentMember.korean_name}
                </p>
              )}
              {currentMember.email && (
                <p>
                  <strong>이메일:</strong> {currentMember.email}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
