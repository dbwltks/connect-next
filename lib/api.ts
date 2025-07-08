// API 호출 유틸리티
const apiCall = async (endpoint: string) => {
  const response = await fetch(endpoint);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.error) {
    throw new Error(result.error);
  }

  return result;
};

// URL 생성 헬퍼
const createUrl = (path: string, params?: Record<string, string | number>) => {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value.toString());
    });
  }
  return url.toString();
};

// 통합 API 함수들
export const api = {
  // 위젯 관련
  widgets: {
    getAll: (pageId?: string) => 
      apiCall(createUrl('/api/widgets', pageId ? { pageId } : undefined)),
    
    getById: (id: string) => 
      apiCall(`/api/widget/${id}`),
  },


  // 댓글 관련
  comments: {
    getRecent: (limit = 5) =>
      apiCall(createUrl('/api/comments', { limit })),
  },

  // 인기 게시글 관련
  popular: {
    getPosts: (limit = 5, sortBy: 'views' | 'likes' | 'comments' = 'views') =>
      apiCall(createUrl('/api/popular-posts', { limit, sortBy })),
  },

  // 메뉴 관련
  menu: {
    getItems: (parentId?: string) =>
      apiCall(createUrl('/api/menu-items', parentId ? { parentId } : undefined)),
  },

  // 캘린더 관련
  calendar: {
    getEvents: () => apiCall('/api/calendar-events'),
  },

  // 게시글 관련 - 기존 함수에 추가
  posts: {
    getForWidget: (boardId: string, limit = 5) =>
      apiCall(createUrl('/api/board-posts', { boardId, limit, type: 'widget' })),
    
    getForMedia: (pageId: string, limit = 5) =>
      apiCall(createUrl('/api/board-posts', { pageId, limit, type: 'media' })),
    
    getForSection: (pageId: string, limit = 10) =>
      apiCall(createUrl('/api/board-posts', { pageId, limit, type: 'section' })),
    
    getForBoard: (params: {
      pageId?: string;
      categoryId?: string;
      page?: number;
      itemCount?: number;
      searchType?: string;
      searchTerm?: string;
    }) => apiCall(createUrl('/api/board', params)),

    // 새로운 CRUD 함수들
    create: (postData: any) => 
      fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      }).then(res => res.json()),
    
    update: (postData: any) =>
      fetch('/api/posts', {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      }).then(res => res.json()),

    getById: (id: string) => apiCall(`/api/posts/${id}`),
    
    delete: (id: string) =>
      fetch(`/api/posts/${id}`, { method: 'DELETE' }).then(res => res.json()),
  },

  // 임시저장 관련
  drafts: {
    getAll: () => apiCall('/api/drafts'),
    create: (draftData: any) =>
      fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData)
      }).then(res => res.json()),
    delete: (id: string) =>
      fetch(`/api/drafts/${id}`, { method: 'DELETE' }).then(res => res.json()),
  },

  // 태그 관련
  tags: {
    getAll: (search?: string) => 
      apiCall(createUrl('/api/tags', search ? { search } : undefined)),
    create: (tagData: any) =>
      fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagData)
      }).then(res => res.json()),
    update: (id: string, tagData: any) =>
      fetch(`/api/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagData)
      }).then(res => res.json()),
    delete: (id: string) =>
      fetch(`/api/tags/${id}`, { method: 'DELETE' }).then(res => res.json()),
  },
};

// 개별 함수들 (기존 호환성 유지)
export const fetchWidget = api.widgets.getById;
export const fetchWidgets = api.widgets.getAll;
export const fetchBoardWidgetPosts = api.posts.getForWidget;
export const fetchMediaWidgetPosts = api.posts.getForMedia;
export const fetchBoardSectionPosts = async (pageId: string, limit = 10) => {
  const result = await api.posts.getForSection(pageId, limit);
  return { posts: result };
};

export const fetchBoardPostsForWidget = async (pageId: string, limit = 5) => {
  const result = await api.posts.getForWidget(pageId, limit);
  // 위젯이 기대하는 { posts: [...], menuUrlMap: {...} } 구조로 반환
  return { 
    posts: Array.isArray(result) ? result : result.posts || [],
    menuUrlMap: {}
  };
};

export const fetchRecentComments = async (limit = 5) => {
  const result = await api.comments.getRecent(limit);
  // 위젯이 기대하는 { comments: [...], menuUrlMap: {...} } 구조로 반환
  return { 
    comments: Array.isArray(result) ? result : result.comments || [],
    menuUrlMap: {}
  };
};

export const fetchPopularPosts = async (limit = 5, sortBy: 'views' | 'likes' | 'comments' = 'views') => {
  const result = await api.popular.getPosts(limit, sortBy);
  // 이미 { posts: [...] } 구조이므로 그대로 반환
  return Array.isArray(result) ? { posts: result } : result;
};

export const fetchPopularPostsWidget = async (limit = 10) => {
  const result = await api.popular.getPosts(limit);
  return Array.isArray(result) ? { posts: result } : result;
};
export const fetchMenuItems = api.menu.getItems;
export const fetchCalendarEvents = api.calendar.getEvents;