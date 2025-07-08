import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 성경 버전 정보 (실제 DB 테이블 기준)
const BIBLE_VERSIONS = {
  kor_old: { table: "bible_kor_old", name: "개역개정" },
  kor_new: { table: "bible_kor_new", name: "새번역" },
  niv: { table: "bible_niv", name: "NIV" },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const book = searchParams.get('book');
    const chapter = searchParams.get('chapter');
    const version = searchParams.get('version') || 'kor_old';

    if (!book || !chapter) {
      return NextResponse.json({ error: 'Book and chapter parameters are required' }, { status: 400 });
    }

    const bookNum = parseInt(book);
    const chapterNum = parseInt(chapter);
    
    if (isNaN(bookNum) || bookNum < 1 || bookNum > 66) {
      return NextResponse.json({ error: 'Invalid book number' }, { status: 400 });
    }

    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json({ error: 'Invalid chapter number' }, { status: 400 });
    }

    if (!BIBLE_VERSIONS[version as keyof typeof BIBLE_VERSIONS]) {
      return NextResponse.json({ error: 'Invalid version' }, { status: 400 });
    }

    const supabase = await createClient();
    const tableName = BIBLE_VERSIONS[version as keyof typeof BIBLE_VERSIONS].table;

    const { data, error } = await supabase
      .from(tableName)
      .select("verse")
      .eq("book", bookNum)
      .eq("chapter", chapterNum)
      .order("verse", { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ verseCount: 31 });
    }

    return NextResponse.json({ verseCount: data[0].verse });
  } catch (error) {
    console.error('Bible verse count API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verse count' },
      { status: 500 }
    );
  }
}