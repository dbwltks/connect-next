"use client";

import React from "react";
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
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  FileCode,
  Minus,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// CustomTableCell with backgroundColor attribute
const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
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

interface EditorProps {
  content: string;
  onUpdate?: (content: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
}

interface SimpleEditorToolbarProps {
  editor: any;
}

const SimpleEditorToolbar = ({ editor }: SimpleEditorToolbarProps) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="p-2 flex flex-wrap gap-1 items-center bg-gray-50/50">
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <Button
          variant={editor.isActive("taskList") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className="h-8 w-8 p-0"
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r pr-2 mr-2">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={editor.isActive("highlight") ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {[
              "#FFD700",
              "#FF6B6B",
              "#4ECDC4",
              "#45B7D1",
              "#96CEB4",
              "#FECA57",
              "#FF9FF3",
              "#54A0FF",
            ].map((color) => (
              <DropdownMenuItem
                key={color}
                onClick={() =>
                  editor.chain().focus().toggleHighlight({ color }).run()
                }
                className="flex items-center gap-2"
              >
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: color }}
                />
                <span>{color}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => editor.chain().focus().unsetHighlight().run()}
            >
              Clear highlight
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
      </div>

      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <Button
          variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={
            editor.isActive({ textAlign: "center" }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={
            editor.isActive({ textAlign: "right" }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className="h-8 w-8 p-0"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant={
            editor.isActive({ textAlign: "justify" }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className="h-8 w-8 p-0"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <span className="text-sm">
                {editor.isActive("heading", { level: 1 })
                  ? "H1"
                  : editor.isActive("heading", { level: 2 })
                    ? "H2"
                    : editor.isActive("heading", { level: 3 })
                      ? "H3"
                      : editor.isActive("heading", { level: 4 })
                        ? "H4"
                        : "P"}
              </span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              Paragraph
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            >
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              Heading 3
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 4 }).run()
              }
            >
              Heading 4
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <List className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                editor?.chain().focus().toggleBulletList().run();
              }}
            >
              Bullet List
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor?.chain().focus().toggleOrderedList().run();
              }}
            >
              Numbered List
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor?.chain().focus().toggleTaskList().run();
              }}
            >
              Task List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <Button
          variant={editor.isActive("blockquote") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="h-8 w-8 p-0"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("codeBlock") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="h-8 w-8 p-0"
        >
          <FileCode className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={editor.isActive("link") ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <div className="p-3">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const url = (e.target as HTMLInputElement).value;
                    if (url) {
                      editor.chain().focus().setLink({ href: url }).run();
                    }
                  }
                }}
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().unsetLink().run()}
          className="h-8 w-8 p-0"
        >
          <Unlink className="h-4 w-4" />
        </Button>
      </div>

      <TableInsertButton editor={editor} />

      {editor.isActive("table") && (
        <div className="flex items-center gap-1 border-l pl-2 ml-2">
          <TableEditDropdown editor={editor} />
        </div>
      )}
    </div>
  );
};

const TableInsertButton = ({ editor }: { editor: any }) => {
  const insertTable = (rows: number, cols: number) => {
    if (editor && rows > 0 && cols > 0) {
      editor
        .chain()
        .focus()
        .insertTable({ rows, cols, withHeaderRow: true })
        .run();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          Table
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="p-3">
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 64 }, (_, i) => {
              const row = Math.floor(i / 8) + 1;
              const col = (i % 8) + 1;
              return (
                <button
                  key={i}
                  className="w-4 h-4 border border-gray-300 hover:bg-blue-100"
                  onMouseEnter={(e) => {
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      Array.from(parent.children).forEach((child, index) => {
                        const childRow = Math.floor(index / 8) + 1;
                        const childCol = (index % 8) + 1;
                        if (childRow <= row && childCol <= col) {
                          child.classList.add("bg-blue-200");
                        } else {
                          child.classList.remove("bg-blue-200");
                        }
                      });
                    }
                  }}
                  onClick={() => insertTable(row, col)}
                />
              );
            })}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TableEditDropdown = ({ editor }: { editor: any }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          Edit Table
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addRowBefore().run()}
          disabled={!editor.can().addRowBefore()}
        >
          Add row before
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.can().addRowAfter()}
        >
          Add row after
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          disabled={!editor.can().addColumnBefore()}
        >
          Add column before
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.can().addColumnAfter()}
        >
          Add column after
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!editor.can().deleteRow()}
        >
          Delete row
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().deleteColumn().run()}
          disabled={!editor.can().deleteColumn()}
        >
          Delete column
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().mergeCells().run()}
          disabled={!editor.can().mergeCells()}
        >
          Merge cells
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().splitCell().run()}
          disabled={!editor.can().splitCell()}
        >
          Split cell
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          disabled={!editor.can().toggleHeaderRow()}
        >
          Toggle header row
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
          disabled={!editor.can().toggleHeaderColumn()}
        >
          Toggle header column
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
          Highlight cell
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!editor.can().deleteTable()}
        >
          Delete table
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const Editor: React.FC<EditorProps> = ({
  content,
  onUpdate,
  editable = true,
  placeholder = "새 문서를 작성해보세요.",
  className = "",
}) => {
  const updateTimeoutRef = React.useRef<NodeJS.Timeout>();
  const isUpdatingFromProps = React.useRef(false);
  
  const debouncedUpdate = React.useCallback((content: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      if (onUpdate) {
        onUpdate(content);
      }
    }, 300);
  }, [onUpdate]);

  const editor = useEditor(
    {
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
          placeholder,
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
      content,
      editable,
      editorProps: {
        attributes: {
          class: `prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-350px)] ${className}`,
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
                    const text =
                      cell.textContent?.replace(/\s+/g, " ").trim() || "";
                    rowData.push(text);
                  });
                  if (rowData.length > 0) {
                    tableData.push(rowData);
                  }
                });

                if (tableData.length > 0 && tableData[0].length > 1) {
                  const maxCols = Math.max(
                    ...tableData.map((row) => row.length)
                  );

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
                  }, 100);

                  event.preventDefault();
                  return true;
                }
              }
            });
          }

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
        if (!isUpdatingFromProps.current) {
          debouncedUpdate(editor.getHTML());
        }
      },
    },
    []
  );
  
  React.useEffect(() => {
    if (editor && !isUpdatingFromProps.current) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== content) {
        isUpdatingFromProps.current = true;
        editor.commands.setContent(content, {
          emitUpdate: false,
        });
        setTimeout(() => {
          isUpdatingFromProps.current = false;
        }, 100);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="overflow-hidden">
      {editable && <SimpleEditorToolbar editor={editor} />}
      <div className="relative">
        <EditorContent editor={editor} />
        <style jsx global>{`
          .ProseMirror p.is-editor-empty:first-child::before {
            color: #adb5bd;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          .ProseMirror.is-editor-empty::before {
            color: #adb5bd;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
        `}</style>
      </div>
    </div>
  );
};

export { SimpleEditorToolbar, TableInsertButton, TableEditDropdown };
