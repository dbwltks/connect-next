import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    const supabase = await createClient();

    let query = supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: tags, error } = await query;

    if (error) {
      console.error('Failed to fetch tags:', error);
      throw error;
    }

    return NextResponse.json({ tags: tags || [] });
  } catch (error) {
    console.error('Tags fetch API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color = '#3B82F6' } = body;

    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 중복 태그 확인
    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('name', name)
      .single();

    if (existingTag) {
      return NextResponse.json(
        { error: 'Tag already exists' },
        { status: 409 }
      );
    }

    // 태그 생성
    const { data: tag, error } = await supabase
      .from('tags')
      .insert({
        name,
        color,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create tag:', error);
      throw error;
    }

    return NextResponse.json({ tag });
  } catch (error) {
    console.error('Tag creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}