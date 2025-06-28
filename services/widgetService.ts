import { supabase } from "@/db";
import { IBoardPost } from "@/types/index";

// 위젯 단일 조회
export async function fetchWidget(widgetId: string) {
  const { data, error } = await supabase
    .from("cms_layout")
    .select("*")
    .eq("id", widgetId)
    .single();

  if (error) {
    console.error("위젯 조회 실패:", error);
    throw error;
  }

  return data;
}

// 게시판 위젯용 게시글 조회
export async function fetchBoardWidgetPosts(
  boardId: string,
  limit: number = 5
) {
  const { data: posts, error } = await supabase
    .from("board_posts")
    .select("*")
    .eq("board_id", boardId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  // 클라이언트에서 published_at 우선 정렬
  const sortedPosts = [...(posts || [])].sort((a: any, b: any) => {
    // 날짜 정렬: published_at 우선, 없으면 created_at
    const aDate = new Date(a.published_at || a.created_at);
    const bDate = new Date(b.published_at || b.created_at);
    const timeDiff = bDate.getTime() - aDate.getTime();

    // 날짜가 같으면 ID로 정렬
    if (timeDiff === 0) {
      return a.id.localeCompare(b.id);
    }

    return timeDiff;
  });

  return sortedPosts;
}

// 미디어 위젯용 게시글 조회
export async function fetchMediaWidgetPosts(pageId: string, limit: number = 5) {
  const { data: posts, error } = await supabase
    .from("board_posts")
    .select("*")
    .eq("page_id", pageId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("미디어 위젯용 게시물 조회 실패:", error);
    throw error;
  }

  // 사용자 정보를 수동으로 조회
  let postsWithUsers = posts || [];
  if (posts && posts.length > 0) {
    const userIds = Array.from(
      new Set(posts.map((post: any) => post.user_id).filter(Boolean))
    );

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, display_name, email")
        .in("id", userIds);

      const userMap = new Map(users?.map((user) => [user.id, user]) || []);

      postsWithUsers = posts.map((post: any) => ({
        ...post,
        users: userMap.get(post.user_id) || null,
      }));
    }
  }

  return { posts: postsWithUsers };
}

// 게시판 섹션 위젯용 게시글 조회 (pageId 기반)
export async function fetchBoardSectionPosts(
  pageId: string,
  limit: number = 10
) {
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

// 게시물 목록 가져오기 (위젯용) - 기존 함수 이름 변경
export const fetchBoardPostsForWidget = async (
  pageId: string,
  limit: number = 5
) => {
  const { data: posts, error } = await supabase
    .from("board_posts")
    .select("*")
    .eq("page_id", pageId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("위젯용 게시물 조회 실패:", error);
    throw error;
  }

  // 사용자 정보를 수동으로 조회
  let postsWithUsers = posts || [];
  if (posts && posts.length > 0) {
    const userIds = Array.from(
      new Set(posts.map((post: any) => post.user_id).filter(Boolean))
    );

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, display_name, email")
        .in("id", userIds);

      const userMap = new Map(users?.map((user) => [user.id, user]) || []);

      postsWithUsers = posts.map((post: any) => ({
        ...post,
        users: userMap.get(post.user_id) || null,
      }));
    }
  }

  return postsWithUsers;
};

// 최근 댓글 가져오기
export const fetchRecentComments = async (limit: number = 5) => {
  const { data: comments, error } = await supabase
    .from("board_comments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("최근 댓글 조회 실패:", error);
    throw error;
  }

  // 게시물과 사용자 정보를 수동으로 조회
  let commentsWithData = comments || [];
  if (comments && comments.length > 0) {
    const postIds = Array.from(
      new Set(comments.map((comment: any) => comment.post_id).filter(Boolean))
    );
    const userIds = Array.from(
      new Set(comments.map((comment: any) => comment.user_id).filter(Boolean))
    );

    // 게시물 정보 조회
    let postsMap = new Map();
    if (postIds.length > 0) {
      const { data: posts } = await supabase
        .from("board_posts")
        .select("id, title")
        .in("id", postIds);

      postsMap = new Map(posts?.map((post) => [post.id, post]) || []);
    }

    // 사용자 정보 조회
    let usersMap = new Map();
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, display_name")
        .in("id", userIds);

      usersMap = new Map(users?.map((user) => [user.id, user]) || []);
    }

    commentsWithData = comments.map((comment: any) => ({
      ...comment,
      board_posts: postsMap.get(comment.post_id) || null,
      users: usersMap.get(comment.user_id) || null,
    }));
  }

  return commentsWithData;
};

// 인기 게시물 가져오기
export const fetchPopularPosts = async (
  limit: number = 5,
  sortBy: "views" | "likes" | "comments" = "views"
) => {
  let orderColumn = "view_count";
  if (sortBy === "likes") orderColumn = "likes_count";
  if (sortBy === "comments") orderColumn = "comments_count";

  const { data: posts, error } = await supabase
    .from("board_posts")
    .select("*")
    .eq("status", "published")
    .order(orderColumn, { ascending: false })
    .limit(limit);

  if (error) {
    console.error("인기 게시물 조회 실패:", error);
    throw error;
  }

  // 사용자 정보를 수동으로 조회
  let postsWithUsers = posts || [];
  if (posts && posts.length > 0) {
    const userIds = Array.from(
      new Set(posts.map((post: any) => post.user_id).filter(Boolean))
    );

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, display_name, email")
        .in("id", userIds);

      const userMap = new Map(users?.map((user) => [user.id, user]) || []);

      postsWithUsers = posts.map((post: any) => ({
        ...post,
        users: userMap.get(post.user_id) || null,
      }));
    }
  }

  return postsWithUsers;
};

// 인기 게시물 조회 (기존)
export async function fetchPopularPostsWidget(limit: number = 10) {
  const { data: posts, error } = await supabase
    .from("board_posts")
    .select("*")
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("인기 게시물 조회 실패:", error);
    throw error;
  }

  // 사용자 정보를 수동으로 조회
  let postsWithUsers = posts || [];
  if (posts && posts.length > 0) {
    const userIds = Array.from(
      new Set(posts.map((post: any) => post.user_id).filter(Boolean))
    );

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, display_name, email")
        .in("id", userIds);

      const userMap = new Map(users?.map((user) => [user.id, user]) || []);

      postsWithUsers = posts.map((post: any) => ({
        ...post,
        users: userMap.get(post.user_id) || null,
      }));
    }
  }

  return { posts: postsWithUsers };
}

// 메뉴 항목 가져오기
export const fetchMenuItems = async (parentId?: string) => {
  const { data, error } = await supabase
    .from("cms_menus")
    .select("*")
    .eq("parent_id", parentId || null)
    .order("order_num", { ascending: true });

  if (error) {
    console.error("메뉴 항목 조회 실패:", error);
    throw error;
  }

  return data || [];
};

// 위젯 목록 가져오기
export const fetchWidgets = async (pageId?: string) => {
  const { data: widgets, error } = await supabase
    .from("cms_layout")
    .select("*")
    .eq("page_id", pageId || null)
    .eq("is_active", true)
    .order("order", { ascending: true });

  if (error) {
    console.error("위젯 목록 조회 실패:", error);
    throw error;
  }

  return widgets || [];
};
