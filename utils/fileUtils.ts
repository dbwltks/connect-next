import { createClient } from '@/utils/supabase/server';

export interface IFileInfo {
  url: string;
  name: string;
  size?: string;
  type?: string;
  uploadedAt?: string;
}

// 파일을 temp에서 정식 위치로 이동하는 함수
export async function moveFilesFromTemp(files: IFileInfo[] = [], content: string = '') {
  // 입력 유효성 검사
  if (!Array.isArray(files)) {
    console.warn("moveFilesFromTemp: files parameter is not an array:", files);
    return { 
      movedFiles: [], 
      urlMapping: {}, 
      finalContent: content || '',
      moveThumbnailFromTemp: async (url: string) => url
    };
  }
  const supabase = await createClient();
  const movedFiles: IFileInfo[] = [];
  const urlMapping: { [oldUrl: string]: string } = {};

  // 파일 배열에서 temp 파일들 이동
  for (const file of files) {
    // 유효성 검사
    if (!file || !file.url || typeof file.url !== 'string') {
      console.warn("Invalid file object:", file);
      movedFiles.push(file); // 유효하지 않은 파일은 그대로 유지
      continue;
    }
    
    if (file.url.includes("/temp/")) {
      try {
        const tempPath = file.url.split("/storage/v1/object/public/board/")[1];
        const newPath = tempPath.replace("temp/", "");

        // 파일 복사
        const { data: downloadData, error: downloadError } = 
          await supabase.storage.from("board").download(tempPath);

        if (downloadError) {
          console.error("파일 다운로드 실패:", downloadError);
          movedFiles.push(file); // 실패시 원본 유지
          continue;
        }

        // 새 위치에 업로드
        const { error: uploadError } = await supabase.storage
          .from("board")
          .upload(newPath, downloadData, { upsert: true });

        if (uploadError) {
          console.error("파일 업로드 실패:", uploadError);
          movedFiles.push(file); // 실패시 원본 유지
          continue;
        }

        // 새 URL 생성
        const { data: publicUrlData } = supabase.storage
          .from("board")
          .getPublicUrl(newPath);

        // URL 매핑 저장
        urlMapping[file.url] = publicUrlData.publicUrl;

        // 임시 파일 삭제
        await supabase.storage.from("board").remove([tempPath]);

        // 새 파일 정보로 추가
        movedFiles.push({
          ...file,
          url: publicUrlData.publicUrl,
        });
      } catch (error) {
        console.error("파일 이동 중 오류:", error);
        movedFiles.push(file); // 실패시 원본 유지
      }
    } else {
      // 이미 정식 경로인 파일은 그대로 유지
      movedFiles.push(file);
    }
  }

  // 컨텐츠에서 temp URL들을 찾아서 이동
  const tempUrlRegex = /https:\/\/[^\/]+\/storage\/v1\/object\/public\/board\/temp\/[^\s"')]+/g;
  const tempUrls = content.match(tempUrlRegex) || [];

  for (const tempUrl of tempUrls) {
    if (!urlMapping[tempUrl]) { // 이미 처리된 URL이 아닌 경우만
      try {
        const tempPath = tempUrl.split("/storage/v1/object/public/board/")[1];
        const newPath = tempPath.replace("temp/", "");

        // 파일 복사
        const { data: downloadData, error: downloadError } = 
          await supabase.storage.from("board").download(tempPath);

        if (downloadError) {
          console.error("컨텐츠 내 파일 다운로드 실패:", downloadError);
          continue;
        }

        // 새 위치에 업로드
        const { error: uploadError } = await supabase.storage
          .from("board")
          .upload(newPath, downloadData, { upsert: true });

        if (uploadError) {
          console.error("컨텐츠 내 파일 업로드 실패:", uploadError);
          continue;
        }

        // 새 URL 생성
        const { data: publicUrlData } = supabase.storage
          .from("board")
          .getPublicUrl(newPath);

        // URL 매핑 저장
        urlMapping[tempUrl] = publicUrlData.publicUrl;

        // 임시 파일 삭제
        await supabase.storage.from("board").remove([tempPath]);

      } catch (error) {
        console.error("컨텐츠 내 파일 이동 중 오류:", error);
      }
    }
  }

  // 컨텐츠 내 URL 교체
  let finalContent = content;
  for (const [oldUrl, newUrl] of Object.entries(urlMapping)) {
    const escapedOldUrl = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedOldUrl, "g");
    finalContent = finalContent.replace(regex, newUrl);
  }

  // 썸네일 이미지 처리 함수
  const moveThumbnailFromTemp = async (thumbnailImage: string) => {
    if (thumbnailImage && thumbnailImage.includes("/temp/")) {
      try {
        const tempPath = thumbnailImage.split("/storage/v1/object/public/board/")[1];
        const newPath = tempPath.replace("temp/", "");

        // 파일 복사
        const { data: downloadData, error: downloadError } = 
          await supabase.storage.from("board").download(tempPath);

        if (downloadError || !downloadData) {
          return thumbnailImage; // 실패시 원본 반환
        }

        // 새 위치에 업로드
        const { error: uploadError } = await supabase.storage
          .from("board")
          .upload(newPath, downloadData, { upsert: true });

        if (uploadError) {
          return thumbnailImage; // 실패시 원본 반환
        }

        // 새 URL 생성
        const { data: publicUrlData } = supabase.storage
          .from("board")
          .getPublicUrl(newPath);

        // 임시 파일 삭제
        await supabase.storage.from("board").remove([tempPath]);

        return publicUrlData.publicUrl;
      } catch (error) {
        console.error("썸네일 이미지 이동 중 오류:", error);
        return thumbnailImage; // 실패시 원본 반환
      }
    }
    return thumbnailImage;
  };

  return { 
    movedFiles, 
    urlMapping, 
    finalContent,
    moveThumbnailFromTemp
  };
}

// 임시 파일들을 정리하는 함수
export async function cleanupTempFiles(fileUrls: string[] = []) {
  const supabase = await createClient();
  const tempPaths: string[] = [];

  for (const url of fileUrls) {
    if (url.includes("/temp/")) {
      try {
        const tempPath = url.split("/storage/v1/object/public/board/")[1];
        tempPaths.push(tempPath);
      } catch (error) {
        console.error("임시 파일 경로 파싱 오류:", error);
      }
    }
  }

  if (tempPaths.length > 0) {
    try {
      const { error } = await supabase.storage.from("board").remove(tempPaths);
      if (error) {
        console.error("임시 파일 삭제 실패:", error);
      } else {
        console.log(`${tempPaths.length}개의 임시 파일이 삭제되었습니다.`);
      }
    } catch (error) {
      console.error("임시 파일 정리 중 오류:", error);
    }
  }
}