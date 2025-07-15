"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
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
  validateDisplayName,
  checkForbiddenWords,
} from "@/lib/forbidden-words";
import {
  Dialog as CropDialog,
  DialogContent as CropDialogContent,
  DialogHeader as CropDialogHeader,
  DialogFooter as CropDialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import AvatarSelector from "@/components/ui/avatar-selector";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Camera, Edit, Shield, Activity, MessageSquare, FileText, Calendar, Mail,
  Bell, Globe, Clock, ExternalLink, Eye
} from "lucide-react";

export default function MyPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  // 비밀번호 변경 다이얼로그 상태 및 로직
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // 프로필 수정 다이얼로그 상태 및 로직
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nickname: "",
  });

  // 아바타 업로드 상태 및 로직
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDeleted, setAvatarDeleted] = useState(false);
  const [avatarRefreshTrigger, setAvatarRefreshTrigger] = useState(0);

  // 설정 상태
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    activityVisible: false,
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // 최근 활동 데이터
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // 게시글/댓글 목록 다이얼로그 상태
  const [postsDialogOpen, setPostsDialogOpen] = useState(false);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [menuUrlMap, setMenuUrlMap] = useState<Record<string, string>>({});

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

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    try {
      if (!user) {
        throw new Error("로그인된 사용자 정보를 찾을 수 없습니다.");
      }

      // 입력 검증
      if (pwForm.newPassword !== pwForm.confirmPassword) {
        throw new Error("새 비밀번호가 일치하지 않습니다.");
      }

      if (pwForm.newPassword.length < 6) {
        throw new Error("새 비밀번호는 6자 이상이어야 합니다.");
      }

      if (pwForm.currentPassword === pwForm.newPassword) {
        throw new Error("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
      }

      // 현재 비밀번호 검증을 위해 재인증 시도
      const { error: signInError } = await createClient().auth.signInWithPassword({
        email: user.email!,
        password: pwForm.currentPassword
      });

      if (signInError) {
        throw new Error("현재 비밀번호가 일치하지 않습니다.");
      }

      // Supabase Auth API를 사용하여 비밀번호 변경
      const { error } = await createClient().auth.updateUser({
        password: pwForm.newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: "비밀번호 변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
      setPwDialogOpen(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({
        title: "비밀번호 변경 실패",
        description: error.message || "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setPwLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    console.log("프로필 수정 시작:", {
      user,
      nickname: profileForm.nickname,
    });

    try {
      if (!user?.id) {
        console.error("사용자 정보 없음:", user);
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      // 유효성 검사
      const nickname = profileForm.nickname.trim();
      if (!nickname) {
        throw new Error("닉네임을 입력해주세요.");
      }

      // 금지어 및 전체 유효성 검사
      const validation = validateDisplayName(nickname);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // 중복 체크 (현재 사용자 제외)
      const { data: existingUser } = await createClient()
        .from("users")
        .select("id")
        .eq("nickname", nickname)
        .neq("id", user.id)
        .single();

      if (existingUser) {
        throw new Error("이미 사용 중인 닉네임입니다.");
      }

      console.log("닉네임 업데이트 시작...");

      // users 테이블의 nickname 업데이트
      const { error: dbError } = await createClient()
        .from("users")
        .update({ nickname: nickname })
        .eq("id", user.id);

      if (dbError) {
        console.error("DB 업데이트 에러:", dbError);
        throw dbError;
      }

      // Auth의 user_metadata 업데이트는 제거 (users.nickname만 사용)

      console.log("프로필 수정 성공!");

      toast({
        title: "프로필 수정 완료",
        description: "닉네임이 성공적으로 변경되었습니다.",
      });

      setProfileDialogOpen(false);
      setProfileLoading(false);

      // 1.5초 후 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("프로필 수정 에러:", error);

      toast({
        title: "프로필 수정 실패",
        description: error.message || "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });

      setProfileLoading(false);
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
      const { error: uploadError } = await createClient().storage
        .from("profile-avatars")
        .upload(filePath, croppedBlob, {
          upsert: true,
          contentType: "image/jpeg",
        });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = createClient().storage
        .from("profile-avatars")
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) throw new Error("이미지 URL을 가져오지 못했습니다.");
      const { error: updateError } = await createClient()
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;
      setUserProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      setAvatarPreview(publicUrl);
      setAvatarDeleted(false);
      setCropDialogOpen(false);
      setCropImage(null);
      setPendingFile(null);
      
      // 헤더 업데이트를 위한 전역 이벤트 발생
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      
      toast({
        title: "프로필 이미지 변경 완료",
        description: "새로운 프로필 이미지가 적용되었습니다.",
      });
      
      // AvatarSelector 새로고침
      setAvatarRefreshTrigger(prev => prev + 1);
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

  // 아바타 선택 핸들러 (AvatarSelector용)
  const handleAvatarSelectFromHistory = (avatarUrl: string) => {
    setUserProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }));
    setAvatarPreview(avatarUrl);
    setAvatarDeleted(false);
    
    // 헤더 업데이트를 위한 전역 이벤트 발생
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  };

  // 아바타 업로드 버튼 클릭 핸들러 (AvatarSelector용)
  const handleAvatarUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 게시글 목록 가져오기
  const fetchUserPosts = async () => {
    if (!user) return;
    setPostsLoading(true);
    try {
      const { data, error } = await createClient()
        .from("board_posts")
        .select("id, title, content, created_at, views, page_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const posts = data || [];
      setUserPosts(posts);
      
      // 메뉴 URL 매핑 가져오기
      if (posts.length > 0) {
        const pageIds = Array.from(new Set(posts.map((post: any) => post.page_id).filter(Boolean)));
        if (pageIds.length > 0) {
          const { data: menuItems } = await createClient()
            .from('cms_menus')
            .select('page_id, url')
            .in('page_id', pageIds)
            .not('url', 'is', null);

          if (menuItems) {
            const urlMap = menuItems.reduce((acc: Record<string, string>, item: any) => {
              if (item.page_id && item.url) {
                acc[item.page_id] = item.url;
              }
              return acc;
            }, {});
            setMenuUrlMap(urlMap);
          }
        }
      }
    } catch (error) {
      console.error("게시글 가져오기 오류:", error);
      toast({
        title: "게시글 로딩 실패",
        description: "게시글을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setPostsLoading(false);
    }
  };

  // 댓글 목록 가져오기
  const fetchUserComments = async () => {
    if (!user) return;
    setCommentsLoading(true);
    try {
      const { data, error } = await createClient()
        .from("board_comments")
        .select("id, content, created_at, post_id, board_posts(id, title, page_id)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const comments = data || [];
      setUserComments(comments);
      
      // 메뉴 URL 매핑 가져오기
      if (comments.length > 0) {
        const pageIds = Array.from(new Set(comments.map((comment: any) => comment.board_posts?.page_id).filter(Boolean)));
        if (pageIds.length > 0) {
          const { data: menuItems } = await createClient()
            .from('cms_menus')
            .select('page_id, url')
            .in('page_id', pageIds)
            .not('url', 'is', null);

          if (menuItems) {
            const urlMap = menuItems.reduce((acc: Record<string, string>, item: any) => {
              if (item.page_id && item.url) {
                acc[item.page_id] = item.url;
              }
              return acc;
            }, {});
            setMenuUrlMap(prev => ({ ...prev, ...urlMap }));
          }
        }
      }
    } catch (error) {
      console.error("댓글 가져오기 오류:", error);
      toast({
        title: "댓글 로딩 실패",
        description: "댓글을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setCommentsLoading(false);
    }
  };

  // 게시글 보기 핸들러 (페이지 이동)
  const handleViewPosts = async () => {
    if (!user) return;
    
    try {
      // 사용자의 가장 최근 게시글의 게시판으로 이동
      const { data, error } = await createClient()
        .from("board_posts")
        .select("page_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.page_id) {
        // 페이지의 메뉴 URL 조회
        const { data: menu } = await createClient()
          .from("cms_menus")
          .select("url")
          .eq("page_id", data.page_id)
          .single();

        if (menu?.url) {
          router.push(`${menu.url}?author=${user.id}`);
          return;
        }
      }
    } catch (error) {
      console.error("게시판 URL 조회 실패:", error);
    }
    
    // 폴백: 홈으로 이동하며 작성자 필터 적용
    router.push(`/?author=${user.id}`);
  };

  // 댓글 보기 핸들러 (페이지 이동)
  const handleViewComments = async () => {
    if (!user) return;
    
    try {
      // 사용자의 가장 최근 댓글의 게시글이 속한 게시판으로 이동
      const { data, error } = await createClient()
        .from("board_comments")
        .select("board_posts(page_id)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.board_posts?.page_id) {
        // 페이지의 메뉴 URL 조회
        const { data: menu } = await createClient()
          .from("cms_menus")
          .select("url")
          .eq("page_id", data.board_posts.page_id)
          .single();

        if (menu?.url) {
          router.push(`${menu.url}?author=${user.id}`);
          return;
        }
      }
    } catch (error) {
      console.error("게시판 URL 조회 실패:", error);
    }
    
    // 폴백: 홈으로 이동하며 작성자 필터 적용
    router.push(`/?author=${user.id}`);
  };

  // 게시글 다이얼로그 보기 핸들러
  const handleViewPostsDialog = () => {
    setPostsDialogOpen(true);
    fetchUserPosts();
  };

  // 댓글 다이얼로그 보기 핸들러
  const handleViewCommentsDialog = () => {
    setCommentsDialogOpen(true);
    fetchUserComments();
  };

  // 계정 삭제 핸들러
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      '정말로 계정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.'
    );
    
    if (!confirmed) return;

    try {
      // 사용자 데이터 삭제 (실제 구현에서는 백엔드 API 호출)
      const { error } = await createClient()
        .from('users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: '계정 삭제 완료',
        description: '계정이 성공적으로 삭제되었습니다.',
      });

      await signOut();
      router.push('/');
    } catch (error: any) {
      toast({
        title: '계정 삭제 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // 아바타 삭제 핸들러
  const handleAvatarDelete = async () => {
    if (!user || !userProfile?.avatar_url) return;
    setAvatarUploading(true);
    try {
      // Storage 파일 경로 추출
      const url = userProfile.avatar_url;
      const matches = url.match(/profile-avatars\/(.+)$/);
      const filePath = matches ? matches[1] : null;
      if (!filePath) throw new Error("파일 경로를 추출할 수 없습니다.");
      // Storage에서 삭제
      const { error: removeError } = await createClient().storage
        .from("profile-avatars")
        .remove([filePath]);
      if (removeError) throw removeError;
      // DB에서 avatar_url null로
      const { error: updateError } = await createClient()
        .from("users")
        .update({ avatar_url: null })
        .eq("id", user.id);
      if (updateError) throw updateError;
      setUserProfile((prev: any) => ({ ...prev, avatar_url: null }));
      setAvatarPreview(null);
      setAvatarDeleted(true);
      toast({
        title: "프로필 이미지 삭제 완료",
        description: "프로필 이미지가 삭제되었습니다.",
      });
      
      // AvatarSelector 새로고침
      setAvatarRefreshTrigger(prev => prev + 1);
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
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserStats = async () => {

      try {
        // 사용자 프로필 정보 가져오기
        const { data: profileData, error: profileError } = await createClient()
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("사용자 프로필 가져오기 오류:", profileError);
        } else {
          setUserProfile(profileData);
          // 현재 사용자의 nickname을 폼에 설정
          const currentNickname = profileData?.nickname || profileData?.username || "";
          setProfileForm({ nickname: currentNickname });
        }

        // 게시글 수 가져오기
        const { count: postCount } = await createClient()
          .from("board_posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // 댓글 수 가져오기 (board_comments 테이블 사용)
        const { count: commentCount } = await createClient()
          .from("board_comments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        setPostCount(postCount || 0);
        setCommentCount(commentCount || 0);

        // 최근 활동 데이터 가져오기
        await fetchRecentActivities();
      } catch (error) {
        console.error("사용자 통계 가져오기 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentActivities = async () => {
      if (!user) return;

      try {
        const activities = [];

        // 최근 게시글 3개
        const { data: recentPosts } = await createClient()
          .from("board_posts")
          .select("title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (recentPosts) {
          recentPosts.forEach((post: any) => {
            activities.push({
              type: '게시글',
              title: post.title,
              time: new Date(post.created_at),
              icon: FileText,
            });
          });
        }

        // 최근 댓글 3개
        const { data: recentComments } = await createClient()
          .from("board_comments")
          .select("content, created_at, board_posts(title)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (recentComments) {
          recentComments.forEach((comment: any) => {
            activities.push({
              type: '댓글',
              title: `"${comment.board_posts?.title}"에 댓글을 작성했습니다`,
              time: new Date(comment.created_at),
              icon: MessageSquare,
            });
          });
        }

        // 프로필 업데이트 (users 테이블의 updated_at 기준)
        if (userProfile?.updated_at) {
          const profileUpdateTime = new Date(userProfile.updated_at);
          const now = new Date();
          const diffInDays = Math.floor((now.getTime() - profileUpdateTime.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffInDays <= 30) { // 30일 이내 업데이트만 표시
            activities.push({
              type: '프로필',
              title: '프로필을 업데이트했습니다',
              time: profileUpdateTime,
              icon: Edit,
            });
          }
        }

        // 시간순으로 정렬하고 최대 5개만 표시
        activities.sort((a, b) => b.time.getTime() - a.time.getTime());
        setRecentActivities(activities.slice(0, 5));

      } catch (error) {
        console.error("최근 활동 가져오기 오류:", error);
      }
    };

    fetchUserStats();
  }, [user]);

  const handleLogoutClick = async () => {
    await signOut();
    router.push("/login");
  };

  // 상대 시간 표시 함수
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}주 전`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}개월 전`;
  };

  // 로딩 중 (인증 로딩 또는 데이터 로딩)
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 인증되지 않은 사용자는 로그인 페이지로 이동
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">마이페이지</h1>
              <p className="text-sm text-muted-foreground mt-0.5">프로필과 계정 설정 관리</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽 컬럼 - 프로필 정보 */}
          <div className="lg:col-span-2 space-y-5">
            {/* 프로필 정보 카드 */}
            <Card className="shadow-sm border bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* 아바타 */}
                  <div className="relative group">
                    <Avatar className="h-20 w-20 border-2 border-white shadow-md ring-1 ring-gray-200">
                      <AvatarImage
                        src={avatarDeleted ? undefined : (avatarPreview || userProfile?.avatar_url)}
                        alt={userProfile?.nickname || userProfile?.username || "사용자"}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary to-primary/80 text-white">
                        {(userProfile?.nickname || userProfile?.username)?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* 아바타 변경 버튼 */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full">
                      <label
                        htmlFor="avatar-upload"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 hover:bg-white rounded-md cursor-pointer text-xs font-medium text-gray-800 transition-colors shadow-sm"
                      >
                        <Camera className="h-3 w-3" />
                        변경
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
                    </div>
                    
                    {avatarUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-20">
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* 프로필 정보 */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">
                        {userProfile?.nickname || userProfile?.username || "사용자"}
                      </h2>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1.5 h-8">
                            <Edit className="h-3.5 w-3.5" />
                            프로필 수정
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                      <Button variant="outline" size="sm" className="gap-1.5 h-8">
                        <Settings className="h-3.5 w-3.5" />
                        설정
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 활동 통계 */}
            <Card className="shadow-sm border bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  활동 통계
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleViewPostsDialog}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 text-left group"
                  >
                    <div className="p-2 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-semibold text-blue-900">{postCount}</p>
                      <p className="text-sm text-blue-700">작성한 게시글</p>
                      <p className="text-xs text-blue-600 mt-0.5">클릭해서 보기 →</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleViewCommentsDialog}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100 hover:from-emerald-100 hover:to-green-100 transition-all duration-200 text-left group"
                  >
                    <div className="p-2 bg-emerald-100 rounded-md group-hover:bg-emerald-200 transition-colors">
                      <MessageSquare className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-semibold text-emerald-900">{commentCount}</p>
                      <p className="text-sm text-emerald-700">작성한 댓글</p>
                      <p className="text-xs text-emerald-600 mt-0.5">클릭해서 보기 →</p>
                    </div>
                  </button>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      가입일: {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <Badge variant="secondary" className="gap-1.5 text-xs w-fit">
                    <Activity className="h-3 w-3" />
                    활성 사용자
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 최근 활동 및 히스토리 */}
            <Card className="shadow-sm border bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-green-100 rounded-md">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  최근 활동
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="p-1.5 bg-muted rounded-md">
                          <activity.icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.type} • {getRelativeTime(activity.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-medium mb-1">활동 내역이 없습니다</h3>
                    <p className="text-sm text-muted-foreground">
                      게시글이나 댓글을 작성해보세요
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 컬럼 - 아바타 관리 & 계정 관리 */}
          <div className="space-y-5">
            {/* 아바타 갤러리 */}
            {user && (
              <AvatarSelector
                userId={user.id}
                currentAvatarUrl={avatarPreview || userProfile?.avatar_url}
                onAvatarSelect={handleAvatarSelectFromHistory}
                onUploadClick={handleAvatarUploadClick}
                disabled={avatarUploading}
                refreshTrigger={avatarRefreshTrigger}
              />
            )}

            {/* 알림 설정 */}
            <Card className="shadow-sm border bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  알림 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">이메일 알림</div>
                      <div className="text-xs text-muted-foreground">새 댓글 및 메시지</div>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, email: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">푸시 알림</div>
                      <div className="text-xs text-muted-foreground">모바일 푸시 알림</div>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, push: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">마케팅 알림</div>
                      <div className="text-xs text-muted-foreground">이벤트 및 소식</div>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, marketing: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 개인정보 설정 */}
            <Card className="shadow-sm border bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-green-100 rounded-md">
                    <Globe className="h-4 w-4 text-green-600" />
                  </div>
                  개인정보 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">프로필 공개</div>
                      <div className="text-xs text-muted-foreground">다른 사용자에게 프로필 공개</div>
                    </div>
                    <Switch
                      checked={privacy.profileVisible}
                      onCheckedChange={(checked) =>
                        setPrivacy(prev => ({ ...prev, profileVisible: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">활동 내역 공개</div>
                      <div className="text-xs text-muted-foreground">게시글, 댓글 활동 공개</div>
                    </div>
                    <Switch
                      checked={privacy.activityVisible}
                      onCheckedChange={(checked) =>
                        setPrivacy(prev => ({ ...prev, activityVisible: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 계정 관리 */}
            <Card className="shadow-sm border bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-orange-100 rounded-md">
                    <Shield className="h-4 w-4 text-orange-600" />
                  </div>
                  계정 관리
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {/* 비밀번호 변경 */}
                <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2.5 h-auto p-3">
                      <Shield className="h-4 w-4 shrink-0" />
                      <div className="text-left min-w-0">
                        <div className="font-medium text-sm">비밀번호 변경</div>
                        <div className="text-xs text-muted-foreground">계정 보안 강화</div>
                      </div>
                    </Button>
                  </DialogTrigger>
                </Dialog>

                {/* 로그아웃 */}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2.5 h-auto p-3 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                  onClick={handleLogoutClick}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm">로그아웃</div>
                    <div className="text-xs text-muted-foreground">세션 종료</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 다이얼로그들 */}
        {/* 프로필 수정 다이얼로그 */}
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                프로필 수정
              </DialogTitle>
              <DialogDescription>
                프로필 정보를 업데이트하여 다른 사용자들에게 표시될 정보를 설정하세요.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-sm font-medium">닉네임</Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    type="text"
                    value={profileForm.nickname}
                    onChange={handleProfileChange}
                    placeholder="2-10자로 입력하세요"
                    minLength={2}
                    maxLength={10}
                    className="h-10"
                    required
                  />
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">닉네임 규칙</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• 2자 이상 10자 이하로 입력하세요</li>
                    <li>• 관리자, 운영자, 종교 관련 용어, 비속어는 사용할 수 없습니다</li>
                    <li>• 다른 사용자와 중복되지 않는 이름을 입력하세요</li>
                    <li>• 한글, 영문, 숫자를 사용할 수 있습니다</li>
                  </ul>
                </div>
              </div>
              
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProfileDialogOpen(false)}
                  disabled={profileLoading}
                >
                  취소
                </Button>
                <Button type="submit" disabled={profileLoading} className="gap-2">
                  {profileLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {profileLoading ? "저장 중..." : "저장하기"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 비밀번호 변경 다이얼로그 */}
        <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                비밀번호 변경
              </DialogTitle>
              <DialogDescription>
                계정 보안을 위해 정기적으로 비밀번호를 변경하는 것을 권장합니다.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePwSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>보안 확인:</strong> 계정 보안을 위해 현재 비밀번호를 확인합니다.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium">현재 비밀번호</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={handlePwChange}
                    placeholder="현재 비밀번호를 입력하세요"
                    className="h-10"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">새 비밀번호</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={pwForm.newPassword}
                    onChange={handlePwChange}
                    placeholder="새 비밀번호를 입력하세요 (6자 이상)"
                    className="h-10"
                    minLength={6}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">새 비밀번호 확인</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={handlePwChange}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    className="h-10"
                    minLength={6}
                    required
                  />
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-900 mb-2">보안 권장사항</h4>
                  <ul className="text-xs text-amber-800 space-y-1">
                    <li>• 8자 이상의 비밀번호를 사용하세요</li>
                    <li>• 대소문자, 숫자, 특수문자를 조합하세요</li>
                    <li>• 다른 사이트와 동일한 비밀번호는 피하세요</li>
                    <li>• 정기적으로 비밀번호를 변경하세요</li>
                  </ul>
                </div>
              </div>
              
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPwDialogOpen(false)}
                  disabled={pwLoading}
                >
                  취소
                </Button>
                <Button type="submit" disabled={pwLoading} className="gap-2">
                  {pwLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pwLoading ? "변경 중..." : "변경하기"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 아바타 크롭 다이얼로그 */}
        <CropDialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
          <CropDialogContent className="max-w-[95vw] w-full sm:max-w-lg">
            <CropDialogHeader className="text-center pb-4">
              <DialogTitle className="text-xl font-semibold flex items-center justify-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                프로필 이미지 편집
              </DialogTitle>
              <div className="text-sm text-muted-foreground mt-1">
                이미지를 드래그하여 위치를 조정하고, 슬라이더로 크기를 조절하세요
              </div>
            </CropDialogHeader>
            
            {/* 크롭 영역 */}
            <div className="relative w-full h-80 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border-2 border-dashed border-slate-200 overflow-hidden">
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
                  style={{
                    containerStyle: {
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'transparent',
                    },
                  }}
                />
              )}
            </div>

            {/* 확대/축소 컨트롤 */}
            <div className="space-y-4 mt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <div className="p-1 bg-primary/10 rounded">
                      <Camera className="h-3 w-3 text-primary" />
                    </div>
                    이미지 크기 조절
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="relative">
                  <Slider
                    id="avatar-zoom-slider"
                    min={1}
                    max={3}
                    step={0.05}
                    value={[zoom]}
                    onValueChange={([v]) => setZoom(v)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>작게</span>
                    <span>크게</span>
                  </div>
                </div>
              </div>

              {/* 가이드 텍스트 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="p-1 bg-blue-100 rounded">
                    <Camera className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-blue-800 font-medium">편집 도움말</p>
                    <ul className="text-xs text-blue-700 mt-1 space-y-0.5">
                      <li>• 이미지를 드래그하여 위치 조정</li>
                      <li>• 슬라이더로 확대/축소</li>
                      <li>• 원형으로 자동 크롭됩니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <CropDialogFooter className="flex justify-between sm:justify-end gap-2 pt-6">
              <Button 
                variant="outline" 
                onClick={handleCropCancel}
                className="flex-1 sm:flex-none"
              >
                취소
              </Button>
              <Button 
                onClick={handleCropApply} 
                disabled={avatarUploading}
                className="flex-1 sm:flex-none gap-2"
              >
                {avatarUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    적용하기
                  </>
                )}
              </Button>
            </CropDialogFooter>
          </CropDialogContent>
        </CropDialog>

        {/* 게시글 목록 다이얼로그 */}
        <Dialog open={postsDialogOpen} onOpenChange={setPostsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                내가 작성한 글 ({userPosts.length}개)
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              {postsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">작성한 글이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userPosts.map((post: any) => (
                    <Card key={post.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm mb-2 line-clamp-1">
                            {post.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {post.content?.replace(/<[^>]*>/g, '') || '내용 없음'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              조회 {post.views || 0}
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="ml-3 shrink-0 gap-1.5"
                          onClick={() => {
                            const menuUrl = menuUrlMap[post.page_id];
                            const url = menuUrl ? `${menuUrl}?post=${post.id}` : `/?post=${post.id}`;
                            router.push(url);
                            setPostsDialogOpen(false);
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                          이동하기
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* 댓글 목록 다이얼로그 */}
        <Dialog open={commentsDialogOpen} onOpenChange={setCommentsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                내가 작성한 댓글 ({userComments.length}개)
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              {commentsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : userComments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">작성한 댓글이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userComments.map((comment: any) => (
                    <Card key={comment.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-2 text-muted-foreground">
                            "{comment.board_posts?.title || '삭제된 게시글'}"에 작성한 댓글
                          </p>
                          <p className="text-sm mb-2 line-clamp-3">
                            {comment.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="ml-3 shrink-0 gap-1.5"
                          onClick={() => {
                            if (comment.board_posts) {
                              const menuUrl = menuUrlMap[comment.board_posts.page_id];
                              const url = menuUrl ? `${menuUrl}?post=${comment.post_id}` : `/?post=${comment.post_id}`;
                              router.push(url);
                              setCommentsDialogOpen(false);
                            } else {
                              toast({
                                title: "게시글을 찾을 수 없음",
                                description: "해당 게시글이 삭제되었거나 접근할 수 없습니다.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                          이동하기
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
