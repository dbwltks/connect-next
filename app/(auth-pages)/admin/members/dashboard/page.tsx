"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Calendar, 
  Heart, 
  Droplets,
  Activity,
  BarChart3,
  Clock,
  Gift,
  Cake
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface MemberStats {
  total: number;
  active: number;
  inactive: number;
  transferred: number;
  deceased: number;
  new_this_week: number;
  new_this_month: number;
  new_this_year: number;
  by_gender: {
    male: number;
    female: number;
    other: number;
  };
  by_status: Record<string, number>;
}

interface SacramentStats {
  infant_baptism: number;
  adult_baptism: number;
  total_baptized: number;
  married: number;
  recent_baptisms: number;
  recent_marriages: number;
}

interface BirthdayStats {
  total_with_birthday: number;
  this_week: number;
  next_week: number;
  this_month: number;
  next_month: number;
}

interface BirthdayMember {
  id: string;
  first_name: string;
  last_name: string;
  korean_name?: string;
  birth_date: string;
  birthday_this_year: string;
  age: number;
}

interface BirthdayLists {
  this_week: BirthdayMember[];
  next_week: BirthdayMember[];
  this_month: BirthdayMember[];
  next_month: BirthdayMember[];
}

interface MonthlyTrend {
  month: string;
  new_members: number;
  memberships: number;
}

interface RecentMember {
  id: string;
  first_name: string;
  last_name: string;
  korean_name?: string;
  created_at: string;
  membership_status: string;
}

interface UpcomingEvent {
  type: string;
  date: string;
  member_id: string;
  title: string;
}

interface DashboardData {
  memberStats: MemberStats;
  sacramentStats: SacramentStats;
  birthdayStats: BirthdayStats;
  birthdayLists: BirthdayLists;
  monthlyTrends: MonthlyTrend[];
  recentMembers: RecentMember[];
  upcomingEvents: UpcomingEvent[];
}

export default function MembersDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/members/dashboard");
      
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error("대시보드 데이터 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '활동';
      case 'inactive':
        return '장기결석';
      case 'transferred':
        return '이적';
      case 'deceased':
        return '사망';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'transferred':
        return 'bg-blue-100 text-blue-800';
      case 'deceased':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">교인 관리 대시보드</h1>
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

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">교인 관리 대시보드</h1>
        <div className="text-center py-8">
          <p className="text-gray-500">데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const mainStats = [
    {
      title: "총 교인 수",
      value: data.memberStats.total,
      icon: Users,
      description: "전체 등록된 교인 수",
      color: "text-blue-600"
    },
    {
      title: "활동 교인",
      value: data.memberStats.active,
      icon: UserCheck,
      description: "현재 활동 중인 교인",
      color: "text-green-600"
    },
    {
      title: "이번 달 신규",
      value: data.memberStats.new_this_month,
      icon: UserPlus,
      description: "이번 달 새로 등록된 교인",
      color: "text-purple-600"
    },
    {
      title: "세례 교인",
      value: data.sacramentStats.total_baptized,
      icon: Droplets,
      description: "세례를 받은 교인 수",
      color: "text-cyan-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">교인 관리 대시보드</h1>
        <div className="flex gap-2">
          <Button onClick={loadDashboardData} disabled={loading}>
            {loading ? "로딩 중..." : "새로고침"}
          </Button>
          <Link href="/admin/members">
            <Button variant="outline">교인 관리</Button>
          </Link>
        </div>
      </div>

      {/* 메인 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat: any) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 추가 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">장기결석</CardTitle>
            <UserX className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.memberStats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              관리가 필요한 교인
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">결혼 교인</CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.sacramentStats.married}</div>
            <p className="text-xs text-muted-foreground">
              결혼한 교인 수
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 주 신규</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.memberStats.new_this_week}</div>
            <p className="text-xs text-muted-foreground">
              이번 주 새로 등록
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">성별 비율</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((data.memberStats.by_gender.male / data.memberStats.total) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              남성 비율 (여성: {Math.round((data.memberStats.by_gender.female / data.memberStats.total) * 100)}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 생일자 관리 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cake className="h-5 w-5 mr-2" />
            생일자 관리
          </CardTitle>
          <CardDescription>
            교인들의 생일 정보를 주별, 월별로 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">{data.birthdayStats.this_week}</div>
              <div className="text-sm text-gray-600 mt-1">이번 주</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600">{data.birthdayStats.next_week}</div>
              <div className="text-sm text-gray-600 mt-1">다음 주</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-purple-50">
              <div className="text-2xl font-bold text-purple-600">{data.birthdayStats.this_month}</div>
              <div className="text-sm text-gray-600 mt-1">이번 달</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-orange-50">
              <div className="text-2xl font-bold text-orange-600">{data.birthdayStats.next_month}</div>
              <div className="text-sm text-gray-600 mt-1">다음 달</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                이번 주 생일자
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.birthdayLists.this_week.length > 0 ? (
                  data.birthdayLists.this_week.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div>
                        <div className="font-medium">
                          {member.first_name} {member.last_name}
                          {member.korean_name && (
                            <span className="text-sm text-gray-500 ml-2">({member.korean_name})</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(member.birthday_this_year).toLocaleDateString()} ({member.age}세)
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        생일
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">이번 주 생일자가 없습니다</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                다음 주 생일자
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.birthdayLists.next_week.length > 0 ? (
                  data.birthdayLists.next_week.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div>
                        <div className="font-medium">
                          {member.first_name} {member.last_name}
                          {member.korean_name && (
                            <span className="text-sm text-gray-500 ml-2">({member.korean_name})</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(member.birthday_this_year).toLocaleDateString()} ({member.age}세)
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        생일
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">다음 주 생일자가 없습니다</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                이번 달 생일자
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.birthdayLists.this_month.length > 0 ? (
                  data.birthdayLists.this_month.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                      <div>
                        <div className="font-medium">
                          {member.first_name} {member.last_name}
                          {member.korean_name && (
                            <span className="text-sm text-gray-500 ml-2">({member.korean_name})</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(member.birthday_this_year).toLocaleDateString()} ({member.age}세)
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        생일
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">이번 달 생일자가 없습니다</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                다음 달 생일자
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.birthdayLists.next_month.length > 0 ? (
                  data.birthdayLists.next_month.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <div>
                        <div className="font-medium">
                          {member.first_name} {member.last_name}
                          {member.korean_name && (
                            <span className="text-sm text-gray-500 ml-2">({member.korean_name})</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(member.birthday_this_year).toLocaleDateString()} ({member.age}세)
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        생일
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">다음 달 생일자가 없습니다</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최근 등록 교인 및 다가오는 기념일 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              최근 등록 교인
            </CardTitle>
            <CardDescription>
              최근에 등록된 교인들을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentMembers.slice(0, 8).map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {member.first_name} {member.last_name}
                      {member.korean_name && (
                        <span className="text-sm text-gray-500 ml-2">({member.korean_name})</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge className={getStatusColor(member.membership_status)}>
                    {getStatusText(member.membership_status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2" />
              다가오는 기념일
            </CardTitle>
            <CardDescription>
              다음 달까지의 세례 및 결혼 기념일
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.upcomingEvents.length > 0 ? (
                data.upcomingEvents.slice(0, 8).map((event, index: any) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline" className={
                      event.type === 'baptism' ? 'border-cyan-500 text-cyan-600' : 'border-pink-500 text-pink-600'
                    }>
                      {event.type === 'baptism' ? '세례' : '결혼'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  다가오는 기념일이 없습니다
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 월별 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            월별 신규 교인 추이
          </CardTitle>
          <CardDescription>
            최근 6개월간 신규 교인 등록 현황
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.monthlyTrends.map((trend, index: any) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{trend.new_members}</div>
                <div className="text-sm text-gray-500 mt-1">{trend.month}</div>
                <div className="text-xs text-gray-400 mt-1">
                  멤버십: {trend.memberships}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 교인 상태 분포 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            교인 상태 분포
          </CardTitle>
          <CardDescription>
            교인들의 현재 상태별 분포
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.memberStats.by_status).map(([status, count]: any) => (
              <div key={status} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-500 mt-1">{getStatusText(status)}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {Math.round((count / data.memberStats.total) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 빠른 작업 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
          <CardDescription>
            자주 사용하는 교인 관리 작업들
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/admin/members" className="block w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-500" />
              <div>
                <div className="font-medium">교인 관리</div>
                <div className="text-sm text-gray-500">교인 정보를 추가, 수정, 삭제합니다</div>
              </div>
            </div>
          </Link>
          <Link href="/admin/members/reports" className="block w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-green-500" />
              <div>
                <div className="font-medium">교인 보고서</div>
                <div className="text-sm text-gray-500">교인 통계 및 보고서를 생성합니다</div>
              </div>
            </div>
          </Link>
          <Link href="/admin/members/inactive" className="block w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-orange-500" />
              <div>
                <div className="font-medium">장기결석 교인</div>
                <div className="text-sm text-gray-500">장기결석 교인을 관리합니다</div>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}