"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db";
import { toast } from "@/components/ui/toaster";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email.trim()) {
        throw new Error("이메일을 입력하세요");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("올바른 이메일 형식이 아닙니다");
      }

      // 먼저 해당 이메일이 등록되어 있는지 확인
      const { data: userExists } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (!userExists) {
        throw new Error("등록되지 않은 이메일입니다");
      }

      // 비밀번호 재설정 이메일 발송
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error("비밀번호 재설정 이메일 발송에 실패했습니다");
      }

      setEmailSent(true);
      toast({
        title: "이메일 발송 완료",
        description: "비밀번호 재설정 링크를 이메일로 보내드렸습니다.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description:
          error.message || "비밀번호 재설정 요청 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="w-full py-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/30 px-4 sm:px-6 min-h-screen">
        <div className="mx-auto w-full max-w-[450px] bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 md:p-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              이메일 발송 완료
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              <strong>{email}</strong>로<br />
              비밀번호 재설정 링크를 보내드렸습니다.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">이메일을 확인해주세요</p>
                  <p>
                    이메일이 도착하지 않았다면 스팸 폴더를 확인해보세요. 링크는
                    24시간 동안 유효합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                variant="outline"
                className="w-full"
              >
                다른 이메일로 시도
              </Button>

              <Link href="/login" className="block">
                <Button variant="default" className="w-full">
                  로그인 페이지로 돌아가기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/30 px-4 sm:px-6 min-h-screen">
      <div className="mx-auto w-full max-w-[450px] bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 md:p-10">
        <div className="mb-2">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            로그인으로 돌아가기
          </Link>
        </div>

        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            비밀번호 찾기
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            등록하신 이메일을 입력하시면
            <br />
            비밀번호 재설정 링크를 보내드립니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              이메일 주소
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base"
            disabled={isLoading}
          >
            {isLoading ? "발송 중..." : "재설정 링크 보내기"}
          </Button>
        </form>

        <div className="text-center text-sm pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
          계정이 없으신가요?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
