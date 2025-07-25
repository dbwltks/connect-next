"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Users, Plus, Edit, Trash2, Phone, Mail, Search, Settings } from "lucide-react";
import { participantsApi, categoriesApi, membersApi, type Participant } from "../utils/api";
import { saveProgramFeatureData, loadProgramData } from "../utils/program-data";


interface ParticipantsTabProps {
  programId: string;
}

export default function ParticipantsTab({ programId }: ParticipantsTabProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>(['신청', '승인', '거절', '참석', '불참']);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [fieldSettings, setFieldSettings] = useState({
    name: true,
    email: true,
    phone: true,
    birth_date: true,
    gender: true,
    status: true,
    category: true,
    notes: true
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    gender: '',
    status: '신청',
    category: '일반',
    notes: ''
  });

  const fieldLabels = {
    name: '이름',
    email: '이메일',
    phone: '연락처',
    birth_date: '생년월일',
    gender: '성별',
    status: '상태',
    category: '카테고리',
    notes: '비고'
  };

  const loadParticipants = async () => {
    try {
      const data = await participantsApi.getAll(programId);
      setParticipants(data);
    } catch (error) {
      alert('참가자 로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getParticipantCategories();
      setCategories(data);
    } catch (error) {
      setCategories(['일반', 'VIP', '학생', '교직원']);
    }
  };

  const loadSettings = async () => {
    try {
      const programData = await loadProgramData(programId);
      if (programData?.participants_setting) {
        const settings = programData.participants_setting;
        if (settings.fieldSettings) {
          setFieldSettings(settings.fieldSettings);
        }
        if (settings.statuses) {
          setStatuses(settings.statuses);
        }
        if (settings.categories) {
          setCategories(settings.categories);
        }
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        fieldSettings,
        statuses,
        categories
      };
      await saveProgramFeatureData(programId, 'participants_setting', settings);
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) {
      return;
    }
    const updatedCategories = [...categories, newCategory.trim()];
    setCategories(updatedCategories);
    setNewCategory('');
    await saveSettings();
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (confirm(`정말로 "${categoryName}" 카테고리를 삭제하시겠습니까?`)) {
      const updatedCategories = categories.filter(c => c !== categoryName);
      setCategories(updatedCategories);
      await saveSettings();
    }
  };

  const handleAddStatus = async () => {
    if (!newStatus.trim() || statuses.includes(newStatus.trim())) {
      return;
    }
    const updatedStatuses = [...statuses, newStatus.trim()];
    setStatuses(updatedStatuses);
    setNewStatus('');
    await saveSettings();
  };

  const handleDeleteStatus = async (status: string) => {
    if (confirm(`정말로 "${status}" 상태를 삭제하시겠습니까?`)) {
      const updatedStatuses = statuses.filter(s => s !== status);
      setStatuses(updatedStatuses);
      await saveSettings();
    }
  };

  const handleFieldToggle = async (field: keyof typeof fieldSettings) => {
    const updatedSettings = {
      ...fieldSettings,
      [field]: !fieldSettings[field]
    };
    setFieldSettings(updatedSettings);
    await saveSettings();
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const results = await membersApi.search(query);
      
      // 이미 참가자로 등록된 사람들의 이메일/전화번호/이름 목록
      const existingEmails = participants.map(p => p.email?.toLowerCase()).filter(Boolean);
      const existingPhones = participants.map(p => p.phone).filter(Boolean);
      const existingNames = participants.map(p => p.name.toLowerCase());
      
      // 중복 체크 및 상태 추가
      const resultsWithStatus = results.map(member => {
        const memberEmail = member.email?.toLowerCase();
        const memberPhone = member.phone;
        const memberName = (member.korean_name || `${member.first_name} ${member.last_name}`.trim()).toLowerCase();
        
        const isDuplicate = 
          (memberEmail && existingEmails.includes(memberEmail)) ||
          (memberPhone && existingPhones.includes(memberPhone)) ||
          (memberName && existingNames.includes(memberName));
        
        return {
          ...member,
          isDuplicate
        };
      });
      
      setSearchResults(resultsWithStatus);
      setShowSearchResults(true);
    } catch (error) {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // 성별 데이터 표준화 함수
  const normalizeGender = (gender: string): string => {
    if (!gender) return '';
    
    const genderLower = gender.toLowerCase().trim();
    
    // 남성 패턴
    if (['male', 'm', '남성', '남자', '남', 'man'].includes(genderLower)) {
      return '남성';
    }
    
    // 여성 패턴
    if (['female', 'f', '여성', '여자', '여', 'woman'].includes(genderLower)) {
      return '여성';
    }
    
    return '';
  };

  const handleSelectMember = (member: any) => {
    // 한글 이름 우선, 없으면 영어 이름 조합
    const displayName = member.korean_name || `${member.first_name} ${member.last_name}`.trim();
    
    // 성별 정보 추출 및 표준화 (다양한 필드명 고려)
    const rawGender = member.gender || member.sex || member.gender_type || '';
    const normalizedGender = normalizeGender(rawGender);
    
    setFormData({
      name: displayName,
      email: member.email || '',
      phone: member.phone || '',
      birth_date: member.birth_date || member.date_of_birth || '',
      gender: normalizedGender,
      status: '신청',
      category: '일반',
      notes: ''
    });
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    try {
      if (isEdit && selectedParticipant) {
        await participantsApi.update(selectedParticipant.id, {
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          birth_date: formData.birth_date || undefined,
          gender: formData.gender || undefined,
          status: formData.status,
          category: formData.category,
          notes: formData.notes || undefined
        }, programId);
      } else {
        await participantsApi.create({
          program_id: programId,
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          birth_date: formData.birth_date || undefined,
          gender: formData.gender || undefined,
          status: formData.status,
          category: formData.category,
          notes: formData.notes || undefined
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadParticipants();
      alert(isEdit ? '참가자 정보가 수정되었습니다.' : '참가자가 추가되었습니다.');
    } catch (error) {
      alert(`참가자 저장에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
    }
  };

  const handleEdit = (participant: Participant) => {
    setSelectedParticipant(participant);
    setFormData({
      name: participant.name,
      email: participant.email || '',
      phone: participant.phone || '',
      birth_date: participant.birth_date || '',
      gender: participant.gender || '',
      status: participant.status,
      category: participant.category || '일반',
      notes: participant.notes || ''
    });
    setIsEdit(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말로 이 참가자를 삭제하시겠습니까?')) {
      try {
        // 1. 참가자 삭제
        await participantsApi.delete(id, programId);
        
        // 2. 해당 참가자가 속한 팀에서도 제거
        const programData = await loadProgramData(programId);
        if (programData?.team_members) {
          const updatedTeamMembers = programData.team_members.filter(
            (tm: any) => tm.participantId !== id
          );
          
          // 팀 멤버 목록 업데이트
          await saveProgramFeatureData(programId, 'team_members', updatedTeamMembers);
        }
        
        loadParticipants();
        alert('참가자가 삭제되었습니다.');
      } catch (error) {
        alert(`참가자 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      birth_date: '',
      gender: '',
      status: '신청',
      category: '일반',
      notes: ''
    });
    setSelectedParticipant(null);
    setIsEdit(false);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      '신청': 'bg-blue-100 text-blue-800',
      '승인': 'bg-green-100 text-green-800',
      '거절': 'bg-red-100 text-red-800',
      '참석': 'bg-purple-100 text-purple-800',
      '불참': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  useEffect(() => {
    loadParticipants();
    loadSettings();
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          참가자 관리 ({Array.isArray(participants) ? participants.length : 0}명)
        </CardTitle>
        <div className="flex gap-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>참가자 관리 설정</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="fields" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="fields">필드 설정</TabsTrigger>
                  <TabsTrigger value="categories">카테고리</TabsTrigger>
                  <TabsTrigger value="statuses">상태</TabsTrigger>
                </TabsList>
                
                <TabsContent value="fields" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">표시 필드 설정</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(fieldLabels).map(([field, label]) => (
                        <div key={field} className="flex items-center space-x-2">
                          <Checkbox
                            id={field}
                            checked={fieldSettings[field as keyof typeof fieldSettings]}
                            onCheckedChange={() => handleFieldToggle(field as keyof typeof fieldSettings)}
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
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">카테고리 관리</h3>
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="새 카테고리 이름"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
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
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="statuses" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">상태 관리</h3>
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="새 상태 이름"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
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
                </TabsContent>
              </Tabs>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setIsSettingsOpen(false)}>
                  완료
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetForm();
              setSearchQuery('');
              setShowSearchResults(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                참가자 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible">
            <DialogHeader>
              <DialogTitle>{isEdit ? '참가자 수정' : '참가자 추가'}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 멤버 검색 */}
              <div className="space-y-2 relative">
                <Label htmlFor="search">멤버 검색</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="search"
                    placeholder="이름, 이메일, 전화번호로 검색..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                  
                  {/* 검색 결과 - 절대 위치로 공중에 떠있음 */}
                  {showSearchResults && (
                    <div className="absolute top-full left-0 right-0 z-[9999] mt-1 border border-gray-200 rounded-md bg-white shadow-xl max-h-48 overflow-y-auto">
                      {searchResults.length > 0 ? (
                        searchResults.map((member, index) => (
                          <div
                            key={index}
                            className={`p-3 border-b last:border-b-0 ${
                              member.isDuplicate 
                                ? 'bg-red-50 cursor-not-allowed opacity-60' 
                                : 'hover:bg-gray-50 cursor-pointer'
                            }`}
                            onClick={() => !member.isDuplicate && handleSelectMember(member)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  {member.korean_name || `${member.first_name} ${member.last_name}`.trim() || '이름 없음'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {member.email && <span>{member.email}</span>}
                                  {member.email && member.phone && <span> • </span>}
                                  {member.phone && <span>{member.phone}</span>}
                                </div>
                              </div>
                              {member.isDuplicate && (
                                <Badge variant="destructive" className="text-xs">
                                  이미 등록됨
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-gray-500">
                          검색 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {fieldSettings.name && (
                  <div>
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                )}
                {fieldSettings.category && (
                  <div>
                    <Label htmlFor="category">카테고리</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {fieldSettings.email && (
                  <div>
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                )}
                {fieldSettings.phone && (
                  <div>
                    <Label htmlFor="phone">연락처</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {fieldSettings.birth_date && (
                  <div>
                    <Label htmlFor="birth_date">생년월일</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                    />
                  </div>
                )}
                {fieldSettings.gender && (
                  <div>
                    <Label htmlFor="gender">성별</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="남성">남성</SelectItem>
                        <SelectItem value="여성">여성</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {fieldSettings.status && (
                  <div>
                    <Label htmlFor="status">상태</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* 비고 필드 */}
              {fieldSettings.notes && (
                <div>
                  <Label htmlFor="notes">비고</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="참가자에 대한 메모나 특이사항을 입력하세요..."
                    rows={3}
                  />
                </div>
              )}

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
        {!Array.isArray(participants) || participants.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            아직 등록된 참가자가 없습니다.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                {fieldSettings.category && <TableHead>카테고리</TableHead>}
                {(fieldSettings.email || fieldSettings.phone) && <TableHead>연락처</TableHead>}
                {(fieldSettings.birth_date || fieldSettings.gender) && <TableHead>생년월일/성별</TableHead>}
                {fieldSettings.status && <TableHead>상태</TableHead>}
                {fieldSettings.notes && <TableHead>비고</TableHead>}
                <TableHead>등록일</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(participants) && participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">{participant.name}</TableCell>
                  {fieldSettings.category && (
                    <TableCell>
                      <Badge variant="outline">{participant.category || '일반'}</Badge>
                    </TableCell>
                  )}
                  {(fieldSettings.email || fieldSettings.phone) && (
                    <TableCell>
                      <div className="space-y-1">
                        {fieldSettings.email && participant.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {participant.email}
                          </div>
                        )}
                        {fieldSettings.phone && participant.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {participant.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {(fieldSettings.birth_date || fieldSettings.gender) && (
                    <TableCell>
                      {fieldSettings.birth_date && fieldSettings.gender && participant.birth_date && participant.gender ? (
                        `${participant.birth_date} ${participant.gender}`
                      ) : (
                        fieldSettings.birth_date && participant.birth_date ? participant.birth_date : 
                        fieldSettings.gender && participant.gender ? participant.gender : '-'
                      )}
                    </TableCell>
                  )}
                  {fieldSettings.status && (
                    <TableCell>{getStatusBadge(participant.status)}</TableCell>
                  )}
                  {fieldSettings.notes && (
                    <TableCell className="max-w-xs">
                      {participant.notes ? (
                        <div className="truncate" title={participant.notes}>
                          {participant.notes}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    {new Date(participant.registered_at).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(participant)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(participant.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) || null}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}