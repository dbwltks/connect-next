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
    const startVerse = searchParams.get('startVerse');
    const endVerse = searchParams.get('endVerse');
    const version = searchParams.get('version') || 'kor_old';

    if (!book || !chapter || !startVerse) {
      return NextResponse.json({ 
        error: 'Book, chapter, and startVerse parameters are required' 
      }, { status: 400 });
    }

    const bookNum = parseInt(book);
    const chapterNum = parseInt(chapter);
    const startVerseNum = parseInt(startVerse);
    const endVerseNum = endVerse ? parseInt(endVerse) : startVerseNum;
    
    if (isNaN(bookNum) || bookNum < 1 || bookNum > 66) {
      return NextResponse.json({ error: 'Invalid book number' }, { status: 400 });
    }

    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json({ error: 'Invalid chapter number' }, { status: 400 });
    }

    if (isNaN(startVerseNum) || startVerseNum < 1) {
      return NextResponse.json({ error: 'Invalid start verse number' }, { status: 400 });
    }

    if (isNaN(endVerseNum) || endVerseNum < startVerseNum) {
      return NextResponse.json({ error: 'Invalid end verse number' }, { status: 400 });
    }

    if (!BIBLE_VERSIONS[version as keyof typeof BIBLE_VERSIONS]) {
      return NextResponse.json({ error: 'Invalid version' }, { status: 400 });
    }

    const supabase = await createClient();
    const tableName = BIBLE_VERSIONS[version as keyof typeof BIBLE_VERSIONS].table;

    console.log('Querying table:', tableName, 'for book:', bookNum, 'chapter:', chapterNum, 'verses:', startVerseNum, '-', endVerseNum);
    
    let query = supabase
      .from(tableName)
      .select("book, chapter, verse, btext")
      .eq("book", bookNum)
      .eq("chapter", chapterNum)
      .gte("verse", startVerseNum)
      .lte("verse", endVerseNum)
      .order("verse", { ascending: true });

    const { data, error } = await query;
    
    console.log('Query result:', { data, error });

    if (error) {
      throw error;
    }

    // btext를 text로 변환
    const verses = (data || []).map((verse: any) => ({
      ...verse,
      text: verse.btext
    }));

    return NextResponse.json({ 
      verses,
      version: BIBLE_VERSIONS[version as keyof typeof BIBLE_VERSIONS].name
    });
  } catch (error) {
    console.error('Bible verses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bible verses' },
      { status: 500 }
    );
  }
}