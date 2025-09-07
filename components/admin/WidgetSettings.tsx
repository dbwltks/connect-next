"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IWidget } from "@/types";
import { WidgetSettingsRenderer } from "./widget-settings";

interface WidgetSettingsProps {
  editingWidget: IWidget | null;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  setEditingWidget: (widget: IWidget | null) => void;
  onSave: (widget: IWidget) => Promise<void>;
  menuItems?: any[];
  pages?: any[];
  roles?: any[];
  programs?: any[];
}

export function WidgetSettings({
  editingWidget,
  dialogOpen,
  setDialogOpen,
  setEditingWidget,
  onSave,
  menuItems = [],
  pages = [],
  roles = [],
  programs = [],
}: WidgetSettingsProps) {

  if (!editingWidget) {
    return null;
  }

  // Wrap onSave to close dialog after saving
  const handleSave = async (widget: IWidget) => {
    await onSave(widget);
    setDialogOpen(false);
    setEditingWidget(null);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>위젯 설정 - {editingWidget.type}</DialogTitle>
        </DialogHeader>
        
        <WidgetSettingsRenderer
          widget={editingWidget}
          onSave={handleSave}
          menuItems={menuItems}
          pages={pages}
          roles={roles}
          programs={programs}
        />
      </DialogContent>
    </Dialog>
  );
}