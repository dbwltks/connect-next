"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, X, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/db";
import { toast } from "@/components/ui/toaster";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error
        } = await supabase.auth.getUser();
        
        if (error || !user) {
          setIsValidSession(false);
          toast({
            title: "인증이 만료되었습니다",
            description: "비밀번호 재설정 링크를 다시 요청해주세요.",
            variant: "destructive",
          });
          router.push("/forgot-password");
        } else {
          setIsValidSession(true);
        }
      } catch (error) {
        setIsValidSession(false);
        router.push("/forgot-password");
      }
    };

    checkAuth();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(newFormData);

    // 비밀번호 확인 검증
    if (name === "password" || name === "confirmPassword") {
      const password = name === "password" ? value : newFormData.password;
      const confirmPassword =
        name === "confirmPassword" ? value : newFormData.confirmPassword;

      if (confirmPassword.length > 0) {
        setPasswordMatch(password === confirmPassword);
      } else {
        setPasswordMatch(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.password.trim()) {
        throw new Error("비밀번호를 입력하세요");
      }

      if (formData.password.length < 8) {
        throw new Error("비밀번호는 8자 이상이어야 합니다");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("비밀번호가 일치하지 않습니다");
      }

      // 비밀번호 업데이트
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        throw new Error("비밀번호 변경에 실패했습니다");
      }

      toast({
        title: "비밀번호 변경 완료",
        description: "새 비밀번호로 로그인해주세요.",
        variant: "default",
      });

      // 로그아웃 후 로그인 페이지로 이동
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message || "비밀번호 변경 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <div className="w-full py-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/30 px-4 sm:px-6 min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isValidSession === false) {
    return null; // 리다이렉트 중
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
            비밀번호 재설정
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            새로운 비밀번호를 입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              새 비밀번호{" "}
              <span className="text-xs text-gray-500">(8자 이상)</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="8자 이상 입력하세요"
                value={formData.password}
                onChange={handleChange}
                className="h-11 pr-10"
                minLength={8}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {formData.password.length > 0 && formData.password.length < 8 && (
              <p className="text-xs text-red-500 mt-1">
                비밀번호는 8자 이상이어야 합니다
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              비밀번호 확인
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`h-11 pr-20 ${
                  passwordMatch === false
                    ? "border-red-500 focus:border-red-500"
                    : passwordMatch === true
                      ? "border-green-500 focus:border-green-500"
                      : ""
                }`}
                required
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {passwordMatch === true && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {passwordMatch === false && (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {passwordMatch === false && (
              <p className="text-xs text-red-500 mt-1">
                비밀번호가 일치하지 않습니다
              </p>
            )}
            {passwordMatch === true && (
              <p className="text-xs text-green-600 mt-1">
                비밀번호가 일치합니다
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base mt-6"
            disabled={
              isLoading ||
              passwordMatch === false ||
              formData.password.length < 8
            }
          >
            {isLoading ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </form>
      </div>
    </div>
  );
}
