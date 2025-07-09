"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, UserCheck, UserX, TrendingUp, Calendar, Shield, Key, Activity } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  adminUsers: number;
  recentRegistrations: Array<{
    id: string;
    username: string;
    email: string;
    created_at: string;
    role: string;
  }>;
  roleStats?: {
    total: number;
    active: number;
    system: number;
    custom: number;
  };
  permissionStats?: {
    total: number;
    active: number;
    by_category: Record<string, number>;
  };
}

export default function AccountsDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    adminUsers: 0,
    recentRegistrations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/dashboard");
      
      if (response.ok) {
        const data = await response.json();
        
        // 최근 가입자 데이터 (사용자 API에서 가져오기)
        const usersResponse = await fetch("/api/admin/users");
        let recentUsers = [];
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          recentUsers = usersData.users
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .map((user: any) => ({
              id: user.id,
              username: user.username,
              email: user.email,
              created_at: user.created_at,
              role: user.role
            }));
        }
        
        setStats({
          totalUsers: data.userStats.total,
          activeUsers: data.userStats.active,
          newUsersThisMonth: data.userStats.new_this_month,
          adminUsers: data.userStats.by_role.admin || 0,
          recentRegistrations: recentUsers,
          roleStats: data.roleStats,
          permissionStats: data.permissionStats
        });
      }
    } catch (error) {
      console.error("대시보드 데이터 로딩 실패:", error);
      // 오류 발생 시 기본값 유지
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        adminUsers: 0,
        recentRegistrations: [],
        roleStats: { total: 0, active: 0, system: 0, custom: 0 },
        permissionStats: { total: 0, active: 0, by_category: {} }
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "총 사용자",
      value: stats.totalUsers,
      icon: Users,
      description: "전체 등록된 사용자 수",
      color: "text-blue-600"
    },
    {
      title: "활성 사용자",
      value: stats.activeUsers,
      icon: UserCheck,
      description: "최근 30일 내 활동한 사용자",
      color: "text-green-600"
    },
    {
      title: "이번 달 신규",
      value: stats.newUsersThisMonth,
      icon: UserPlus,
      description: "이번 달 새로 가입한 사용자",
      color: "text-purple-600"
    },
    {
      title: "관리자",
      value: stats.adminUsers,
      icon: UserX,
      description: "관리자 권한을 가진 사용자",
      color: "text-orange-600"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">계정 대시보드</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i: any) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">계정 대시보드</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={loadDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "로딩 중..." : "새로고침"}
          </button>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            마지막 업데이트: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card: any) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 추가 통계 카드들 */}
      {stats.roleStats && stats.permissionStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 역할</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.roleStats.active}</div>
              <p className="text-xs text-muted-foreground">
                총 {stats.roleStats.total}개 역할 중
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">시스템 역할</CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.roleStats.system}</div>
              <p className="text-xs text-muted-foreground">
                커스텀 역할: {stats.roleStats.custom}개
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 권한</CardTitle>
              <Key className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.permissionStats.active}</div>
              <p className="text-xs text-muted-foreground">
                총 {stats.permissionStats.total}개 권한
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">권한 카테고리</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.permissionStats.by_category).length}</div>
              <p className="text-xs text-muted-foreground">
                분류된 권한 그룹
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 최근 가입자 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              최근 가입자
            </CardTitle>
            <CardDescription>
              최근 가입한 사용자들을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentRegistrations.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium capitalize">{user.role}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>빠른 작업</CardTitle>
            <CardDescription>
              자주 사용하는 계정 관리 작업들
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/accounts/permissions" className="block w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-blue-500" />
                <div>
                  <div className="font-medium">권한 관리</div>
                  <div className="text-sm text-gray-500">사용자 권한과 역할을 관리합니다</div>
                </div>
              </div>
            </Link>
            <Link href="/admin/accounts/permissions?tab=roles" className="block w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Key className="h-4 w-4 mr-2 text-green-500" />
                <div>
                  <div className="font-medium">역할 관리</div>
                  <div className="text-sm text-gray-500">시스템 역할을 생성하고 수정합니다</div>
                </div>
              </div>
            </Link>
            <Link href="/admin/accounts/permissions/advanced" className="block w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Activity className="h-4 w-4 mr-2 text-purple-500" />
                <div>
                  <div className="font-medium">고급 관리</div>
                  <div className="text-sm text-gray-500">권한 리뷰와 감사 로그를 확인합니다</div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}