"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Plus, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { financeApi, categoriesApi, type FinanceRecord } from "../utils/api";
import CategoryManager from "./category-manager";

interface FinanceTabProps {
  programId: string;
}

export default function FinanceTab({ programId }: FinanceTabProps) {
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const loadFinances = async () => {
    try {
      const data = await financeApi.getAll(programId);
      setFinances(data);
    } catch (error) {
      console.error('재정 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getFinanceCategories();
      setCategories(data);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      setCategories(['교육비', '식비', '교통비', '숙박비', '기타']);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && selectedRecord) {
        await financeApi.update(selectedRecord.id, {
          type: formData.type,
          category: formData.category,
          amount: parseFloat(formData.amount),
          description: formData.description || undefined,
          date: formData.date
        });
      } else {
        await financeApi.create({
          program_id: programId,
          type: formData.type,
          category: formData.category,
          amount: parseFloat(formData.amount),
          description: formData.description || undefined,
          date: formData.date
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadFinances();
    } catch (error) {
      console.error('재정 데이터 저장 실패:', error);
    }
  };

  const handleEdit = (record: FinanceRecord) => {
    setSelectedRecord(record);
    setFormData({
      type: record.type,
      category: record.category,
      amount: record.amount.toString(),
      description: record.description || '',
      date: record.date
    });
    setIsEdit(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말로 이 거래 내역을 삭제하시겠습니까?')) {
      try {
        await financeApi.delete(id);
        loadFinances();
      } catch (error) {
        console.error('거래 내역 삭제 실패:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'income',
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSelectedRecord(null);
    setIsEdit(false);
  };

  const getTypeBadge = (type: 'income' | 'expense') => {
    return type === 'income' ? (
      <Badge className="bg-green-100 text-green-800">
        <TrendingUp className="h-3 w-3 mr-1" />
        수입
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <TrendingDown className="h-3 w-3 mr-1" />
        지출
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const getTotalIncome = () => {
    return finances
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0);
  };

  const getTotalExpense = () => {
    return finances
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpense();
  };

  useEffect(() => {
    loadFinances();
    loadCategories();
  }, [programId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">총 수입</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalIncome())}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">총 지출</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(getTotalExpense())}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">잔액</p>
                <p className={`text-2xl font-bold ${getBalance() >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(getBalance())}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            거래 내역 ({finances.length}건)
          </CardTitle>
          <div className="flex gap-2">
            <CategoryManager type="finance" onCategoriesChange={loadCategories} />
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  거래 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isEdit ? '거래 내역 수정' : '거래 내역 추가'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">유형 *</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value as 'income' | 'expense'})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">수입</SelectItem>
                          <SelectItem value="expense">지출</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="category">카테고리 *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">금액 *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">날짜 *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="거래 내역 설명을 입력하세요..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      취소
                    </Button>
                    <Button type="submit">
                      {isEdit ? '수정' : '추가'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {finances.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              아직 거래 내역이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>유형</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>날짜</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finances.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{getTypeBadge(record.type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.category}</Badge>
                    </TableCell>
                    <TableCell className={`font-medium ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                    </TableCell>
                    <TableCell>
                      {new Date(record.date).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {record.description || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}