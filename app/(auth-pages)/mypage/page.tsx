"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut } from "lucide-react";
import { supabase } from "@/db";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
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
import { toast } from "@/components/ui/toaster";
import Cropper from "react-easy-crop";
import {
  Dialog as CropDialog,
  DialogContent as CropDialogContent,
  DialogHeader as CropDialogHeader,
  DialogFooter as CropDialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

export default function MyPage() {
  const { user, handleLogout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  // 비밀번호 변경 다이얼로그 상태 및 로직
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // 아바타 업로드 상태 및 로직
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDeleted, setAvatarDeleted] = useState(false);

  // 크롭 관련 상태
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    try {
      const storedUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!storedUser)
        throw new Error("로그인된 사용자 정보를 찾을 수 없습니다.");
      const userData = JSON.parse(storedUser);
      if (!userData.id) throw new Error("사용자 ID를 찾을 수 없습니다.");
      const { data: dbUser, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userData.id)
        .single();
      if (dbError || !dbUser)
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      if (dbUser.password !== pwForm.currentPassword) {
        throw new Error("현재 비밀번호가 일치하지 않습니다.");
      }
      if (pwForm.newPassword !== pwForm.confirmPassword) {
        throw new Error("새 비밀번호가 일치하지 않습니다.");
      }
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password: pwForm.newPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userData.id);
      if (updateError) throw updateError;
      toast({
        title: "비밀번호 변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
      setPwDialogOpen(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({
        title: "비밀번호 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPwLoading(false);
    }
  };

  // 크롭 영역 저장
  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // 파일 -> 크롭 다이얼로그
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "이미지 용량 초과",
        description: "5MB 이하 이미지만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setPendingFile(file);
    setCropImage(URL.createObjectURL(file));
    setCropDialogOpen(true);
  };

  // 크롭된 이미지 Blob 생성
  async function getCroppedImg(imageSrc: string, crop: any) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const size = Math.max(crop.width, crop.height);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context 생성 실패");
    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      size,
      size
    );
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("이미지 변환 실패"));
      }, "image/jpeg");
    });
  }

  // 이미지 객체 생성
  function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });
  }

  // 크롭 적용(업로드)
  const handleCropApply = async () => {
    if (!cropImage || !croppedAreaPixels || !pendingFile || !user) return;
    setAvatarUploading(true);
    try {
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      if (croppedBlob.size > 5 * 1024 * 1024) {
        toast({
          title: "크롭 이미지 용량 초과",
          description: "5MB 이하로 잘라주세요.",
          variant: "destructive",
        });
        setAvatarUploading(false);
        return;
      }
      const ext = "jpg";
      const filePath = `profile-avatars/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(filePath, croppedBlob, {
          upsert: true,
          contentType: "image/jpeg",
        });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage
        .from("profile-avatars")
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) throw new Error("이미지 URL을 가져오지 못했습니다.");
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;
      setAvatarPreview(publicUrl);
      setAvatarDeleted(false);
      setCropDialogOpen(false);
      setCropImage(null);
      setPendingFile(null);
      toast({
        title: "프로필 이미지 변경 완료",
        description: "새로운 프로필 이미지가 적용되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "이미지 업로드 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  // 아바타 삭제 핸들러
  const handleAvatarDelete = async () => {
    if (!user || !user.avatar_url) return;
    setAvatarUploading(true);
    try {
      // Storage 파일 경로 추출
      const url = user.avatar_url;
      const matches = url.match(/profile-avatars\/(.+)$/);
      const filePath = matches ? `profile-avatars/${matches[1]}` : null;
      if (!filePath) throw new Error("파일 경로를 추출할 수 없습니다.");
      // Storage에서 삭제
      const { error: removeError } = await supabase.storage
        .from("profile-avatars")
        .remove([filePath.replace("profile-avatars/", "")]);
      if (removeError) throw removeError;
      // DB에서 avatar_url null로
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: null })
        .eq("id", user.id);
      if (updateError) throw updateError;
      setAvatarPreview(null);
      setAvatarDeleted(true);
      toast({
        title: "프로필 이미지 삭제 완료",
        description: "프로필 이미지가 삭제되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "이미지 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  // 크롭 다이얼로그 취소 핸들러
  const handleCropCancel = () => {
    setCropDialogOpen(false);
    setCropImage(null);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

        // 댓글 수 가져오기 (board_comments 테이블 사용)
        const { count: commentCount } = await supabase
          .from("board_comments")
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
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="flex flex-col gap-8">
        {/* 프로필 섹션 */}
        <Card className="shadow-sm border border-muted-foreground/10">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg font-semibold tracking-tight">
              프로필
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <div className="relative group">
                <Avatar className="h-24 w-24 shadow-md">
                  <AvatarImage
                    src={
                      avatarDeleted
                        ? ""
                        : (avatarPreview ?? user.avatar_url ?? "")
                    }
                    alt={user.username}
                  />
                  <AvatarFallback className="text-2xl font-bold bg-muted">
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {/* 이미지 변경/삭제 버튼 (마우스 오버 시 노출) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full z-10">
                  <label
                    htmlFor="avatar-upload"
                    className="flex items-center gap-1 px-2 py-1 bg-black/60 rounded cursor-pointer text-white text-xs font-semibold"
                  >
                    이미지 변경
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={avatarUploading}
                      ref={fileInputRef}
                    />
                  </label>
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2 py-1 bg-red-600/80 hover:bg-red-700 rounded text-white text-xs font-semibold disabled:opacity-50"
                    onClick={handleAvatarDelete}
                    disabled={
                      avatarUploading ||
                      avatarDeleted ||
                      (!avatarPreview && !user.avatar_url)
                    }
                  >
                    이미지 삭제
                  </button>
                </div>
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-20">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 w-full">
                <h2 className="text-2xl font-bold leading-tight mb-1">
                  {user.username}
                </h2>
                <p className="text-muted-foreground text-sm mb-2">
                  {user.email}
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-md px-3"
                  >
                    <User className="mr-2 h-4 w-4" />
                    프로필 수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-md px-3"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    설정
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 활동 내역 */}
        <Card className="shadow-sm border border-muted-foreground/10">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg font-semibold tracking-tight">
              활동 내역
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="font-medium text-base">작성한 게시글</h3>
                  <p className="text-xs text-muted-foreground">{postCount}개</p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-md px-3">
                  보기
                </Button>
              </div>
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="font-medium text-base">작성한 댓글</h3>
                  <p className="text-xs text-muted-foreground">
                    {commentCount}개
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-md px-3">
                  보기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 계정 관리 */}
        <Card className="shadow-sm border border-muted-foreground/10">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg font-semibold tracking-tight">
              계정 관리
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-6 flex flex-col gap-4">
            {/* 비밀번호 변경 다이얼로그 */}
            <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
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
                    비밀번호를 변경하려면 현재 비밀번호를 입력하고 새로운
                    비밀번호를 설정하세요.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePwSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">현재 비밀번호</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={pwForm.currentPassword}
                      onChange={handlePwChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">새 비밀번호</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={pwForm.newPassword}
                      onChange={handlePwChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={pwForm.confirmPassword}
                      onChange={handlePwChange}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPwDialogOpen(false)}
                    >
                      취소
                    </Button>
                    <Button type="submit" disabled={pwLoading}>
                      {pwLoading && (
                        <Loader2 className="mr-2 mb-2 h-4 w-4 animate-spin" />
                      )}
                      {pwLoading ? "변경 중..." : "변경하기"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            {/* 로그아웃 버튼 */}
            <Button
              variant="outline"
              className="w-full justify-start text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
              onClick={handleLogoutClick}
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </CardContent>
        </Card>

        {/* 아바타 크롭 다이얼로그 */}
        <CropDialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
          <CropDialogContent className="max-w-[95vw] w-[350px] sm:w-[400px]">
            <CropDialogHeader>
              <DialogTitle>프로필 이미지 자르기</DialogTitle>
            </CropDialogHeader>
            <div className="relative w-full h-64 bg-gray-100 rounded">
              {cropImage && (
                <Cropper
                  image={cropImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                />
              )}
            </div>
            <div className="flex flex-col gap-3 mt-6">
              <div className="flex items-center justify-between mb-1">
                <Label
                  htmlFor="avatar-zoom-slider"
                  className="text-xs text-muted-foreground"
                >
                  확대/축소
                </Label>
                <span className="text-xs text-muted-foreground font-mono">
                  {zoom.toFixed(2)}x
                </span>
              </div>
              <Slider
                id="avatar-zoom-slider"
                min={1}
                max={3}
                step={0.01}
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                className="w-full"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleCropCancel}>
                  취소
                </Button>
                <Button onClick={handleCropApply} disabled={avatarUploading}>
                  {avatarUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  적용
                </Button>
              </div>
            </div>
          </CropDialogContent>
        </CropDialog>
      </div>
    </div>
  );
}
