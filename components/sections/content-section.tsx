"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Section } from "@/components/admin/section-manager";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Save,
  X,
  Image as ImageIcon,
  Code,
  FileText,
  Maximize2,
  Smartphone,
} from "lucide-react"; // ImageIcon으로 변경
import { Textarea } from "@/components/ui/textarea";
// import { Input } from "@/components/ui/input"; // Input은 현재 사용되지 않음
import {
  fetchContent,
  saveContent,
  deleteContent,
  upsertContent,
} from "@/services/contentService";
import { toast } from "@/components/ui/toaster";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // RadioGroup은 현재 사용되지 않음
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";

// TipTap 에디터 컴포넌트
const TipTapEditor = dynamic(() => import("@/components/ui/tiptap-editor"), {
  ssr: false,
  loading: () => <p>에디터 로드중...</p>,
});

import DOMPurify from "dompurify";

// 콘텐츠 내 스크립트를 실행하기 위한 iframe 컴포넌트
interface ContentRendererProps {
  content: string;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ content }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const sanitizedContent = DOMPurify.sanitize(content, {
      ADD_TAGS: ["script"],
      ADD_ATTR: ["onerror", "onload", "src", "type"],
      FORCE_BODY: true,
    });
    
    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>콘텐츠</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, sans-serif;
              background-color: white;
              color: #333;
            }
            p {
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body class="p-4">
          ${sanitizedContent}
        </body>
        </html>
      `);
      doc.close();
      
      // iframe 높이 자동 조절 (더 정확한 버전)
      const setIframeHeight = () => {
        if (!iframeRef.current || !iframeRef.current.contentWindow) return;
        
        try {
          // 다양한 높이 값을 수집
          const doc = iframeRef.current.contentWindow.document;
          const body = doc.body;
          const html = doc.documentElement;
          
          // 가장 정확한 높이를 구하기 위한 여러 방법
          const bodyHeight = Math.max(
            body.scrollHeight, 
            body.offsetHeight, 
            html.clientHeight, 
            html.scrollHeight, 
            html.offsetHeight
          );
          
          // 콘텐츠의 공간을 확보하기 위해 여백 추가 (20px)
          const heightWithMargin = bodyHeight + 20;
          
          // iframe 높이 설정 + 최소 높이 보장
          iframeRef.current.style.height = `${Math.max(heightWithMargin, 100)}px`;
        } catch (e) {
          console.error('iframe 높이 조절 오류:', e);
        }
      };
      
      // 콘텐츠 로드 완료 시 높이 조절
      iframeRef.current.onload = setIframeHeight;
      
      // 더 자주 및 더 긴 시간동안 높이 체크 (동적 콘텐츠 대응)
      // 여러 시점에서 체크하여 가장 정확한 값 확보
      setTimeout(setIframeHeight, 50);
      setTimeout(setIframeHeight, 100);
      setTimeout(setIframeHeight, 300);
      setTimeout(setIframeHeight, 500);
      setTimeout(setIframeHeight, 1000);
      
      // 이미지 로드에 따른 동적 높이 조절
      const images = doc.querySelectorAll('img');
      if (images.length > 0) {
        images.forEach(img => {
          img.onload = setIframeHeight;
        });
      }
    }
  }, [content]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full border-0 overflow-hidden bg-white"
      style={{ minHeight: "100px" }}
      title="콘텐츠"
      sandbox="allow-same-origin allow-scripts allow-popups"
      scrolling="no"
    />
  );
};

interface ContentSectionProps {
  section: Section;
  className?: string;
}

export default function ContentSection({
  section,
  className = "",
}: ContentSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [htmlContent, setHtmlContent] = useState(section.content || "");
  const [richTextContent, setRichTextContent] = useState(section.content || "");
  // const [editedTitle, setEditedTitle] = useState(section.title || ""); // 현재 UI에서 사용 안 함
  // const [editedDescription, setEditedDescription] = useState(section.description || ""); // 현재 UI에서 사용 안 함
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const isAdmin = user?.role === "admin";
  const [isSaving, setIsSaving] = useState(false);
  const [previewTab, setPreviewTab] = useState<"desktop" | "mobile">("desktop");
  const [fullWidth, setFullWidth] = useState(section.full_width === true);
  const [contentType, setContentType] = useState<"html" | "text" | "image">(
    section.content_type || "html"
  );
  // 에디터 모드 완전 비활성화: 항상 HTML 모드만 사용
  const editMode: "html" = "html";
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [popupPreviewTab, setPopupPreviewTab] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [mobileWidth, setMobileWidth] = useState<string>("375"); // 모바일 미리보기 너비
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const contentIframeRef = useRef<HTMLIFrameElement>(null);
  const desktopIframeRef = useRef<HTMLIFrameElement>(null);
  const mobileIframeRef = useRef<HTMLIFrameElement>(null);
  const popupDesktopIframeRef = useRef<HTMLIFrameElement>(null);
  const popupMobileIframeRef = useRef<HTMLIFrameElement>(null);

  const generatePreviewHtml = (currentContent: string) => {
    let contentHtmlOutput = "";
    if (contentType === "html") {
      contentHtmlOutput = currentContent;
    } else if (contentType === "text") {
      contentHtmlOutput = currentContent
        .split("\n\n")
        .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("");
    } else if (contentType === "image") {
      contentHtmlOutput = `<img src="${currentContent}" alt="콘텐츠 이미지" style="max-width: 100%; height: auto;" />`;
    }

    // 콘텐츠가 비어있으면 기본 메시지 표시
    if (!contentHtmlOutput.trim()) {
      contentHtmlOutput = "<p>콘텐츠가 없습니다.</p>";
    }

    // 현재 페이지의 스타일시트 가져오기 (옵션: 더 안정적인 방법으로 교체 가능)
    const stylesheets = Array.from(document.styleSheets)
      .filter((sheet) => {
        try {
          return !!sheet.cssRules;
        } catch (e) {
          return false;
        }
      })
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch (e) {
          return "";
        }
      })
      .filter((css) => css.length > 0)
      .join("\n");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>미리보기</title>
        <!-- 로컬 스타일시트 사용 -->
        <script>
          // 정확한 높이 계산을 위한 함수
          function getFullHeight() {
            // 요소들의 높이 계산
            const contentContainer = document.querySelector('.content-container');
            const contentHeight = contentContainer ? contentContainer.scrollHeight : 0;
            
            // 모든 요소를 포함한 전체 높이 계산
            const allElements = document.querySelectorAll('*');
            let maxBottom = 0;
            
            // 모든 요소의 하단 경계를 계산하여 가장 낮은 지점 찾기
            allElements.forEach(el => {
              const rect = el.getBoundingClientRect();
              const bottom = rect.bottom + window.scrollY;
              if (bottom > maxBottom) maxBottom = bottom;
            });
            
            // 추가 요소들의 높이
            const bodyHeight = document.body.scrollHeight;
            const offsetHeight = document.body.offsetHeight;
            const clientHeight = document.body.clientHeight;
            const docHeight = document.documentElement.scrollHeight;
            
            // 모든 값 중 가장 큰 값 사용
            const calculatedHeight = Math.max(maxBottom, bodyHeight, offsetHeight, clientHeight, docHeight, contentHeight);
            
            // 최소한의 여백만 추가 (10px)
            const finalHeight = calculatedHeight + 10;
            
            return {
              calculatedHeight: finalHeight, // 여백이 포함된 최종 높이
              maxBottom,
              bodyHeight,
              offsetHeight,
              clientHeight,
              docHeight,
              contentHeight,
              originalHeight: calculatedHeight // 여백 없는 원래 계산값
            };
          }
          
          // 높이 조절 및 부모에게 전송
          function resizeIframe() {
            const heights = getFullHeight();
            
            // 부모 프레임에 메시지 전송 - 정확한 높이를 전달
            window.parent.postMessage({
              type: 'resize',
              height: heights.calculatedHeight,
              source: window.name || 'unknown-iframe'
            }, '*');
          }
          
          // 이미지 로드 완료 후 높이 재계산
          function setupImageListeners() {
            document.querySelectorAll('img').forEach(img => {
              img.addEventListener('load', function() {
                setTimeout(resizeIframe, 10);
              });
              
              if (img.complete) {
                setTimeout(resizeIframe, 10);
              }
            });
          }
          
          // 초기화 및 이벤트 설정
          function initialize() {
            // 초기 높이 설정
            resizeIframe();
            
            // 이미지 로드 이벤트 설정
            setupImageListeners();
            
            // 여러 시점에서 높이 재계산
            setTimeout(resizeIframe, 2000);
            
            // 동적 변경 감지
            const observer = new MutationObserver(() => {
              setTimeout(resizeIframe, 10);
            });
            
            observer.observe(document.body, { 
              childList: true, 
              subtree: true, 
              attributes: true,
              characterData: true
            });
          }
          
          // 메시지 수신 처리 (높이 갱신 요청)
          window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'checkHeight') {
              setTimeout(resizeIframe, 10);
            }
          });
          
          // 페이지 로드 이벤트 설정
          window.addEventListener('DOMContentLoaded', initialize);
          window.addEventListener('load', initialize);
        </script>
        <style>
          html, body { 
            height: auto; 
            min-height: 100%; 
            overflow-x: hidden; 
            margin: 0; 
            padding: 0; 
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            ${fullWidth ? "width: 100%;" : "width: 100%; max-width: 1200px; margin-left: auto; margin-right: auto;"}
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
          }
          .content-container { 
            width: 100%;
            margin: 0 auto;
            box-sizing: border-box;
          }
          img { 
            max-width: 100%; 
            height: auto; 
            display: block; 
            margin: 0 auto; 
          }
          /* 현재 페이지 스타일 (필요시 주석 해제 또는 수정) */
          /* ${stylesheets} */
          /* 기본 태그 스타일 */
          h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; line-height: 1.25; }
          h1 { font-size: 2em; } h2 { font-size: 1.5em; } h3 { font-size: 1.25em; }
          p { margin: 1em 0; } a { color: #0070f3; text-decoration: none; } a:hover { text-decoration: underline; }
          ul, ol { padding-left: 2em; } blockquote { margin-left: 0; padding-left: 1em; border-left: 4px solid #ddd; color: #666; }
          pre { background: #f5f5f5; padding: 1em; overflow-x: auto; border-radius: 4px; }
          code { background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
          table { border-collapse: collapse; width: 100%; margin: 1em 0; }
          th, td { border: 1px solid #ddd; padding: 0.5em; text-align: left; }
          th { background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="content-container">
          ${contentHtmlOutput}
        </div>
      </body>
      </html>
    `;
  };

  const updateIframe = (
    iframeRef: React.RefObject<HTMLIFrameElement>,
    contentToRender: string,
    iframeName: string
  ) => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        iframeRef.current.setAttribute("name", iframeName); // iframe 식별자 설정
        doc.open();
        doc.write(generatePreviewHtml(contentToRender));
        doc.close();
      }
    }
  };

  // 편집 중 미리보기 업데이트
  useEffect(() => {
    if (isEditing) {
      const currentContent = htmlContent;
      if (previewTab === "desktop") {
        updateIframe(desktopIframeRef, currentContent, "desktopPreview");
      } else {
        updateIframe(mobileIframeRef, currentContent, "mobilePreview");
      }
      if (isPreviewOpen) {
        updateIframe(
          popupDesktopIframeRef,
          currentContent,
          "popupDesktopPreview"
        );
        updateIframe(
          popupMobileIframeRef,
          currentContent,
          "popupMobilePreview"
        );
      }
    }
  }, [
    isEditing,
    htmlContent,
    previewTab,
    fullWidth,
    contentType,
    isPreviewOpen,
  ]);

  // 일반 보기 모드 콘텐츠 초기화 및 업데이트
  useEffect(() => {
    // (불러오기) 필요시 fetchContent 사용 예시
    // useEffect(() => {
    //   async function loadContent() {
    //     const data = await fetchContent(section.id);
    //     // setHtmlContent(data.content); 등 상태 반영
    //   }
    //   if (!isEditing) {
    //     loadContent();
    //     updateIframe(contentIframeRef, section.content || "", "contentDisplay");
    //     setTimeout(() => {
    //       if (contentIframeRef.current?.contentWindow) {
    //         contentIframeRef.current.contentWindow.postMessage(
    //           { type: "checkHeight" },
    //           "*"
    //         );
    //       }
    //     }, 500);
    //   }
    // }, [isEditing, section.content, section.content_type, fullWidth]);
  }, [isEditing, section.content, section.content_type, fullWidth]);

  // 팝업 열릴 때와 팝업 탭 변경 시 업데이트
  useEffect(() => {
    if (isPreviewOpen) {
      const currentContent = htmlContent;
      // 약간의 딜레이를 주어 iframe이 렌더링될 시간을 확보
      setTimeout(() => {
        if (popupPreviewTab === "desktop") {
          updateIframe(
            popupDesktopIframeRef,
            currentContent,
            "popupDesktopPreview"
          );
        } else {
          updateIframe(
            popupMobileIframeRef,
            currentContent,
            "popupMobilePreview"
          );
        }
      }, 100);
    }
  }, [isPreviewOpen, popupPreviewTab, htmlContent, contentType, fullWidth]);

  // 클라이언트 상태 설정을 위한 간단한 useEffect
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleEditClick = () => {
    setHtmlContent(section.content || "");
    setFullWidth(section.full_width === true);
    setContentType(section.content_type || "html");
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    // 상태를 섹션 데이터로 되돌릴 필요 없음, isEditing false로 변경 시 useEffect가 처리
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    const contentToSave = htmlContent;
    try {
      await upsertContent({
        pageId: section.id,
        content: contentToSave,
        fullWidth,
      });
      // 로컬 상태 동기화
      section.content = contentToSave;
      section.content_type = contentType;
      section.full_width = fullWidth;
      setHtmlContent(contentToSave);
      setIsEditing(false);
      toast({
        title: "저장 성공",
        description: "콘텐츠가 성공적으로 저장되었습니다.",
      });
    } catch (error: any) {
      console.error("Error updating section:", error);
      toast({
        title: "저장 실패",
        description: error?.message || JSON.stringify(error),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="content-section-wrapper w-full my-8">
      {/* 섹션 간 간격 추가 */}
      <div className="container mx-auto px-4 mb-4">
        {/* 서버와 클라이언트 간 일관된 렌더링을 위해 항상 div는 유지하고 내용만 조건부 렌더링 */}
        {isClient && isAdmin && !isEditing ? (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
              className="flex items-center gap-1"
            >
              <Pencil className="h-4 w-4" />
              편집
            </Button>
          </div>
        ) : (
          <div className="hidden"></div> /* 빈 div로 구조 유지 */
        )}
      </div>
      <section
        className={`${className} relative w-full ${!isEditing && fullWidth ? "" : "container mx-auto px-4"}`}
      >
        {isEditing ? (
          <div className="space-y-4">
            <Card className="mb-4">
              <div className="flex justify-between items-center p-3 border-b">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="full-width-checkbox"
                    className="text-sm font-medium"
                  >
                    전체 폭
                  </Label>
                  <input
                    type="checkbox"
                    id="full-width-checkbox"
                    checked={fullWidth}
                    onChange={(e) => setFullWidth(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelClick}
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" /> 취소
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => setIsPreviewOpen(true)}
                  >
                    <Maximize2 className="h-4 w-4" /> 미리보기
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveClick}
                    disabled={isSaving}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" />{" "}
                    {isSaving ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </div>
            </Card>
            <div>
              <Card className="overflow-hidden">
                <div className="flex justify-between items-center p-3 border-b">
                  <h3 className="text-sm font-medium">입력창 (HTML 전용)</h3>
                </div>
                <CardContent className="p-0">
                  <Textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="HTML 콘텐츠를 입력하세요."
                    className="text-sm font-mono w-full border-0 p-3"
                    style={{ height: "400px" }}
                  />
                </CardContent>
              </Card>
              
              <Dialog
                open={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
              >
                <DialogContent className="max-w-none w-[95vw] h-[90vh] p-0 flex flex-col">
                  <DialogHeader className="p-4 border-b flex-row justify-between items-center">
                    <DialogTitle>전체 화면 미리보기</DialogTitle>
                    <div className="flex items-center gap-2">
                      <Select
                        value={mobileWidth}
                        onValueChange={setMobileWidth}
                      >
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                          <SelectValue placeholder="모바일 크기" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="375">iPhone SE</SelectItem>
                          <SelectItem value="390">
                            iPhone 12/13
                          </SelectItem>
                          <SelectItem value="414">
                            iPhone XR/11
                          </SelectItem>
                          <SelectItem value="360">Galaxy S21</SelectItem>
                        </SelectContent>
                      </Select>
                      <Tabs
                        value={popupPreviewTab}
                        onValueChange={(v) =>
                          setPopupPreviewTab(v as "desktop" | "mobile")
                        }
                        className="w-auto"
                      >
                        <TabsList className="inline-flex text-xs">
                          <TabsTrigger value="desktop">
                            데스크톱
                          </TabsTrigger>
                          <TabsTrigger value="mobile">모바일</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </DialogHeader>
                  <div
                    className="flex-1 overflow-auto bg-gray-100"
                    style={{ minHeight: "800px" }}
                  >
                    <div
                      className={`w-full h-[800px] transition-opacity ${popupPreviewTab === "desktop" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}
                    >
                      <iframe
                        ref={popupDesktopIframeRef}
                        className="w-full h-full border-0 bg-white"
                        title="팝업 데스크톱 미리보기"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    </div>
                    <div
                      className={`w-full h-full flex justify-center items-center transition-opacity ${popupPreviewTab === "mobile" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}
                    >
                      <div
                        className="overflow-hidden shadow-lg rounded-lg border-4 border-gray-800 bg-white"
                        style={{
                          width: `${parseInt(mobileWidth) + 8}px`,
                          height: `${parseInt(mobileWidth) * 1.8 + 8}px`,
                        }}
                      >
                        <iframe
                          ref={popupMobileIframeRef}
                          className="border-0"
                          title="팝업 모바일 미리보기"
                          sandbox="allow-same-origin allow-scripts"
                          style={{
                            width: `${mobileWidth}px`,
                            height: `${parseInt(mobileWidth) * 1.8}px`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ) : (
          <div
            className={`content-display w-full ${fullWidth ? "" : "container mx-auto px-4 max-w-screen-lg"}`}
            style={{ minHeight: "auto" }}
          >
            <div
              className="w-full bg-white content-container prose max-w-none"
              style={{ overflow: "visible", minHeight: "auto", padding: "16px" }}
            >
              {isClient && (
                <>
                  <ContentRenderer content={section.content || ""} />
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
