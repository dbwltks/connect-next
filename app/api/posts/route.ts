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

    // 게시글 생성 - org_posts 테이블 사용
    const CONNECT_CHURCH_ORG_ID = '23913033-e35d-456c-818a-7824dd9de106';

    const { data: post, error } = await supabase
      .from('org_posts')
      .insert({
        organization_id: CONNECT_CHURCH_ORG_ID,
        title,
        content: finalContent,
        description,
        category_id,
        author_id: user.id,
        allow_comments,
        post_type: is_notice ? 'notice' : (is_pinned ? 'pinned' : 'normal'),
        status,
        published_at: published_at || new Date().toISOString(),
        thumbnail_url: finalThumbnailImage,
        meta: { files: finalFiles, page_id },
        tags: tags || [],
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

    // 게시글 소유자 확인 - org_posts 테이블 사용
    const { data: existingPost, error: fetchError } = await supabase
      .from('org_posts')
      .select('author_id')
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
    const isOwner = existingPost.author_id === user.id;

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

    // 게시글 업데이트 - org_posts 테이블 사용 (author_id는 기존 작성자 유지)
    const { data: post, error } = await supabase
      .from('org_posts')
      .update({
        title,
        content: finalContent,
        description,
        category_id,
        allow_comments,
        post_type: is_notice ? 'notice' : (is_pinned ? 'pinned' : 'normal'),
        status,
        published_at,
        thumbnail_url: finalThumbnailImage,
        meta: { files: finalFiles, page_id },
        tags: tags || [],
        updated_at: new Date().toISOString()
        // author_id는 업데이트하지 않음 - 기존 작성자 유지
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