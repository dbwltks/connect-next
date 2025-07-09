"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogClose,
} from "@/components/ui/dialog";
import { Search, Shield, Edit, Trash2, Plus, Users, Settings, Lock, Activity, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
  permissions_count?: number;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  level: number;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category: string;
  data_scope?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PermissionCategory {
  id: string;
  name: string;
  display_name: string;
  icon?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AccountsPermissions() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isEditPermissionDialogOpen, setIsEditPermissionDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PermissionCategory | null>(null);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const { toast } = useToast();

  // 통계 데이터
  const [reviewStats, setReviewStats] = useState({
    critical: 0,
    overdue: 0,
    high_risk: 0,
    total: 0,
  });
  const [auditStats, setAuditStats] = useState({
    today: 0,
    permissions: 0,
    failed: 0,
  });

  // 새 역할 폼 상태
  const [newRole, setNewRole] = useState({
    name: "",
    display_name: "",
    description: "",
    level: 0,
  });
  
  const [editingRole, setEditingRole] = useState({
    name: "",
    display_name: "",
    description: "",
    level: 0,
  });
  
  // 새 권한 폼 상태
  const [newPermission, setNewPermission] = useState({
    name: '',
    display_name: '',
    category: '',
    data_scope: 'all',
    description: '',
  });
  
  // 새 카테고리 폼 상태
  const [newCategory, setNewCategory] = useState({
    name: '',
    display_name: '',
    icon: '',
    description: '',
    display_order: 0,
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadPermissions();
    loadCategories();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("사용자 목록 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await fetch("/api/admin/roles");
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
      }
    } catch (error) {
      console.error("역할 목록 로딩 실패:", error);
    } finally {
      setRolesLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const response = await fetch("/api/admin/permissions");
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error("권한 목록 로딩 실패:", error);
    }
  };
  
  const loadCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("카테고리 목록 로딩 실패:", error);
    }
  };

  const loadStats = async () => {
    try {
      // 권한 리뷰 통계 로드
      const reviewResponse = await fetch("/api/admin/permissions/review");
      if (reviewResponse.ok) {
        const reviewData = await reviewResponse.json();
        const stats = {
          critical: reviewData.users.filter((u: any) => u.review_priority === 'critical').length,
          overdue: reviewData.users.filter((u: any) => u.days_since_review >= 90).length,
          high_risk: reviewData.users.filter((u: any) => u.risk_score >= 80).length,
          total: reviewData.users.length,
        };
        setReviewStats(stats);
      }

      // 감사 로그 통계 로드
      const auditResponse = await fetch("/api/admin/audit-logs");
      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        if (auditData.statistics) {
          setAuditStats({
            today: auditData.statistics.total_24h || 0,
            permissions: auditData.statistics.permission_related || 0,
            failed: 0,
          });
        }
      }
    } catch (error) {
      console.error("통계 로딩 실패:", error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateCategory = async () => {
    try {
      if (!newCategory.name || !newCategory.display_name) {
        toast({
          title: "오류",
          description: "필수 필드를 입력해주세요.",
          variant: "destructive",
        });
        return;
      }

      const method = selectedCategory ? 'PUT' : 'POST';
      const url = '/api/admin/categories';
      const body = selectedCategory 
        ? { id: selectedCategory.id, ...newCategory }
        : newCategory;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: "성공",
          description: `카테고리가 ${selectedCategory ? '수정' : '추가'}되었습니다.`,
        });
        setIsEditCategoryDialogOpen(false);
        loadCategories();
      } else {
        const errorData = await response.json();
        toast({
          title: "오류",
          description: errorData.error || "카테고리 처리에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('카테고리 처리 오류:', error);
      toast({
        title: "오류",
        description: "카테고리 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/categories?id=${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "성공",
          description: "카테고리가 삭제되었습니다.",
        });
        loadCategories();
      } else {
        const errorData = await response.json();
        toast({
          title: "오류",
          description: errorData.error || "카테고리 삭제에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
      toast({
        title: "오류",
        description: "카테고리 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleCreatePermission = async () => {
    try {
      if (!newPermission.name || !newPermission.display_name || !newPermission.category) {
        toast({
          title: "오류",
          description: "필수 필드를 입력해주세요.",
          variant: "destructive",
        });
        return;
      }

      const method = selectedPermission ? 'PUT' : 'POST';
      const url = '/api/admin/permissions';
      const body = selectedPermission 
        ? { id: selectedPermission.id, ...newPermission }
        : newPermission;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: "성공",
          description: `권한이 ${selectedPermission ? '수정' : '추가'}되었습니다.`,
        });
        setIsEditPermissionDialogOpen(false);
        loadPermissions();
      } else {
        const errorData = await response.json();
        toast({
          title: "오류",
          description: errorData.error || "권한 처리에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('권한 처리 오류:', error);
      toast({
        title: "오류",
        description: "권한 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm('이 권한을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/permissions?id=${permissionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "성공",
          description: "권한이 삭제되었습니다.",
        });
        loadPermissions();
      } else {
        const errorData = await response.json();
        toast({
          title: "오류",
          description: errorData.error || "권한 삭제에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('권한 삭제 오류:', error);
      toast({
        title: "오류",
        description: "권한 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleCreateRole = async (roleData?: any) => {
    try {
      const dataToUse = roleData || newRole;
      
      if (!dataToUse.name || !dataToUse.display_name) {
        toast({
          title: "오류",
          description: "필수 필드를 입력해주세요.",
          variant: "destructive",
        });
        return;
      }

      const method = dataToUse.id ? 'PUT' : 'POST';
      const url = '/api/admin/roles';
      const body = dataToUse;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: "성공",
          description: `역할이 ${dataToUse.id ? '수정' : '추가'}되었습니다.`,
        });
        if (!dataToUse.id) {
          setIsRoleDialogOpen(false);
        }
        loadRoles();
      } else {
        const errorData = await response.json();
        toast({
          title: "오류",
          description: errorData.error || "역할 처리에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('역할 처리 오류:', error);
      toast({
        title: "오류",
        description: "역할 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('이 역할을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/roles?id=${roleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "성공",
          description: "역할이 삭제되었습니다.",
        });
        loadRoles();
      } else {
        const errorData = await response.json();
        toast({
          title: "오류",
          description: errorData.error || "역할 삭제에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('역할 삭제 오류:', error);
      toast({
        title: "오류",
        description: "역할 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    const roleConfig = {
      admin: { color: "bg-red-100 text-red-800" },
      pastor: { color: "bg-purple-100 text-purple-800" },
      elder: { color: "bg-blue-100 text-blue-800" },
      teacher: { color: "bg-green-100 text-green-800" },
      member: { color: "bg-gray-100 text-gray-800" },
    };
    
    const config = roleConfig[roleName as keyof typeof roleConfig] || roleConfig.member;
    
    return (
      <Badge className={config.color}>
        {role?.display_name || roleName}
      </Badge>
    );
  };

  if (loading || rolesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">계정 권한 관리</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i: any) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">계정 권한 관리</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">사용자 관리</TabsTrigger>
          <TabsTrigger value="roles">역할 관리</TabsTrigger>
          <TabsTrigger value="permissions">권한 관리</TabsTrigger>
          <TabsTrigger value="categories">카테고리</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">사용자 관리</h2>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedUser(null);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  새 사용자 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 사용자 추가</DialogTitle>
                  <DialogDescription>
                    시스템에 새로운 사용자를 추가합니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">사용자명</Label>
                      <Input
                        id="username"
                        placeholder="사용자명을 입력하세요"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">이메일</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="이메일을 입력하세요"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="role">역할</Label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="">역할 선택</option>
                      {roles.map((role: any) => (
                        <option key={role.id} value={role.name}>
                          {role.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">
                      취소
                    </Button>
                  </DialogClose>
                  <Button onClick={() => {
                    toast({
                      title: "개발 중",
                      description: "사용자 추가 기능은 개발 중입니다.",
                    });
                    setIsEditDialogOpen(false);
                  }}>
                    추가
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">관리자</p>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">목사</p>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === 'pastor').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">장로</p>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === 'elder').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">전체 사용자</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>사용자 권한 관리</CardTitle>
              <CardDescription>
                사용자의 역할과 권한을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 검색 및 필터 */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="사용자명 또는 이메일로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="역할로 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 역할</SelectItem>
                    {roles.map((role: any) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 사용자 목록 테이블 */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사용자명</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead>최근 로그인</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString()
                          : "로그인 기록 없음"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>사용자 편집 - {user.username}</DialogTitle>
                                <DialogDescription>
                                  사용자의 정보와 역할을 수정합니다.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-username">사용자명</Label>
                                    <Input
                                      id="edit-username"
                                      defaultValue={user.username}
                                      placeholder="사용자명을 입력하세요"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-email">이메일</Label>
                                    <Input
                                      id="edit-email"
                                      type="email"
                                      defaultValue={user.email}
                                      placeholder="이메일을 입력하세요"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="edit-role">역할</Label>
                                  <select className="w-full p-2 border rounded-md" defaultValue={user.role}>
                                    {roles.map((role: any) => (
                                      <option key={role.id} value={role.name}>
                                        {role.display_name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>가입일</Label>
                                    <p className="text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <Label>최근 로그인</Label>
                                    <p className="text-sm text-gray-600">
                                      {user.last_login 
                                        ? new Date(user.last_login).toLocaleDateString()
                                        : "로그인 기록 없음"
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">
                                    취소
                                  </Button>
                                </DialogClose>
                                <Button onClick={() => {
                                  toast({
                                    title: "개발 중",
                                    description: "사용자 편집 기능은 개발 중입니다.",
                                  });
                                }}>
                                  저장
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">역할 관리</h2>
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedRole(null);
                  setNewRole({
                    name: "",
                    display_name: "",
                    description: "",
                    level: 0,
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  새 역할 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedRole ? '역할 수정' : '새 역할 추가'}
                  </DialogTitle>
                  <DialogDescription>
                    시스템에서 사용할 역할을 {selectedRole ? '수정' : '추가'}합니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role-name">역할 이름</Label>
                      <Input
                        id="role-name"
                        value={newRole.name}
                        onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                        placeholder="예: manager"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role-display-name">표시 이름</Label>
                      <Input
                        id="role-display-name"
                        value={newRole.display_name}
                        onChange={(e) => setNewRole({...newRole, display_name: e.target.value})}
                        placeholder="예: 관리자"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="role-level">권한 레벨</Label>
                    <Input
                      id="role-level"
                      type="number"
                      value={newRole.level}
                      onChange={(e) => setNewRole({...newRole, level: parseInt(e.target.value) || 0})}
                      placeholder="0-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-description">설명</Label>
                    <Textarea
                      id="role-description"
                      value={newRole.description}
                      onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                      placeholder="역할에 대한 설명을 입력하세요..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">
                      취소
                    </Button>
                  </DialogClose>
                  <Button onClick={handleCreateRole}>
                    {selectedRole ? '수정' : '추가'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>역할 목록</CardTitle>
              <CardDescription>
                시스템에서 사용할 수 있는 역할들을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>역할 이름</TableHead>
                    <TableHead>표시 이름</TableHead>
                    <TableHead>권한 레벨</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role: any) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.display_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{role.level}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {role.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.is_active ? "default" : "secondary"}>
                          {role.is_active ? "활성" : "비활성"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(role.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRole(role);
                                  setEditingRole({
                                    name: role.name,
                                    display_name: role.display_name,
                                    description: role.description || "",
                                    level: role.level,
                                  });
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>역할 수정 - {role.display_name}</DialogTitle>
                                <DialogDescription>
                                  역할의 정보를 수정합니다.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-role-name">역할 이름</Label>
                                    <Input
                                      id="edit-role-name"
                                      value={editingRole.name}
                                      onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                                      placeholder="예: manager"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-role-display-name">표시 이름</Label>
                                    <Input
                                      id="edit-role-display-name"
                                      value={editingRole.display_name}
                                      onChange={(e) => setEditingRole({...editingRole, display_name: e.target.value})}
                                      placeholder="예: 관리자"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="edit-role-level">권한 레벨</Label>
                                  <Input
                                    id="edit-role-level"
                                    type="number"
                                    value={editingRole.level}
                                    onChange={(e) => setEditingRole({...editingRole, level: parseInt(e.target.value) || 0})}
                                    placeholder="0-100"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-role-description">설명</Label>
                                  <Textarea
                                    id="edit-role-description"
                                    value={editingRole.description}
                                    onChange={(e) => setEditingRole({...editingRole, description: e.target.value})}
                                    placeholder="역할에 대한 설명을 입력하세요..."
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>생성일</Label>
                                    <p className="text-sm text-gray-600">{new Date(role.created_at).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <Label>상태</Label>
                                    <p className="text-sm text-gray-600">{role.is_active ? "활성" : "비활성"}</p>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">
                                    취소
                                  </Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button onClick={async () => {
                                    const updatedRole = {
                                      id: role.id,
                                      ...editingRole,
                                    };
                                    
                                    await handleCreateRole(updatedRole);
                                  }}>
                                    저장
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh]">
                              <DialogHeader>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <DialogTitle>권한 설정 - {role.display_name}</DialogTitle>
                                    <DialogDescription>
                                      이 역할에 할당된 권한을 관리합니다.
                                    </DialogDescription>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        const allCheckboxes = document.querySelectorAll('[id^="perm-"]') as NodeListOf<HTMLInputElement>;
                                        allCheckboxes.forEach(checkbox => {
                                          checkbox.checked = true;
                                        });
                                      }}
                                    >
                                      전체 선택
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        const allCheckboxes = document.querySelectorAll('[id^="perm-"]') as NodeListOf<HTMLInputElement>;
                                        allCheckboxes.forEach(checkbox => {
                                          checkbox.checked = false;
                                        });
                                      }}
                                    >
                                      전체 해제
                                    </Button>
                                  </div>
                                </div>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="relative">
                                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input
                                    placeholder="권한 검색..."
                                    className="pl-10"
                                    onChange={(e) => {
                                      const searchTerm = e.target.value.toLowerCase();
                                      const permissionItems = document.querySelectorAll('[data-permission-item]');
                                      const categoryItems = document.querySelectorAll('[data-category-item]');
                                      
                                      permissionItems.forEach(item => {
                                        const text = item.textContent?.toLowerCase() || '';
                                        const shouldShow = text.includes(searchTerm);
                                        (item as HTMLElement).style.display = shouldShow ? 'flex' : 'none';
                                      });
                                      
                                      categoryItems.forEach(category => {
                                        const visiblePermissions = category.querySelectorAll('[data-permission-item]:not([style*="display: none"])');
                                        (category as HTMLElement).style.display = visiblePermissions.length > 0 ? 'block' : 'none';
                                      });
                                    }}
                                  />
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto">
                                  <div className="space-y-4">
                                    {Object.entries(
                                      permissions.reduce((acc, permission) => {
                                        const category = permission.category || 'other';
                                        if (!acc[category]) acc[category] = [];
                                        acc[category].push(permission);
                                        return acc;
                                      }, {} as Record<string, Permission[]>)
                                    ).map(([category, categoryPermissions]: any) => {
                                      const categoryInfo = categories.find(c => c.name === category);
                                      return (
                                        <div key={category} className="border rounded-lg p-4 bg-gray-50" data-category-item>
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center">
                                              <span className="text-lg mr-2">{categoryInfo?.icon || '📁'}</span>
                                              <h4 className="font-semibold text-gray-900">
                                                {categoryInfo?.display_name || category}
                                              </h4>
                                              <span className="ml-2 text-sm text-gray-500">
                                                ({categoryPermissions.length}개)
                                              </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <Checkbox 
                                                id={`category-${category}`}
                                                onCheckedChange={(checked) => {
                                                  // 카테고리 전체 선택/해제 로직
                                                  categoryPermissions.forEach((permission: any) => {
                                                    const checkbox = document.getElementById(`perm-${permission.id}`) as HTMLInputElement;
                                                    if (checkbox) {
                                                      checkbox.checked = checked as boolean;
                                                    }
                                                  });
                                                }}
                                              />
                                              <label htmlFor={`category-${category}`} className="text-sm text-gray-600 cursor-pointer">
                                                전체 선택
                                              </label>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {categoryPermissions.map((permission: any) => (
                                              <div key={permission.id} className="flex items-center space-x-2 p-2 bg-white rounded border" data-permission-item>
                                                <Checkbox id={`perm-${permission.id}`} />
                                                <label htmlFor={`perm-${permission.id}`} className="text-sm flex-1 cursor-pointer">
                                                  <div className="font-medium text-gray-900">{permission.display_name}</div>
                                                  <div className="text-xs text-gray-500">{permission.name}</div>
                                                  {permission.description && (
                                                    <div className="text-xs text-gray-400 mt-1">{permission.description}</div>
                                                  )}
                                                </label>
                                                {permission.data_scope && permission.data_scope !== 'all' && (
                                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {permission.data_scope}
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">
                                    취소
                                  </Button>
                                </DialogClose>
                                <Button onClick={() => {
                                  toast({
                                    title: "개발 중",
                                    description: "권한 설정 기능은 개발 중입니다.",
                                  });
                                }}>
                                  저장
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={role.is_system}
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">권한 관리</h2>
            <Dialog open={isEditPermissionDialogOpen} onOpenChange={setIsEditPermissionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedPermission(null);
                  setNewPermission({
                    name: '',
                    display_name: '',
                    category: '',
                    data_scope: 'all',
                    description: '',
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  새 권한 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedPermission ? '권한 수정' : '새 권한 추가'}
                  </DialogTitle>
                  <DialogDescription>
                    시스템에서 사용할 권한을 {selectedPermission ? '수정' : '추가'}합니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="permission-name">권한 이름</Label>
                      <Input
                        id="permission-name"
                        value={newPermission.name}
                        onChange={(e) => setNewPermission({...newPermission, name: e.target.value})}
                        placeholder="예: user.create"
                      />
                    </div>
                    <div>
                      <Label htmlFor="permission-display-name">표시 이름</Label>
                      <Input
                        id="permission-display-name"
                        value={newPermission.display_name}
                        onChange={(e) => setNewPermission({...newPermission, display_name: e.target.value})}
                        placeholder="예: 사용자 생성"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="permission-category">카테고리</Label>
                      <select
                        id="permission-category"
                        value={newPermission.category}
                        onChange={(e) => setNewPermission({...newPermission, category: e.target.value})}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">카테고리 선택</option>
                        {categories.map((category: any) => (
                          <option key={category.id} value={category.name}>
                            {category.display_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="permission-scope">데이터 범위</Label>
                      <select
                        id="permission-scope"
                        value={newPermission.data_scope}
                        onChange={(e) => setNewPermission({...newPermission, data_scope: e.target.value})}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="all">전체</option>
                        <option value="department">부서</option>
                        <option value="team">팀</option>
                        <option value="own">본인</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="permission-description">설명</Label>
                    <Textarea
                      id="permission-description"
                      value={newPermission.description}
                      onChange={(e) => setNewPermission({...newPermission, description: e.target.value})}
                      placeholder="권한에 대한 설명을 입력하세요..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditPermissionDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleCreatePermission}>
                    {selectedPermission ? '수정' : '추가'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>권한 목록</CardTitle>
              <CardDescription>
                시스템에서 사용할 수 있는 권한들을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  permissions.reduce((acc, permission) => {
                    const category = permission.category || 'other';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(permission);
                    return acc;
                  }, {} as Record<string, Permission[]>)
                ).map(([category, categoryPermissions]: any) => (
                  <div key={category} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {categoryPermissions.map((permission: any) => (
                        <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{permission.display_name}</span>
                            </div>
                            <div className="text-xs text-gray-500">{permission.name}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedPermission(permission);
                                setNewPermission({
                                  name: permission.name,
                                  display_name: permission.display_name,
                                  category: permission.category,
                                  data_scope: permission.data_scope || 'all',
                                  description: permission.description || '',
                                });
                                setIsEditPermissionDialogOpen(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeletePermission(permission.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">카테고리 관리</h2>
            <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedCategory(null);
                  setNewCategory({
                    name: '',
                    display_name: '',
                    icon: '',
                    description: '',
                    display_order: categories.length + 1,
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  새 카테고리 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedCategory ? '카테고리 수정' : '새 카테고리 추가'}
                  </DialogTitle>
                  <DialogDescription>
                    권한을 분류하는 카테고리를 {selectedCategory ? '수정' : '추가'}합니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category-name">카테고리 이름</Label>
                      <Input
                        id="category-name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        placeholder="예: user_management"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-display-name">표시 이름</Label>
                      <Input
                        id="category-display-name"
                        value={newCategory.display_name}
                        onChange={(e) => setNewCategory({...newCategory, display_name: e.target.value})}
                        placeholder="예: 사용자 관리"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category-icon">아이콘</Label>
                      <Input
                        id="category-icon"
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                        placeholder="예: 👥"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-order">순서</Label>
                      <Input
                        id="category-order"
                        type="number"
                        value={newCategory.display_order}
                        onChange={(e) => setNewCategory({...newCategory, display_order: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category-description">설명</Label>
                    <Textarea
                      id="category-description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                      placeholder="카테고리에 대한 설명을 입력하세요..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditCategoryDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleCreateCategory}>
                    {selectedCategory ? '수정' : '추가'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>카테고리 목록</CardTitle>
              <CardDescription>
                권한을 분류하는 카테고리들을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>순서</TableHead>
                    <TableHead>아이콘</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>표시 이름</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>권한 수</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category: any) => {
                    const permissionCount = permissions.filter(p => p.category === category.name).length;
                    return (
                      <TableRow key={category.id}>
                        <TableCell>
                          <Badge variant="outline">{category.display_order}</Badge>
                        </TableCell>
                        <TableCell className="text-lg">{category.icon}</TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.display_name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {category.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={category.is_active ? "default" : "secondary"}>
                            {category.is_active ? "활성" : "비활성"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{permissionCount}개</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCategory(category);
                                setNewCategory({
                                  name: category.name,
                                  display_name: category.display_name,
                                  icon: category.icon || '',
                                  description: category.description || '',
                                  display_order: category.display_order,
                                });
                                setIsEditCategoryDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              disabled={permissionCount > 0}
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 고급 관리 섹션 - 바로가기 */}
      <Card>
        <CardHeader>
          <CardTitle>고급 관리</CardTitle>
          <CardDescription>
            고급 권한 관리 기능과 분석 도구
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  권한 리뷰
                </CardTitle>
                <CardDescription>
                  정기적인 권한 검토가 필요한 사용자들을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>긴급 리뷰 필요</span>
                    <span className="text-red-600 font-semibold">{reviewStats.critical}명</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>90일 이상 미리뷰</span>
                    <span className="text-orange-600 font-semibold">{reviewStats.overdue}명</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>고위험 사용자</span>
                    <span className="text-red-600 font-semibold">{reviewStats.high_risk}명</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => window.open('/admin/accounts/permissions/advanced', '_blank')}
                >
                  권한 리뷰 시작
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-500" />
                  감사 로그
                </CardTitle>
                <CardDescription>
                  권한 변경 및 접근 기록을 실시간으로 추적합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>오늘 활동</span>
                    <span className="text-blue-600 font-semibold">{auditStats.today}건</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>권한 변경</span>
                    <span className="text-orange-600 font-semibold">{auditStats.permissions}건</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>실패한 접근</span>
                    <span className="text-red-600 font-semibold">{auditStats.failed}건</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => window.open('/admin/accounts/permissions/advanced', '_blank')}
                >
                  감사 로그 보기
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-500" />
                  보안 정책
                </CardTitle>
                <CardDescription>
                  자동 권한 관리 및 보안 정책을 설정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>자동 권한 만료</span>
                    <span className="text-green-600 font-semibold">활성</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>시간 제한 접근</span>
                    <span className="text-green-600 font-semibold">설정됨</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IP 제한</span>
                    <span className="text-gray-600 font-semibold">미설정</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => toast({
                    title: "개발 중",
                    description: "보안 정책 설정 기능은 개발 중입니다.",
                  })}
                >
                  정책 설정
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}