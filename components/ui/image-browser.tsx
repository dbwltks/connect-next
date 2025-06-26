"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/db";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ImageBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (imageUrl: string, imageName?: string) => void;
  buckets?: string[];
  multiple?: boolean;
  title?: string;
}

interface ServerImage {
  name: string;
  path?: string;
  url: string;
  bucket: string;
  folder?: string;
  size: number;
  created_at: string;
}

// SWR fetcher 함수
const fetchServerImages = async (buckets: string[]): Promise<ServerImage[]> => {
  const allImages: ServerImage[] = [];

  for (const bucket of buckets) {
    // 루트 레벨 파일들
    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (!error && files) {
      // 이미지 파일만 필터링
      const imageFiles = files.filter((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        return (
          ext && ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)
        );
      });

      // 공개 URL과 함께 저장
      for (const file of imageFiles) {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(file.name);

        allImages.push({
          name: file.name,
          url: urlData.publicUrl,
          bucket: bucket,
          size: file.metadata?.size || 0,
          created_at: file.created_at || file.updated_at || "",
        });
      }

      // 하위 폴더도 탐색 (1단계만)
      const folders = files?.filter((item) => !item.name.includes(".")) || [];
      for (const folder of folders.slice(0, 10)) {
        // 최대 10개 폴더
        const { data: subFiles, error: subError } = await supabase.storage
          .from(bucket)
          .list(folder.name, {
            limit: 50,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (!subError && subFiles) {
          const subImageFiles = subFiles.filter((file) => {
            const ext = file.name.split(".").pop()?.toLowerCase();
            return (
              ext && ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)
            );
          });

          for (const file of subImageFiles) {
            const filePath = `${folder.name}/${file.name}`;
            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);

            allImages.push({
              name: file.name,
              path: filePath,
              url: urlData.publicUrl,
              bucket: bucket,
              folder: folder.name,
              size: file.metadata?.size || 0,
              created_at: file.created_at || file.updated_at || "",
            });
          }
        }
      }
    }
  }

  return allImages;
};

export default function ImageBrowser({
  isOpen,
  onClose,
  onImageSelect,
  buckets = ["homepage-banners", "images", "admin"],
  multiple = false,
  title = "서버 이미지 선택",
}: ImageBrowserProps) {
  const [filter, setFilter] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // SWR로 이미지 데이터 관리
  const {
    data: images = [],
    error,
    isLoading,
    mutate: refreshImages,
  } = useSWR(
    isOpen ? ["server-images", ...buckets] : null, // isOpen일 때만 fetch
    () => fetchServerImages(buckets),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5분간 중복 요청 방지
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (error) => {
        console.error("이미지 로드 오류:", error);
        toast({
          title: "이미지 목록 로드 실패",
          description: "서버 이미지를 불러올 수 없습니다.",
          variant: "destructive",
        });
      },
    }
  );

  // 다이얼로그 닫기 처리
  const handleClose = () => {
    onClose();
    setFilter("");
    setSelectedImages([]);
  };

  // 이미지 선택 처리
  const handleImageClick = (image: ServerImage) => {
    if (multiple) {
      setSelectedImages((prev) => {
        if (prev.includes(image.url)) {
          return prev.filter((url) => url !== image.url);
        } else {
          return [...prev, image.url];
        }
      });
    } else {
      onImageSelect(image.url, image.name);
      handleClose();
    }
  };

  // 다중 선택 완료
  const handleMultipleSelect = () => {
    selectedImages.forEach((url) => {
      const image = images.find((img) => img.url === url);
      onImageSelect(url, image?.name);
    });
    handleClose();
  };

  // 필터링된 이미지
  const filteredImages = images.filter((image) => {
    const filterLower = filter.toLowerCase();
    return (
      !filter ||
      image.name.toLowerCase().includes(filterLower) ||
      (image.folder && image.folder.toLowerCase().includes(filterLower))
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* 검색 필터 */}
          <div className="mb-4">
            <Input
              placeholder="이미지 파일명 또는 폴더명 검색..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>이미지를 불러오는 중...</span>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-red-500">
              <span className="mb-2">
                이미지를 불러오는 중 오류가 발생했습니다.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshImages()}
              >
                다시 시도
              </Button>
            </div>
          )}

          {/* 이미지 그리드 */}
          {!isLoading && !error && (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {filteredImages.map((image, index) => (
                  <div
                    key={index}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      multiple && selectedImages.includes(image.url)
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-transparent hover:border-gray-300"
                    }`}
                    onClick={() => handleImageClick(image)}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-24 object-cover transition-opacity group-hover:opacity-75"
                    />

                    {/* 선택 표시 (다중 선택 모드) */}
                    {multiple && (
                      <div
                        className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 ${
                          selectedImages.includes(image.url)
                            ? "bg-blue-500 border-blue-500"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {selectedImages.includes(image.url) && (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 이미지 정보 오버레이 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="truncate font-medium">{image.name}</div>
                      <div className="text-gray-300 flex justify-between">
                        <span>{image.bucket}</span>
                        {image.folder && <span>📁 {image.folder}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 빈 상태 */}
              {!isLoading && !error && filteredImages.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  {filter
                    ? "검색 결과가 없습니다."
                    : "서버에 이미지가 없습니다."}
                </div>
              )}
            </div>
          )}

          {/* 하단 정보 및 액션 */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                총 {images.length}개의 이미지
                {filter && (
                  <span className="ml-2">
                    (필터링됨: {filteredImages.length}개)
                  </span>
                )}
                {multiple && selectedImages.length > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    {selectedImages.length}개 선택됨
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  취소
                </Button>
                {multiple && selectedImages.length > 0 && (
                  <Button onClick={handleMultipleSelect}>
                    선택한 이미지 추가 ({selectedImages.length}개)
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => refreshImages()}
                  disabled={isLoading}
                  size="sm"
                >
                  🔄 새로고침
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
