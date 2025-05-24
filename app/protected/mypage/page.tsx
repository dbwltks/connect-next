"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut } from "lucide-react";
import { supabase } from "@/db";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import ChangePasswordDialog from "@/components/mypage/change-password-dialog";

export default function MyPage() {
  const { user, handleLogout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 게시글 수 가져오기
        const { count: postCount } = await supabase
          .from("board_posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // 댓글 수 가져오기
        const { count: commentCount } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        setPostCount(postCount || 0);
        setCommentCount(commentCount || 0);
      } catch (error) {
        console.error("사용자 통계 가져오기 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  const handleLogoutClick = async () => {
    await handleLogout();
    router.push("/(auth-pages)/sign-in");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/(auth-pages)/sign-in");
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8">
        {/* 프로필 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle>프로필</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar_url || ""} alt={user.username} />
                <AvatarFallback>
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" size="sm">
                    <User className="mr-2 h-4 w-4" />
                    프로필 수정
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    설정
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 활동 내역 */}
        <Card>
          <CardHeader>
            <CardTitle>활동 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">작성한 게시글</h3>
                  <p className="text-sm text-muted-foreground">{postCount}개</p>
                </div>
                <Button variant="ghost">보기</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">작성한 댓글</h3>
                  <p className="text-sm text-muted-foreground">
                    {commentCount}개
                  </p>
                </div>
                <Button variant="ghost">보기</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 계정 관리 */}
        <Card>
          <CardHeader>
            <CardTitle>계정 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <ChangePasswordDialog />
              <Button
                variant="outline"
                className="w-full justify-start text-red-500"
                onClick={handleLogoutClick}
              >
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
