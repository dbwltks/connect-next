"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { User, Plus, Trash2, Camera, Check, Upload, Image, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

interface AvatarSelectorProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onAvatarSelect: (avatarUrl: string) => void;
  onUploadClick: () => void;
  disabled?: boolean;
  refreshTrigger?: number;
}

export default function AvatarSelector({
  userId,
  currentAvatarUrl,
  onAvatarSelect,
  onUploadClick,
  disabled = false,
  refreshTrigger = 0,
}: AvatarSelectorProps) {
  const [avatarFiles, setAvatarFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchAvatarFiles();
  }, [userId, refreshTrigger]);

  const fetchAvatarFiles = async () => {
    try {
      // Storage에서 사용자 폴더의 파일 목록 조회 (profile-avatars 폴더 내부)
      const { data, error } = await createClient().storage
        .from("profile-avatars")
        .list(`profile-avatars/${userId}`, {
          limit: 10,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        // 폴더가 없으면 빈 배열 반환
        if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
          setAvatarFiles([]);
          return;
        }
        throw error;
      }
      
      // 이미지 파일만 필터링 (jpg, jpeg, png, webp)
      const imageFiles = (data || []).filter((file: any) => 
        file.name && /\.(jpg|jpeg|png|webp)$/i.test(file.name)
      );
      
      setAvatarFiles(imageFiles);
    } catch (error) {
      console.error("아바타 파일 로딩 실패:", error);
      setAvatarFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (fileName: string) => {
    const { data } = createClient().storage
      .from("profile-avatars")
      .getPublicUrl(`profile-avatars/${userId}/${fileName}`);
    return data.publicUrl;
  };

  const handleAvatarSelect = async (fileName: string) => {
    if (disabled) return;

    try {
      const avatarUrl = getAvatarUrl(fileName);
      
      // users 테이블의 avatar_url 업데이트
      const { error } = await createClient()
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (error) throw error;

      onAvatarSelect(avatarUrl);

      // 헤더 업데이트를 위한 전역 이벤트 발생
      window.dispatchEvent(new CustomEvent('profileUpdated'));

      toast({
        title: "아바타 변경 완료",
        description: "선택한 아바타로 변경되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "아바타 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (fileName: string) => {
    if (disabled) return;
    setFileToDelete(fileName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    const fileName = fileToDelete;
    const avatarUrl = getAvatarUrl(fileName);
    const isCurrent = currentAvatarUrl === avatarUrl;

    setDeleting(fileName);
    setDeleteDialogOpen(false);
    setFileToDelete(null);
    try {
      // Storage에서 파일 삭제
      const { error } = await createClient().storage
        .from("profile-avatars")
        .remove([`profile-avatars/${userId}/${fileName}`]);

      if (error) throw error;

      // 현재 사용 중인 아바타를 삭제하는 경우
      if (isCurrent) {
        const remainingFiles = avatarFiles.filter(file => file.name !== fileName);
        
        if (remainingFiles.length > 0) {
          // 다른 아바타가 있으면 첫 번째 아바타로 변경
          const nextAvatarUrl = getAvatarUrl(remainingFiles[0].name);
          const { error: updateError } = await createClient()
            .from("users")
            .update({ avatar_url: nextAvatarUrl })
            .eq("id", userId);
          
          if (!updateError) {
            onAvatarSelect(nextAvatarUrl);
            // 헤더 업데이트를 위한 전역 이벤트 발생
            window.dispatchEvent(new CustomEvent('profileUpdated'));
          }
        } else {
          // 마지막 아바타를 삭제하는 경우 아바타 제거
          const { error: updateError } = await createClient()
            .from("users")
            .update({ avatar_url: null })
            .eq("id", userId);
          
          if (!updateError) {
            onAvatarSelect("");
            // 헤더 업데이트를 위한 전역 이벤트 발생
            window.dispatchEvent(new CustomEvent('profileUpdated'));
          }
        }
      }

      await fetchAvatarFiles();

      toast({
        title: "아바타 삭제 완료",
        description: isCurrent 
          ? "현재 아바타가 삭제되고 다른 아바타로 변경되었습니다."
          : "선택한 아바타가 삭제되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "아바타 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Card className="overflow-hidden shadow-sm border bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Image className="h-4 w-4 text-primary" />
            </div>
            아바타 갤러리
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center h-24">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-sm border bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Image className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span>아바타 갤러리</span>
              <Badge variant="secondary" className="text-xs h-5">
                {avatarFiles.length}/10
              </Badge>
            </div>
          </CardTitle>
          {avatarFiles.length < 10 && (
            <Button
              onClick={onUploadClick}
              disabled={disabled}
              size="sm"
              className="gap-1.5 h-8"
            >
              <Upload className="h-3.5 w-3.5" />
              추가
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-5">
        {avatarFiles.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-1">아바타가 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-3">
              첫 번째 아바타를 업로드하세요
            </p>
            <Button onClick={onUploadClick} disabled={disabled} size="sm" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              업로드
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 현재 아바타 섹션 */}
            {currentAvatarUrl && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  현재 아바타
                </h4>
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <Avatar className="h-12 w-12 ring-2 ring-primary ring-offset-1">
                    <AvatarImage src={currentAvatarUrl} alt="현재 아바타" />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">활성 아바타</p>
                    <p className="text-xs text-muted-foreground">
                      프로필에 사용 중
                    </p>
                  </div>
                  <Badge variant="default" className="gap-1 text-xs h-5">
                    <Check className="h-3 w-3" />
                    사용 중
                  </Badge>
                </div>
              </div>
            )}

            {/* 아바타 그리드 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Image className="h-3.5 w-3.5" />
                저장된 아바타 ({avatarFiles.length}개)
              </h4>
              <ScrollArea className="h-36">
                <div className="grid grid-cols-4 gap-2 pr-3">
                  {avatarFiles.map((file) => {
                    const avatarUrl = getAvatarUrl(file.name);
                    const isCurrent = currentAvatarUrl === avatarUrl;
                    
                    return (
                      <div key={file.name} className="relative group">
                        <div 
                          className={`relative overflow-hidden rounded-full border-2 transition-all duration-200 cursor-pointer ${
                            isCurrent
                              ? "border-blue-500 shadow-sm shadow-blue-500/20"
                              : "border-border hover:border-blue-500/50 hover:shadow-sm"
                          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                          onClick={() => handleAvatarSelect(file.name)}
                        >
                          <img
                            src={avatarUrl}
                            alt={`아바타 ${file.name}`}
                            className="w-full h-full aspect-square object-cover"
                          />
                          
                          {/* 호버 오버레이 */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full">
                            <div className="flex gap-1">
                              {!isCurrent && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-6 w-6 p-0 bg-white/90 hover:bg-white rounded-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAvatarSelect(file.name);
                                  }}
                                  disabled={disabled}
                                >
                                  <Check className="h-3 w-3 text-green-600" />
                                </Button>
                              )}
                              {/* 삭제 버튼 - 모든 아바타에 표시 */}
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-6 w-6 p-0 bg-red-500/90 hover:bg-red-600 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(file.name);
                                }}
                                disabled={disabled || deleting === file.name}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>


                          {/* 삭제 중 로딩 */}
                          {deleting === file.name && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* 업로드 제한 안내 */}
            {avatarFiles.length >= 10 && (
              <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-xs text-orange-800">
                  <strong>저장 한도 도달:</strong> 최대 10개까지 저장 가능합니다. 
                  새 아바타를 추가하려면 기존 아바타를 삭제하세요.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              아바타 삭제 확인
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>선택한 아바타를 영구적으로 삭제하시겠습니까?</p>
              {fileToDelete && currentAvatarUrl === getAvatarUrl(fileToDelete) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-sm text-amber-800 font-medium">
                    ⚠️ 현재 사용 중인 아바타입니다
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    삭제 시 다른 아바타로 자동 변경되거나, 없을 경우 기본 아바타로 설정됩니다.
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}