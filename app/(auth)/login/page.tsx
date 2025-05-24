"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/db";
import { toast } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });

  useEffect(() => {
    if (!loading && user) {
      const redirectTo = searchParams.get("redirect");
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        router.replace("/");
      }
    }
  }, [user, loading, router, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. username으로 사용자 정보 조회
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id, email, role, username")
        .eq("username", formData.username)
        .single();

      if (userError || !userRow) {
        throw new Error("존재하지 않는 아이디입니다.");
      }

      // 2. 이메일로 로그인 시도
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: userRow.email,
          password: formData.password,
        });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          throw new Error("비밀번호가 올바르지 않습니다.");
        }
        throw new Error(signInError.message);
      }

      if (!data.session) {
        throw new Error("로그인에 실패했습니다.");
      }

      // 3. 세션 사용자 정보 업데이트
      await supabase.from("users").upsert({
        id: data.session.user.id,
        email: userRow.email,
        username: userRow.username,
        role: userRow.role || "user",
        last_login: new Date().toISOString(),
      });

      toast({
        title: "로그인 성공",
        description: "환영합니다!",
      });

      // 4. 리다이렉트
      const redirectTo = searchParams.get("redirect");
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        router.replace("/");
      }
    } catch (error: any) {
      console.error("로그인 오류:", error);
      toast({
        title: "로그인 실패",
        description: error.message || "로그인 중 오류가 발생했습니다",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const handleAppleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "apple" });
  };

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "kakao" });
  };

  return (
    <div className="w-full py-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/30 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-[420px] bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 md:p-10">
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
            로그인
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            아이디와 비밀번호를 입력하여 로그인하세요
          </p>
        </div>

        <div className="grid gap-6">
          <form onSubmit={handleLogin}>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    비밀번호
                  </Label>
                  <Link
                    href="/auth/reset-password"
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    비밀번호 찾기
                  </Link>
                </div>
                <Input
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="h-11"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 mt-1">
                <Checkbox
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      remember: checked === true,
                    }))
                  }
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-600 dark:text-gray-300"
                >
                  로그인 상태 유지
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 mt-2 text-base relative"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="opacity-0">로그인</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                  </>
                ) : (
                  "로그인"
                )}
              </Button>
            </div>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                또는
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleGoogleLogin}
              type="button"
              variant="ghost"
              className="w-11 h-11 p-0 flex items-center justify-center"
              aria-label="구글로 로그인"
            >
              <svg width="24" height="24" viewBox="0 0 48 48">
                <g>
                  <path
                    fill="#4285F4"
                    d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C36.64 2.7 30.74 0 24 0 14.82 0 6.73 5.48 2.69 13.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"
                  />
                  <path
                    fill="#34A853"
                    d="M46.1 24.5c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.2 5.6C43.27 37.27 46.1 31.41 46.1 24.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.67 28.13c-1.13-3.36-1.13-6.9 0-10.26l-7.98-6.2C.98 15.27 0 19.5 0 24c0 4.5.98 8.73 2.69 12.33l7.98-6.2z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 48c6.74 0 12.64-2.22 16.85-6.05l-7.2-5.6c-2.01 1.35-4.6 2.15-7.65 2.15-6.38 0-11.87-3.63-14.33-8.94l-7.98 6.2C6.73 42.52 14.82 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </g>
              </svg>
            </Button>
            <Button
              onClick={handleAppleLogin}
              type="button"
              variant="ghost"
              className="w-11 h-11 p-0 flex items-center justify-center text-black"
              aria-label="애플로 로그인"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M16.365 1.43c0 1.14-.93 2.07-1.98 2.07-.09 0-.18-.01-.27-.02.01-.13.02-.26.02-.39 0-1.13.94-2.06 1.98-2.06.09 0 .18.01.27.02-.01.13-.02.26-.02.38zM12.01 6.5c-2.7 0-4.5 1.8-4.5 4.2 0 1.7 1.41 3.19 3.53 4.01-.15.52-.54 1.85-.62 2.15-.1.39.14.38.29.28.12-.08 1.93-1.34 2.72-1.89.19.01.39.02.59.02 2.7 0 4.5-1.8 4.5-4.2s-1.8-4.2-4.5-4.2z" />
              </svg>
            </Button>
            <Button
              onClick={handleKakaoLogin}
              type="button"
              variant="ghost"
              className="w-11 h-11 p-0 flex items-center justify-center"
              aria-label="카카오로 로그인"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <ellipse cx="12" cy="12" rx="12" ry="12" fill="#FEE500" />
                <path
                  d="M12 6.5c-3.59 0-6.5 2.15-6.5 4.8 0 1.7 1.41 3.19 3.53 4.01-.15.52-.54 1.85-.62 2.15-.1.39.14.38.29.28.12-.08 1.93-1.34 2.72-1.89.19.01.39.02.59.02 3.59 0 6.5-2.15 6.5-4.8S15.59 6.5 12 6.5z"
                  fill="#391B1B"
                />
              </svg>
            </Button>
          </div>

          <div className="text-center text-sm pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
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
    </div>
  );
}
