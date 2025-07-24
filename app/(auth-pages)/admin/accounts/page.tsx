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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Plus,
  Users,
  UserPlus,
  X,
  Settings,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// 역할 타입 정의
type Role = {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  level: number;
};

// 사용자 역할 타입 정의
type UserRole = {
  id: string;
  role_id: string;
  assigned_at: string;
  is_active: boolean;
  roles: Role;
};

// 사용자 타입 정의
type User = {
  id: string;
  username: string;
  nickname?: string;
  email?: string;
  role: string; // 레거시 단일 역할 (하위 호환성)
  roles?: string[]; // 새로운 JSON 역할 배열
  user_roles?: UserRole[]; // 구버전 호환성
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  is_approved: boolean;
  linked_member?: Member | null;
  permissions_count?: number;
};

// 교인 타입 정의
type Member = {
  id: string;
  first_name: string;
  last_name: string;
  korean_name?: string;
  email?: string;
  user_id?: string | null;
};

// 폼 데이터 타입 정의
type UserFormData = {
  username: string;
  password: string;
  role: string; // 레거시 지원
  roles: string[]; // JSON 역할 배열
  is_active: boolean;
};

export default function AccountsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [unlinkedMembers, setUnlinkedMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    password: "",
    role: "member",
    roles: [],
    is_active: true,
  });
  const [loading, setLoading] = useState(true);

  // 역할 목록 가져오기
  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/admin/roles");
      if (response.ok) {
        const data = await response.json();
        setAvailableRoles(data.roles || []);
      }
    } catch (error) {
      console.error("역할 목록 가져오기 오류:", error);
    }
  };

  // 사용자 목록 가져오기 (다중 역할 지원)
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // API를 통해 사용자 목록 가져오기 (다중 역할 포함)
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("사용자 목록 가져오기 실패");
      
      const data = await response.json();
      const userData = data.users || [];

      // 교인 목록 가져오기
      const { data: memberData, error: memberError } = await createClient()
        .from("members")
        .select("id, first_name, last_name, korean_name, email, user_id")
        .not("user_id", "is", null);

      if (memberError) throw memberError;

      // 사용자와 교인 정보 연결
      const usersWithMembers = userData.map((user: any) => {
        const linkedMember =
          memberData?.find((member: any) => member.user_id === user.id) || null;
        return { ...user, linked_member: linkedMember };
      });

      setUsers(usersWithMembers);
      setFilteredUsers(usersWithMembers);
    } catch (error) {
      console.error("사용자 목록 가져오기 오류:", error);
      toast({
        title: "오류",
        description: "사용자 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 연결되지 않은 교인 목록 가져오기
  const fetchUnlinkedMembers = async () => {
    try {
      const { data, error } = await createClient()
        .from("members")
        .select("id, first_name, last_name, korean_name, email, user_id")
        .is("user_id", null);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("연결되지 않은 교인 목록 가져오기 오류:", error);
      toast({
        title: "오류",
        description: "교인 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return [];
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  // 검색어 변경 시 필터링
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      role: "member",
      roles: [],
      is_active: true,
    });
    setCurrentUser(null);
  };

  // 사용자 추가 핸들러
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await createClient()
        .from("users")
        .insert([
          {
            username: formData.username,
            password: formData.password, // 실제로는 암호화 필요
            role: formData.role,
            roles: formData.roles.length > 0 ? formData.roles : [formData.role],
            is_active: formData.is_active,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: "계정 추가 성공",
        description: `${formData.username} 계정이 추가되었습니다.`,
      });

      resetForm();
      setOpenUserDialog(false);
      fetchUsers();
    } catch (error: any) {
      console.error("계정 추가 중 오류 발생:", error.message);
      toast({
        title: "계정 추가 실패",
        description: `오류가 발생했습니다: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // 사용자 수정 핸들러
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const updateData: any = {
        username: formData.username,
        role: formData.role,
        roles: formData.roles,
        is_active: formData.is_active,
      };

      // 비밀번호가 입력된 경우에만 업데이트
      if (formData.password.trim() !== "") {
        updateData.password = formData.password; // 실제로는 암호화 필요
      }

      const { error } = await createClient()
        .from("users")
        .update(updateData)
        .eq("id", currentUser.id);

      if (error) throw error;

      toast({
        title: "계정 정보 업데이트 성공",
        description: `${formData.username} 계정 정보가 업데이트되었습니다.`,
      });

      setOpenUserDialog(false);
      fetchUsers();
    } catch (error: any) {
      console.error("계정 정보 업데이트 중 오류 발생:", error.message);
      toast({
        title: "계정 정보 업데이트 실패",
        description: `오류가 발생했습니다: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // 사용자 삭제 핸들러
  const handleDeleteUser = async () => {
    if (!currentUser) return;

    try {
      // 먼저 연결된 members 테이블의 user_id를 null로 설정
      await createClient()
        .from("members")
        .update({ user_id: null })
        .eq("user_id", currentUser.id);

      // 그 다음 사용자 삭제
      const { error } = await createClient()
        .from("users")
        .delete()
        .eq("id", currentUser.id);

      if (error) throw error;

      toast({
        title: "계정 삭제 성공",
        description: `${currentUser.username} 계정이 삭제되었습니다.`,
      });

      setOpenDeleteDialog(false);
      fetchUsers();
    } catch (error: any) {
      console.error("계정 삭제 중 오류 발생:", error.message);
      toast({
        title: "계정 삭제 실패",
        description: `오류가 발생했습니다: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // 수정 다이얼로그 열기
  const openEdit = (user: User) => {
    setCurrentUser(user);
    const currentRoles = user.roles || (user.role ? [user.role] : []);
    setFormData({
      username: user.username,
      password: "", // 비밀번호는 빈 값으로 설정 (수정 시 입력한 경우에만 변경)
      role: user.role,
      roles: currentRoles,
      is_active: user.is_active,
    });
    setIsEditing(true);
    setOpenUserDialog(true);
  };

  // 삭제 다이얼로그 열기
  const openDelete = (user: User) => {
    setCurrentUser(user);
    setOpenDeleteDialog(true);
  };

  // 교인 연결 다이얼로그 열기
  const openLinkMember = async (user: User) => {
    setCurrentUser(user);
    const members = await fetchUnlinkedMembers();
    setUnlinkedMembers(members);
    setSelectedMemberId("");
    setOpenLinkDialog(true);
  };

  // 교인 연결 처리
  const handleLinkMember = async () => {
    if (!currentUser || !selectedMemberId) return;

    try {
      // 이전에 연결된 교인이 있으면 연결 해제
      if (currentUser.linked_member) {
        await createClient()
          .from("members")
          .update({ user_id: null })
          .eq("id", currentUser.linked_member.id);
      }

      // 새 교인 연결
      const { error } = await createClient()
        .from("members")
        .update({ user_id: currentUser.id })
        .eq("id", selectedMemberId);

      if (error) throw error;

      toast({
        title: "교인 연결 성공",
        description: `계정과 교인 정보가 연결되었습니다.`,
      });

      setOpenLinkDialog(false);
      fetchUsers();
    } catch (error: any) {
      console.error("교인 연결 중 오류 발생:", error.message);
      toast({
        title: "교인 연결 실패",
        description: `오류가 발생했습니다: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // 교인 연결 해제
  const handleUnlinkMember = async () => {
    if (!currentUser || !currentUser.linked_member) return;

    try {
      const { error } = await createClient()
        .from("members")
        .update({ user_id: null })
        .eq("id", currentUser.linked_member.id);

      if (error) throw error;

      toast({
        title: "교인 연결 해제 성공",
        description: `계정과 교인 정보의 연결이 해제되었습니다.`,
      });

      setOpenLinkDialog(false);
      fetchUsers();
    } catch (error: any) {
      console.error("교인 연결 해제 중 오류 발생:", error.message);
      toast({
        title: "교인 연결 해제 실패",
        description: `오류가 발생했습니다: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // 역할 관리 다이얼로그 열기
  const openRoleManagement = (user: User) => {
    setCurrentUser(user);
    // 현재 사용자의 역할들을 formData에 설정
    const currentRoles = user.roles || (user.role ? [user.role] : []);
    setFormData(prev => ({
      ...prev,
      roles: currentRoles
    }));
    setOpenRoleDialog(true);
  };

  // 사용자 역할 업데이트
  const handleUpdateUserRoles = async () => {
    if (!currentUser) return;

    console.log("역할 업데이트 요청:", {
      user_id: currentUser.id,
      roles: formData.roles,
      username: currentUser.username
    });

    try {
      const response = await fetch(`/api/admin/users/${currentUser.id}/roles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roles: formData.roles,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("역할 업데이트 에러 응답:", error);
        throw new Error(error.details || error.error || "역할 업데이트 실패");
      }

      toast({
        title: "역할 업데이트 성공",
        description: `${currentUser.username}의 역할이 업데이트되었습니다.`,
      });

      setOpenRoleDialog(false);
      fetchUsers();
    } catch (error: any) {
      console.error("역할 업데이트 중 오류 발생:", error.message);
      toast({
        title: "역할 업데이트 실패",
        description: `오류가 발생했습니다: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // 역할 체크박스 토글
  const toggleRole = (roleName: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleName)
        ? prev.roles.filter(name => name !== roleName)
        : [...prev.roles, roleName]
    }));
  };

  // 역할에 따른 표시 텍스트 (레거시 지원)
  const getRoleText = (role: string) => {
    const roleObj = availableRoles.find(r => r.name === role);
    return roleObj?.display_name || role;
  };

  // 사용자의 모든 역할 표시
  const getUserRolesDisplay = (user: User) => {
    if (user.roles && user.roles.length > 0) {
      return user.roles
        .map(roleName => {
          const roleObj = availableRoles.find(r => r.name === roleName);
          return roleObj?.display_name || roleName;
        })
        .join(", ");
    }
    // 레거시 단일 역할 지원
    return getRoleText(user.role);
  };

  // 사용자의 최고 레벨 역할 가져오기 (권한 계산용)
  const getUserHighestRole = (user: User) => {
    if (user.user_roles && user.user_roles.length > 0) {
      return user.user_roles.reduce((highest, current) => {
        return (current.roles?.level || 0) > (highest.roles?.level || 0) ? current : highest;
      });
    }
    return null;
  };

  // 승인 처리
  const handleApprove = async (userId: string) => {
    try {
      const { error } = await createClient()
        .from("users")
        .update({
          is_approved: true,
          role: "guest",
          approved_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "승인 완료",
        description: "사용자가 승인되었습니다.",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "승인 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 거부 처리
  const handleReject = async (userId: string) => {
    try {
      const { error } = await createClient()
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "거부 완료",
        description: "사용자 계정이 삭제되었습니다.",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "거부 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="container mx-auto py-4 md:py-6 lg:py-8 px-2 md:px-4 lg:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
            계정 관리
          </h1>
          <p className="text-sm md:text-base text-gray-500">
            시스템 계정을 관리하고 조회합니다.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto flex items-center justify-center gap-1"
          onClick={() => {
            resetForm();
            setIsEditing(false);
            setOpenUserDialog(true);
          }}
        >
          <UserPlus className="h-4 w-4" />
          계정 추가
        </Button>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="사용자명으로 검색..."
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
                <TableHead className="whitespace-nowrap">사용자명</TableHead>
                <TableHead className="hidden md:table-cell">역할</TableHead>
                <TableHead className="hidden lg:table-cell">생성일</TableHead>
                <TableHead className="hidden lg:table-cell">
                  마지막 로그인
                </TableHead>
                <TableHead className="hidden sm:table-cell">상태</TableHead>
                <TableHead className="hidden sm:table-cell">승인</TableHead>
                <TableHead className="text-right md:text-left">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    데이터를 불러오는 중...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {searchTerm
                      ? "검색 결과가 없습니다."
                      : "등록된 계정이 없습니다."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div>{user.username}</div>
                      {user.nickname && (
                        <div className="text-xs text-gray-500">
                          {user.nickname}
                        </div>
                      )}
                      {user.email && (
                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>
                      )}
                      <div className="md:hidden text-xs text-gray-500">
                        {getUserRolesDisplay(user)}
                      </div>
                      {user.linked_member && (
                        <div className="text-xs text-blue-600 mt-1">
                          연결된 교인: {user.linked_member.first_name}{" "}
                          {user.linked_member.last_name}
                          {user.linked_member.korean_name
                            ? ` (${user.linked_member.korean_name})`
                            : ""}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1">
                        <div>{getUserRolesDisplay(user)}</div>
                        {user.permissions_count !== undefined && (
                          <div className="text-xs text-gray-500">
                            권한: {user.permissions_count}개
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(user.last_login)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={
                          user.is_active ? "text-green-600" : "text-red-600"
                        }
                      >
                        {user.is_active ? "활성" : "비활성"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {user.role === "pending" || !user.is_approved ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700"
                            onClick={() => handleApprove(user.id)}
                          >
                            승인
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs bg-red-50 hover:bg-red-100 text-red-700"
                            onClick={() => handleReject(user.id)}
                          >
                            거부
                          </Button>
                        </div>
                      ) : (
                        <span className="text-green-600 text-xs">승인됨</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right md:text-left">
                      <div className="flex items-center justify-end md:justify-start gap-1 md:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(user)}
                          className="h-8 w-8"
                          title="계정 수정"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openRoleManagement(user)}
                          className="h-8 w-8"
                          title="역할 관리"
                        >
                          <Settings className="h-4 w-4 text-purple-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openLinkMember(user)}
                          className="h-8 w-8"
                          title="교인 연결"
                        >
                          <Users className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDelete(user)}
                          className="h-8 w-8"
                          title="계정 삭제"
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

      {/* 통합된 계정 다이얼로그 */}
      <Dialog open={openUserDialog} onOpenChange={setOpenUserDialog}>
        <DialogContent className="w-[95%] sm:max-w-[500px] max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "계정 정보 수정" : "새 계정 추가"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "계정 정보를 수정하세요."
                : "새로운 계정 정보를 입력하세요."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 py-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">사용자명</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {isEditing ? "비밀번호 (변경 시에만 입력)" : "비밀번호"}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">역할</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="역할 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="is_active">활성 계정</Label>
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenUserDialog(false)}>
              취소
            </Button>
            <Button onClick={isEditing ? handleEditUser : handleAddUser}>
              {isEditing ? "저장" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>계정 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>사용자명:</strong> {currentUser?.username}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 교인 연결 다이얼로그 */}
      <Dialog open={openLinkDialog} onOpenChange={setOpenLinkDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>교인 연결</DialogTitle>
            <DialogDescription>
              {currentUser?.username} 계정에 연결할 교인을 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {currentUser?.linked_member && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
                <p className="text-sm">
                  현재 연결된 교인:{" "}
                  <strong>
                    {currentUser.linked_member.first_name}{" "}
                    {currentUser.linked_member.last_name}
                  </strong>
                  {currentUser.linked_member.korean_name
                    ? ` (${currentUser.linked_member.korean_name})`
                    : ""}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnlinkMember}
                  className="mt-2"
                >
                  연결 해제
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="member-select">교인 선택</Label>
              <select
                id="member-select"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">교인을 선택하세요</option>
                {unlinkedMembers.map((member: any) => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                    {member.korean_name ? ` (${member.korean_name})` : ""}
                    {member.email ? ` - ${member.email}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenLinkDialog(false)}>
              취소
            </Button>
            <Button onClick={handleLinkMember} disabled={!selectedMemberId}>
              연결
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 역할 관리 다이얼로그 */}
      <Dialog open={openRoleDialog} onOpenChange={setOpenRoleDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>역할 관리</DialogTitle>
            <DialogDescription>
              {currentUser?.username}의 역할을 관리하세요. 여러 역할을 동시에 할당할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* 현재 역할 정보 */}
            {currentUser?.roles && currentUser.roles.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
                <h4 className="text-sm font-medium mb-2">현재 할당된 역할:</h4>
                <div className="space-y-1">
                  {currentUser.roles.map((roleName) => {
                    const role = availableRoles.find(r => r.name === roleName);
                    return (
                      <div key={roleName} className="text-sm">
                        <span className="font-medium">
                          {role?.display_name || roleName}
                        </span>
                        <span className="text-gray-500 ml-2">
                          (레벨: {role?.level || 'N/A'})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 역할 선택 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">역할 선택</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableRoles
                  .sort((a, b) => b.level - a.level) // 레벨 높은 순으로 정렬
                  .map((role) => (
                    <div
                      key={role.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={formData.roles.includes(role.name)}
                        onCheckedChange={() => toggleRole(role.name)}
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`role-${role.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {role.display_name}
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          레벨: {role.level}
                        </p>
                        {role.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 권한 요약 정보 */}
            {formData.roles.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 rounded-md">
                <h4 className="text-sm font-medium mb-2">선택된 역할:</h4>
                <div className="text-sm space-y-1">
                  {formData.roles.map((roleName) => {
                    const role = availableRoles.find(r => r.name === roleName);
                    return role ? (
                      <div key={roleName}>
                        • {role.display_name} (레벨: {role.level})
                      </div>
                    ) : (
                      <div key={roleName}>
                        • {roleName}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  * 높은 레벨의 역할이 우선 적용됩니다.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenRoleDialog(false)}>
              취소
            </Button>
            <Button onClick={handleUpdateUserRoles}>
              역할 업데이트
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
