"use client";

import React, { useState, useEffect } from "react";
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
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "@/components/ui/toaster";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import MemberForm, { Member, MemberFormData } from "@/components/member-form";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // 정렬 상태
  const [sortField, setSortField] = useState<"name" | "korean_name" | "email">(
    "name"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [formData, setFormData] = useState<MemberFormData>({
    first_name: "",
    last_name: "",
    korean_name: "",
    birth_date: "",
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
      birth_date: "",
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
            birth_date: formData.birth_date || null,
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
          birth_date: formData.birth_date || null,
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
      birth_date: member.birth_date || "",
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

  // 정렬된 멤버 목록
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    let aValue: string;
    let bValue: string;

    switch (sortField) {
      case "name":
        aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
        bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
        break;
      case "korean_name":
        aValue = (a.korean_name || "").toLowerCase();
        bValue = (b.korean_name || "").toLowerCase();
        break;
      case "email":
        aValue = (a.email || "").toLowerCase();
        bValue = (b.email || "").toLowerCase();
        break;
      default:
        aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
        bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
    }

    if (sortDirection === "asc") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = sortedMembers.slice(startIndex, endIndex);

  // 검색어 변경 시 첫 페이지로 이동
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 페이지당 항목 수 변경 시 첫 페이지로 이동
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // 정렬 함수
  const handleSort = (field: "name" | "korean_name" | "email") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // 정렬 아이콘 컴포넌트
  const SortIcon = ({ field }: { field: "name" | "korean_name" | "email" }) => {
    if (sortField !== field) {
      return <div className="w-4 h-4 opacity-0" />; // 투명한 공간
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-muted-foreground" />
    ) : (
      <ChevronDown className="w-4 h-4 text-muted-foreground" />
    );
  };

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

  const getGenderText = (gender: string) => {
    switch (gender) {
      case "male":
        return "남성";
      case "female":
        return "여성";
      default:
        return "-";
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 h-10"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-2.5"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* 페이지당 항목 수 선택 */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10개</SelectItem>
              <SelectItem value="20">20개</SelectItem>
              <SelectItem value="30">30개</SelectItem>
              <SelectItem value="40">40개</SelectItem>
              <SelectItem value="50">50개</SelectItem>
              <SelectItem value="100">100개</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          총 {sortedMembers.length}명 중 {startIndex + 1}-
          {Math.min(endIndex, sortedMembers.length)}명 표시
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="rounded-md border min-w-full md:min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    영문 이름
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead
                  className="hidden sm:table-cell cursor-pointer hover:bg-muted/50 select-none transition-colors"
                  onClick={() => handleSort("korean_name")}
                >
                  <div className="flex items-center gap-1">
                    한글 이름
                    <SortIcon field="korean_name" />
                  </div>
                </TableHead>
                <TableHead
                  className="hidden md:table-cell cursor-pointer hover:bg-muted/50 select-none transition-colors"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-1">
                    이메일
                    <SortIcon field="email" />
                  </div>
                </TableHead>
                <TableHead className="hidden sm:table-cell">전화번호</TableHead>
                <TableHead className="hidden lg:table-cell">성별</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    {searchTerm
                      ? "검색 결과가 없습니다."
                      : "등록된 교인이 없습니다."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member: any) => (
                  <TableRow
                    key={member.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => openEdit(member)}
                  >
                    <TableCell className="font-medium">
                      <div>
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="sm:hidden text-xs text-muted-foreground">
                        {member.korean_name || ""}
                      </div>
                      <div className="md:hidden text-xs text-muted-foreground">
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
                      {getGenderText(member.gender)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.max(1, currentPage - 1));
                  }}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(pageNum);
                      }}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* 통합된 회원 다이얼로그 */}
      <Dialog open={openMemberDialog} onOpenChange={setOpenMemberDialog}>
        <DialogContent className="w-[95%] sm:max-w-[700px] md:max-w-[800px] max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{isEditing ? "교인 정보 수정" : "새 교인 추가"}</span>
              {isEditing && currentMember && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setOpenMemberDialog(false);
                    openDelete(currentMember);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  삭제
                </Button>
              )}
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
