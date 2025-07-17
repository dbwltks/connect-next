"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Plus, Trash2 } from "lucide-react";
import { categoriesApi } from "../utils/api";

interface CategoryManagerProps {
  type: 'participant' | 'finance' | 'checklist';
  onCategoriesChange?: () => void;
}

export default function CategoryManager({ type, onCategoriesChange }: CategoryManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const typeLabels = {
    participant: '참가자 카테고리',
    finance: '재정 카테고리',
    checklist: '체크리스트 카테고리'
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      let data: string[] = [];
      
      switch (type) {
        case 'participant':
          data = await categoriesApi.getParticipantCategories();
          break;
        case 'finance':
          data = await categoriesApi.getFinanceCategories();
          break;
        case 'checklist':
          data = await categoriesApi.getChecklistCategories();
          break;
      }
      
      setCategories(data);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) {
      return;
    }

    try {
      switch (type) {
        case 'participant':
          await categoriesApi.addParticipantCategory(newCategory.trim());
          break;
        case 'finance':
          await categoriesApi.addFinanceCategory(newCategory.trim());
          break;
        case 'checklist':
          await categoriesApi.addChecklistCategory(newCategory.trim());
          break;
      }

      setNewCategory('');
      loadCategories();
      onCategoriesChange?.();
    } catch (error) {
      console.error('카테고리 추가 실패:', error);
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (confirm(`정말로 "${categoryName}" 카테고리를 삭제하시겠습니까?`)) {
      try {
        switch (type) {
          case 'participant':
            await categoriesApi.deleteParticipantCategory(categoryName);
            break;
          case 'finance':
            await categoriesApi.deleteFinanceCategory(categoryName);
            break;
          case 'checklist':
            await categoriesApi.deleteChecklistCategory(categoryName);
            break;
        }

        loadCategories();
        onCategoriesChange?.();
      } catch (error) {
        console.error('카테고리 삭제 실패:', error);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, type]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          카테고리 관리
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{typeLabels[type]} 관리</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
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
      </DialogContent>
    </Dialog>
  );
}