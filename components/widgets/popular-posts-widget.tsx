"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/db";
import { IWidget } from "@/types";
import { Heart } from "lucide-react";
import useSWR from "swr";

interface Post {
  id: string;
  title: string;
  views: number;
  like_count: number;
  comment_count: number;
}

interface PopularPostsWidgetProps {
  widget: IWidget;
}

function usePopularPosts(widget: IWidget) {
  const itemCount = widget.display_options?.item_count || 5;
  const sortBy = widget.display_options?.sort_by || "views";
  return useSWR<Post[]>(
    ["popularPosts", itemCount, sortBy],
    async () => {
      let finalPosts: Post[] = [];
      if (sortBy === "likes") {
        const { data: likeData, error: likeError } = await supabase
          .from("board_like")
          .select("post_id");
        if (likeError) throw likeError;
        const likeCounts = (likeData || []).reduce(
          (acc: Record<string, number>, like: any) => {
            if (like.post_id) acc[like.post_id] = (acc[like.post_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
        const sortedPostIds = Object.entries(likeCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, itemCount)
          .map(([id]) => id);
        if (sortedPostIds.length > 0) {
          const { data: postData, error: postError } = await supabase
            .from("board_posts")
            .select("id, title, views")
            .in("id", sortedPostIds)
            .eq("status", "published");
          if (postError) throw postError;
          const postsWithLikes = (postData || [])
            .map((post: any) => ({
              ...post,
              like_count: likeCounts[post.id] || 0,
              comment_count: 0,
            }))
            .sort((a: Post, b: Post) => b.like_count - a.like_count);
          finalPosts = postsWithLikes;
        }
      } else if (sortBy === "comments") {
        const { data: commentData, error: commentError } = await supabase
          .from("board_comments")
          .select("post_id");
        if (commentError) throw commentError;
        const commentCounts = (commentData || []).reduce(
          (acc: Record<string, number>, comment: any) => {
            if (comment.post_id)
              acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
        const sortedPostIds = Object.entries(commentCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, itemCount)
          .map(([id]) => id);
        if (sortedPostIds.length > 0) {
          const { data: postData, error: postError } = await supabase
            .from("board_posts")
            .select("id, title, views")
            .in("id", sortedPostIds)
            .eq("status", "published");
          if (postError) throw postError;
          const postsWithComments = (postData || [])
            .map((post: any) => ({
              ...post,
              like_count: 0,
              comment_count: commentCounts[post.id] || 0,
            }))
            .sort((a: Post, b: Post) => b.comment_count - a.comment_count);
          finalPosts = postsWithComments;
        }
      } else {
        const { data: postData, error: postError } = await supabase
          .from("board_posts")
          .select("id, title, views")
          .eq("status", "published")
          .order("views", { ascending: false })
          .limit(itemCount);
        if (postError) throw postError;
        if (postData && postData.length > 0) {
          finalPosts = postData.map((post: any) => ({
            ...post,
            like_count: 0,
            comment_count: 0,
          }));
        }
      }
      return finalPosts;
    },
    { revalidateOnFocus: true }
  );
}

export default function PopularPostsWidget({
  widget,
}: PopularPostsWidgetProps) {
  const { data: posts, error, isLoading } = usePopularPosts(widget);
  const itemCount = widget.display_options?.item_count || 5;
  const sortBy = widget.display_options?.sort_by || "views";

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 py-5 border-b">
          <div className="h-6 w-3/5 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(itemCount)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-5 w-5 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        인기 게시글 로딩 오류: {error.message}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden border-gray-100 border">
      <div className="px-4 py-3 border-b">
        <h3 className="text-base text-gray-800 font-semibold">
          {widget.title || "인기 게시글"}
        </h3>
      </div>
      {posts && posts.length > 0 ? (
        <ul className="px-4 py-2 space-y-3">
          {posts.map((post, index) => {
            const rank = index + 1;
            let rankStyle = "text-gray-400 font-semibold";
            if (rank === 1)
              rankStyle =
                "font-bold px-1 py-0.5 rounded-sm bg-amber-50 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300";
            else if (rank === 2)
              rankStyle =
                "font-bold px-1 py-0.5 rounded-sm bg-amber-50 text-amber-400 dark:bg-amber-500/15 dark:text-amber-400/80";
            else if (rank === 3)
              rankStyle =
                "px-1 py-0.5 rounded-sm bg-amber-25 text-amber-300 dark:bg-amber-500/10 dark:text-amber-500/80 font-bold";

            return (
              <li key={post.id} className="flex items-center text-sm">
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 rounded-sm text-xs mr-1 ${rankStyle}`}
                >
                  {rank}
                </span>
                <Link
                  href={`/${post.id}`}
                  className="flex-1 truncate hover:underline text-xs text-gray-700"
                >
                  {post.title}
                </Link>
                {sortBy === "likes" ? (
                  <div className="flex items-center ml-2 text-xs">
                    <Heart className="w-3 h-3 mr-1 text-red-400 fill-current" />
                    <span className="text-red-400">{post.like_count || 0}</span>
                  </div>
                ) : sortBy === "comments" ? (
                  <div className="flex items-center ml-2 text-xs">
                    {/* <MessageSquare className="w-3 h-3 mr-1.5 text-gray-400" /> */}
                    <span className="mr-1">💬</span>
                    <span className="text-blue-400">
                      {post.comment_count || 0}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center ml-2 text-xs">
                    {/* <Eye className="w-3 h-3 mr-1.5 text-gray-400" /> */}
                    <span className="mr-1">👀</span>
                    <span className="text-blue-400">{post.views || 0}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="p-4 text-center text-gray-500">게시글이 없습니다.</div>
      )}
    </div>
  );
}
