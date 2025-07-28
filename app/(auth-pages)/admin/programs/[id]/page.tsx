"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  DollarSign,
  Calendar as CalendarIcon,
  UserCheck,
  Settings,
  BarChart3,
  CheckCircle,
  ClipboardList,
} from "lucide-react";
import { loadProgramData, type ProgramData } from "./utils/program-data";

// 타입 정의
interface Program {
  id: string;
  name: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  description: string;
  features: string[];
}

// 컴포넌트 임포트
import DashboardTab from "./components/dashboard-tab";
import ParticipantsTab from "./components/participants-tab";
import FinanceTab from "./components/finance-tab";
import CalendarTab from "./components/calendar-tab";
import AttendanceTab from "./components/attendance-tab";
import ChecklistTab from "./components/checklist-tab";
import TeamsTab from "./components/teams-tab";
import MealTab from "./components/meal-tab";

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // 프로그램 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const programData = await loadProgramData(programId);
        
        if (programData) {
          // 프로그램 기본 정보 설정
          const program: Program = {
            id: programData.id || programId,
            name: programData.name,
            category: programData.category,
            status: programData.status,
            startDate: programData.start_date,
            endDate: programData.end_date,
            description: programData.description,
            features: programData.features || [],
          };
          setProgram(program);
        } else {
          // 프로그램이 없으면 새 프로그램으로 설정
          const mockProgram: Program = {
            id: programId,
            name: "새 프로그램",
            category: "일반",
            status: "계획중",
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: "새로운 프로그램입니다.",
            features: ["participants", "finance", "calendar", "attendance", "checklist", "teams", "meal"],
          };
          setProgram(mockProgram);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        // 오류 시 기본 데이터 설정
        const mockProgram: Program = {
          id: programId,
          name: "프로그램 로드 실패",
          category: "일반",
          status: "오류",
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: "데이터를 불러올 수 없습니다.",
          features: [],
        };
        setProgram(mockProgram);
      }
    };

    loadData();
  }, [programId]);

  if (!program) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const availableTabs = [
    { id: "dashboard", label: "대시보드", icon: BarChart3 },
    ...(program.features.includes("participants") ? [{ id: "participants", label: "참여자", icon: Users }] : []),
    ...(program.features.includes("finance") ? [{ id: "finance", label: "재정", icon: DollarSign }] : []),
    ...(program.features.includes("calendar") ? [{ id: "calendar", label: "일정", icon: CalendarIcon }] : []),
    ...(program.features.includes("attendance") ? [{ id: "attendance", label: "출석", icon: UserCheck }] : []),
    ...(program.features.includes("checklist") ? [{ id: "checklist", label: "확인사항", icon: CheckCircle }] : []),
    ...(program.features.includes("teams") ? [{ id: "teams", label: "팀 관리", icon: Users }] : []),
    ...(program.features.includes("meal") ? [{ id: "meal", label: "식단", icon: ClipboardList }] : []),
    { id: "settings", label: "설정", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="space-y-4 pb-6 border-b">
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => router.push("/admin/programs")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <Button>
            설정 저장
          </Button>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
          <p className="text-muted-foreground">{program.description}</p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full gap-1" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* 탭 컨텐츠 */}
        <TabsContent value="dashboard">
          <DashboardTab programId={programId} onNavigateToTab={setActiveTab} />
        </TabsContent>

        {program.features.includes("participants") && (
          <TabsContent value="participants">
            <ParticipantsTab programId={programId} />
          </TabsContent>
        )}

        {program.features.includes("finance") && (
          <TabsContent value="finance">
            <FinanceTab programId={programId} />
          </TabsContent>
        )}

        {program.features.includes("calendar") && (
          <TabsContent value="calendar">
            <CalendarTab programId={programId} />
          </TabsContent>
        )}

        {program.features.includes("attendance") && (
          <TabsContent value="attendance">
            <AttendanceTab programId={programId} />
          </TabsContent>
        )}

        {program.features.includes("checklist") && (
          <TabsContent value="checklist">
            <ChecklistTab programId={programId} />
          </TabsContent>
        )}

        {program.features.includes("teams") && (
          <TabsContent value="teams">
            <TeamsTab programId={programId} />
          </TabsContent>
        )}

        {program.features.includes("meal") && (
          <TabsContent value="meal">
            <MealTab programId={programId} />
          </TabsContent>
        )}

        <TabsContent value="settings">
          <div className="text-center py-12 text-muted-foreground">
            설정 기능은 곧 추가될 예정입니다.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}