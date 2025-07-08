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
    const version = searchParams.get('version') || 'kor_old';

    if (!book) {
      return NextResponse.json({ error: 'Book parameter is required' }, { status: 400 });
    }

    const bookNum = parseInt(book);
    if (isNaN(bookNum) || bookNum < 1 || bookNum > 66) {
      return NextResponse.json({ error: 'Invalid book number' }, { status: 400 });
    }

    if (!BIBLE_VERSIONS[version as keyof typeof BIBLE_VERSIONS]) {
      return NextResponse.json({ error: 'Invalid version' }, { status: 400 });
    }

    const supabase = await createClient();
    const tableName = BIBLE_VERSIONS[version as keyof typeof BIBLE_VERSIONS].table;

    const { data, error } = await supabase
      .from(tableName)
      .select("chapter")
      .eq("book", bookNum)
      .order("chapter", { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ chapters: [1] });
    }

    const maxChapter = data[0].chapter;
    const chapters = Array.from({ length: maxChapter }, (_, i) => i + 1);
    
    return NextResponse.json({ chapters });
  } catch (error) {
    console.error('Bible chapters API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bible chapters' },
      { status: 500 }
    );
  }
}