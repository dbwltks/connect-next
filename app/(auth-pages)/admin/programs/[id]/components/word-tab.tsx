"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Editor } from "./editor";

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
  Menu,
  ChevronLeft,
  MoreVertical,
  Edit3,
  MoreHorizontal,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface WordTabProps {
  programId: string;
  onNavigateToTab: (tab: string) => void;
  hasEditPermission?: boolean;
}

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

export default function WordTab({
  programId,
  onNavigateToTab,
  hasEditPermission = true,
}: WordTabProps) {
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
  const [isComposing, setIsComposing] = useState(false);

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

  // 프로그램 데이터 로드
  useEffect(() => {
    loadDocuments();
  }, [programId]);

  // 에디터 내용 업데이트 핸들러
  const handleEditorUpdate = React.useCallback((content: string) => {
    if (selectedDocument && selectedDocument.content !== content) {
      const updatedDocument = {
        ...selectedDocument,
        content,
        updatedAt: new Date().toISOString(),
      };
      setSelectedDocument(updatedDocument);
    }
  }, [selectedDocument]);

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
    if (!selectedDocument) return;

    try {
      const updatedDocument = {
        ...selectedDocument,
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
  const finishEditingName = async (newName?: string) => {
    const nameToUse = newName || editingName;
    console.log("finishEditingName called with:", {
      editingItem,
      nameToUse,
      editingName,
    });

    if (!editingItem || !nameToUse.trim()) {
      setEditingItem(null);
      setEditingName("");
      return;
    }

    try {
      const isFolder = folders.some((f) => f.id === editingItem);

      if (isFolder) {
        const updatedFolders = folders.map((f) =>
          f.id === editingItem ? { ...f, name: nameToUse.trim() } : f
        );
        setFolders(updatedFolders);
        await saveOrderToDatabase(documents, updatedFolders);
      } else {
        const updatedDocuments = documents.map((d) =>
          d.id === editingItem
            ? {
                ...d,
                name: nameToUse.trim(),
                updatedAt: new Date().toISOString(),
              }
            : d
        );
        setDocuments(updatedDocuments);

        // 현재 선택된 문서가 이름이 변경된 문서라면 업데이트
        if (selectedDocument && selectedDocument.id === editingItem) {
          setSelectedDocument(
            updatedDocuments.find((d) => d.id === editingItem) || null
          );
        }

        await saveOrderToDatabase(updatedDocuments, folders);
      }
    } catch (error) {
      console.error("Error renaming item:", error);
      alert("이름 변경에 실패했습니다.");
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
    globalDragging = false,
  }: {
    item: FolderData | DocumentData;
    level?: number;
    globalDragging?: boolean;
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
        style={{
          ...style,
          pointerEvents: globalDragging && !isDragging ? "none" : "auto",
        }}
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
        <div className="relative">
          {/* 드래그 중일 때 폴더 전체를 덮는 투명한 오버레이 */}
          {globalDragging && folder.expanded && (
            <div
              className="absolute inset-0 z-20"
              style={{ pointerEvents: "auto" }}
            />
          )}

          <div className="px-2">
            <div
              className={`flex items-center justify-between gap-2 px-2 py-2 hover:bg-gray-100 hover:rounded-xl cursor-grab group relative transition-all duration-150 ${
                dragOverlay
                  ? "bg-blue-100 rounded-xl !bg-blue-100"
                  : isDragging
                    ? "bg-gray-100 rounded-xl"
                    : selectedFolderId === folder.id
                      ? "bg-blue-50 rounded-xl"
                      : ""
              }`}
              style={{
                paddingLeft: paddingLeft,
                zIndex: folder.expanded ? 10 : "auto",
              }}
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
                      right: "0px",
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
                      right: "0px",
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
                      left: paddingLeft + 20 + "px",
                      right: "0px",
                    }}
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full -ml-1 mr-1 flex-shrink-0" />
                  </div>
                )}

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(folder.id);
                  }}
                  className="cursor-pointer p-1 hover:bg-gray-200 rounded"
                >
                  {folder.expanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>
                {folder.expanded ? (
                  <FolderOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
                ) : (
                  <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
                )}
                {editingItem === folder.id ? (
                  <input
                    defaultValue={editingName}
                    onBlur={(e) => {
                      console.log("onBlur triggered:", e.target.value);
                      const newValue = e.target.value;
                      setTimeout(() => {
                        setEditingName(newValue);
                        finishEditingName(newValue);
                      }, 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur(); // 포커스를 잃어서 onBlur 트리거
                      } else if (e.key === "Escape") {
                        cancelEditingName();
                      }
                    }}
                    className="text-sm font-medium text-gray-700 bg-white border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    lang="ko"
                    inputMode="text"
                  />
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-gray-700 truncate min-w-0">
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

              {hasEditPermission && (
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
              )}
            </div>
          </div>

          {folder.expanded &&
            !(isDragging || (globalDragging && activeId === folder.id)) && (
              <div
                className="relative"
                style={{
                  pointerEvents: globalDragging ? "none" : "auto",
                }}
              >
                {childFolders.map((childFolder) => (
                  <SortableTreeItem
                    key={childFolder.id}
                    item={childFolder}
                    level={level + 1}
                    globalDragging={!!activeId}
                  />
                ))}
                {childDocuments.map((doc) => (
                  <SortableTreeItem
                    key={doc.id}
                    item={doc}
                    level={level + 1}
                    globalDragging={!!activeId}
                  />
                ))}
              </div>
            )}

          {/* 펼쳐진 폴더 전체에 대한 inside 인디케이터 */}
          {folder.expanded &&
            dropIndicator?.id === folder.id &&
            dropIndicator.position === "inside" && (
              <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-lg bg-blue-50 bg-opacity-30 z-10 pointer-events-none">
                <div className="absolute top-2 left-4 text-xs text-blue-600 font-medium">
                  폴더 안으로 이동
                </div>
              </div>
            )}
        </div>
      );
    } else {
      const document = item as DocumentData;
      return (
        <div className="px-2">
          <div
            className={`flex items-center justify-between gap-2 px-2 py-2 hover:bg-gray-100 hover:rounded-xl cursor-grab group relative transition-all duration-150 ${
              dragOverlay
                ? "bg-blue-100 rounded-xl !bg-blue-100"
                : isDragging
                  ? "bg-gray-100 rounded-xl"
                  : selectedDocument?.id === document.id
                    ? "bg-blue-50 rounded-xl"
                    : ""
            }`}
            style={{ paddingLeft: paddingLeft + 20 }}
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
                    left: paddingLeft + "px",
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
                    left: paddingLeft + "px",
                    right: "12px",
                  }}
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full -ml-1 mr-1 flex-shrink-0" />
                </div>
              )}

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="h-4 w-4 text-gray-600 flex-shrink-0" />
              {editingItem === document.id ? (
                <input
                  defaultValue={editingName}
                  onBlur={(e) => {
                    console.log("onBlur triggered:", e.target.value);
                    const newValue = e.target.value;
                    setTimeout(() => {
                      setEditingName(newValue);
                      finishEditingName(newValue);
                    }, 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur(); // 포커스를 잃어서 onBlur 트리거
                    } else if (e.key === "Escape") {
                      cancelEditingName();
                    }
                  }}
                  className="text-sm text-gray-700 bg-white border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  lang="ko"
                  inputMode="text"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-sm text-gray-700 truncate min-w-0">
                  {document.name}
                </span>
              )}
            </div>

            {hasEditPermission && (
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
            )}
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
        className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ease-in-out`}
      >
        {/* 사이드바 헤더 */}
        <div className="p-3 border-b border-gray-200">
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
            {!sidebarCollapsed && hasEditPermission && (
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
              <div className="text-center py-8 px-2">
                <FileText className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  문서가 없습니다
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  첫 번째 문서를 만들어보세요
                </p>
                {hasEditPermission && (
                  <Button
                    onClick={() =>
                      setCreateDialog({ open: true, type: "document" })
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />새 문서 만들기
                  </Button>
                )}
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
                  <div className="py-1 px-1">
                    {folders
                      .filter((f) => !f.parentId)
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((folder) => (
                        <SortableTreeItem
                          key={folder.id}
                          item={folder}
                          level={0}
                          globalDragging={!!activeId}
                        />
                      ))}

                    {documents
                      .filter((d) => !d.folderId)
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((doc) => (
                        <SortableTreeItem
                          key={doc.id}
                          item={doc}
                          level={0}
                          globalDragging={!!activeId}
                        />
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
            <div className="bg-white p-4">
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
                {hasEditPermission && (
                  <Button
                    onClick={saveDocument}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    저장
                  </Button>
                )}
              </div>
            </div>

            {/* 에디터 영역 */}
            <div className="flex-1 bg-white overflow-y-auto">
              <div className="max-w-4xl mx-auto min-h-full">
                <Editor
                  key={selectedDocument?.id}
                  content={selectedDocument?.content || ""}
                  onUpdate={handleEditorUpdate}
                  editable={hasEditPermission}
                  placeholder="새 문서를 작성해보세요."
                />
                <style jsx global>{`
                  .ProseMirror {
                    outline: none !important;
                    min-height: calc(100vh - 350px);
                    padding: 16px;
                    white-space: pre-wrap;
                  }

                  .ProseMirror ul,
                  .ProseMirror ol {
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

                  .ProseMirror
                    ul[data-type="taskList"]
                    li
                    input[type="checkbox"] {
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

                  .ProseMirror
                    ul[data-type="taskList"]
                    li[data-checked="true"] {
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
                    font-family:
                      ui-monospace, SFMono-Regular, "SF Mono", Consolas,
                      "Liberation Mono", Menlo, monospace;
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

                  .ProseMirror h1,
                  .ProseMirror h2,
                  .ProseMirror h3,
                  .ProseMirror h4,
                  .ProseMirror h5,
                  .ProseMirror h6 {
                    font-weight: bold;
                    margin: 1rem 0 0.5rem 0;
                  }

                  .ProseMirror h1 {
                    font-size: 2rem;
                  }
                  .ProseMirror h2 {
                    font-size: 1.5rem;
                  }
                  .ProseMirror h3 {
                    font-size: 1.25rem;
                  }

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
              {hasEditPermission && (
                <Button
                  onClick={() =>
                    setCreateDialog({ open: true, type: "document" })
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />새 문서 만들기
                </Button>
              )}
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
                // IME 조합 중에는 키 이벤트 무시
                if (e.nativeEvent.isComposing) {
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (createDialog.type === "document") {
                    createNewDocument();
                  } else {
                    createNewFolder();
                  }
                }
              }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              lang="ko"
              inputMode="text"
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
