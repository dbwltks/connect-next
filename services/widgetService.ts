import { createClient } from "@/utils/supabase/client";
import { IBoardPost } from "@/types/index";

// 위젯 단일 조회
export async function fetchWidget(widgetId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cms_layout")
    .select("*")
    .eq("id", widgetId)
    .single();
  if (error) throw error;
  return data;
}

// 위젯 여러 개 조회
export async function fetchWidgets() {
  const supabase = createClient();
  const { data: widgets, error } = await supabase
    .from("cms_layout")
    .select("*")
    .eq("type", "widget")
    .order("order");

  if (error) throw error;
  return widgets;
}

// 게시판 위젯용 게시글 조회
export async function fetchBoardWidgetPosts(
  boardId: string,
  limit: number = 5
) {
  const supabase = createClient();
  const { data: posts, error } = await supabase
    .from("board_posts")
    .select("*")
    .eq("board_id", boardId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return posts;
}

// 미디어 위젯용 게시글 조회
export async function fetchMediaWidgetPosts(pageId: string, limit: number = 5) {
  const supabase = createClient();
  const { data: posts, error } = await supabase
    .from("board_posts")
    .select("*")
    .eq("page_id", pageId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return posts;
}

// 게시판 섹션 위젯용 게시글 조회 (pageId 기반)
export async function fetchBoardSectionPosts(
  pageId: string,
  limit: number = 10
) {
  const supabase = createClient();
  const { data: posts, error } = await supabase
    .from("board_posts")
    .select("*")
    .eq("page_id", pageId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return { posts: posts || [] };
}
