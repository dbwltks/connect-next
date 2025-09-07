// API 호출 유틸리티
const apiCall = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(endpoint, options);
  
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
  menus: {
    getMenuList: (parentMenuId?: string, pathname?: string) => {
      const params: Record<string, string> = {};
      if (parentMenuId) params.parentMenuId = parentMenuId;
      if (pathname) params.pathname = pathname;
      return apiCall(createUrl('/api/menus', params));
    },
    getHeaderMenus: () => apiCall('/api/header-menus'),
  },

  // 사용자 관련
  user: {
    getCurrentUser: () => apiCall('/api/user/me'),
  },

  // 보드 관련 (최적화된 버전)
  board: {
    getPosts: (params: {
      pageId: string;
      categoryId?: string;
      itemCount: number;
      page: number;
      searchType: string;
      searchTerm: string;
      sortOption?: string;
    }) => {
      const queryParams: Record<string, string> = {
        pageId: params.pageId,
        itemCount: params.itemCount.toString(),
        page: params.page.toString(),
        searchType: params.searchType,
        searchTerm: params.searchTerm,
      };
      
      if (params.categoryId) queryParams.categoryId = params.categoryId;
      if (params.sortOption) queryParams.sortOption = params.sortOption;
      
      return apiCall(createUrl('/api/board-optimized', queryParams));
    },
  },

  // 게시글 관련
  posts: {
    getDetail: (postId: string) => apiCall(`/api/posts/${postId}/detail`),
    incrementView: (postId: string) => 
      apiCall(`/api/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'increment_view' }),
        headers: { 'Content-Type': 'application/json' }
      }),
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

  // 메뉴 관련
  menu: {
    getItems: (parentId?: string) =>
      apiCall(createUrl('/api/menu-items', parentId ? { parentId } : undefined)),
  },

  // 페이지 관련
  pages: {
    getById: (id: string) => apiCall(`/api/pages/${id}`),
    getAll: () => apiCall('/api/pages'),
  },

  // 캘린더 관련
  calendar: {
    getEvents: () => apiCall('/api/calendar-events'),
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

  // 성경 관련
  bible: {
    getBooks: () => apiCall('/api/bible/books'),
    getChapters: (book: number, version = 'kor_old') => 
      apiCall(createUrl('/api/bible/chapters', { book: book.toString(), version })),
    getVerseCount: (book: number, chapter: number, version = 'kor_old') => 
      apiCall(createUrl('/api/bible/verse-count', { 
        book: book.toString(), 
        chapter: chapter.toString(), 
        version 
      })),
    getVerses: (params: {
      book: number;
      chapter: number;
      startVerse: number;
      endVerse?: number;
      version?: string;
    }) => {
      const queryParams: Record<string, string> = {
        book: params.book.toString(),
        chapter: params.chapter.toString(),
        startVerse: params.startVerse.toString(),
        version: params.version || 'kor_old'
      };
      
      if (params.endVerse) {
        queryParams.endVerse = params.endVerse.toString();
      }
      
      return apiCall(createUrl('/api/bible/verses', queryParams));
    },
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
  // 위젯이 기대하는 { posts: [...], menuUrlMap: {...}, pageTitleMap: {...} } 구조로 반환
  return { 
    posts: Array.isArray(result) ? result : result.posts || [],
    menuUrlMap: result.menuUrlMap || {},
    pageTitleMap: result.pageTitleMap || {}
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