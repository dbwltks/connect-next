"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Settings, Edit, Trash2, UserPlus } from "lucide-react";
import { saveProgramFeatureData, loadProgramData } from "../utils/program-data";
import { participantsApi } from "../utils/api";
import { createClient } from "@/utils/supabase/client";

// 구글 캘린더 실제 색상값 (빨주노초 순서)
const GOOGLE_CALENDAR_COLORS = [
  { id: "11", name: "토마토", color: "#d50000", hex: "#d50000" },
  { id: "4", name: "플라밍고", color: "#e67c73", hex: "#e67c73" },
  { id: "6", name: "탠저린", color: "#ff9800", hex: "#ff9800" },
  { id: "5", name: "바나나", color: "#f6bf26", hex: "#f6bf26" },
  { id: "10", name: "바질", color: "#0b8043", hex: "#0b8043" },
  { id: "2", name: "세이지", color: "#33b679", hex: "#33b679" },
  { id: "7", name: "피콕", color: "#039be5", hex: "#039be5" },
  { id: "9", name: "블루베리", color: "#3f51b5", hex: "#3f51b5" },
  { id: "1", name: "라벤더", color: "#7986cb", hex: "#7986cb" },
  { id: "3", name: "그레이프", color: "#8e24aa", hex: "#8e24aa" },
  { id: "8", name: "그래파이트", color: "#616161", hex: "#616161" },
];

// 타입 정의
interface Team {
  id: string;
  name: string;
  description?: string;
  color: string;
  google_calendar_color_id?: string; // 구글 캘린더 색상 ID (1-11)
}

interface TeamRole {
  id: string;
  name: string;
  tier: number; // 0이 최고 티어, 숫자가 높을수록 낮은 티어
  color: string;
  order: number; // 표시 순서
}

interface TeamMember {
  teamId: string;
  participantId: string;
  roleId: string;
  joinDate: string;
}

interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
}

interface TeamsTabProps {
  programId: string;
}

export default function TeamsTab({ programId }: TeamsTabProps) {
  // State 관리
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamRoles, setTeamRoles] = useState<TeamRole[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Dialog 상태
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isTeamSettingsDialogOpen, setIsTeamSettingsDialogOpen] = useState(false);
  
  // 멤버 검색 관련 상태 (각 팀별로 관리)
  const [teamMemberSearch, setTeamMemberSearch] = useState<{[teamId: string]: {
    searchOpen: boolean;
    searchValue: string;
    allMembers: any[];
    selectedMember: any | null;
    selectedRole: string;
  }}>({});
  const searchMembersRef = useRef<NodeJS.Timeout>();
  
  // 편집 상태
  const [selectedTeamEdit, setSelectedTeamEdit] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
    color: "#3f51b5", // 구글 캘린더 기본 블루베리 색상
    google_calendar_color_id: "9" // 블루베리 색상 ID
  });
  
  // 역할 관리
  const [newRole, setNewRole] = useState({
    name: "",
    tier: 1,
    color: "#3B82F6"
  });
  
  // 편집 중인 역할들의 임시 상태
  const [editingRoles, setEditingRoles] = useState<{[roleId: string]: Partial<TeamRole>}>({});


  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 참가자 데이터 로드
        const participantsData = await participantsApi.getAll(programId);
        setParticipants(participantsData);

        // 프로그램 데이터에서 모든 팀 관련 데이터 로드
        const programData = await loadProgramData(programId);
        
        if (programData) {
          // 팀 데이터 로드
          if (programData.teams && Array.isArray(programData.teams)) {
            setTeams(programData.teams);
          }
          
          // 팀원 데이터 로드 및 정리
          if (programData.team_members && Array.isArray(programData.team_members)) {
            // 참가자 ID 목록 생성
            const participantIds = participantsData.map(p => p.id);
            
            // 실제 존재하는 참가자만 팀 멤버로 유지
            const validTeamMembers = programData.team_members.filter(
              (tm: TeamMember) => participantIds.includes(tm.participantId)
            );
            
            // orphaned team members가 있었다면 DB 업데이트
            if (validTeamMembers.length !== programData.team_members.length) {
              console.log(`정리된 팀 멤버: ${programData.team_members.length - validTeamMembers.length}명의 orphaned members 제거`);
              await saveProgramFeatureData(programId, 'team_members', validTeamMembers);
            }
            
            setTeamMembers(validTeamMembers);
          }
          
          // 역할 데이터 로드
          if (programData.team_roles && Array.isArray(programData.team_roles) && programData.team_roles.length > 0) {
            setTeamRoles(programData.team_roles);
          } else {
            // 기본 역할 설정 및 저장
            const defaultRoles = [
              { id: "leader", name: "팀장", tier: 0, color: "#DC2626", order: 0 },
              { id: "member", name: "팀원", tier: 1, color: "#3B82F6", order: 1 },
            ];
            setTeamRoles(defaultRoles);
            
            // 기본 역할을 DB에 저장
            await saveProgramFeatureData(programId, 'team_roles', defaultRoles);
          }
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      }
    };

    loadData();
  }, [programId]);

  // 팀 생성/수정
  const handleTeamSubmit = async () => {
    try {
      let updatedTeams;
      
      if (selectedTeamEdit) {
        // 팀 수정
        updatedTeams = teams.map(team =>
          team.id === selectedTeamEdit.id
            ? { ...team, ...teamForm }
            : team
        );
      } else {
        // 팀 생성
        const newTeam: Team = {
          id: `team_${Date.now()}`,
          ...teamForm
        };
        updatedTeams = [...teams, newTeam];
      }
      
      const success = await saveProgramFeatureData(programId, 'teams', updatedTeams);
      
      if (success) {
        setTeams(updatedTeams);
        setIsTeamDialogOpen(false);
        setSelectedTeamEdit(null);
        setTeamForm({ name: "", description: "", color: "#5484ed", google_calendar_color_id: "9" });
      } else {
        alert('팀 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('팀 저장 실패:', error);
      alert('팀 저장에 실패했습니다.');
    }
  };

  // 팀 삭제
  const handleDeleteTeam = async (teamId: string) => {
    if (confirm("정말로 이 팀을 삭제하시겠습니까?")) {
      try {
        const updatedTeams = teams.filter(t => t.id !== teamId);
        const updatedMembers = teamMembers.filter(tm => tm.teamId !== teamId);
        
        const teamsSuccess = await saveProgramFeatureData(programId, 'teams', updatedTeams);
        const membersSuccess = await saveProgramFeatureData(programId, 'team_members', updatedMembers);
        
        if (teamsSuccess && membersSuccess) {
          setTeams(updatedTeams);
          setTeamMembers(updatedMembers);
        } else {
          alert('팀 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('팀 삭제 실패:', error);
        alert('팀 삭제에 실패했습니다.');
      }
    }
  };

  // 역할 변경
  const handleRoleChange = async (teamId: string, participantId: string, newRoleId: string) => {
    try {
      const updatedMembers = teamMembers.map(tm =>
        tm.participantId === participantId && tm.teamId === teamId
          ? { ...tm, roleId: newRoleId }
          : tm
      );
      
      const success = await saveProgramFeatureData(programId, 'team_members', updatedMembers);
      
      if (success) {
        setTeamMembers(updatedMembers);
      } else {
        alert('역할 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('역할 변경 실패:', error);
      alert('역할 변경에 실패했습니다.');
    }
  };

  // 역할 추가
  const handleAddRole = async () => {
    try {
      const role: TeamRole = {
        id: `role_${Date.now()}`,
        ...newRole,
        order: teamRoles.length
      };
      
      const updatedRoles = [...teamRoles, role];
      const success = await saveProgramFeatureData(programId, 'team_roles', updatedRoles);
      
      if (success) {
        setTeamRoles(updatedRoles);
        setNewRole({ name: "", tier: 1, color: "#3B82F6" });
      } else {
        alert('역할 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('역할 추가 실패:', error);
      alert('역할 추가에 실패했습니다.');
    }
  };

  // 역할 삭제
  const handleDeleteRole = async (roleId: string) => {
    // 기본 역할 (팀장, 팀원)은 삭제 방지
    if (roleId === "leader" || roleId === "member") {
      alert("기본 역할은 삭제할 수 없습니다.");
      return;
    }

    // 해당 역할을 사용하는 팀원이 있는지 확인
    const roleInUse = teamMembers.some(tm => tm.roleId === roleId);
    if (roleInUse) {
      alert("이 역할을 사용하는 팀원이 있어 삭제할 수 없습니다.");
      return;
    }

    if (confirm("정말로 이 역할을 삭제하시겠습니까?")) {
      try {
        const updatedRoles = teamRoles.filter(role => role.id !== roleId);
        const success = await saveProgramFeatureData(programId, 'team_roles', updatedRoles);
        
        if (success) {
          setTeamRoles(updatedRoles);
        } else {
          alert('역할 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('역할 삭제 실패:', error);
        alert('역할 삭제에 실패했습니다.');
      }
    }
  };

  // 역할 임시 수정 (로컬 상태만 변경)
  const handleRoleEdit = (roleId: string, updates: Partial<TeamRole>) => {
    setEditingRoles(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        ...updates
      }
    }));
  };

  // 역할 수정 저장
  const handleSaveRole = async (roleId: string) => {
    try {
      const roleUpdates = editingRoles[roleId];
      if (!roleUpdates) return;
      
      const updatedRoles = teamRoles.map(role =>
        role.id === roleId ? { ...role, ...roleUpdates } : role
      );
      
      const success = await saveProgramFeatureData(programId, 'team_roles', updatedRoles);
      
      if (success) {
        setTeamRoles(updatedRoles);
        // 편집 상태에서 제거
        setEditingRoles(prev => {
          const newState = { ...prev };
          delete newState[roleId];
          return newState;
        });
      } else {
        alert('역할 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('역할 수정 실패:', error);
      alert('역할 수정에 실패했습니다.');
    }
  };

  // 역할 수정 취소
  const handleCancelRoleEdit = (roleId: string) => {
    setEditingRoles(prev => {
      const newState = { ...prev };
      delete newState[roleId];
      return newState;
    });
  };

  // 현재 표시할 역할 값 가져오기 (편집 중이면 편집 값, 아니면 원본 값)
  const getRoleDisplayValue = (role: TeamRole, field: keyof TeamRole) => {
    const editingRole = editingRoles[role.id];
    if (editingRole && field in editingRole) {
      return editingRole[field];
    }
    return role[field];
  };



  // 팀원 삭제
  const removeParticipantFromTeam = async (teamId: string, participantId: string) => {
    if (confirm("정말로 이 팀원을 팀에서 제거하시겠습니까?")) {
      try {
        const updatedMembers = teamMembers.filter(tm => 
          !(tm.teamId === teamId && tm.participantId === participantId)
        );
        
        const success = await saveProgramFeatureData(programId, 'team_members', updatedMembers);
        
        if (success) {
          setTeamMembers(updatedMembers);
        } else {
          alert('팀원 제거에 실패했습니다.');
        }
      } catch (error) {
        console.error('팀원 제거 실패:', error);
        alert('팀원 제거에 실패했습니다.');
      }
    }
  };

  // 참가자를 팀에 추가하는 함수  
  const addParticipantToTeam = async (teamId: string, participantId: string, roleId: string) => {
    const newTeamMember: TeamMember = {
      teamId: teamId,
      participantId: participantId,
      roleId,
      joinDate: new Date().toISOString()
    };
    
    const updatedMembers = [...teamMembers, newTeamMember];
    
    // 직접 Supabase 호출로 시도
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('programs')
        .update({ 
          team_members: updatedMembers,
          updated_at: new Date().toISOString()
        })
        .eq('id', programId);

      if (error) {
        console.error('직접 저장 실패:', error);
        return;
      }

      setTeamMembers(updatedMembers);
      // 검색 상태 초기화
      setTeamMemberSearch(prev => ({
        ...prev,
        [teamId]: {
          searchOpen: false,
          searchValue: '',
          allMembers: [],
          selectedMember: null,
          selectedRole: ''
        }
      }));
    } catch (error) {
      console.error('팀원 추가 에러:', error);
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">팀 관리</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsTeamSettingsDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            팀 설정
          </Button>
          <Button size="sm" onClick={() => {
            setSelectedTeamEdit(null);
            setTeamForm({ name: "", description: "", color: "#5484ed", google_calendar_color_id: "9" });
            setIsTeamDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            팀 생성
          </Button>
        </div>
      </div>

      {/* 팀 목록 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          const teamMembersList = teamMembers.filter(tm => tm.teamId === team.id);
          // 실제 존재하는 참가자만 필터링
          const validTeamMembers = teamMembersList.filter(tm => 
            participants.some(p => p.id === tm.participantId)
          );
          
          return (
            <Card key={team.id} className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: team.color }}
                    ></div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedTeamEdit(team);
                      setTeamForm({
                        name: team.name,
                        description: team.description || "",
                        color: team.color,
                        google_calendar_color_id: team.google_calendar_color_id || "9"
                      });
                      setIsTeamDialogOpen(true);
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTeam(team.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {team.description && (
                  <p className="text-sm text-gray-600">{team.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">
                      팀원 ({validTeamMembers.length}명)
                    </p>
                  </div>
                  <div className="space-y-2">
                    {validTeamMembers.map((member) => {
                      const participant = participants.find(p => p.id === member.participantId);
                      if (!participant) return null;
                      
                      const memberRole = teamRoles.find(role => role.id === member.roleId);
                      return (
                        <div key={member.participantId} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <span>{participant.name}</span>
                            {memberRole && (
                              <Badge 
                                style={{ 
                                  backgroundColor: memberRole.color + '20', 
                                  color: memberRole.color, 
                                  borderColor: memberRole.color + '40' 
                                }}
                                className="text-xs px-2 py-0.5"
                              >
                                {memberRole.name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={member.roleId}
                              onValueChange={(newRoleId) => handleRoleChange(team.id, member.participantId, newRoleId)}
                            >
                              <SelectTrigger className="w-20 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {teamRoles.map(role => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeParticipantFromTeam(team.id, member.participantId)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* 팀원 추가 - 간단한 한 줄 UI */}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          {/* 클릭 외부 영역 감지를 위한 오버레이 */}
                          {teamMemberSearch[team.id]?.searchOpen && (
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setTeamMemberSearch(prev => ({
                                ...prev,
                                [team.id]: { ...prev[team.id], searchOpen: false }
                              }))}
                            />
                          )}
                          <Input 
                            placeholder="참가자 이름 검색..." 
                            className="h-8 text-sm"
                            value={teamMemberSearch[team.id]?.searchValue || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              
                              if (value.length >= 1) {
                                // 검색된 참가자들
                                const searchedParticipants = participants.filter(p => 
                                  p.name.toLowerCase().includes(value.toLowerCase())
                                );
                                
                                // 현재 팀의 참가자 ID 목록
                                const currentTeamMemberIds = validTeamMembers.map(tm => tm.participantId);
                                
                                // 중복 상태 표시
                                const participantsWithStatus = searchedParticipants.map(participant => ({
                                  ...participant,
                                  isInCurrentTeam: currentTeamMemberIds.includes(participant.id)
                                }));
                                
                                setTeamMemberSearch(prev => ({
                                  ...prev,
                                  [team.id]: {
                                    ...prev[team.id],
                                    searchValue: value,
                                    searchOpen: participantsWithStatus.length > 0,
                                    allMembers: participantsWithStatus,
                                    selectedMember: null,
                                    selectedRole: 'member'
                                  }
                                }));
                              } else {
                                setTeamMemberSearch(prev => ({
                                  ...prev,
                                  [team.id]: {
                                    ...prev[team.id],
                                    searchValue: value,
                                    searchOpen: false,
                                    allMembers: [],
                                    selectedMember: null,
                                    selectedRole: 'member'
                                  }
                                }));
                              }
                            }}
                          />
                          
                          {/* 검색 결과 드롭다운 */}
                          {teamMemberSearch[team.id]?.searchOpen && teamMemberSearch[team.id]?.allMembers?.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-auto">
                              {teamMemberSearch[team.id].allMembers.map((participant) => (
                                <div 
                                  key={participant.id} 
                                  className={`p-2 border-b last:border-b-0 ${
                                    participant.isInCurrentTeam 
                                      ? 'bg-red-50 cursor-not-allowed opacity-60' 
                                      : 'cursor-pointer hover:bg-gray-50'
                                  }`}
                                  onClick={() => {
                                    if (!participant.isInCurrentTeam) {
                                      setTeamMemberSearch(prev => ({
                                        ...prev,
                                        [team.id]: {
                                          ...prev[team.id],
                                          selectedMember: participant,
                                          searchOpen: false,
                                          searchValue: participant.name
                                        }
                                      }));
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">{participant.name}</p>
                                    {participant.isInCurrentTeam && (
                                      <Badge variant="destructive" className="text-xs">
                                        이미 팀원
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <Select 
                          value={teamMemberSearch[team.id]?.selectedRole || 'member'}
                          onValueChange={(roleId) => {
                            setTeamMemberSearch(prev => ({
                              ...prev,
                              [team.id]: {
                                ...prev[team.id],
                                selectedRole: roleId
                              }
                            }));
                          }}
                        >
                          <SelectTrigger className="w-20 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {teamRoles.map(role => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          size="sm" 
                          className="h-8 px-3 text-xs"
                          disabled={
                            !teamMemberSearch[team.id]?.selectedMember || 
                            teamMemberSearch[team.id]?.selectedMember?.isInCurrentTeam
                          }
                          onClick={() => {
                            const participant = teamMemberSearch[team.id]?.selectedMember;
                            const roleId = teamMemberSearch[team.id]?.selectedRole || 'member';
                            if (participant && !participant.isInCurrentTeam) {
                              addParticipantToTeam(team.id, participant.id, roleId);
                            }
                          }}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          추가
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 팀 생성/편집 Dialog */}
      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTeamEdit ? '팀 편집' : '새 팀 생성'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-name">팀 이름</Label>
              <Input
                id="team-name"
                value={teamForm.name}
                onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                placeholder="팀 이름을 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="team-description">설명</Label>
              <Textarea
                id="team-description"
                value={teamForm.description}
                onChange={(e) => setTeamForm({...teamForm, description: e.target.value})}
                placeholder="팀 설명을 입력하세요"
              />
            </div>
            <div>
              <Label>팀 색상 (구글 캘린더 연동)</Label>
              <div className="space-y-3">
                <div className="grid grid-cols-6 gap-2">
                  {GOOGLE_CALENDAR_COLORS.map((colorOption) => {
                    // 현재 편집 중인 팀을 제외하고 다른 팀에서 사용 중인지 확인
                    const isUsedByOtherTeam = teams.some(team => 
                      team.color === colorOption.hex && 
                      team.id !== selectedTeamEdit?.id
                    );
                    const usingTeam = teams.find(team => 
                      team.color === colorOption.hex && 
                      team.id !== selectedTeamEdit?.id
                    );
                    
                    return (
                      <button
                        key={colorOption.id}
                        type="button"
                        onClick={() => setTeamForm({
                          ...teamForm, 
                          color: colorOption.hex,
                          google_calendar_color_id: colorOption.id
                        })}
                        className={`relative w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 flex items-center justify-center ${
                          teamForm.color === colorOption.hex 
                            ? 'border-gray-800 shadow-lg' 
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: colorOption.color }}
                        title={`${colorOption.name}${isUsedByOtherTeam ? ` (${usingTeam?.name}에서 사용 중)` : ''}`}
                      >
                        {isUsedByOtherTeam && (
                          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white text-white text-xs flex items-center justify-center font-bold">
                            !
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div 
                    className="w-4 h-4 rounded border" 
                    style={{ backgroundColor: teamForm.color }}
                  />
                  <span>
                    선택된 색상: {GOOGLE_CALENDAR_COLORS.find(c => c.hex === teamForm.color)?.name || '사용자 정의'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTeamDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleTeamSubmit}>
                {selectedTeamEdit ? '수정' : '생성'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* 팀 설정 Dialog */}
      <Dialog open={isTeamSettingsDialogOpen} onOpenChange={setIsTeamSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팀 설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">역할 관리</h3>
              <div className="space-y-2 mb-4">
                {teamRoles.map(role => {
                  const isEditing = role.id in editingRoles;
                  const hasChanges = isEditing && Object.keys(editingRoles[role.id] || {}).length > 0;
                  
                  return (
                    <div key={role.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={getRoleDisplayValue(role, 'color') as string}
                          onChange={(e) => handleRoleEdit(role.id, { color: e.target.value })}
                          className="w-8 h-8 p-0 border-0"
                        />
                        <Input
                          value={getRoleDisplayValue(role, 'name') as string}
                          onChange={(e) => handleRoleEdit(role.id, { name: e.target.value })}
                          className="w-24 h-8"
                        />
                        <Select 
                          value={(getRoleDisplayValue(role, 'tier') as number).toString()} 
                          onValueChange={(value) => handleRoleEdit(role.id, { tier: parseInt(value) })}
                        >
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">T0</SelectItem>
                            <SelectItem value="1">T1</SelectItem>
                            <SelectItem value="2">T2</SelectItem>
                            <SelectItem value="3">T3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasChanges && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleCancelRoleEdit(role.id)}
                              className="h-8 px-2 text-xs"
                            >
                              취소
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => handleSaveRole(role.id)}
                              className="h-8 px-2 text-xs"
                            >
                              저장
                            </Button>
                          </>
                        )}
                        {role.id === "leader" || role.id === "member" ? (
                          <Badge variant="secondary" className="text-xs">기본</Badge>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteRole(role.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">새 역할 추가</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="역할 이름"
                    value={newRole.name}
                    onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  />
                  <Select value={newRole.tier.toString()} onValueChange={(value) => setNewRole({...newRole, tier: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">티어 0 (최고)</SelectItem>
                      <SelectItem value="1">티어 1</SelectItem>
                      <SelectItem value="2">티어 2</SelectItem>
                      <SelectItem value="3">티어 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="color"
                    value={newRole.color}
                    onChange={(e) => setNewRole({...newRole, color: e.target.value})}
                    className="w-full"
                  />
                  <Button onClick={handleAddRole} disabled={!newRole.name}>
                    추가
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}