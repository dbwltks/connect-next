"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/db";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/components/ui/toaster";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });

  useEffect(() => {
    // 이미 로그인된 경우
    if (user) {
      router.push("/");
    }
  }, [user, router]);

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
      console.log("로그인 시도:", formData.username);

      // 1. username → email, role 조회
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select(
          `
          id,
          username,
          email,
          role,
          is_active,
          created_at,
          last_login
        `
        )
        .eq("username", formData.username)
        .single();

      console.log("사용자 정보 조회 결과:", { userRow, error: userError });

      if (userError || !userRow) {
        console.error("사용자 조회 오류:", userError);
        throw new Error("존재하지 않는 아이디입니다.");
      }

      if (!userRow.is_active) {
        throw new Error("비활성화된 계정입니다. 관리자에게 문의하세요.");
      }

      // 2. Supabase Auth 로그인
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userRow.email,
        password: formData.password,
      });

      console.log("Auth 로그인 결과:", {
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        error,
      });

      if (error || !data.user) throw new Error(error?.message || "로그인 실패");

      // 3. users 테이블 업데이트 (마지막 로그인 시간 및 role 정보)
      const { error: updateError } = await supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          role: userRow.role || "user", // role 정보 업데이트
        })
        .eq("id", userRow.id);

      if (updateError) {
        console.error("사용자 정보 업데이트 오류:", updateError);
      }

      // 4. auth.users 테이블의 role 정보도 업데이트
      const { error: authUpdateError } = await supabase
        .from("auth.users")
        .update({
          role: userRow.role || "user",
        })
        .eq("id", userRow.id);

      if (authUpdateError) {
        console.error("auth.users 테이블 업데이트 오류:", authUpdateError);
      }

      toast({
        title: "로그인 성공",
        description: "환영합니다!",
        variant: "default",
      });

      // 리다이렉트 처리
      const redirectTo = searchParams.get("redirect");
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        router.replace("/protected/mypage");
      }
    } catch (error: any) {
      console.error("로그인 오류:", error);
      toast({
        title: "로그인 실패",
        description: error.message || "로그인 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <form
        onSubmit={handleLogin}
        className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
      >
        <Link
          href="/"
          className="absolute left-4 top-4 md:left-8 md:top-8 text-foreground/80 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">로그인</h1>
        <p className="text-sm text-muted-foreground">
          계정이 없으신가요?{" "}
          <Link
            className="text-primary underline hover:text-primary/80"
            href="/sign-up"
          >
            회원가입
          </Link>
        </p>

        <div className="grid gap-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="username">아이디</Label>
            <Input
              id="username"
              name="username"
              placeholder="아이디를 입력하세요"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">비밀번호</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:text-primary/80"
              >
                비밀번호 찾기
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
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
              className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              로그인 상태 유지
            </label>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
        </div>
      </form>
    </div>
  );
}
