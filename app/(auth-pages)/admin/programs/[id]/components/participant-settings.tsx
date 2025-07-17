"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Settings, Plus, Trash2 } from "lucide-react";
import { categoriesApi } from "../utils/api";

interface ParticipantSettingsProps {
  onSettingsChange?: () => void;
}

interface FieldSettings {
  name: boolean;
  email: boolean;
  phone: boolean;
  age: boolean;
  gender: boolean;
  status: boolean;
  category: boolean;
  notes: boolean;
}

export default function ParticipantSettings({ onSettingsChange }: ParticipantSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>(['신청', '승인', '거절', '참석', '불참']);
  const [newCategory, setNewCategory] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldSettings, setFieldSettings] = useState<FieldSettings>({
    name: true,
    email: true,
    phone: true,
    age: true,
    gender: true,
    status: true,
    category: true,
    notes: true
  });

  const fieldLabels = {
    name: '이름',
    email: '이메일',
    phone: '연락처',
    age: '나이',
    gender: '성별',
    status: '상태',
    category: '카테고리',
    notes: '비고'
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.getParticipantCategories();
      setCategories(data);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      setCategories(['일반', 'VIP', '학생', '교직원']);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) {
      return;
    }

    try {
      await categoriesApi.addParticipantCategory(newCategory.trim());
      setNewCategory('');
      loadCategories();
      onSettingsChange?.();
    } catch (error) {
      console.error('카테고리 추가 실패:', error);
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (confirm(`정말로 "${categoryName}" 카테고리를 삭제하시겠습니까?`)) {
      try {
        await categoriesApi.deleteParticipantCategory(categoryName);
        loadCategories();
        onSettingsChange?.();
      } catch (error) {
        console.error('카테고리 삭제 실패:', error);
      }
    }
  };

  const handleAddStatus = () => {
    if (!newStatus.trim() || statuses.includes(newStatus.trim())) {
      return;
    }

    setStatuses(prev => [...prev, newStatus.trim()]);
    setNewStatus('');
    onSettingsChange?.();
  };

  const handleDeleteStatus = (status: string) => {
    if (confirm(`정말로 "${status}" 상태를 삭제하시겠습니까?`)) {
      setStatuses(prev => prev.filter(s => s !== status));
      onSettingsChange?.();
    }
  };

  const handleFieldToggle = (field: keyof FieldSettings) => {
    setFieldSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
    onSettingsChange?.();
  };

  const getEnabledFields = () => {
    return Object.entries(fieldSettings)
      .filter(([_, enabled]) => enabled)
      .map(([field, _]) => field);
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          설정
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>참가자 관리 설정</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 필드 표시 설정 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">표시 필드 설정</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(fieldLabels).map(([field, label]) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={fieldSettings[field as keyof FieldSettings]}
                    onCheckedChange={() => handleFieldToggle(field as keyof FieldSettings)}
                    disabled={field === 'name'} // 이름은 필수 필드
                  />
                  <Label htmlFor={field} className={field === 'name' ? 'text-muted-foreground' : ''}>
                    {label} {field === 'name' && '(필수)'}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              선택된 필드만 참가자 추가/수정 폼과 테이블에 표시됩니다.
            </p>
          </div>

          <Separator />

          {/* 카테고리 관리 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">카테고리 관리</h3>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="새 카테고리 이름"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCategory();
                  }
                }}
              />
              <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>현재 카테고리</Label>
              {loading ? (
                <div className="text-center text-muted-foreground py-4">로딩 중...</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center gap-1">
                      <Badge variant="secondary">{category}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 상태 관리 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">상태 관리</h3>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="새 상태 이름"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddStatus();
                  }
                }}
              />
              <Button onClick={handleAddStatus} disabled={!newStatus.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>현재 상태</Label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <div key={status} className="flex items-center gap-1">
                    <Badge variant="outline">{status}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteStatus(status)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* 설정 요약 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">현재 설정 요약</h3>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm"><strong>활성 필드:</strong> {getEnabledFields().map(field => fieldLabels[field as keyof typeof fieldLabels]).join(', ')}</p>
              <p className="text-sm mt-1"><strong>카테고리 수:</strong> {categories.length}개</p>
              <p className="text-sm mt-1"><strong>상태 수:</strong> {statuses.length}개</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => setIsOpen(false)}>
            완료
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}