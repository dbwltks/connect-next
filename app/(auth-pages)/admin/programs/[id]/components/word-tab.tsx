"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { BulletList } from "@tiptap/extension-bullet-list";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { ListItem } from "@tiptap/extension-list-item";
import { Blockquote } from "@tiptap/extension-blockquote";
import { CodeBlock } from "@tiptap/extension-code-block";
import { Link } from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Underline } from "@tiptap/extension-underline";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Image } from "@tiptap/extension-image";
import { History } from "@tiptap/extension-history";

// CustomTableCell with backgroundColor attribute
const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      // extend the existing attributes …
      ...this.parent?.(),

      // and add a new one …
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-background-color"),
        renderHTML: (attributes) => {
          return {
            "data-background-color": attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },
});

// Table HTML template for insertion
export const tableHTML = `
  <table style="width:100%">
    <tr>
      <th>제목1</th>
      <th>제목2</th>
      <th>제목3</th>
    </tr>
    <tr>
      <td>내용1</td>
      <td>내용2</td>
      <td>내용3</td>
    </tr>
    <tr>
      <td>내용4</td>
      <td>내용5</td>
      <td>내용6</td>
    </tr>
  </table>
`;

import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  rectIntersection,
  MeasuringStrategy,
} from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Plus,
  Save,
  Trash2,
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Table as TableIcon,
  Menu,
  ChevronLeft,
  MoreVertical,
  Edit3,
  Type,
  Palette,
  MoreHorizontal,
  CheckSquare,
  Code,
  Quote,
  Minus,
  Undo,
  Redo,
  Image as ImageIcon,
  Highlighter,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  AlignJustify,
  Strikethrough,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface WordTabProps {
  programId: string;
  onNavigateToTab: (tab: string) => void;
}

// Simple Editor Toolbar (TipTap 스타일)
const SimpleEditorToolbar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 p-3 bg-white">
      <div className="flex flex-wrap items-center gap-1">
        {/* Undo/Redo */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0"
            title="되돌리기"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0"
            title="다시실행"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        {/* Text Formatting */}
        <Button
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("strike") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="h-8 w-8 p-0"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("code") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className="h-8 w-8 p-0"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("underline") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-8 w-8 p-0"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={editor.isActive("highlight") ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="grid grid-cols-4 gap-2">
              {[
                "#fef3c7", "#fed7aa", "#fecaca", "#f3e8ff",
                "#dbeafe", "#d1fae5", "#fce7f3", "#f3f4f6"
              ].map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                />
              ))}
              <button
                className="w-8 h-8 rounded border bg-white"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
              >
                <Minus className="h-3 w-3 m-auto" />
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        {/* Superscript/Subscript */}
        <Button
          variant={editor.isActive("superscript") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className="h-8 w-8 p-0"
        >
          <SuperscriptIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("subscript") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className="h-8 w-8 p-0"
        >
          <SubscriptIcon className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        {/* Text Alignment */}
        <Button
          variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className="h-8 w-8 p-0"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: "justify" }) ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className="h-8 w-8 p-0"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        {/* Image Upload */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  editor.chain().focus().setImage({ src: reader.result as string }).run();
                };
                reader.readAsDataURL(file);
              }
            };
            input.click();
          }}
          className="h-8 w-8 p-0"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        {/* Text Styles */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-3">
              <Type className="h-4 w-4 mr-1" />
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              본문
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              제목 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              제목 2
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              제목 3
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            >
              제목 4
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        {/* Lists */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-1" />
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuItem
              onClick={() => {
                editor?.chain().focus().toggleBulletList().run();
              }}
            >
              <List className="h-4 w-4 mr-2" />
              글머리 기호
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor?.chain().focus().toggleOrderedList().run();
              }}
            >
              <ListOrdered className="h-4 w-4 mr-2" />
              번호 목록
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor?.chain().focus().toggleTaskList().run();
              }}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              할 일 목록
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        {/* Blocks */}
        <div className="flex items-center">
          <Button
            variant={editor.isActive("blockquote") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="h-8 w-8 p-0"
            title="인용구"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("codeBlock") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className="h-8 w-8 p-0"
            title="코드 블록"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="h-8 w-8 p-0"
            title="구분선"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={editor.isActive("link") ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <Input
                placeholder="링크 URL을 입력하세요"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const url = (e.target as HTMLInputElement).value;
                    if (url) {
                      editor.chain().focus().setLink({ href: url }).run();
                    }
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => editor.chain().focus().unsetLink().run()}
                variant="outline"
                className="w-full"
              >
                링크 해제
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Table */}
        <TableInsertButton editor={editor} />

        {editor.isActive("table") && (
          <>
            <div className="h-4 w-px bg-gray-300 mx-1" />
            <TableEditDropdown editor={editor} />
          </>
        )}
      </div>
    </div>
  );
};

// Table Insert Button Component
const TableInsertButton = ({ editor }: { editor: any }) => {
  const [tableGrid, setTableGrid] = useState({ rows: 0, cols: 0 });
  const [isOpen, setIsOpen] = useState(false);

  const insertTable = (rows: number, cols: number) => {
    if (editor && rows > 0 && cols > 0) {
      editor
        .chain()
        .focus()
        .insertTable({
          rows,
          cols,
          withHeaderRow: false,
        })
        .run();
      setIsOpen(false);
      setTableGrid({ rows: 0, cols: 0 });
    }
  };

  const renderTableGrid = () => {
    const maxRows = 6;
    const maxCols = 8;
    const grid = [];

    for (let row = 1; row <= maxRows; row++) {
      for (let col = 1; col <= maxCols; col++) {
        const isSelected = row <= tableGrid.rows && col <= tableGrid.cols;
        grid.push(
          <div
            key={`${row}-${col}`}
            className={`w-4 h-4 border cursor-pointer transition-colors ${
              isSelected
                ? "bg-blue-500 border-blue-600"
                : "bg-gray-50 border-gray-200 hover:bg-blue-50"
            }`}
            onMouseEnter={() => setTableGrid({ rows: row, cols: col })}
            onClick={() => insertTable(row, col)}
          />
        );
      }
    }

    return (
      <div className="p-3">
        <div
          className="grid gap-1 mb-3"
          style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}
        >
          {grid}
        </div>
        <div className="text-center text-sm text-gray-600">
          {tableGrid.rows > 0 && tableGrid.cols > 0
            ? `${tableGrid.rows} × ${tableGrid.cols} 표`
            : "크기를 선택하세요"}
        </div>
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-9 w-9 p-0 hover:bg-gray-100"
          title="표 삽입"
        >
          <TableIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        onMouseLeave={() => setTableGrid({ rows: 0, cols: 0 })}
      >
        {renderTableGrid()}
      </PopoverContent>
    </Popover>
  );
};

// Table Edit Dropdown Component
const TableEditDropdown = ({ editor }: { editor: any }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 hover:bg-gray-100">
          <TableIcon className="h-4 w-4 mr-1" />
          표 편집
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addRowBefore().run()}
          disabled={!editor.can().addRowBefore()}
        >
          <Plus className="h-4 w-4 mr-2" />
          위에 행 추가
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.can().addRowAfter()}
        >
          <Plus className="h-4 w-4 mr-2" />
          아래에 행 추가
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          disabled={!editor.can().addColumnBefore()}
        >
          <Plus className="h-4 w-4 mr-2" />
          왼쪽에 열 추가
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.can().addColumnAfter()}
        >
          <Plus className="h-4 w-4 mr-2" />
          오른쪽에 열 추가
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!editor.can().deleteRow()}
          className="text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          행 삭제
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().deleteColumn().run()}
          disabled={!editor.can().deleteColumn()}
          className="text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          열 삭제
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().mergeCells().run()}
          disabled={!editor.can().mergeCells()}
        >
          셀 병합
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().splitCell().run()}
          disabled={!editor.can().splitCell()}
        >
          셀 분할
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          disabled={!editor.can().toggleHeaderRow()}
        >
          헤더 행 토글
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
          disabled={!editor.can().toggleHeaderColumn()}
        >
          헤더 열 토글
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            editor
              .chain()
              .focus()
              .setCellAttribute("backgroundColor", "#FAF594")
              .run()
          }
          disabled={
            !editor.can().setCellAttribute("backgroundColor", "#FAF594")
          }
        >
          <Palette className="h-4 w-4 mr-2" />
          셀 색상 변경
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!editor.can().deleteTable()}
          className="text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          표 삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface DocumentData {
  id: string;
  name: string;
  content: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
}

interface FolderData {
  id: string;
  name: string;
  parentId?: string;
  expanded?: boolean;
  order?: number;
}

interface Program {
  id: string;
  name: string;
  documents?: DocumentData[];
  folders?: FolderData[];
}

export default function WordTab({ programId, onNavigateToTab }: WordTabProps) {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<Program | null>(null);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(
    null
  );
  const [newDocumentName, setNewDocumentName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "document" | "folder";
    id: string;
    name: string;
  }>({ open: false, type: "document", id: "", name: "" });

  // Dialog 상태
  const [createDialog, setCreateDialog] = useState<{
    open: boolean;
    type: "document" | "folder";
    parentFolderId?: string;
  }>({ open: false, type: "document" });


  // 사이드바 상태
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 이름 편집 상태
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  // 드래그 상태
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<
    FolderData | DocumentData | null
  >(null);
  const [activeItemLevel, setActiveItemLevel] = useState<number>(0);
  const [dropIndicator, setDropIndicator] = useState<{
    id: string;
    position: "above" | "below" | "inside";
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // 수직만 이동 가능하도록 제약
  const modifiers = [
    (args: any) => {
      const { transform } = args;
      return {
        ...transform,
        x: 0, // x축 이동 완전 차단
      };
    },
  ];

  // 수직 제약 조건
  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };

  const supabase = createClient();

  // Tiptap 에디터 설정
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      CustomTableCell,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "새 문서를 작성해보세요.",
        emptyEditorClass: "is-editor-empty",
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Typography,
      Highlight.configure({
        multicolor: true,
      }),
      Superscript,
      Subscript,
    ],
    content: selectedDocument?.content || "",
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-350px)]",
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off", 
        spellcheck: "false",
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        const htmlItem = items.find((item) => item.type === "text/html");
        const textItem = items.find((item) => item.type === "text/plain");

        if (htmlItem) {
          htmlItem.getAsString((html) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const tables = doc.querySelectorAll("table");

            if (tables.length > 0) {
              const table = tables[0];
              const rows = table.querySelectorAll("tr");
              const tableData: string[][] = [];

              rows.forEach((row) => {
                const cells = row.querySelectorAll("td, th");
                const rowData: string[] = [];
                cells.forEach((cell) => {
                  // HTML 태그 제거하고 텍스트만 추출
                  const text =
                    cell.textContent?.replace(/\s+/g, " ").trim() || "";
                  rowData.push(text);
                });
                if (rowData.length > 0) {
                  tableData.push(rowData);
                }
              });

              if (tableData.length > 0 && tableData[0].length > 1) {
                const maxCols = Math.max(...tableData.map((row) => row.length));

                // 표 삽입
                setTimeout(() => {
                  editor
                    ?.chain()
                    .focus()
                    .insertTable({
                      rows: tableData.length,
                      cols: maxCols,
                      withHeaderRow: false,
                    })
                    .run();

                  // 테이블 생성 완료 - 사용자가 수동으로 내용 입력 필요
                  // goToCell 메소드가 현재 TipTap 버전에서 지원되지 않음
                }, 100);

                event.preventDefault();
                return true;
              }
            }
          });
        }

        // 텭으로 구분된 텍스트 (Excel/Google Sheets에서 복사한 경우)
        if (textItem && !htmlItem) {
          textItem.getAsString((text) => {
            const lines = text.split("\n").filter((line) => line.trim());
            const isTabularData =
              lines.some((line) => line.includes("\t")) && lines.length > 1;

            if (isTabularData) {
              const tableData = lines.map((line) => line.split("\t"));
              const maxCols = Math.max(...tableData.map((row) => row.length));

              if (maxCols > 1) {
                setTimeout(() => {
                  editor
                    ?.chain()
                    .focus()
                    .insertTable({
                      rows: tableData.length,
                      cols: maxCols,
                      withHeaderRow: false,
                    })
                    .run();

                  setTimeout(() => {
                    // 테이블 생성 완료 후 사용자가 수동으로 내용 입력
                    // goToCell 메소드가 현재 TipTap 버전에서 지원되지 않음
                  }, 200);
                }, 100);

                event.preventDefault();
                return true;
              }
            }
          });
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (selectedDocument) {
        const updatedDocument = {
          ...selectedDocument,
          content: editor.getHTML(),
          updatedAt: new Date().toISOString(),
        };
        setSelectedDocument(updatedDocument);
      }
    },
  }, [selectedDocument?.id]);

  // 프로그램 데이터 로드
  useEffect(() => {
    loadDocuments();
  }, [programId]);

  // 선택된 문서가 변경되면 에디터 내용 업데이트
  useEffect(() => {
    if (editor && selectedDocument) {
      const currentContent = editor.getHTML();
      if (currentContent !== selectedDocument.content) {
        editor.commands.setContent(selectedDocument.content, { emitUpdate: false });
      }
    }
  }, [selectedDocument?.id, editor]);

  // 문서 및 폴더 로드
  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("programs")
        .select("id, name, documents, folders")
        .eq("id", programId)
        .single();

      if (error) throw error;

      setProgram(data);
      setDocuments(data.documents || []);

      // 폴더 데이터 정리: 자기 참조 방지
      const cleanFolders = (data.folders || []).map((folder: FolderData) => ({
        ...folder,
        parentId: folder.parentId === folder.id ? null : folder.parentId,
      }));
      setFolders(cleanFolders);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  // 새 문서 생성
  const createNewDocument = async () => {
    if (!newDocumentName.trim() || !program) return;

    try {
      const newDocument: DocumentData = {
        id: crypto.randomUUID(),
        name: newDocumentName,
        content: "",
        folderId: createDialog.parentFolderId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedDocuments = [...documents, newDocument];

      const { error } = await supabase
        .from("programs")
        .update({
          documents: updatedDocuments,
        })
        .eq("id", programId);

      if (error) throw error;

      setDocuments(updatedDocuments);
      setNewDocumentName("");
      setCreateDialog({ open: false, type: "document" });
      setSelectedDocument(newDocument);

      // 부모 폴더가 있다면 해당 폴더를 확장하여 새 문서가 보이도록 함
      if (createDialog.parentFolderId) {
        setFolders((prev) =>
          prev.map((folder) =>
            folder.id === createDialog.parentFolderId
              ? { ...folder, expanded: true }
              : folder
          )
        );
      }
    } catch (error) {
      console.error("Error creating document:", error);
    }
  };

  // 새 폴더 생성
  const createNewFolder = async () => {
    if (!newFolderName.trim() || !program) return;

    try {
      const newFolder: FolderData = {
        id: crypto.randomUUID(),
        name: newFolderName,
        parentId: createDialog.parentFolderId || undefined,
        expanded: true,
      };

      const updatedFolders = [...folders, newFolder];

      const { error } = await supabase
        .from("programs")
        .update({
          folders: updatedFolders,
        })
        .eq("id", programId);

      if (error) throw error;

      // 부모 폴더가 있다면 해당 폴더를 확장하여 새 폴더가 보이도록 함
      const finalFolders = createDialog.parentFolderId
        ? updatedFolders.map((folder) =>
            folder.id === createDialog.parentFolderId
              ? { ...folder, expanded: true }
              : folder
          )
        : updatedFolders;

      setFolders(finalFolders);
      setNewFolderName("");
      setCreateDialog({ open: false, type: "folder" });
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  // 문서 저장
  const saveDocument = async () => {
    if (!selectedDocument || !editor) return;

    try {
      const updatedDocument = {
        ...selectedDocument,
        content: editor.getHTML(),
        updatedAt: new Date().toISOString(),
      };

      const updatedDocuments = documents.map((doc) =>
        doc.id === selectedDocument.id ? updatedDocument : doc
      );

      const { error } = await supabase
        .from("programs")
        .update({
          documents: updatedDocuments,
        })
        .eq("id", programId);

      if (error) throw error;

      setDocuments(updatedDocuments);
      setSelectedDocument(updatedDocument);
      alert("문서가 저장되었습니다.");
    } catch (error) {
      console.error("Error saving document:", error);
      alert("저장에 실패했습니다.");
    }
  };

  // 문서 삭제
  const deleteDocument = async (documentId: string) => {
    try {
      const updatedDocuments = documents.filter((doc) => doc.id !== documentId);

      const { error } = await supabase
        .from("programs")
        .update({
          documents: updatedDocuments,
        })
        .eq("id", programId);

      if (error) throw error;

      setDocuments(updatedDocuments);
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
      }
      setDeleteDialog({ open: false, type: "document", id: "", name: "" });
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  // 폴더 삭제
  const deleteFolder = async (folderId: string) => {
    try {
      // 하위 폴더들 찾기 (재귀적으로)
      const getAllSubfolders = (parentId: string): string[] => {
        const subfolders = folders.filter((f) => f.parentId === parentId);
        let allSubfolders = subfolders.map((f) => f.id);
        subfolders.forEach((folder) => {
          allSubfolders = [...allSubfolders, ...getAllSubfolders(folder.id)];
        });
        return allSubfolders;
      };

      const foldersToDelete = [folderId, ...getAllSubfolders(folderId)];

      // 삭제될 폴더들에 속한 문서들도 삭제
      const updatedDocuments = documents.filter(
        (doc) => !foldersToDelete.includes(doc.folderId || "")
      );

      // 폴더들 삭제
      const updatedFolders = folders.filter(
        (folder) => !foldersToDelete.includes(folder.id)
      );

      const { error } = await supabase
        .from("programs")
        .update({
          documents: updatedDocuments,
          folders: updatedFolders,
        })
        .eq("id", programId);

      if (error) throw error;

      setDocuments(updatedDocuments);
      setFolders(updatedFolders);

      // 삭제된 폴더가 선택되어 있었다면 선택 해제
      if (selectedFolderId && foldersToDelete.includes(selectedFolderId)) {
        setSelectedFolderId(null);
      }

      // 삭제된 폴더 안의 문서가 선택되어 있었다면 선택 해제
      if (
        selectedDocument &&
        foldersToDelete.includes(selectedDocument.folderId || "")
      ) {
        setSelectedDocument(null);
      }

      setDeleteDialog({ open: false, type: "folder", id: "", name: "" });
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  // 폴더 토글
  const toggleFolder = (folderId: string) => {
    setFolders(
      folders.map((folder) =>
        folder.id === folderId
          ? { ...folder, expanded: !folder.expanded }
          : folder
      )
    );
  };

  // 간단한 드래그 핸들러들

  // 순서 변경을 데이터베이스에 저장
  const saveOrderToDatabase = useCallback(
    async (newDocuments: DocumentData[], newFolders: FolderData[]) => {
      try {
        const { error } = await supabase
          .from("programs")
          .update({
            documents: newDocuments,
            folders: newFolders,
          })
          .eq("id", programId);

        if (error) throw error;
      } catch (error) {
        console.error("Error saving order:", error);
      }
    },
    [programId]
  );

  // 이름 편집 시작
  const startEditingName = (item: FolderData | DocumentData) => {
    setEditingItem(item.id);
    setEditingName(item.name);
  };

  // 이름 편집 완료
  const finishEditingName = async () => {
    if (!editingItem || !editingName.trim()) {
      setEditingItem(null);
      setEditingName("");
      return;
    }

    try {
      const isFolder = folders.some((f) => f.id === editingItem);

      if (isFolder) {
        const updatedFolders = folders.map((f) =>
          f.id === editingItem ? { ...f, name: editingName.trim() } : f
        );
        setFolders(updatedFolders);
        await saveOrderToDatabase(documents, updatedFolders);
      } else {
        const updatedDocuments = documents.map((d) =>
          d.id === editingItem ? { ...d, name: editingName.trim() } : d
        );
        setDocuments(updatedDocuments);
        await saveOrderToDatabase(updatedDocuments, folders);
      }
    } catch (error) {
      console.error("Error renaming item:", error);
    }

    setEditingItem(null);
    setEditingName("");
  };

  // 이름 편집 취소
  const cancelEditingName = () => {
    setEditingItem(null);
    setEditingName("");
  };

  // 드래그 핸들러들
  // 아이템의 레벨을 계산하는 함수
  const getItemLevel = (item: FolderData | DocumentData): number => {
    if ("content" in item) {
      // 문서인 경우
      const doc = item as DocumentData;
      if (!doc.folderId) return 0;

      const parentFolder = folders.find((f) => f.id === doc.folderId);
      if (!parentFolder) return 0;

      return getFolderLevel(parentFolder) + 1;
    } else {
      // 폴더인 경우
      return getFolderLevel(item as FolderData);
    }
  };

  const getFolderLevel = (folder: FolderData): number => {
    if (!folder.parentId) return 0;

    const parentFolder = folders.find((f) => f.id === folder.parentId);
    if (!parentFolder) return 0;

    return getFolderLevel(parentFolder) + 1;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;

    setActiveId(id);
    const item = [...documents, ...folders].find((item) => item.id === id);
    setActiveItem(item || null);

    if (item) {
      const level = getItemLevel(item);
      setActiveItemLevel(level);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;

    if (!over || !active) {
      setOverId(null);
      setDropIndicator(null);
      return;
    }

    const overId = over.id as string;
    const activeId = active.id as string;

    if (activeId === overId) {
      setOverId(null);
      setDropIndicator(null);
      return;
    }

    setOverId(overId);

    const overItem = [...documents, ...folders].find(
      (item) => item.id === overId
    );
    const activeItem = [...documents, ...folders].find(
      (item) => item.id === activeId
    );

    if (overItem && activeItem) {
      const isOverFolder = !("content" in overItem);
      const isActiveDocument = "content" in activeItem;
      const isActiveFolder = !("content" in activeItem);

      if (isOverFolder && isActiveDocument) {
        // 문서를 폴더에 드롭하는 경우 - 3분할로 나누어 above, inside, below 구분
        const rect = over.rect;
        if (rect) {
          const topThird = rect.top + rect.height / 3;
          const bottomThird = rect.top + (rect.height * 2) / 3;
          const pointerY = active.rect.current.translated?.top || rect.top;

          if (pointerY < topThird) {
            setDropIndicator({ id: overId, position: "above" });
          } else if (pointerY > bottomThird) {
            setDropIndicator({ id: overId, position: "below" });
          } else {
            setDropIndicator({ id: overId, position: "inside" });
          }
        } else {
          setDropIndicator({ id: overId, position: "inside" });
        }
      } else if (!isOverFolder && isActiveDocument) {
        // 문서를 문서에 드롭하는 경우 (같은 폴더 내에서 순서 변경)
        const activeDoc = activeItem as DocumentData;
        const overDoc = overItem as DocumentData;

        // 문서를 문서에 드롭 - 마우스 위치에 따라 above/below 결정
        const rect = over.rect;
        if (rect) {
          const midpoint = rect.top + rect.height / 2;
          // 드래그되는 아이템의 현재 위치를 더 정확하게 계산
          const activeRect = active.rect.current.translated;
          const pointerY = activeRect
            ? activeRect.top + activeRect.height / 2
            : rect.top;

          if (pointerY < midpoint) {
            setDropIndicator({ id: overId, position: "above" });
          } else {
            setDropIndicator({ id: overId, position: "below" });
          }
        } else {
          setDropIndicator({ id: overId, position: "above" });
        }
      } else if (!isOverFolder && isActiveFolder) {
        // 폴더를 문서에 드롭하는 경우 (이동 금지)
        setDropIndicator(null);
      } else if (isOverFolder && isActiveFolder) {
        // 폴더를 폴더에 드롭하는 경우 - 자기 자신 체크
        if (activeId === overId) {
          setDropIndicator(null);
          return;
        }

        // 마우스 위치에 따라 - 3분할로 나누어 above, inside, below 구분
        const rect = over.rect;
        if (rect) {
          const topThird = rect.top + rect.height / 3;
          const bottomThird = rect.top + (rect.height * 2) / 3;
          const pointerY = active.rect.current.translated?.top || rect.top;

          if (pointerY < topThird) {
            setDropIndicator({ id: overId, position: "above" });
          } else if (pointerY > bottomThird) {
            setDropIndicator({ id: overId, position: "below" });
          } else {
            setDropIndicator({ id: overId, position: "inside" });
          }
        } else {
          setDropIndicator({ id: overId, position: "inside" });
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);
    setActiveItem(null);
    setActiveItemLevel(0);
    setDropIndicator(null);

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeItem = [...documents, ...folders].find(
      (item) => item.id === activeId
    );
    let overItem = [...documents, ...folders].find(
      (item) => item.id === overId
    );

    if (!activeItem || !overItem) return;

    const isOverFolder = !("content" in overItem);

    // 폴더 안으로 이동
    if (dropIndicator?.position === "inside") {
      if ("content" in activeItem) {
        // 문서를 폴더로
        const updatedDocuments = documents.map((d) =>
          d.id === activeId ? { ...d, folderId: overId } : d
        );
        setDocuments(updatedDocuments);
        saveOrderToDatabase(updatedDocuments, folders);

        // 대상 폴더 확장
        setFolders((prev) =>
          prev.map((f) => (f.id === overId ? { ...f, expanded: true } : f))
        );
      } else {
        // 폴더를 폴더로
        const activeFolder = activeItem as FolderData;
        const updatedFolders = folders.map((f) => {
          if (f.id === activeId) {
            return { ...f, parentId: overId, expanded: activeFolder.expanded };
          } else if (f.id === overId) {
            return { ...f, expanded: true };
          }
          return f;
        });
        setFolders(updatedFolders);
        saveOrderToDatabase(documents, updatedFolders);
      }
    }
    // 같은 레벨에서 순서 변경 또는 폴더 위/아래에 위치
    else if (
      dropIndicator?.position === "above" ||
      dropIndicator?.position === "below"
    ) {
      const isActiveFolder = !("content" in activeItem);
      const isOverFolder = !("content" in overItem);

      if (isActiveFolder && isOverFolder) {
        // 폴더를 폴더에 드롭
        const activeFolder = activeItem as FolderData;
        const overFolder = overItem as FolderData;

        if (dropIndicator?.position === "above") {
          // 폴더 위에 드롭 (같은 레벨로 이동)
          if (activeFolder.parentId === overFolder.parentId) {
            // 같은 레벨에서 순서 변경
            const siblings = folders
              .filter((f) => f.parentId === activeFolder.parentId)
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            const oldIndex = siblings.findIndex((f) => f.id === activeId);
            let newIndex = siblings.findIndex((f) => f.id === overId);

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              const reorderedSiblings = arrayMove(siblings, oldIndex, newIndex);
              const updatedFolders = folders.map((f) => {
                const siblingIndex = reorderedSiblings.findIndex(
                  (s) => s.id === f.id
                );
                if (siblingIndex !== -1) {
                  return {
                    ...f,
                    order: siblingIndex,
                    expanded:
                      f.id === activeId ? activeFolder.expanded : f.expanded,
                  };
                }
                return f;
              });

              setFolders(updatedFolders);
              saveOrderToDatabase(documents, updatedFolders);
            }
          } else {
            // 다른 레벨로 이동 (하위 폴더를 상위로 또는 다른 상위로)
            const targetParentId = overFolder.parentId;
            const targetSiblings = folders
              .filter((f) => f.parentId === targetParentId)
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            const overFolderIndex = targetSiblings.findIndex(
              (f) => f.id === overId
            );

            // above 포지션이므로 overFolder 위치에 삽입
            const insertIndex = overFolderIndex;

            // 기존 siblings의 order를 재조정
            const updatedFolders = folders.map((f) => {
              if (f.id === activeId) {
                return {
                  ...f,
                  parentId: targetParentId,
                  order: insertIndex,
                  expanded: activeFolder.expanded,
                };
              } else if (f.parentId === targetParentId) {
                const currentIndex = targetSiblings.findIndex(
                  (s) => s.id === f.id
                );
                if (currentIndex >= insertIndex) {
                  return { ...f, order: currentIndex + 1 };
                }
              }
              return f;
            });

            setFolders(updatedFolders);
            saveOrderToDatabase(documents, updatedFolders);
          }
        } else if (dropIndicator?.position === "below") {
          // 폴더 아래에 드롭 - 해당 폴더의 하위 폴더로 추가
          const folderChildren = folders.filter((f) => f.parentId === overId);
          const maxOrder =
            folderChildren.length > 0
              ? Math.max(...folderChildren.map((f) => f.order || 0))
              : -1;

          const updatedFolders = folders.map((f) => {
            if (f.id === activeId) {
              return {
                ...f,
                parentId: overId,
                order: maxOrder + 1,
                expanded: activeFolder.expanded,
              };
            } else if (f.id === overId) {
              return { ...f, expanded: true };
            }
            return f;
          });
          setFolders(updatedFolders);
          saveOrderToDatabase(documents, updatedFolders);
        }
      } else if (!isActiveFolder && isOverFolder && dropIndicator?.position) {
        // 문서를 폴더에 드롭
        const activeDoc = activeItem as DocumentData;
        const overFolder = overItem as FolderData;

        if (dropIndicator?.position === "above") {
          // 폴더 위에 드롭 - 폴더와 같은 레벨로 이동
          const updatedDocuments = documents.map((d) =>
            d.id === activeId ? { ...d, folderId: overFolder.parentId } : d
          );
          setDocuments(updatedDocuments);
          saveOrderToDatabase(updatedDocuments, folders);
        } else if (dropIndicator?.position === "below") {
          // 폴더 아래에 드롭 - 폴더 안의 마지막에 추가
          const folderChildren = documents.filter((d) => d.folderId === overId);
          const maxOrder =
            folderChildren.length > 0
              ? Math.max(...folderChildren.map((d) => d.order || 0))
              : -1;

          const updatedDocuments = documents.map((d) =>
            d.id === activeId
              ? { ...d, folderId: overId, order: maxOrder + 1 }
              : d
          );
          setDocuments(updatedDocuments);
          saveOrderToDatabase(updatedDocuments, folders);

          // 대상 폴더 확장
          setFolders((prev) =>
            prev.map((f) => (f.id === overId ? { ...f, expanded: true } : f))
          );
        } else {
          // 폴더 안으로 드롭 (inside)
          const updatedDocuments = documents.map((d) =>
            d.id === activeId ? { ...d, folderId: overId } : d
          );
          setDocuments(updatedDocuments);
          saveOrderToDatabase(updatedDocuments, folders);

          // 대상 폴더 확장
          setFolders((prev) =>
            prev.map((f) => (f.id === overId ? { ...f, expanded: true } : f))
          );
        }
      } else if (!isActiveFolder && !isOverFolder) {
        // 문서를 문서 위/아래에 드롭 (같은 폴더 내에서 순서 변경)
        // 문서를 문서 위치에 드롭
        const activeDoc = activeItem as DocumentData;
        const overDoc = overItem as DocumentData;

        if (activeDoc.folderId === overDoc.folderId) {
          // 같은 폴더 내에서 순서 변경
          const siblings = documents
            .filter((d) => d.folderId === activeDoc.folderId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          const oldIndex = siblings.findIndex((d) => d.id === activeId);
          let newIndex = siblings.findIndex((d) => d.id === overId);

          // below 위치인 경우 인덱스를 +1 해줌
          if (dropIndicator?.position === "below") {
            newIndex += 1;
          }

          // 인덱스 바운드 처리
          if (newIndex > siblings.length) {
            newIndex = siblings.length;
          }

          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const reorderedSiblings = arrayMove(siblings, oldIndex, newIndex);

            // 간단하게 order 재설정
            const updatedDocuments = documents.map((d) => {
              const siblingIndex = reorderedSiblings.findIndex(
                (s) => s.id === d.id
              );
              if (siblingIndex !== -1) {
                return { ...d, order: siblingIndex };
              }
              return d;
            });

            setDocuments(updatedDocuments);
            saveOrderToDatabase(updatedDocuments, folders);
          }
        } else {
          // 다른 폴더에서 온 문서를 해당 폴더로 이동
          const targetFolderId = overDoc.folderId;
          const siblings = documents
            .filter((d) => d.folderId === targetFolderId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          const targetIndex = siblings.findIndex((d) => d.id === overId);
          let insertIndex = targetIndex;

          // below 위치인 경우 인덱스를 +1 해줌
          if (dropIndicator?.position === "below") {
            insertIndex += 1;
          }

          // 새 siblings 배열 생성 (이동하는 문서 삽입)
          const newSiblings = [...siblings];
          newSiblings.splice(insertIndex, 0, {
            ...activeDoc,
            folderId: targetFolderId,
          });

          // 전체 문서 배열 업데이트
          const updatedDocuments = documents.map((d) => {
            if (d.id === activeId) {
              // 이동하는 문서
              return { ...d, folderId: targetFolderId, order: insertIndex };
            } else if (d.folderId === targetFolderId) {
              // 대상 폴더의 기존 문서들
              const newIndex = newSiblings.findIndex((s) => s.id === d.id);
              return { ...d, order: newIndex };
            }
            return d;
          });

          setDocuments(updatedDocuments);
          saveOrderToDatabase(updatedDocuments, folders);

          // 대상 폴더 확장
          if (targetFolderId) {
            setFolders((prev) =>
              prev.map((f) =>
                f.id === targetFolderId ? { ...f, expanded: true } : f
              )
            );
          }
        }
      }
    }
  };


  // Sortable 트리 아이템
  const SortableTreeItem = ({
    item,
    level = 0,
  }: {
    item: FolderData | DocumentData;
    level?: number;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: item.id,
      data: {
        type: "content" in item ? "document" : "folder",
        item,
      },
      disabled: false,
    });

    // 드래그 중에는 원래 위치에 호버 상태로 남겨두기
    const style = {
      transition,
      zIndex: isDragging ? 1000 : "auto",
      opacity: isDragging ? 0.7 : 1,
    } as React.CSSProperties;

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={isDragging ? "z-50" : ""}
      >
        <TreeItem
          item={item}
          level={level}
          isDragging={isDragging}
          globalDragging={!!activeId}
        />
      </div>
    );
  };

  // 트리 아이템 렌더링
  const TreeItem = ({
    item,
    level = 0,
    isDragging = false,
    globalDragging = false,
    dragOverlay = false,
  }: {
    item: FolderData | DocumentData;
    level?: number;
    isDragging?: boolean;
    globalDragging?: boolean;
    dragOverlay?: boolean;
  }) => {
    const isFolder = !("content" in item);
    const paddingLeft = level * 20;

    // 폴더의 모든 하위 문서 개수를 재귀적으로 계산
    const getTotalDocumentCount = (folderId: string): number => {
      const directDocuments = documents.filter(
        (d) => d.folderId === folderId
      ).length;
      const subFolders = folders.filter((f) => f.parentId === folderId);
      const subDocuments = subFolders.reduce(
        (count, subFolder) => count + getTotalDocumentCount(subFolder.id),
        0
      );
      return directDocuments + subDocuments;
    };

    if (isFolder) {
      const folder = item as FolderData;
      const childFolders = folders
        .filter((f) => f.parentId === folder.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      const childDocuments = documents
        .filter((d) => d.folderId === folder.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      return (
        <div>
          <div className="px-4">
            <div
              className={`flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-100 hover:rounded-xl cursor-grab group relative transition-all duration-150 ${
                dragOverlay
                  ? "bg-blue-100 rounded-xl !bg-blue-100"
                  : isDragging
                    ? "bg-gray-100 rounded-xl"
                    : selectedFolderId === folder.id
                      ? "bg-blue-50 rounded-xl"
                      : ""
              }`}
              style={{ paddingLeft: paddingLeft + 12 }}
              onClick={() => {
                setSelectedFolderId(folder.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEditingName(folder);
              }}
            >
              {/* Drop indicators - 폴더용 */}
              {dropIndicator?.id === folder.id &&
                dropIndicator.position === "above" && (
                  <div
                    className="absolute -top-0.5 h-1 bg-blue-500 rounded-full z-20 flex items-center"
                    style={{
                      left: paddingLeft + "px",
                      right: "12px",
                    }}
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full -ml-1 mr-1 flex-shrink-0" />
                  </div>
                )}
              {dropIndicator?.id === folder.id &&
                dropIndicator.position === "below" && (
                  <div
                    className="absolute -bottom-0.5 h-1 bg-blue-500 rounded-full z-20 flex items-center"
                    style={{
                      left: paddingLeft + "px",
                      right: "12px",
                    }}
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full -ml-1 mr-1 flex-shrink-0" />
                  </div>
                )}
              {dropIndicator?.id === folder.id &&
                dropIndicator.position === "inside" && (
                  <div
                    className="absolute -bottom-0.5 h-1 bg-blue-500 rounded-full z-20 flex items-center"
                    style={{
                      left: paddingLeft + 32 + "px",
                      right: "12px",
                    }}
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full -ml-1 mr-1 flex-shrink-0" />
                  </div>
                )}

              <div className="flex items-center gap-2 flex-1">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(folder.id);
                  }}
                  className="cursor-pointer p-1 hover:bg-gray-200 rounded"
                >
                  {folder.expanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                {folder.expanded ? (
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                ) : (
                  <Folder className="h-4 w-4 text-blue-600" />
                )}
                {editingItem === folder.id ? (
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={finishEditingName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        finishEditingName();
                      } else if (e.key === "Escape") {
                        cancelEditingName();
                      }
                    }}
                    className="text-sm font-medium text-gray-700 bg-white border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {folder.name}
                    </span>
                    {/* 하위 항목 개수 뱃지 - 드래그 중이거나 접혀있을 때만 표시 */}
                    {(isDragging || !folder.expanded) &&
                      (childFolders.length > 0 ||
                        childDocuments.length > 0) && (
                        <span
                          className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${
                            isDragging
                              ? "bg-blue-500 text-white shadow-md"
                              : "bg-gray-200 text-gray-600"
                          }`}
                          style={
                            isDragging
                              ? ({
                                  opacity: "1 !important",
                                } as React.CSSProperties)
                              : {}
                          }
                        >
                          {!folder.parentId
                            ? getTotalDocumentCount(folder.id)
                            : childFolders.length + childDocuments.length}
                        </span>
                      )}
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateDialog({
                        open: true,
                        type: "document",
                        parentFolderId: folder.id,
                      });
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    하위 문서 추가
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateDialog({
                        open: true,
                        type: "folder",
                        parentFolderId: folder.id,
                      });
                    }}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    하위 폴더 추가
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialog({
                        open: true,
                        type: "folder",
                        id: folder.id,
                        name: folder.name,
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditingName(folder);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    이름 바꾸기
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {folder.expanded &&
            !(isDragging || (globalDragging && activeId === folder.id)) && (
              <div>
                {childFolders.map((childFolder) => (
                  <SortableTreeItem
                    key={childFolder.id}
                    item={childFolder}
                    level={level + 1}
                  />
                ))}
                {childDocuments.map((doc) => (
                  <SortableTreeItem key={doc.id} item={doc} level={level + 1} />
                ))}
              </div>
            )}
        </div>
      );
    } else {
      const document = item as DocumentData;
      return (
        <div className="px-4">
          <div
            className={`flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-100 hover:rounded-xl cursor-grab group relative transition-all duration-150 ${
              dragOverlay
                ? "bg-blue-100 rounded-xl !bg-blue-100"
                : isDragging
                  ? "bg-gray-100 rounded-xl"
                  : selectedDocument?.id === document.id
                    ? "bg-blue-50 rounded-xl"
                    : ""
            }`}
            style={{ paddingLeft: paddingLeft + 32 }}
            onClick={() => {
              setSelectedDocument(document);
              setSelectedFolderId(null); // 문서 선택 시 폴더 선택 해제
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              startEditingName(document);
            }}
          >
            {/* Drop indicators - 문서용 */}
            {dropIndicator?.id === document.id &&
              dropIndicator.position === "above" && (
                <div
                  className="absolute -top-0.5 h-1 bg-blue-500 rounded-full z-20 flex items-center"
                  style={{
                    left: paddingLeft + 12 + "px",
                    right: "12px",
                  }}
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full -ml-1 mr-1 flex-shrink-0" />
                </div>
              )}
            {dropIndicator?.id === document.id &&
              dropIndicator.position === "below" && (
                <div
                  className="absolute -bottom-0.5 h-1 bg-blue-500 rounded-full z-20 flex items-center"
                  style={{
                    left: paddingLeft + 12 + "px",
                    right: "12px",
                  }}
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full -ml-1 mr-1 flex-shrink-0" />
                </div>
              )}

            <div className="flex items-center gap-2 flex-1">
              <FileText className="h-4 w-4 text-gray-600" />
              {editingItem === document.id ? (
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={finishEditingName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      finishEditingName();
                    } else if (e.key === "Escape") {
                      cancelEditingName();
                    }
                  }}
                  className="text-sm text-gray-700 bg-white border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-sm text-gray-700 truncate">
                  {document.name}
                </span>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialog({
                      open: true,
                      type: "document",
                      id: document.id,
                      name: document.name,
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditingName(document);
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  이름 바꾸기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-180px)] flex bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
      {/* 왼쪽 사이드바 - 문서 목록 */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-80"} bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ease-in-out`}
      >
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div
              className={`flex items-center ${sidebarCollapsed ? "-ml-3" : ""}`}
            >
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8 p-0 flex-shrink-0"
                title={
                  sidebarCollapsed
                    ? `사이드바 펼치기 (문서 ${documents.length}개)`
                    : "사이드바 접기"
                }
              >
                {sidebarCollapsed ? (
                  <Menu className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
              {sidebarCollapsed && (
                <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-tight -ml-1">
                  {documents.length}
                </span>
              )}
            </div>
            {!sidebarCollapsed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    title="추가"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      setCreateDialog({ open: true, type: "document" })
                    }
                  >
                    <FileText className="h-4 w-4 mr-2" />새 문서
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setCreateDialog({ open: true, type: "folder" })
                    }
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />새 폴더
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* 문서 및 폴더 목록 */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {folders.length === 0 && documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  문서가 없습니다
                </h3>
                <p className="text-gray-500 mb-4">
                  첫 번째 문서를 만들어보세요
                </p>
                <Button
                  onClick={() =>
                    setCreateDialog({ open: true, type: "document" })
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />새 문서 만들기
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                measuring={measuring}
                modifiers={modifiers}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={[...folders, ...documents].map((item) => item.id)}
                >
                  <div className="py-2">
                    {folders
                      .filter((f) => !f.parentId)
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((folder) => (
                        <SortableTreeItem
                          key={folder.id}
                          item={folder}
                          level={0}
                        />
                      ))}

                    {documents
                      .filter((d) => !d.folderId)
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((doc) => (
                        <SortableTreeItem key={doc.id} item={doc} level={0} />
                      ))}
                  </div>
                </SortableContext>

                {createPortal(
                  <DragOverlay>
                    {activeItem && (
                      <div className="opacity-90 dnd-kit-drag-overlay">
                        <TreeItem
                          item={activeItem}
                          level={activeItemLevel}
                          isDragging={true}
                          globalDragging={true}
                          dragOverlay={true}
                        />
                      </div>
                    )}
                  </DragOverlay>,
                  document.body
                )}
              </DndContext>
            )}
          </div>
        )}
      </div>

      {/* 삭제 다이얼로그 */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open &&
          setDeleteDialog({ open: false, type: "document", id: "", name: "" })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialog.type === "folder" ? "폴더 삭제" : "문서 삭제"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              정말로 "{deleteDialog.name}"{" "}
              {deleteDialog.type === "folder" ? "폴더" : "문서"}를
              삭제하시겠습니까?
              {deleteDialog.type === "folder" && (
                <>
                  <br />
                  폴더 안의 모든 문서와 하위 폴더도 함께 삭제됩니다.
                </>
              )}
              {deleteDialog.type === "document" && (
                <>
                  <br />이 작업은 되돌릴 수 없습니다.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog.type === "folder") {
                  deleteFolder(deleteDialog.id);
                } else {
                  deleteDocument(deleteDialog.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 오른쪽 에디터 영역 */}
      <div className="flex-1 flex flex-col h-full">
        {selectedDocument ? (
          <>
            {/* 에디터 헤더 */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedDocument.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    마지막 수정:{" "}
                    {new Date(selectedDocument.updatedAt).toLocaleDateString(
                      "ko-KR"
                    )}
                  </p>
                </div>
                <Button
                  onClick={saveDocument}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  저장
                </Button>
              </div>

              {/* 개선된 에디터 도구모음 */}
              {editor && <SimpleEditorToolbar editor={editor} />}
            </div>

            {/* 에디터 영역 */}
            <div className="flex-1 bg-white overflow-y-auto">
              <div className="max-w-4xl mx-auto p-8 min-h-full">
                {/* BubbleMenu removed for TipTap v3 compatibility */}
                {/* {editor && (
                  <BubbleMenu
                    editor={editor}
                    className="bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex items-center gap-1"
                    tippyOptions={{ duration: 100 }}
                  >
                    <Button
                      size="sm"
                      variant={editor.isActive("bold") ? "default" : "ghost"}
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className="h-8 w-8 p-0"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={editor.isActive("italic") ? "default" : "ghost"}
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className="h-8 w-8 p-0"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={editor.isActive("underline") ? "default" : "ghost"}
                      onClick={() => editor.chain().focus().toggleUnderline().run()}
                      className="h-8 w-8 p-0"
                    >
                      <UnderlineIcon className="h-4 w-4" />
                    </Button>
                  </BubbleMenu>
                )} */}
                {editor ? (
                  <EditorContent
                    editor={editor}
                    className="prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-350px)]"
                  />
                ) : (
                  <div className="min-h-[calc(100vh-350px)] flex items-center justify-center text-gray-500">
                    에디터를 로딩 중입니다...
                  </div>
                )}
                <style jsx global>{`
                  .ProseMirror {
                    outline: none !important;
                    min-height: calc(100vh - 350px);
                    padding: 16px;
                    white-space: pre-wrap;
                  }

                  .ProseMirror ul, .ProseMirror ol {
                    padding-left: 1rem;
                    margin: 1rem 0;
                  }

                  .ProseMirror ul li {
                    list-style-type: disc;
                    margin-bottom: 0.5rem;
                    margin-left: 1rem;
                    cursor: text;
                    min-height: 1.2em;
                  }

                  .ProseMirror ul:not([data-type="taskList"]) li {
                    cursor: text;
                    position: relative;
                  }

                  .ProseMirror ul:not([data-type="taskList"]) li::marker {
                    color: currentColor;
                  }

                  .ProseMirror ol li {
                    list-style-type: decimal;
                    margin-bottom: 0.5rem;
                    margin-left: 1rem;
                    cursor: text;
                    min-height: 1.2em;
                  }

                  .ProseMirror ul[data-type="taskList"] {
                    list-style: none;
                    padding-left: 0;
                    margin: 1rem 0;
                  }

                  .ProseMirror ul[data-type="taskList"] li {
                    display: flex;
                    align-items: center;
                    margin-bottom: 0.25rem;
                    margin-left: 0;
                    list-style: none;
                  }

                  .ProseMirror ul[data-type="taskList"] li input[type="checkbox"] {
                    margin-right: 0.25rem;
                    cursor: pointer;
                    width: 16px;
                    height: 16px;
                  }

                  .ProseMirror ul[data-type="taskList"] li > label {
                    flex: 0 0 auto;
                    margin-right: 0.25rem;
                    user-select: none;
                    display: flex;
                    align-items: center;
                  }

                  .ProseMirror ul[data-type="taskList"] li > div {
                    flex: 1 1 auto;
                    cursor: text;
                  }

                  .ProseMirror ul[data-type="taskList"] li > div > p {
                    margin: 0;
                    min-height: 1.2em;
                  }

                  .ProseMirror ul[data-type="taskList"] li[data-checked="true"] {
                    text-decoration: line-through;
                    color: #6b7280;
                  }

                  .ProseMirror blockquote {
                    border-left: 4px solid #e5e7eb;
                    padding-left: 1rem;
                    margin: 1rem 0;
                    font-style: italic;
                    color: #6b7280;
                  }

                  .ProseMirror code {
                    background-color: #f3f4f6;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
                  }

                  .ProseMirror pre {
                    background-color: #f3f4f6;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    margin: 1rem 0;
                  }

                  .ProseMirror pre code {
                    background: none;
                    padding: 0;
                    border-radius: 0;
                  }

                  .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6 {
                    font-weight: bold;
                    margin: 1rem 0 0.5rem 0;
                  }

                  .ProseMirror h1 { font-size: 2rem; }
                  .ProseMirror h2 { font-size: 1.5rem; }
                  .ProseMirror h3 { font-size: 1.25rem; }

                  .ProseMirror p {
                    margin: 0.5rem 0;
                  }

                  .ProseMirror strong {
                    font-weight: bold;
                  }

                  .ProseMirror em {
                    font-style: italic;
                  }

                  .ProseMirror u {
                    text-decoration: underline;
                  }

                  .ProseMirror s {
                    text-decoration: line-through;
                  }

                  .ProseMirror mark {
                    background-color: yellow;
                    padding: 0.125rem 0;
                  }

                  .ProseMirror a {
                    color: #3b82f6;
                    text-decoration: underline;
                  }

                  .ProseMirror img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.5rem;
                    margin: 1rem 0;
                  }

                  .ProseMirror table {
                    /* border-radius: 6px !important; */
                    overflow: hidden !important;
                    margin: 16px 0 !important;
                    width: auto !important;
                    table-layout: fixed !important;
                  }

                  .ProseMirror th,
                  .ProseMirror td {
                    border: 1px solid #d1d5db !important;
                    padding: 8px 12px !important;
                    min-width: 100px !important;
                    position: relative !important;
                    vertical-align: top !important;
                  }

                  .ProseMirror th {
                    background-color: #f9fafb !important;
                    font-weight: 600 !important;
                    text-align: left !important;
                  }

                  .ProseMirror td {
                    background-color: white !important;
                  }

                  .ProseMirror .selectedCell {
                    background-color: #dbeafe !important;
                  }

                  .ProseMirror .column-resize-handle {
                    background-color: #3b82f6 !important;
                    width: 4px !important;
                    position: absolute !important;
                    right: -2px !important;
                    top: 0 !important;
                    bottom: 0 !important;
                    cursor: col-resize !important;
                  }

                  /* 커서 관련 스타일 수정 */
                  .ProseMirror .ProseMirror-gapcursor {
                    position: relative !important;
                    pointer-events: none !important;
                  }

                  .ProseMirror .ProseMirror-gapcursor:after {
                    content: "" !important;
                    display: block !important;
                    position: absolute !important;
                    top: -2px !important;
                    width: 20px !important;
                    border-top: 1px solid black !important;
                    animation: ProseMirror-cursor-blink 1.1s steps(2, start)
                      infinite !important;
                  }

                  @keyframes ProseMirror-cursor-blink {
                    to {
                      visibility: hidden;
                    }
                  }

                  /* 기본 텍스트 커서는 세로로 유지 */
                  .ProseMirror {
                    caret-color: black !important;
                  }

                  /* 표 밖에서 표 근처의 gapcursor는 가로선으로 */
                  .ProseMirror .ProseMirror-gapcursor:after {
                    border-left: none !important;
                    border-top: 1px solid black !important;
                    height: 0 !important;
                    width: 20px !important;
                  }

                  /* 드래그 오버레이에서 뱃지만 불투명하게 */
                  .dnd-kit-drag-overlay .opacity-100 {
                    opacity: 1 !important;
                  }

                  /* Placeholder 스타일 */
                  .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder) !important;
                    float: left !important;
                    color: #9ca3af !important;
                    pointer-events: none !important;
                    height: 0 !important;
                  }

                  .ProseMirror.is-editor-empty::before {
                    content: attr(data-placeholder) !important;
                    color: #9ca3af !important;
                    pointer-events: none !important;
                    position: absolute !important;
                  }
                `}</style>
              </div>
            </div>
          </>
        ) : (
          /* 문서 선택 안내 */
          <div className="flex-1 flex items-center justify-center bg-white h-full">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                문서를 선택하세요
              </h3>
              <p className="text-gray-500 mb-6">
                왼쪽에서 문서를 선택하거나 새 문서를 만들어보세요
              </p>
              <Button
                onClick={() =>
                  setCreateDialog({ open: true, type: "document" })
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />새 문서 만들기
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 생성 Dialog */}
      <Dialog
        open={createDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialog({ open: false, type: "document" });
            setNewDocumentName("");
            setNewFolderName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {createDialog.type === "document"
                ? "새 문서 만들기"
                : "새 폴더 만들기"}
            </DialogTitle>
            <DialogDescription>
              {createDialog.type === "document"
                ? "새로운 문서의 이름을 입력하세요."
                : "새로운 폴더의 이름을 입력하세요."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={
                createDialog.type === "document" ? "문서 이름" : "폴더 이름"
              }
              value={
                createDialog.type === "document"
                  ? newDocumentName
                  : newFolderName
              }
              onChange={(e) => {
                if (createDialog.type === "document") {
                  setNewDocumentName(e.target.value);
                } else {
                  setNewFolderName(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (createDialog.type === "document") {
                    createNewDocument();
                  } else {
                    createNewFolder();
                  }
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialog({ open: false, type: "document" });
                setNewDocumentName("");
                setNewFolderName("");
              }}
            >
              취소
            </Button>
            <Button
              onClick={
                createDialog.type === "document"
                  ? createNewDocument
                  : createNewFolder
              }
              disabled={
                createDialog.type === "document"
                  ? !newDocumentName.trim()
                  : !newFolderName.trim()
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
