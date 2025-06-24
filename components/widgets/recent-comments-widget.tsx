"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/db";
import { IWidget } from "@/types";
import useSWR from "swr";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  board_posts: any;
}

interface RecentCommentsWidgetProps {
  widget: IWidget;
}

function useRecentComments(widget: IWidget) {
  const itemCount = widget.display_options?.item_count || 5;
  return useSWR<Comment[]>(
    ["recentComments", itemCount],
    async () => {
      const { data, error } = await supabase
        .from("board_comments")
        .select(
          "id, content, created_at, post_id, board_posts!inner( title, status )"
        )
        .eq("board_posts.status", "published")
        .order("created_at", { ascending: false })
        .limit(itemCount);
      if (error) throw error;
      return (data || []) as Comment[];
    },
    { revalidateOnFocus: true }
  );
}

export default function RecentCommentsWidget({
  widget,
}: RecentCommentsWidgetProps) {
  const { data: comments, error, isLoading } = useRecentComments(widget);
  const itemCount = widget.display_options?.item_count || 5;

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded overflow-hidden">
        <div className="p-4 border-b">
          <div className="h-6 w-3/5 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(itemCount)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        최신 댓글 로딩 오류: {error.message}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h3 className="text-base font-semibold">
          {widget.title || "최신 댓글"}
        </h3>
      </div>
      {comments && comments.length > 0 ? (
        <ul className="px-4 py-2 space-y-2">
          {comments.map((comment) => (
            <li key={comment.id} className="text-sm">
              <Link href={`/${comment.post_id}`} className="hover:underline">
                <p className="truncate">{comment.content}</p>
                <span className="block truncate text-xs text-gray-500">
                  -{" "}
                  {Array.isArray(comment.board_posts)
                    ? comment.board_posts[0]?.title
                    : comment.board_posts?.title || "원본 게시글"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-4 text-center text-gray-500">댓글이 없습니다.</div>
      )}
    </div>
  );
}
