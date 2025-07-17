"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Calendar,
  Users,
  Edit,
  Trash2,
  Eye,
  Briefcase,
  PlayCircle,
  PauseCircle,
  StopCircle,
  DollarSign,
  UserCheck,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/utils/supabase/client";

// 프로그램 상태 타입
type ProgramStatus = "준비중" | "진행중" | "완료" | "중단";

// 프로그램 카테고리 타입
type ProgramCategory = "예배" | "교육" | "선교" | "봉사" | "친교" | "특별행사";

// 프로그램 인터페이스
interface Program {
  id: string;
  name: string;
  category: ProgramCategory;
  status: ProgramStatus;
  startDate: string;
  endDate: string;
  description?: string;
  participantCount?: number;
  budget?: number;
  features: string[]; // 활성화된 기능들 (예: "참여자", "재정", "캘린더" 등)
}

// 기본 프로그램 기능 목록
const availableFeatures = [
  { id: "participants", name: "참여자 관리", icon: Users },
  { id: "finance", name: "재정 관리", icon: DollarSign },
  { id: "calendar", name: "일정 관리", icon: Calendar },
  { id: "attendance", name: "출석 체크", icon: UserCheck },
  { id: "checklist", name: "확인사항 관리", icon: ClipboardList },
  { id: "teams", name: "팀 관리", icon: Users },
];

// 상태별 색상 및 아이콘
const statusConfig = {
  준비중: { color: "bg-yellow-100 text-yellow-800", icon: PlayCircle },
  진행중: { color: "bg-green-100 text-green-800", icon: PlayCircle },
  완료: { color: "bg-blue-100 text-blue-800", icon: StopCircle },
  중단: { color: "bg-red-100 text-red-800", icon: PauseCircle },
};

// 카테고리별 색상
const categoryConfig = {
  예배: "bg-purple-100 text-purple-800",
  교육: "bg-blue-100 text-blue-800",
  선교: "bg-green-100 text-green-800",
  봉사: "bg-orange-100 text-orange-800",
  친교: "bg-pink-100 text-pink-800",
  특별행사: "bg-indigo-100 text-indigo-800",
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    category: "" as ProgramCategory,
    status: "준비중" as ProgramStatus,
    startDate: "",
    endDate: "",
    description: "",
    features: [] as string[],
  });

  // 프로그램 데이터 로드
  useEffect(() => {
    loadPrograms();
  }, []);

  // Supabase에서 프로그램 목록 로드
  const loadPrograms = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('프로그램 로드 오류:', error);
        return;
      }

      console.log('프로그램 데이터:', data);

      // 데이터 변환
      const transformedPrograms: Program[] = (data || []).map((program: any) => ({
        id: program.id,
        name: program.name,
        category: program.category,
        status: program.status,
        startDate: program.start_date,
        endDate: program.end_date,
        description: program.description,
        participantCount: Array.isArray(program.participants) ? program.participants.length : 0,
        budget: Array.isArray(program.finances) ? program.finances.reduce((sum: number, finance: any) => sum + (finance.amount || 0), 0) : 0,
        features: program.features || []
      }));

      setPrograms(transformedPrograms);
    } catch (error) {
      console.error('프로그램 로드 실패:', error);
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: "",
      category: "" as ProgramCategory,
      status: "준비중",
      startDate: "",
      endDate: "",
      description: "",
      features: [],
    });
    setSelectedProgram(null);
    setIsEdit(false);
  };

  // 새 프로그램 추가 대화상자 열기
  const handleAddProgram = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // 프로그램 편집 대화상자 열기
  const handleEditProgram = (program: Program) => {
    setFormData({
      name: program.name,
      category: program.category,
      status: program.status,
      startDate: program.startDate,
      endDate: program.endDate,
      description: program.description || "",
      features: program.features,
    });
    setSelectedProgram(program);
    setIsEdit(true);
    setIsDialogOpen(true);
  };

  // 프로그램 삭제
  const handleDeleteProgram = async (id: string) => {
    if (confirm("정말로 이 프로그램을 삭제하시겠습니까?")) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('programs')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('프로그램 삭제 오류:', error);
          alert('프로그램 삭제에 실패했습니다.');
          return;
        }

        // 로컬 상태 업데이트
        setPrograms(programs.filter(p => p.id !== id));
      } catch (error) {
        console.error('프로그램 삭제 실패:', error);
        alert('프로그램 삭제에 실패했습니다.');
      }
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supabase = createClient();
      
      if (isEdit && selectedProgram) {
        // 편집 모드
        const { error } = await supabase
          .from('programs')
          .update({
            name: formData.name,
            category: formData.category,
            status: formData.status,
            start_date: formData.startDate,
            end_date: formData.endDate,
            description: formData.description,
            features: formData.features,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedProgram.id);

        if (error) {
          console.error('프로그램 수정 오류:', error);
          alert('프로그램 수정에 실패했습니다.');
          return;
        }

        // 로컬 상태 업데이트
        setPrograms(programs.map(p => 
          p.id === selectedProgram.id 
            ? { ...selectedProgram, ...formData }
            : p
        ));
      } else {
        // 새 프로그램 추가
        const { data, error } = await supabase
          .from('programs')
          .insert({
            name: formData.name,
            category: formData.category,
            status: formData.status,
            start_date: formData.startDate,
            end_date: formData.endDate,
            description: formData.description,
            features: formData.features,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('프로그램 추가 오류:', error);
          alert('프로그램 추가에 실패했습니다.');
          return;
        }

        // 로컬 상태 업데이트
        const newProgram: Program = {
          id: data.id,
          ...formData,
          participantCount: 0,
          budget: 0,
        };
        setPrograms([newProgram, ...programs]);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('폼 제출 실패:', error);
      alert('작업에 실패했습니다.');
    }
  };

  // 기능 토글
  const toggleFeature = (featureId: string) => {
    const newFeatures = formData.features.includes(featureId)
      ? formData.features.filter(f => f !== featureId)
      : [...formData.features, featureId];
    
    setFormData({ ...formData, features: newFeatures });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            프로그램 관리
          </h1>
          <p className="text-muted-foreground">
            교회 프로그램들을 관리하고 모니터링하세요.
          </p>
        </div>
        <Button onClick={handleAddProgram}>
          <Plus className="mr-2 h-4 w-4" />
          새 프로그램
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 프로그램</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{programs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행중</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {programs.filter(p => p.status === "진행중").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 참여자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {programs.reduce((sum, p) => sum + (p.participantCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 예산</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(programs.reduce((sum, p) => sum + (p.budget || 0), 0) / 10000).toFixed(0)}만원
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 프로그램 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>프로그램 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>프로그램명</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>시작일</TableHead>
                <TableHead>종료일</TableHead>
                <TableHead>참여자</TableHead>
                <TableHead>기능</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell>
                    <Badge className={categoryConfig[program.category]}>
                      {program.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[program.status].color}>
                      {program.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(program.startDate), "yyyy.MM.dd", { locale: ko })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(program.endDate), "yyyy.MM.dd", { locale: ko })}
                  </TableCell>
                  <TableCell>{program.participantCount || 0}명</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {program.features.map((featureId) => {
                        const feature = availableFeatures.find(f => f.id === featureId);
                        return feature ? (
                          <Badge key={featureId} variant="outline" className="text-xs">
                            {feature.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/admin/programs/${program.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProgram(program)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProgram(program.id)}
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

      {/* 프로그램 추가/편집 대화상자 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "프로그램 편집" : "새 프로그램 추가"}
            </DialogTitle>
            <DialogDescription>
              프로그램 정보를 입력하고 필요한 기능을 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">프로그램명</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: ProgramCategory) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="예배">예배</SelectItem>
                    <SelectItem value="교육">교육</SelectItem>
                    <SelectItem value="선교">선교</SelectItem>
                    <SelectItem value="봉사">봉사</SelectItem>
                    <SelectItem value="친교">친교</SelectItem>
                    <SelectItem value="특별행사">특별행사</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">상태</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ProgramStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="준비중">준비중</SelectItem>
                    <SelectItem value="진행중">진행중</SelectItem>
                    <SelectItem value="완료">완료</SelectItem>
                    <SelectItem value="중단">중단</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">시작일</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">종료일</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="프로그램에 대한 간단한 설명을 입력하세요."
              />
            </div>

            <div className="space-y-3">
              <Label>프로그램 기능</Label>
              <div className="grid grid-cols-2 gap-3">
                {availableFeatures.map((feature) => {
                  const Icon = feature.icon;
                  const isSelected = formData.features.includes(feature.id);
                  return (
                    <div
                      key={feature.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => toggleFeature(feature.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{feature.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                취소
              </Button>
              <Button type="submit">
                {isEdit ? "수정" : "추가"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}