"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { participantsApi } from "../utils/api";

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

interface OverviewTabProps {
  program: Program;
}

export default function OverviewTab({ program }: OverviewTabProps) {
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    const loadParticipantCount = async () => {
      try {
        const participants = await participantsApi.getAll(program.id);
        setParticipantCount(participants.length);
      } catch (error) {
        setParticipantCount(0);
      }
    };

    loadParticipantCount();
  }, [program.id]);
  const statusColors = {
    "계획중": "bg-yellow-100 text-yellow-800",
    "진행중": "bg-green-100 text-green-800", 
    "완료": "bg-blue-100 text-blue-800",
    "오류": "bg-red-100 text-red-800",
  };

  const categoryColors = {
    "예배": "bg-purple-100 text-purple-800",
    "교육": "bg-blue-100 text-blue-800",
    "선교": "bg-green-100 text-green-800",
    "봉사": "bg-orange-100 text-orange-800",
    "친교": "bg-pink-100 text-pink-800",
    "특별행사": "bg-indigo-100 text-indigo-800",
    "일반": "bg-gray-100 text-gray-800",
  };

  const featureNames = {
    "participants": "참여자 관리",
    "finance": "재정 관리", 
    "calendar": "일정 관리",
    "attendance": "출석 체크",
    "checklist": "확인사항 관리",
    "teams": "팀 관리",
    "meal": "식단 관리",
  };

  return (
    <div className="space-y-6">
      {/* 프로그램 기본 정보 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              프로그램 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">카테고리</p>
                <Badge className={categoryColors[program.category as keyof typeof categoryColors] || categoryColors["일반"]}>
                  {program.category}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">상태</p>
                <Badge className={statusColors[program.status as keyof typeof statusColors] || statusColors["계획중"]}>
                  {program.status}
                </Badge>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">기간</p>
              <p className="text-sm">
                {format(new Date(program.startDate), "yyyy년 MM월 dd일", { locale: ko })} ~ {" "}
                {format(new Date(program.endDate), "yyyy년 MM월 dd일", { locale: ko })}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">설명</p>
              <p className="text-sm">{program.description || "설명이 없습니다."}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              활성화된 기능
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {program.features.map((feature) => (
                <Badge key={feature} variant="outline">
                  {featureNames[feature as keyof typeof featureNames] || feature}
                </Badge>
              ))}
              {program.features.length === 0 && (
                <p className="text-sm text-muted-foreground">활성화된 기능이 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 통계 요약 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 참여자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participantCount}</div>
            <p className="text-xs text-muted-foreground">명</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 예산</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">CAD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행률</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">완료</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">남은 일수</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.ceil((new Date(program.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <p className="text-xs text-muted-foreground">일</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}