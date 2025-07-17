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
import { Users, Plus, Edit, Trash2, Phone, Mail, Search } from "lucide-react";
import { participantsApi, categoriesApi, membersApi, type Participant } from "../utils/api";
import ParticipantSettings from "./participant-settings";


interface ParticipantsTabProps {
  programId: string;
}

export default function ParticipantsTab({ programId }: ParticipantsTabProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>(['신청', '승인', '거절', '참석', '불참']);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [fieldSettings, setFieldSettings] = useState({
    name: true,
    email: true,
    phone: true,
    age: true,
    gender: true,
    status: true,
    category: true,
    notes: true
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    status: '신청',
    category: '일반',
    notes: ''
  });

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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const results = await membersApi.search(query);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSelectMember = (member: any) => {
    setFormData({
      name: member.kor || member.name_kor || member.korean_name || member.eng || member.name_eng || member.english_name || member.name || member.full_name || member.user_name || member.display_name || '',
      email: member.email || member.email_address || member.contact_email || '',
      phone: member.phone || member.phone_number || member.mobile || member.contact_phone || '',
      age: member.age?.toString() || '',
      gender: member.gender || member.sex || '',
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
          age: formData.age ? parseInt(formData.age) : undefined,
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
          age: formData.age ? parseInt(formData.age) : undefined,
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
      age: participant.age?.toString() || '',
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
        await participantsApi.delete(id, programId);
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
      age: '',
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          참가자 관리 ({Array.isArray(participants) ? participants.length : 0}명)
        </CardTitle>
        <div className="flex gap-2">
          <ParticipantSettings onSettingsChange={loadCategories} />
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
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
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => handleSelectMember(member)}
                          >
                            <div className="font-medium">
                              {member.kor || member.name_kor || member.korean_name || member.eng || member.name_eng || member.english_name || member.name || member.full_name || member.user_name || member.display_name || '이름 없음'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(member.email || member.email_address || member.contact_email) && <span>{member.email || member.email_address || member.contact_email}</span>}
                              {(member.email || member.email_address || member.contact_email) && (member.phone || member.phone_number || member.mobile || member.contact_phone) && <span> • </span>}
                              {(member.phone || member.phone_number || member.mobile || member.contact_phone) && <span>{member.phone || member.phone_number || member.mobile || member.contact_phone}</span>}
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
                {fieldSettings.age && (
                  <div>
                    <Label htmlFor="age">나이</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
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
                {(fieldSettings.age || fieldSettings.gender) && <TableHead>나이/성별</TableHead>}
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
                  {(fieldSettings.age || fieldSettings.gender) && (
                    <TableCell>
                      {fieldSettings.age && fieldSettings.gender && participant.age && participant.gender ? (
                        `${participant.age}세 ${participant.gender}`
                      ) : (
                        fieldSettings.age && participant.age ? `${participant.age}세` : 
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