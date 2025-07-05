"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, CalendarDays, History, MapPin, Clock, User } from "lucide-react";
import { supabase } from "@/db";
import { IWidget } from "@/types";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  category: string;
  color: string;
  department?: string;
  is_all_day: boolean;
  created_by?: string;
}

interface SimpleCalendarWidgetProps {
  widget: IWidget;
}

export default function SimpleCalendarWidget({
  widget,
}: SimpleCalendarWidgetProps) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">(
    widget.settings?.default_tab || "upcoming"
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // SWR로 일정 데이터 관리
  const {
    data: events = [],
    error,
    isLoading,
  } = useSWR(
    ["calendar_events"],
    async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data || [];
    }
    // 전역 설정 사용
  );

  // 이벤트 색상 가져오기 (데이터베이스에 저장된 color 사용)
  const getEventColor = (event: CalendarEvent) => {
    return event.color || "#6B7280";
  };

  // 시간 포맷팅 함수
  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    return timeString.substring(0, 5); // HH:MM 형식
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateString === today.toISOString().split("T")[0]) {
      return "오늘";
    }
    if (dateString === tomorrow.toISOString().split("T")[0]) {
      return "내일";
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];

    return `${month}월 ${day}일 (${weekday})`;
  };

  // 다가올 일정 가져오기
  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split("T")[0];
    const eventCount = widget.settings?.event_count || 10;
    return events
      .filter((event: CalendarEvent) => {
        return event.start_date >= today;
      })
      .slice(0, eventCount);
  };

  // 지난 일정 가져오기
  const getPastEvents = () => {
    const today = new Date().toISOString().split("T")[0];
    const eventCount = widget.settings?.event_count || 10;
    return events
      .filter((event: CalendarEvent) => {
        return event.start_date < today;
      })
      .reverse()
      .slice(0, eventCount); // 최근순
  };

  const upcomingEvents = getUpcomingEvents();
  const pastEvents = getPastEvents();
  const displayEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="text-center">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="text-center text-red-600">
            일정을 불러오는 중 오류가 발생했습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg overflow-hidden border border-slate-100">
      <div className="px-4 py-3">
        <h3 className="text-base text-gray-800 font-semibold pb-2">
          {widget.title || "일정"}
        </h3>

        {/* 탭 버튼 */}
        {(widget.settings?.show_tab_buttons ?? true) && (
          <div className="flex gap-1">
            <Button
              variant={activeTab === "upcoming" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("upcoming")}
              className="flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              다가올 일정
            </Button>
            <Button
              variant={activeTab === "past" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("past")}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              지난 일정
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {displayEvents.length > 0 ? (
            displayEvents.map((event: CalendarEvent) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedEvent(event);
                  setIsDialogOpen(true);
                }}
              >
                {(widget.settings?.show_category_colors ?? true) && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: getEventColor(event) }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm font-medium truncate">
                      {event.title}
                    </div>
                    {event.is_all_day &&
                      (widget.settings?.show_all_day_badge ?? true) && (
                        <Badge variant="secondary" className="text-xs">
                          종일
                        </Badge>
                      )}
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatDate(event.start_date)}
                    {!event.is_all_day && event.start_time && (
                      <span className="ml-2">
                        {formatTime(event.start_time)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                {activeTab === "upcoming"
                  ? "다가올 일정이 없습니다"
                  : "지난 일정이 없습니다"}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      {/* 일정 상세 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedEvent?.color || "#6B7280" }}
              />
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              {/* 날짜 및 시간 */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{formatDate(selectedEvent.start_date)}</span>
                {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date && (
                  <span>- {formatDate(selectedEvent.end_date)}</span>
                )}
              </div>

              {/* 시간 정보 */}
              {!selectedEvent.is_all_day && (selectedEvent.start_time || selectedEvent.end_time) && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>
                    {selectedEvent.start_time && formatTime(selectedEvent.start_time)}
                    {selectedEvent.end_time && ` - ${formatTime(selectedEvent.end_time)}`}
                  </span>
                </div>
              )}

              {/* 종일 일정 표시 */}
              {selectedEvent.is_all_day && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <Badge variant="secondary" className="text-xs">
                    종일
                  </Badge>
                </div>
              )}

              {/* 장소 */}
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {/* 부서 */}
              {selectedEvent.department && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{selectedEvent.department}</span>
                </div>
              )}

              {/* 설명 */}
              {selectedEvent.description && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">상세 내용</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* 카테고리 */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>카테고리: {selectedEvent.category}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
