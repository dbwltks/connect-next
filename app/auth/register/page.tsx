"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db";
import { toast } from "@/components/ui/toaster";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  // 로그인 상태 확인
  useEffect(() => {
    // 로컬 스토리지나 세션 스토리지에서 사용자 정보 확인
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");

    // 이미 로그인된 상태면 홈페이지로 리다이렉트
    if (user) {
      router.push("/");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!formData.username.trim()) throw new Error("아이디를 입력하세요");
      if (formData.password !== formData.confirmPassword) {
        throw new Error("비밀번호가 일치하지 않습니다");
      }
      if (!formData.terms) {
        throw new Error("이용약관에 동의해주세요");
      }
      // 아이디 중복 체크
      const { data: existUser, error: existError } = await supabase
        .from("users")
        .select("id")
        .eq("username", formData.username)
        .single();
      if (existUser) throw new Error("이미 사용 중인 아이디입니다");
      // Supabase Auth 회원가입
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      if (error || !data.user)
        throw new Error(error?.message || "회원가입에 실패했습니다");
      // users 테이블에 username, email 저장
      const { error: userError } = await supabase.from("users").insert({
        id: data.user.id,
        username: formData.username,
        email: formData.email,
      });
      if (userError) throw new Error(userError.message);
      toast({
        title: "회원가입 성공",
        description: "이메일 인증 후 로그인하세요",
        variant: "default",
      });
      router.push("/sign-in");
    } catch (error: any) {
      toast({
        title: "회원가입 실패",
        description: error.message || "회원가입 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full py-12 md:py-24 lg:py-32 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/30 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-[450px] bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 md:p-10">
        <div className="mb-2">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            홈으로 돌아가기
          </Link>
        </div>

        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            회원가입
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            아래 정보를 입력하여 교회 커뮤니티에 가입하세요
          </p>
        </div>

        <div className="grid gap-6">
          <form onSubmit={handleRegister}>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  아이디
                </Label>
                <Input
                  id="username"
                  placeholder="아이디"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect="off"
                  className="h-11"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  이메일
                </Label>
                <Input
                  id="email"
                  placeholder="이메일 주소"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  className="h-11"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    비밀번호
                  </Label>
                  <Input
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className="h-11"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    비밀번호 확인
                  </Label>
                  <Input
                    id="confirmPassword"
                    placeholder="••••••••"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className="h-11"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start space-x-2 mt-2">
                <Checkbox
                  id="terms"
                  name="terms"
                  className="mt-1"
                  checked={formData.terms}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      terms: checked === true,
                    }))
                  }
                  required
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-600 dark:text-gray-300 leading-tight"
                >
                  <span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline"
                        >
                          이용약관
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>이용약관</DialogTitle>
                        <DialogDescription asChild>
                          <div className="max-h-72 overflow-y-auto text-left whitespace-pre-wrap">
                            {`여기에 이용약관 내용을 입력하세요.\n\n샘플: 본 서비스는 ... (이하 생략)`}
                          </div>
                        </DialogDescription>
                      </DialogContent>
                    </Dialog>
                    과{" "}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline"
                        >
                          개인정보처리방침
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>개인정보처리방침</DialogTitle>
                        <DialogDescription asChild>
                          <div className="max-h-72 overflow-y-auto text-left whitespace-pre-wrap">
                            {`여기에 개인정보처리방침 내용을 입력하세요.\n\n샘플: 본 서비스는 회원의 개인정보를 ... (이하 생략)`}
                          </div>
                        </DialogDescription>
                      </DialogContent>
                    </Dialog>
                    에 동의합니다
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 mt-2 text-base"
                disabled={isLoading}
              >
                {isLoading ? "처리 중..." : "회원가입"}
              </Button>
            </div>
          </form>

          <div className="text-center text-sm pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/sign-in"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
