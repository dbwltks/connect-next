"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/db";
import { toast } from "@/components/ui/toaster";
import { Loader2, Settings } from "lucide-react";

export default function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 로컬/세션 스토리지에서 사용자 정보 가져오기
      const storedUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!storedUser) {
        throw new Error("로그인된 사용자 정보를 찾을 수 없습니다.");
      }

      const userData = JSON.parse(storedUser);
      if (!userData.id) {
        throw new Error("사용자 ID를 찾을 수 없습니다.");
      }

      // 데이터베이스에서 사용자 정보 가져오기
      const { data: dbUser, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userData.id)
        .single();

      if (dbError || !dbUser) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      // 현재 비밀번호 확인
      if (dbUser.password !== formData.currentPassword) {
        throw new Error("현재 비밀번호가 일치하지 않습니다.");
      }

      // 새 비밀번호 확인
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error("새 비밀번호가 일치하지 않습니다.");
      }

      // 비밀번호 업데이트
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password: formData.newPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userData.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "비밀번호 변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
      setOpen(false);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "비밀번호 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          비밀번호 변경
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>비밀번호 변경</DialogTitle>
          <DialogDescription>
            비밀번호를 변경하려면 현재 비밀번호를 입력하고 새로운 비밀번호를
            설정하세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">현재 비밀번호</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "변경 중..." : "변경하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
