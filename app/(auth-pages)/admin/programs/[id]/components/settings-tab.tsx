"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  Users,
  DollarSign,
  Calendar,
  UserCheck,
  CheckCircle,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Settings,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { loadProgramData, saveProgramData, type ProgramData } from "../utils/program-data";

interface SettingsTabProps {
  programId: string;
}

const AVAILABLE_FEATURES = [
  { id: "participants", label: "참여자 관리", icon: Users, description: "참가자 등록 및 관리" },
  { id: "finance", label: "재정 관리", icon: DollarSign, description: "수입/지출 관리" },
  { id: "calendar", label: "일정 관리", icon: Calendar, description: "이벤트 및 일정 관리" },
  { id: "attendance", label: "출석 관리", icon: UserCheck, description: "출석 체크 및 통계" },
  { id: "checklist", label: "확인사항", icon: CheckCircle, description: "할 일 및 체크리스트" },
  { id: "teams", label: "팀 관리", icon: Users, description: "팀 구성 및 관리" },
  { id: "meal", label: "식단 관리", icon: ClipboardList, description: "식단 계획 및 관리" },
  { id: "sheet", label: "스프레드시트", icon: FileSpreadsheet, description: "데이터 시트 및 분석" },
  { id: "word", label: "문서 관리", icon: FileText, description: "문서 작성 및 관리" },
];

export default function SettingsTab({ programId }: SettingsTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState<ProgramData | null>(null);
  
  const supabase = createClient();

  // 프로그램 데이터 로드
  useEffect(() => {
    loadProgram();
  }, [programId]);

  const loadProgram = async () => {
    try {
      setLoading(true);
      const data = await loadProgramData(programId);
      setProgram(data);
    } catch (error) {
      console.error('프로그램 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBasicInfoChange = (field: string, value: string) => {
    if (!program) return;
    setProgram({ ...program, [field]: value });
  };

  const handleFeatureToggle = (featureId: string, enabled: boolean) => {
    if (!program) return;
    
    const currentFeatures = program.features || [];
    let newFeatures: string[];
    
    if (enabled) {
      newFeatures = [...currentFeatures, featureId];
    } else {
      newFeatures = currentFeatures.filter(f => f !== featureId);
    }
    
    setProgram({ ...program, features: newFeatures });
  };

  const handleSave = async () => {
    if (!program) return;
    
    try {
      setSaving(true);
      
      console.log('저장 시도:', {
        programId,
        name: program.name,
        features: program.features
      });
      
      // 직접 supabase 쿼리로 업데이트
      const { data, error } = await supabase
        .from('programs')
        .update({
          name: program.name,
          category: program.category,
          start_date: program.start_date,
          end_date: program.end_date,
          description: program.description,
          features: program.features || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', programId)
        .select();
      
      if (error) {
        console.error('프로그램 저장 오류:', error);
        alert(`저장에 실패했습니다: ${error.message}`);
        return;
      }
      
      console.log('저장 성공:', data);
      alert('설정이 저장되었습니다.');
      // 페이지 새로고침으로 탭 변경사항 반영
      window.location.reload();
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        프로그램 정보를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">프로그램 이름</label>
              <Input
                value={program.name || ''}
                onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                placeholder="프로그램 이름을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">카테고리</label>
              <Input
                value={program.category || ''}
                onChange={(e) => handleBasicInfoChange('category', e.target.value)}
                placeholder="카테고리를 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">시작일</label>
              <Input
                type="date"
                value={program.start_date || ''}
                onChange={(e) => handleBasicInfoChange('start_date', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">종료일</label>
              <Input
                type="date"
                value={program.end_date || ''}
                onChange={(e) => handleBasicInfoChange('end_date', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">설명</label>
            <Textarea
              value={program.description || ''}
              onChange={(e) => handleBasicInfoChange('description', e.target.value)}
              placeholder="프로그램 설명을 입력하세요"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 기능 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>사용할 기능 선택</CardTitle>
          <p className="text-sm text-muted-foreground">
            이 프로그램에서 사용할 기능들을 선택하세요. 선택된 기능만 탭으로 표시됩니다.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_FEATURES.map((feature) => {
              const Icon = feature.icon;
              const isEnabled = program.features?.includes(feature.id) || false;
              
              return (
                <div
                  key={feature.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    isEnabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={`h-5 w-5 mt-0.5 ${isEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">{feature.label}</h3>
                          {isEnabled && (
                            <Badge variant="secondary" className="text-xs">
                              활성화
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              설정 저장
            </>
          )}
        </Button>
      </div>
    </div>
  );
}