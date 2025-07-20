"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  UserCheck,
  Plus,
  Calendar,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";

// 로컬 날짜를 YYYY-MM-DD 형식으로 변환 (시간대 문제 해결)
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 날짜 문자열을 로컬 Date 객체로 변환 (시간대 문제 해결)
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};
import { createClient } from "@/utils/supabase/client";
import { participantsApi, type Participant } from "../utils/api";
import { saveProgramFeatureData, loadProgramData } from "../utils/program-data";

interface AttendanceRecord {
  id: string;
  participantId: string;
  date: string;
  status: "present" | "absent" | "late";
  notes?: string;
  createdAt: string;
}

interface AttendanceSession {
  id: string;
  date: string;
  title: string;
  description?: string;
  createdAt: string;
}

interface AttendanceTabProps {
  programId: string;
}

export default function AttendanceTab({ programId }: AttendanceTabProps) {
  // 상태 관리
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<
    AttendanceSession[]
  >([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [userRole, setUserRole] = useState<string>("guest");

  // 모달 상태
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // 폼 상태
  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    date: formatLocalDate(new Date()),
  });

  // 관리자 권한 확인
  const hasAdminPermission = () => {
    return userRole === "admin" || userRole === "tier0" || userRole === "tier1";
  };

  // 사용자 역할 로드
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

          setUserRole(userData?.role || "guest");
        }
      } catch (error) {
        console.error("사용자 역할 로드 실패:", error);
        setUserRole("guest");
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

        // 출석 세션 및 기록 데이터 로드
        const programData = await loadProgramData(programId);
        if (programData) {
          if (programData.attendance_sessions) {
            setAttendanceSessions(
              Array.isArray(programData.attendance_sessions)
                ? programData.attendance_sessions
                : []
            );
          }
          if (programData.attendance_records) {
            setAttendanceRecords(
              Array.isArray(programData.attendance_records)
                ? programData.attendance_records
                : []
            );
          }
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    };

    loadData();
  }, [programId]);

  // 출석 세션 저장
  const saveAttendanceSessions = async (sessions: AttendanceSession[]) => {
    try {
      console.log("출석 세션 저장 시도:", {
        programId,
        sessionsCount: sessions.length,
        sessions: sessions,
      });

      const result = await saveProgramFeatureData(
        programId,
        "attendance_sessions",
        sessions
      );

      if (result) {
        setAttendanceSessions(sessions);
        console.log("출석 세션 저장 성공");
      } else {
        throw new Error("저장 함수에서 false 반환");
      }
    } catch (error) {
      console.error("출석 세션 저장 실패:", error);
      alert("출석 세션 저장에 실패했습니다.");
    }
  };

  // 출석 기록 저장
  const saveAttendanceRecords = async (records: AttendanceRecord[]) => {
    try {
      await saveProgramFeatureData(programId, "attendance_records", records);
      setAttendanceRecords(records);
    } catch (error) {
      console.error("출석 기록 저장 실패:", error);
      alert("출석 기록 저장에 실패했습니다.");
    }
  };

  // 출석 세션 추가/수정
  const handleSessionSubmit = async () => {
    if (!sessionForm.title.trim() || !sessionForm.date) {
      alert("제목과 날짜를 입력해주세요.");
      return;
    }

    console.log("세션 제출 시작:", {
      sessionForm,
      editingSessionId,
      programId,
    });

    try {
      if (editingSessionId) {
        // 수정
        const updatedSessions = attendanceSessions.map((session) =>
          session.id === editingSessionId
            ? {
                ...session,
                title: sessionForm.title,
                description: sessionForm.description,
                date: sessionForm.date,
              }
            : session
        );
        await saveAttendanceSessions(updatedSessions);
      } else {
        // 새 세션 추가
        const newSession: AttendanceSession = {
          id: `session_${Date.now()}`,
          title: sessionForm.title,
          description: sessionForm.description,
          date: sessionForm.date,
          createdAt: new Date().toISOString(),
        };
        await saveAttendanceSessions([...attendanceSessions, newSession]);
      }

      setIsSessionModalOpen(false);
      setEditingSessionId(null);
      setSessionForm({
        title: "",
        description: "",
        date: formatLocalDate(new Date()),
      });
    } catch (error) {
      console.error("출석 세션 저장 실패:", error);
      alert("출석 세션 저장에 실패했습니다.");
    }
  };

  // 출석 세션 삭제
  const handleDeleteSession = async (sessionId: string) => {
    if (confirm("정말로 이 출석 세션을 삭제하시겠습니까?")) {
      try {
        const updatedSessions = attendanceSessions.filter(
          (s) => s.id !== sessionId
        );
        const updatedRecords = attendanceRecords.filter(
          (r) =>
            r.date !== attendanceSessions.find((s) => s.id === sessionId)?.date
        );

        await saveAttendanceSessions(updatedSessions);
        await saveAttendanceRecords(updatedRecords);
      } catch (error) {
        console.error("출석 세션 삭제 실패:", error);
        alert("출석 세션 삭제에 실패했습니다.");
      }
    }
  };

  // 출석 상태 토글
  const toggleAttendance = async (
    participantId: string,
    sessionDate: string
  ) => {
    const existingRecord = attendanceRecords.find(
      (record) =>
        record.participantId === participantId && record.date === sessionDate
    );

    let newStatus: "present" | "absent" | "late";
    if (!existingRecord || existingRecord.status === "absent") {
      newStatus = "present";
    } else if (existingRecord.status === "present") {
      newStatus = "late";
    } else {
      newStatus = "absent";
    }

    try {
      let updatedRecords;
      if (existingRecord) {
        updatedRecords = attendanceRecords.map((record) =>
          record.participantId === participantId && record.date === sessionDate
            ? { ...record, status: newStatus }
            : record
        );
      } else {
        const newRecord: AttendanceRecord = {
          id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          participantId,
          date: sessionDate,
          status: newStatus,
          createdAt: new Date().toISOString(),
        };
        updatedRecords = [...attendanceRecords, newRecord];
      }

      await saveAttendanceRecords(updatedRecords);
    } catch (error) {
      console.error("출석 상태 변경 실패:", error);
      alert("출석 상태 변경에 실패했습니다.");
    }
  };

  // 참가자 정렬
  const sortedParticipants = [...participants].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.name.localeCompare(b.name, "ko");
    } else {
      return b.name.localeCompare(a.name, "ko");
    }
  });

  // 페이지네이션
  const totalParticipants = sortedParticipants.length;
  const totalPages = Math.ceil(totalParticipants / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedParticipants = sortedParticipants.slice(startIndex, endIndex);

  // 출석 통계 계산
  const totalSessions = attendanceSessions.length;
  const activeSessions = attendanceSessions.filter((session) => {
    const sessionDate = new Date(session.date);
    const today = new Date();
    return sessionDate <= today;
  }).length;
  const totalAttendanceRecords = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(
    (r) => r.status === "present"
  ).length;
  const attendanceRate =
    totalAttendanceRecords > 0
      ? Math.round((presentCount / totalAttendanceRecords) * 100)
      : 0;

  return (
    <div className="space-y-4 p-4">
      {/* 출석 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">총 세션</div>
            <div className="text-2xl font-bold text-blue-600">
              {totalSessions}개
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">진행된 세션</div>
            <div className="text-2xl font-bold text-green-600">
              {activeSessions}개
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">총 참가자</div>
            <div className="text-2xl font-bold text-purple-600">
              {participants.length}명
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">출석률</div>
            <div
              className={`text-2xl font-bold transition-colors duration-200 ${
                attendanceRate >= 80
                  ? "text-green-600"
                  : attendanceRate >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {attendanceRate}%
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 출석 세션 관리 - 캘린더 기반 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              출석 세션
            </h3>
            <Badge variant="secondary" className="text-sm text-blue-400">
              {attendanceSessions.length}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 캘린더 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                className="rounded-md"
                modifiers={{
                  hasSession: attendanceSessions.map((session) =>
                    parseLocalDate(session.date)
                  ),
                }}
                modifiersStyles={{
                  hasSession: {
                    backgroundColor: "#dbeafe",
                    color: "#1d4ed8",
                    fontWeight: "bold",
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* 선택된 날짜의 세션들 */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })}{" "}
                    세션
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {(() => {
                      const selectedDateSessions = attendanceSessions.filter(
                        (session) =>
                          isSameDay(parseLocalDate(session.date), selectedDate)
                      );
                      return selectedDateSessions.length > 0
                        ? `${selectedDateSessions.length}개의 세션이 있습니다.`
                        : "세션이 없습니다.";
                    })()}
                  </p>
                </div>
                {hasAdminPermission() && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingSessionId(null);
                      setSessionForm({
                        title: "",
                        description: "",
                        date: formatLocalDate(selectedDate),
                      });
                      setIsSessionModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    세션 추가
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const selectedDateSessions = attendanceSessions
                    .filter((session) =>
                      isSameDay(parseLocalDate(session.date), selectedDate)
                    )
                    .sort(
                      (a, b) =>
                        parseLocalDate(a.date).getTime() -
                        parseLocalDate(b.date).getTime()
                    );

                  if (selectedDateSessions.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        선택된 날짜에 세션이 없습니다.
                        {hasAdminPermission() && (
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingSessionId(null);
                                setSessionForm({
                                  title: "",
                                  description: "",
                                  date: formatLocalDate(selectedDate),
                                });
                                setIsSessionModalOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />새 세션 추가
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return selectedDateSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 border rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{session.title}</h4>
                          {session.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {session.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            생성일:{" "}
                            {format(new Date(session.createdAt), "MM/dd HH:mm")}
                          </p>
                        </div>
                        {hasAdminPermission() && (
                          <div className="flex gap-1 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingSessionId(session.id);
                                setSessionForm({
                                  title: session.title,
                                  description: session.description || "",
                                  date: session.date,
                                });
                                setIsSessionModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSession(session.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 전체 출석 현황 테이블 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              출석 현황
            </h3>
            <Badge variant="secondary" className="text-sm text-blue-400">
              {participants.length}명
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
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
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="font-semibold min-w-[120px] sticky left-0 bg-white z-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-semibold hover:bg-transparent flex items-center gap-1"
                        onClick={() => {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          setCurrentPage(1);
                        }}
                      >
                        참가자
                        {sortOrder === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    {attendanceSessions
                      .sort(
                        (a, b) =>
                          parseLocalDate(a.date).getTime() -
                          parseLocalDate(b.date).getTime()
                      )
                      .map((session) => (
                        <TableHead
                          key={session.id}
                          className="font-semibold text-center min-w-[100px]"
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-medium">
                              {session.title}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              {format(parseLocalDate(session.date), "MM/dd", {
                                locale: ko,
                              })}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                    <TableHead className="font-semibold text-center min-w-[80px]">
                      출석률
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedParticipants.map((participant) => {
                    // 참가자별 출석률 계산
                    const participantRecords = attendanceRecords.filter(
                      (record) => record.participantId === participant.id
                    );
                    const presentCount = participantRecords.filter(
                      (record) => record.status === "present"
                    ).length;
                    const totalSessions = attendanceSessions.length;
                    const attendanceRate =
                      totalSessions > 0
                        ? Math.round((presentCount / totalSessions) * 100)
                        : 0;

                    return (
                      <TableRow
                        key={participant.id}
                        className="border-b last:border-0"
                      >
                        <TableCell className="font-medium py-3 sticky left-0 bg-white z-10">
                          {participant.name}
                        </TableCell>
                        {attendanceSessions
                          .sort(
                            (a, b) =>
                              parseLocalDate(a.date).getTime() -
                              parseLocalDate(b.date).getTime()
                          )
                          .map((session) => {
                            const attendanceRecord = attendanceRecords.find(
                              (record) =>
                                record.participantId === participant.id &&
                                record.date === session.date
                            );
                            const status = attendanceRecord?.status || "absent";

                            return (
                              <TableCell
                                key={session.id}
                                className="text-center py-3"
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-auto hover:bg-gray-50"
                                  onClick={() =>
                                    toggleAttendance(
                                      participant.id,
                                      session.date
                                    )
                                  }
                                >
                                  {status === "present" && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  )}
                                  {status === "late" && (
                                    <Clock className="h-5 w-5 text-yellow-500" />
                                  )}
                                  {status === "absent" && (
                                    <XCircle className="h-5 w-5 text-red-300" />
                                  )}
                                </Button>
                              </TableCell>
                            );
                          })}
                        <TableCell className="text-center py-3">
                          <div className="w-16 mx-auto">
                            <Badge
                              className={`w-full justify-center text-xs transition-colors duration-200 ${
                                attendanceRate >= 80
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : attendanceRate >= 60
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                              }`}
                            >
                              {attendanceRate}%
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {participants.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={attendanceSessions.length + 2}
                        className="text-center py-8 text-gray-500"
                      >
                        등록된 참가자가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  총 {totalParticipants}명 중 {startIndex + 1}-
                  {Math.min(endIndex, totalParticipants)}명 표시
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* 출석 세션 추가/수정 모달 */}
      <Dialog open={isSessionModalOpen} onOpenChange={setIsSessionModalOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSessionId ? "출석 세션 수정" : "새 출석 세션 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="session-title">세션 제목 *</Label>
              <Input
                id="session-title"
                value={sessionForm.title}
                onChange={(e) =>
                  setSessionForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="예: 1차 세미나, 정기 모임 등"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="session-date">날짜 *</Label>
              <Input
                id="session-date"
                type="date"
                value={sessionForm.date}
                onChange={(e) =>
                  setSessionForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="session-description">설명</Label>
              <Textarea
                id="session-description"
                value={sessionForm.description}
                onChange={(e) =>
                  setSessionForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="세션에 대한 추가 설명 (선택사항)"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSessionModalOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleSessionSubmit}>
              {editingSessionId ? "수정" : "추가"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
