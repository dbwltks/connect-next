import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { moveFilesFromTemp, IFileInfo } from '@/utils/fileUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      description,
      page_id,
      category_id,
      allow_comments = true,
      is_notice = false,
      is_pinned = false,
      status = 'published',
      published_at,
      thumbnail_image,
      files,
      tags
    } = body;

    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // published 상태일 때만 파일 이동 처리
    let finalContent = content;
    let finalFiles = files;
    let finalThumbnailImage = thumbnail_image;

    if (status === 'published') {
      // 임시 파일들을 정식 위치로 이동
      const { movedFiles, finalContent: updatedContent, moveThumbnailFromTemp } = 
        await moveFilesFromTemp(files || [], content || '');
      
      finalContent = updatedContent;
      finalFiles = movedFiles;
      
      // 썸네일 이미지도 이동
      if (thumbnail_image) {
        finalThumbnailImage = await moveThumbnailFromTemp(thumbnail_image);
      }
    }

    // 게시글 생성
    const { data: post, error } = await supabase
      .from('board_posts')
      .insert({
        title,
        content: finalContent,
        description,
        page_id,
        category_id,
        user_id: user.id,
        allow_comments,
        is_notice,
        is_pinned,
        status,
        published_at: published_at || new Date().toISOString(),
        thumbnail_image: finalThumbnailImage,
        files: JSON.stringify(finalFiles),
        tags: JSON.stringify(tags),
        views: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create post:', error);
      throw error;
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Post creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      content,
      description,
      page_id,
      category_id,
      allow_comments,
      is_notice,
      is_pinned,
      status,
      published_at,
      thumbnail_image,
      files,
      tags
    } = body;

    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 게시글 소유자 확인
    const { data: existingPost, error: fetchError } = await supabase
      .from('board_posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 사용자 권한 확인 (관리자 권한 포함)
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.role?.toLowerCase() === 'admin';
    const isOwner = existingPost.user_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // published 상태일 때만 파일 이동 처리
    let finalContent = content;
    let finalFiles = files;
    let finalThumbnailImage = thumbnail_image;

    if (status === 'published') {
      // 임시 파일들을 정식 위치로 이동
      const { movedFiles, finalContent: updatedContent, moveThumbnailFromTemp } = 
        await moveFilesFromTemp(files || [], content || '');
      
      finalContent = updatedContent;
      finalFiles = movedFiles;
      
      // 썸네일 이미지도 이동
      if (thumbnail_image) {
        finalThumbnailImage = await moveThumbnailFromTemp(thumbnail_image);
      }
    }

    // 게시글 업데이트 (user_id는 기존 작성자 유지)
    const { data: post, error } = await supabase
      .from('board_posts')
      .update({
        title,
        content: finalContent,
        description,
        page_id,
        category_id,
        allow_comments,
        is_notice,
        is_pinned,
        status,
        published_at,
        thumbnail_image: finalThumbnailImage,
        files: JSON.stringify(finalFiles),
        tags: JSON.stringify(tags),
        updated_at: new Date().toISOString()
        // user_id는 업데이트하지 않음 - 기존 작성자 유지
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update post:', error);
      throw error;
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Post update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}