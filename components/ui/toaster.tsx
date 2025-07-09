"use client";

import { useState, useEffect } from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
// import { useToast } from "@/components/ui/use-toast"

// 토스트 상태 관리를 위한 이벤트
const toastEventManager = {
  listeners: new Set<Function>(),
  toasts: [] as Array<{
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: "default" | "destructive";
    open?: boolean;
  }>,
  subscribe(listener: Function) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },
  publish() {
    this.listeners.forEach((listener) => listener(this.toasts));
  },
  addToast(toast: {
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: "default" | "destructive";
  }) {
    const id = Math.random().toString(36).substring(2);
    this.toasts = [{ id, open: true, ...toast }, ...this.toasts].slice(0, 5); // 최대 5개까지만 유지
    this.publish();
    return id;
  },
  removeToast(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.publish();
  },
  updateToast(
    id: string,
    toast: Partial<{
      title?: React.ReactNode;
      description?: React.ReactNode;
      variant?: "default" | "destructive";
      open?: boolean;
    }>
  ) {
    this.toasts = this.toasts.map((t: any) =>
      t.id === id ? { ...t, ...toast } : t
    );
    this.publish();
  },
};

// 전역에서 사용할 수 있는 toast 함수
export function toast(props: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
}) {
  return toastEventManager.addToast(props);
}

export function Toaster() {
  const [toasts, setToasts] = useState(toastEventManager.toasts);

  useEffect(() => {
    return toastEventManager.subscribe((newToasts: typeof toasts) => {
      setToasts([...newToasts]);
    });
  }, []);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, variant, ...props }) {
        return (
          <Toast
            key={id}
            {...props}
            variant={variant}
            onOpenChange={(open) => {
              if (!open) {
                toastEventManager.removeToast(id);
              }
            }}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
