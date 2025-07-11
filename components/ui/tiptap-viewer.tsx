"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Typography from "@tiptap/extension-typography";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Highlight from "@tiptap/extension-highlight";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import { Node } from "@tiptap/core";
import React, { useEffect } from "react";

// 유튜브 비디오 노드 확장
const Youtube = Node.create({
  name: "youtube",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      videoId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div",
        getAttrs: (element) => {
          const iframe = element.querySelector(
            'iframe[src*="youtube.com/embed"]'
          );
          if (iframe) {
            const src = iframe.getAttribute("src");
            if (src) {
              const videoIdMatch = src.match(/youtube\.com\/embed\/([^?&]+)/);
              if (videoIdMatch) {
                return {
                  src: src,
                  videoId: videoIdMatch[1],
                };
              }
            }
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, videoId } = HTMLAttributes;
    const finalSrc = src || `https://www.youtube.com/embed/${videoId}`;

    return [
      "div",
      {
        style:
          "position:relative;width:100%;padding-bottom:56.25%;border-radius:0.5rem;",
      },
      [
        "iframe",
        {
          src: finalSrc,
          frameborder: "0",
          allowfullscreen: "",
          style: "position:absolute;top:0;left:0;width:100%;height:100%;",
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        },
      ],
    ];
  },
});

// 폰트 크기 확장 기능
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize.replace(/['"]+/g, ""),
        renderHTML: (attributes) => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },
});

interface TipTapViewerProps {
  content: string;
  className?: string;
  fontSizeLevel?: number;
  fontBoldLevel?: number;
  fontFamily?: string;
}

export default function TipTapViewer({
  content,
  className = "",
  fontSizeLevel = 1,
  fontBoldLevel = 1,
  fontFamily = "nanumMyeongjo",
}: TipTapViewerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-6",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal ml-6",
        },
      }),
      ListItem,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      FontSize,
      Color,
      FontFamily,
      Typography,
      Placeholder.configure({
        placeholder: "",
      }),
      Underline,
      Subscript,
      Superscript,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: "border-collapse border border-gray-300 w-full my-4",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border border-gray-300",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class:
            "border border-gray-300 bg-gray-100 font-semibold p-2 text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-300 p-2",
        },
      }),
      Youtube,
    ],
    content,
    editable: false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!editor) {
    return <div>로딩 중...</div>;
  }

  // 글꼴 크기 계산
  const getFontSize = (baseSize: string) => {
    const sizes = {
      "-2": "0.75",
      "-1": "0.875",
      "0": "1",
      "1": "1.125",
      "2": "1.25",
    };
    const multiplier =
      sizes[fontSizeLevel.toString() as keyof typeof sizes] || "1";
    return `calc(${baseSize} * ${multiplier})`;
  };

  // 글꼴 굵기 계산
  const getFontWeight = () => {
    const weights = {
      "-1": "300",
      "0": "400",
      "1": "500",
      "2": "600",
      "3": "700",
    };
    return weights[fontBoldLevel.toString() as keyof typeof weights] || "400";
  };

  // 글꼴 패밀리 계산
  const getFontFamily = () => {
    const families = {
      default: "system-ui, -apple-system, sans-serif",
      notoSans: '"Noto Sans KR", sans-serif',
      nanumGothic: '"Nanum Gothic", "나눔고딕", sans-serif',
      nanumMyeongjo: '"Nanum Myeongjo", "나눔명조", serif',
      spoqa: '"Spoqa Han Sans", "스포카 한 산스", sans-serif',
    };
    return families[fontFamily as keyof typeof families] || families.default;
  };

  return (
    <div className={`tiptap-viewer ${className}`}>
      <EditorContent editor={editor} />

      <style jsx global>{`
        .tiptap-viewer .ProseMirror {
          outline: none;
          padding: 0;
          font-family: ${getFontFamily()};
          font-weight: ${getFontWeight()};
        }

        .tiptap-viewer .ProseMirror p {
          line-height: 1.5;
          font-size: ${getFontSize("1rem")};
        }
        {/* margin-top: 1.5rem;
        margin-bottom: 1rem; */}
        .tiptap-viewer .ProseMirror h1,
        .tiptap-viewer .ProseMirror h2,
        .tiptap-viewer .ProseMirror h3,
        .tiptap-viewer .ProseMirror h4,
        .tiptap-viewer .ProseMirror h5,
        .tiptap-viewer .ProseMirror h6 {
          
          font-weight: 600;
          line-height: 1.3;
        }

        .tiptap-viewer .ProseMirror h1 {
          font-size: ${getFontSize("1.75rem")};
        }
        .tiptap-viewer .ProseMirror h2 {
          font-size: ${getFontSize("1.5rem")};
        }
        .tiptap-viewer .ProseMirror h3 {
          font-size: ${getFontSize("1.25rem")};
        }
        .tiptap-viewer .ProseMirror h4 {
          font-size: ${getFontSize("1.125rem")};
        }
        .tiptap-viewer .ProseMirror h5 {
          font-size: ${getFontSize("1rem")};
        }
        .tiptap-viewer .ProseMirror h6 {
          font-size: ${getFontSize("0.875rem")};
        }

        .tiptap-viewer .ProseMirror ul,
        .tiptap-viewer .ProseMirror ol {
          margin-left: 1rem;
          margin-bottom: 1rem;
          padding-left: 0.5rem;
        }

        .tiptap-viewer .ProseMirror ol {
          list-style-type: decimal;
        }

        .tiptap-viewer .ProseMirror ul {
          list-style-type: disc;
        }

        .tiptap-viewer .ProseMirror li {
          margin-bottom: 0.5rem;
          margin-left: 0;
        }

        .tiptap-viewer .ProseMirror ol li::marker {
          font-size: 0.9em;
          font-weight: bold;
        }

        .tiptap-viewer .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1.5rem 0;
          color: #4b5563;
          font-style: italic;
        }

        .tiptap-viewer .ProseMirror pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          margin: 1.5rem 0;
          font-size: 0.875rem;
          border: 1px solid #e5e7eb;
        }

        .tiptap-viewer .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
        }

        .tiptap-viewer .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
        }

        .tiptap-viewer .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .tiptap-viewer .ProseMirror a:hover {
          color: #1d4ed8;
        }

        .tiptap-viewer .ProseMirror hr {
          margin: 0.1rem 0 1rem 0;
          border: none;
          border-top: 2px solid #e5e7eb;
        }

        .tiptap-viewer .ProseMirror img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
          border-radius: 0.5rem;
        }

        .tiptap-viewer .ProseMirror table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }

        .tiptap-viewer .ProseMirror th,
        .tiptap-viewer .ProseMirror td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem 0.75rem;
          text-align: left;
        }

        .tiptap-viewer .ProseMirror th {
          background-color: #f9fafb;
          font-weight: 600;
        }

        .tiptap-viewer .ProseMirror tr:nth-child(even) {
          background-color: #f9fafb;
        }

        .tiptap-viewer .ProseMirror mark {
          background-color: #fef08a;
          padding: 0.1rem 0.2rem;
          border-radius: 0.125rem;
        }

        .tiptap-viewer .ProseMirror sub {
          font-size: 0.75em;
          vertical-align: sub;
        }

        .tiptap-viewer .ProseMirror sup {
          font-size: 0.75em;
          vertical-align: super;
        }

        .tiptap-viewer .ProseMirror u {
          text-decoration: underline;
        }

        .tiptap-viewer .ProseMirror s {
          text-decoration: line-through;
        }

        .tiptap-viewer .ProseMirror iframe {
          max-width: 100%;
          margin: 1rem 0;
          border-radius: 0.5rem;
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  );
}
