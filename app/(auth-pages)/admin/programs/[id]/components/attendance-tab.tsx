"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, Plus } from "lucide-react";

interface AttendanceTabProps {
  programId: string;
}

export default function AttendanceTab({ programId }: AttendanceTabProps) {
  const [attendance, setAttendance] = useState([]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          출석 관리
        </CardTitle>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          출석 체크
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          출석 관리 기능이 곧 추가될 예정입니다.
        </div>
      </CardContent>
    </Card>
  );
}