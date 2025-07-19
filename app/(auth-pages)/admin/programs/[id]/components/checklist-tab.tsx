"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CheckCircle, Plus, Edit, Trash2, XCircle, Filter, Triangle } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { saveProgramFeatureData, loadProgramData } from "../utils/program-data";
import { participantsApi, type Participant } from "../utils/api";
import { createClient } from "@/utils/supabase/client";

interface ChecklistItem {
  id: string;
  name: string;
  required: boolean;
  price?: number;
  teams?: string[];  // 어떤 팀에서 사용하는지
}

interface ChecklistEntry {
  participantId?: string;
  teamId?: string;
  checklistItemId: string;
  completed: boolean;
  status?: 'pending' | 'in_progress' | 'completed'; // 새로운 상태 필드
  completedDate?: string;
  note?: string;
}

interface ChecklistTabProps {
  programId: string;
}

export default function ChecklistTab({ programId }: ChecklistTabProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklistEntries, setChecklistEntries] = useState<ChecklistEntry[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [userRole, setUserRole] = useState<string>('guest');
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);

  // 관리자 권한 확인 함수
  const hasAdminPermission = () => {
    return userRole === 'admin' || userRole === 'tier0' || userRole === 'tier1';
  };
  const [selectedChecklistEdit, setSelectedChecklistEdit] = useState<ChecklistItem | null>(null);
  const [checklistForm, setChecklistForm] = useState({
    name: "",
    required: false,
    price: "",
    teams: [] as string[]
  });

  // 사용자 역할 로드
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setUserRole(userData?.role || 'guest');
        }
      } catch (error) {
        console.error('사용자 역할 로드 실패:', error);
        setUserRole('guest');
      }
    };

    loadUserRole();
  }, []);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 참가자 데이터 로드
        const participantsData = await participantsApi.getAll(programId);
        setParticipants(participantsData);

        // 프로그램 데이터에서 확인사항 관련 데이터 로드
        const programData = await loadProgramData(programId);
        
        console.log('프로그램 데이터 로드:', programData);
        
        if (programData) {
          if (programData.checklist_setting) {
            console.log('checklist_setting 데이터:', programData.checklist_setting);
            setChecklistItems(Array.isArray(programData.checklist_setting) ? programData.checklist_setting : []);
          }
          if (programData.checklist) {
            console.log('checklist 데이터:', programData.checklist);
            setChecklistEntries(Array.isArray(programData.checklist) ? programData.checklist : []);
          }
          if (programData.teams) {
            console.log('teams 데이터:', programData.teams);
            setTeams(Array.isArray(programData.teams) ? programData.teams : []);
          }
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      }
    };

    loadData();
  }, [programId]);

  // 확인사항 항목 저장
  const saveChecklistItems = async (items: ChecklistItem[]) => {
    try {
      console.log('saveChecklistItems 호출, 데이터:', items);
      const result = await saveProgramFeatureData(programId, 'checklist_setting', items);
      console.log('저장 결과:', result);
      if (result) {
        setChecklistItems(items);
        console.log('상태 업데이트 완료');
      } else {
        throw new Error('저장 함수에서 false 반환');
      }
    } catch (error) {
      console.error('확인사항 저장 실패:', error);
      alert('확인사항 저장에 실패했습니다.');
    }
  };

  // 체크 데이터 저장
  const saveChecklistEntries = async (entries: ChecklistEntry[]) => {
    try {
      await saveProgramFeatureData(programId, 'checklist', entries);
      setChecklistEntries(entries);
    } catch (error) {
      console.error('체크 데이터 저장 실패:', error);
      alert('체크 데이터 저장에 실패했습니다.');
    }
  };

  // 확인사항 항목 제출
  const handleChecklistSubmit = async () => {
    if (!checklistForm.name.trim()) {
      alert('항목명을 입력해주세요.');
      return;
    }

    try {
      if (selectedChecklistEdit) {
        // 편집
        const updatedItems = checklistItems.map(item => 
          item.id === selectedChecklistEdit.id 
            ? {
                ...item,
                name: checklistForm.name,
                required: checklistForm.required,
                price: checklistForm.price ? parseFloat(checklistForm.price) : undefined,
                teams: checklistForm.teams
              }
            : item
        );
        await saveChecklistItems(updatedItems);
      } else {
        // 새 항목 추가
        const newItem: ChecklistItem = {
          id: `checklist_${Date.now()}`,
          name: checklistForm.name,
          required: checklistForm.required,
          price: checklistForm.price ? parseFloat(checklistForm.price) : undefined,
          teams: checklistForm.teams,
        };
        await saveChecklistItems([...checklistItems, newItem]);
      }

      setIsChecklistDialogOpen(false);
      setSelectedChecklistEdit(null);
      setChecklistForm({ name: "", required: false, price: "", teams: [] });
    } catch (error) {
      console.error('확인사항 저장 실패:', error);
      alert('확인사항 저장에 실패했습니다.');
    }
  };

  // 확인사항 항목 삭제
  const handleDeleteChecklistItem = async (itemId: string) => {
    if (confirm("정말로 이 항목을 삭제하시겠습니까?")) {
      const updatedItems = checklistItems.filter(i => i.id !== itemId);
      const updatedEntries = checklistEntries.filter(c => c.checklistItemId !== itemId);
      
      await saveChecklistItems(updatedItems);
      await saveChecklistEntries(updatedEntries);
    }
  };

  // 기존 데이터를 새로운 status 필드로 마이그레이션
  const migrateOldData = async () => {
    const needsMigration = checklistEntries.some(entry => 
      !entry.status && entry.completed !== undefined
    );
    
    if (needsMigration) {
      const migratedEntries = checklistEntries.map(entry => ({
        ...entry,
        status: entry.status || (entry.completed ? 'completed' : 'pending')
      }));
      
      await saveChecklistEntries(migratedEntries);
    }
  };

  // 데이터 로드 후 마이그레이션 실행
  useEffect(() => {
    if (checklistEntries.length > 0) {
      migrateOldData();
    }
  }, [checklistEntries.length]); // 데이터가 로드된 후에만 실행

  // 체크 상태 토글 (3단계 순환: pending -> in_progress -> completed -> pending)
  const toggleCheck = async (participantId: string, checklistItemId: string) => {
    const existingEntry = checklistEntries.find(
      entry => entry.participantId === participantId && entry.checklistItemId === checklistItemId
    );

    // 현재 상태 확인
    const currentStatus = existingEntry?.status || 'pending';
    
    // 다음 상태 결정
    let nextStatus: 'pending' | 'in_progress' | 'completed';
    switch (currentStatus) {
      case 'pending':
        nextStatus = 'in_progress';
        break;
      case 'in_progress':
        nextStatus = 'completed';
        break;
      case 'completed':
        nextStatus = 'pending';
        break;
      default:
        nextStatus = 'in_progress';
    }

    let updatedEntries;
    if (existingEntry) {
      // 기존 체크 데이터 업데이트
      updatedEntries = checklistEntries.map(entry => 
        entry.participantId === participantId && entry.checklistItemId === checklistItemId
          ? { 
              ...entry, 
              status: nextStatus,
              completed: nextStatus === 'completed', // 기존 completed 필드도 유지
              completedDate: nextStatus === 'completed' ? format(new Date(), "yyyy-MM-dd") : undefined 
            }
          : entry
      );
    } else {
      // 새로운 체크 데이터 생성
      const newEntry: ChecklistEntry = {
        participantId,
        checklistItemId,
        status: nextStatus,
        completed: nextStatus === 'completed',
        completedDate: nextStatus === 'completed' ? format(new Date(), "yyyy-MM-dd") : undefined,
      };
      updatedEntries = [...checklistEntries, newEntry];
    }

    await saveChecklistEntries(updatedEntries);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">확인사항 관리</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedTeam} onValueChange={(value) => {
            setSelectedTeam(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="팀 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {Array.isArray(teams) && teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasAdminPermission() && (
            <Button size="sm" onClick={() => {
              setSelectedChecklistEdit(null);
              setChecklistForm({ name: "", required: false, price: "", teams: [] });
              setIsChecklistDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              항목 추가
            </Button>
          )}
        </div>
      </div>

      {/* 참여자별 확인사항 현황 */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">참여자별 확인 현황</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5개</SelectItem>
                  <SelectItem value="10">10개</SelectItem>
                  <SelectItem value="20">20개</SelectItem>
                  <SelectItem value="50">50개</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="font-semibold min-w-[120px]">참여자</TableHead>
                  {Array.isArray(checklistItems) && checklistItems
                    .filter(item => {
                      if (selectedTeam === 'all') return true;
                      return item.teams && item.teams.includes(selectedTeam);
                    })
                    .map((item) => (
                    <TableHead key={item.id} className="font-semibold text-center min-w-[120px]">
                      <div className="flex flex-col items-center">
                        <span className="text-xs">{item.name}</span>
                        {item.price && (
                          <span className="text-xs text-gray-500">${item.price} CAD</span>
                        )}
                        {item.required && (
                          <span className="text-xs text-red-500">필수</span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="font-semibold text-center">완료율</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  // 페이지네이션 계산
                  const totalParticipants = Array.isArray(participants) ? participants.length : 0;
                  const totalPages = Math.ceil(totalParticipants / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedParticipants = Array.isArray(participants) ? participants.slice(startIndex, endIndex) : [];

                  return paginatedParticipants.map((participant) => {
                  const participantCheckData = Array.isArray(checklistEntries) ? checklistEntries.filter(
                    entry => entry.participantId === participant.id
                  ) : [];
                  // 현재 선택된 팀에 해당하는 필수 항목만 완료율 계산에 포함
                  const filteredItems = Array.isArray(checklistItems) ? checklistItems.filter(item => {
                    if (selectedTeam === 'all') return true;
                    return item.teams && item.teams.includes(selectedTeam);
                  }) : [];
                  const requiredItems = filteredItems.filter(item => item.required);
                  const completedRequiredCount = participantCheckData.filter(entry => {
                    const item = filteredItems.find(item => item.id === entry.checklistItemId);
                    return entry.completed && item?.required;
                  }).length;
                  const totalRequiredCount = requiredItems.length;
                  const completionRate = totalRequiredCount > 0 ? Math.round((completedRequiredCount / totalRequiredCount) * 100) : 0;

                  return (
                    <TableRow key={participant.id} className="border-b last:border-0">
                      <TableCell className="font-medium">{participant.name}</TableCell>
                      {Array.isArray(checklistItems) && checklistItems
                        .filter(item => {
                          if (selectedTeam === 'all') return true;
                          return item.teams && item.teams.includes(selectedTeam);
                        })
                        .map((item) => {
                        const checkData = participantCheckData.find(
                          entry => entry.checklistItemId === item.id
                        );
                        
                        return (
                          <TableCell key={item.id} className="text-center">
                            <div className="flex justify-center">
                              {(() => {
                                // 기존 completed 필드와 새로운 status 필드 호환성 처리
                                const status = checkData?.status || (checkData?.completed ? 'completed' : 'pending');
                                const renderIcon = () => {
                                  switch (status) {
                                    case 'completed':
                                      return <CheckCircle className="h-5 w-5 text-green-500 hover:text-yellow-500 transition-colors" />;
                                    case 'in_progress':
                                      return <Triangle className="h-5 w-5 text-yellow-500 hover:text-red-500 transition-colors" />;
                                    case 'pending':
                                    default:
                                      return <XCircle className="h-5 w-5 text-red-300 hover:text-green-500 transition-colors" />;
                                  }
                                };

                                return (
                                  <div className="flex flex-col items-center">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="p-1 h-auto hover:bg-gray-50"
                                      onClick={() => toggleCheck(participant.id, item.id)}
                                    >
                                      {renderIcon()}
                                    </Button>
                                    {checkData?.completedDate && status === 'completed' && (
                                      <span className="text-xs text-gray-500 mt-1">
                                        {format(new Date(checkData.completedDate), "MM/dd", { locale: ko })}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        <div className="w-16 mx-auto">
                          <Badge 
                            className={`w-full justify-center text-xs ${
                              completionRate >= 80 
                                ? "bg-green-100 text-green-800 border-green-200"
                                : completionRate >= 50
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }`}
                          >
                            {completionRate}%
                          </Badge>
                        </div>
                        {totalRequiredCount > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {completedRequiredCount}/{totalRequiredCount} 필수
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                  });
                })()}
              </TableBody>
            </Table>
          </div>
          
          {/* 페이지네이션 */}
          {(() => {
            const totalParticipants = Array.isArray(participants) ? participants.length : 0;
            const totalPages = Math.ceil(totalParticipants / itemsPerPage);
            
            if (totalPages <= 1) return null;
            
            return (
              <div className="flex justify-between items-center p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  총 {totalParticipants}명 중 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalParticipants)}명 표시
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(Math.max(1, currentPage - 1));
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                            }}
                            isActive={currentPage === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(Math.min(totalPages, currentPage + 1));
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* 확인사항 목록 관리 */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">확인사항 목록</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="font-semibold">항목명</TableHead>
                <TableHead className="font-semibold">필수여부</TableHead>
                <TableHead className="font-semibold">금액</TableHead>
                <TableHead className="font-semibold">팀</TableHead>
                <TableHead className="font-semibold">완료자 수</TableHead>
                <TableHead className="text-right font-semibold">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(checklistItems) && checklistItems
                .filter(item => {
                  if (selectedTeam === 'all') return true;
                  return item.teams && item.teams.includes(selectedTeam);
                })
                .map((item) => {
                const completedCount = Array.isArray(checklistEntries) ? checklistEntries.filter(
                  entry => entry.checklistItemId === item.id && entry.completed
                ).length : 0;
                
                const teamNames = item.teams && item.teams.length > 0 
                  ? item.teams.map(teamId => {
                      const team = teams.find(t => t.id === teamId);
                      return team ? team.name : teamId;
                    }).join(', ')
                  : '전체';
                
                return (
                  <TableRow key={item.id} className="border-b last:border-0">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge className={item.required ? "bg-red-100 text-red-800 border-red-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                        {item.required ? "필수" : "선택"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.price ? `$${item.price} CAD` : "-"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{teamNames}</span>
                    </TableCell>
                    <TableCell>
                      {completedCount}/{Array.isArray(participants) ? participants.length : 0}명
                    </TableCell>
                    <TableCell className="text-right">
                      {hasAdminPermission() ? (
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedChecklistEdit(item);
                            setChecklistForm({
                              name: item.name,
                              required: item.required,
                              price: item.price?.toString() || "",
                              teams: item.teams || [],
                            });
                            setIsChecklistDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteChecklistItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">-</div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 확인사항 관리 다이얼로그 */}
      <Dialog open={isChecklistDialogOpen} onOpenChange={setIsChecklistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedChecklistEdit ? "확인사항 편집" : "새 확인사항 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="checklist-name">항목명</Label>
              <Input
                id="checklist-name"
                value={checklistForm.name}
                onChange={(e) => setChecklistForm({ ...checklistForm, name: e.target.value })}
                placeholder="확인사항 항목명을 입력하세요"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={checklistForm.required}
                onCheckedChange={(checked) => setChecklistForm({ ...checklistForm, required: !!checked })}
              />
              <Label htmlFor="required">필수 항목</Label>
            </div>
            <div>
              <Label htmlFor="price">금액 (CAD) - 선택사항</Label>
              <Input
                id="price"
                type="number"
                value={checklistForm.price}
                onChange={(e) => setChecklistForm({ ...checklistForm, price: e.target.value })}
                placeholder="금액을 입력하세요 (예: 25.00)"
              />
            </div>
            <div>
              <Label htmlFor="teams">팀 선택 - 선택사항</Label>
              <div className="mt-2 space-y-2">
                {Array.isArray(teams) && teams.map((team) => (
                  <div key={team.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`team-${team.id}`}
                      checked={checklistForm.teams.includes(team.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setChecklistForm({ 
                            ...checklistForm, 
                            teams: [...checklistForm.teams, team.id] 
                          });
                        } else {
                          setChecklistForm({ 
                            ...checklistForm, 
                            teams: checklistForm.teams.filter(id => id !== team.id) 
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`team-${team.id}`}>{team.name}</Label>
                  </div>
                ))}
                {(!Array.isArray(teams) || teams.length === 0) && (
                  <p className="text-sm text-muted-foreground">등록된 팀이 없습니다.</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsChecklistDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleChecklistSubmit}>
                {selectedChecklistEdit ? "수정" : "추가"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}