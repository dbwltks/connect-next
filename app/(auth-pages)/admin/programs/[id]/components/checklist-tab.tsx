"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Plus } from "lucide-react";

interface ChecklistTabProps {
  programId: string;
}

export default function ChecklistTab({ programId }: ChecklistTabProps) {
  const [checklist, setChecklist] = useState([]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          확인사항 관리
        </CardTitle>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          항목 추가
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          확인사항 관리 기능이 곧 추가될 예정입니다.
        </div>
      </CardContent>
    </Card>
  );
}