import { NextRequest, NextResponse } from 'next/server';

// 성경 책 번호와 이름 매핑 (한글)
const BIBLE_BOOKS_KOR = {
  1: "창세기", 2: "출애굽기", 3: "레위기", 4: "민수기", 5: "신명기",
  6: "여호수아", 7: "사사기", 8: "룻기", 9: "사무엘상", 10: "사무엘하",
  11: "열왕기상", 12: "열왕기하", 13: "역대상", 14: "역대하", 15: "에스라",
  16: "느헤미야", 17: "에스더", 18: "욥기", 19: "시편", 20: "잠언",
  21: "전도서", 22: "아가", 23: "이사야", 24: "예레미야", 25: "예레미야애가",
  26: "에스겔", 27: "다니엘", 28: "호세아", 29: "요엘", 30: "아모스",
  31: "오바댜", 32: "요나", 33: "미가", 34: "나훔", 35: "하박국",
  36: "스바냐", 37: "학개", 38: "스가랴", 39: "말라기", 40: "마태복음",
  41: "마가복음", 42: "누가복음", 43: "요한복음", 44: "사도행전", 45: "로마서",
  46: "고린도전서", 47: "고린도후서", 48: "갈라디아서", 49: "에베소서", 50: "빌립보서",
  51: "골로새서", 52: "데살로니가전서", 53: "데살로니가후서", 54: "디모데전서", 55: "디모데후서",
  56: "디도서", 57: "빌레몬서", 58: "히브리서", 59: "야고보서", 60: "베드로전서",
  61: "베드로후서", 62: "요한일서", 63: "요한이서", 64: "요한삼서", 65: "유다서",
  66: "요한계시록",
};

// 성경 책 번호와 이름 매핑 (영어)
const BIBLE_BOOKS_ENG = {
  1: "Genesis", 2: "Exodus", 3: "Leviticus", 4: "Numbers", 5: "Deuteronomy",
  6: "Joshua", 7: "Judges", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
  11: "1 Kings", 12: "2 Kings", 13: "1 Chronicles", 14: "2 Chronicles", 15: "Ezra",
  16: "Nehemiah", 17: "Esther", 18: "Job", 19: "Psalms", 20: "Proverbs",
  21: "Ecclesiastes", 22: "Song of Songs", 23: "Isaiah", 24: "Jeremiah", 25: "Lamentations",
  26: "Ezekiel", 27: "Daniel", 28: "Hosea", 29: "Joel", 30: "Amos",
  31: "Obadiah", 32: "Jonah", 33: "Micah", 34: "Nahum", 35: "Habakkuk",
  36: "Zephaniah", 37: "Haggai", 38: "Zechariah", 39: "Malachi", 40: "Matthew",
  41: "Mark", 42: "Luke", 43: "John", 44: "Acts", 45: "Romans",
  46: "1 Corinthians", 47: "2 Corinthians", 48: "Galatians", 49: "Ephesians", 50: "Philippians",
  51: "Colossians", 52: "1 Thessalonians", 53: "2 Thessalonians", 54: "1 Timothy", 55: "2 Timothy",
  56: "Titus", 57: "Philemon", 58: "Hebrews", 59: "James", 60: "1 Peter",
  61: "2 Peter", 62: "1 John", 63: "2 John", 64: "3 John", 65: "Jude",
  66: "Revelation",
};

export async function GET() {
  try {
    const books = Object.entries(BIBLE_BOOKS_KOR).map(([id, korName]: any) => ({
      id: parseInt(id),
      korName,
      engName: BIBLE_BOOKS_ENG[parseInt(id) as keyof typeof BIBLE_BOOKS_ENG],
      testament: parseInt(id) <= 39 ? 'old' : 'new'
    }));

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Bible books API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bible books' },
      { status: 500 }
    );
  }
}