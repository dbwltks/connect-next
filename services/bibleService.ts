import { createClient } from "@/utils/supabase/client";
import { api } from '@/lib/api';

// 성경 전용 supabase 클라이언트 생성
// 이제 createClient()를 사용하여 각 함수에서 직접 생성합니다

// 성경 책 번호와 이름 매핑 (한글)
export const BIBLE_BOOKS_KOR = {
  1: "창세기",
  2: "출애굽기",
  3: "레위기",
  4: "민수기",
  5: "신명기",
  6: "여호수아",
  7: "사사기",
  8: "룻기",
  9: "사무엘상",
  10: "사무엘하",
  11: "열왕기상",
  12: "열왕기하",
  13: "역대상",
  14: "역대하",
  15: "에스라",
  16: "느헤미야",
  17: "에스더",
  18: "욥기",
  19: "시편",
  20: "잠언",
  21: "전도서",
  22: "아가",
  23: "이사야",
  24: "예레미야",
  25: "예레미야애가",
  26: "에스겔",
  27: "다니엘",
  28: "호세아",
  29: "요엘",
  30: "아모스",
  31: "오바댜",
  32: "요나",
  33: "미가",
  34: "나훔",
  35: "하박국",
  36: "스바냐",
  37: "학개",
  38: "스가랴",
  39: "말라기",
  40: "마태복음",
  41: "마가복음",
  42: "누가복음",
  43: "요한복음",
  44: "사도행전",
  45: "로마서",
  46: "고린도전서",
  47: "고린도후서",
  48: "갈라디아서",
  49: "에베소서",
  50: "빌립보서",
  51: "골로새서",
  52: "데살로니가전서",
  53: "데살로니가후서",
  54: "디모데전서",
  55: "디모데후서",
  56: "디도서",
  57: "빌레몬서",
  58: "히브리서",
  59: "야고보서",
  60: "베드로전서",
  61: "베드로후서",
  62: "요한일서",
  63: "요한이서",
  64: "요한삼서",
  65: "유다서",
  66: "요한계시록",
};

// 성경 책 번호와 이름 매핑 (영어)
export const BIBLE_BOOKS_ENG = {
  1: "Genesis",
  2: "Exodus",
  3: "Leviticus",
  4: "Numbers",
  5: "Deuteronomy",
  6: "Joshua",
  7: "Judges",
  8: "Ruth",
  9: "1 Samuel",
  10: "2 Samuel",
  11: "1 Kings",
  12: "2 Kings",
  13: "1 Chronicles",
  14: "2 Chronicles",
  15: "Ezra",
  16: "Nehemiah",
  17: "Esther",
  18: "Job",
  19: "Psalms",
  20: "Proverbs",
  21: "Ecclesiastes",
  22: "Song of Songs",
  23: "Isaiah",
  24: "Jeremiah",
  25: "Lamentations",
  26: "Ezekiel",
  27: "Daniel",
  28: "Hosea",
  29: "Joel",
  30: "Amos",
  31: "Obadiah",
  32: "Jonah",
  33: "Micah",
  34: "Nahum",
  35: "Habakkuk",
  36: "Zephaniah",
  37: "Haggai",
  38: "Zechariah",
  39: "Malachi",
  40: "Matthew",
  41: "Mark",
  42: "Luke",
  43: "John",
  44: "Acts",
  45: "Romans",
  46: "1 Corinthians",
  47: "2 Corinthians",
  48: "Galatians",
  49: "Ephesians",
  50: "Philippians",
  51: "Colossians",
  52: "1 Thessalonians",
  53: "2 Thessalonians",
  54: "1 Timothy",
  55: "2 Timothy",
  56: "Titus",
  57: "Philemon",
  58: "Hebrews",
  59: "James",
  60: "1 Peter",
  61: "2 Peter",
  62: "1 John",
  63: "2 John",
  64: "3 John",
  65: "Jude",
  66: "Revelation",
};

// 번역본에 따라 적절한 성경 책 이름 반환하는 함수
export function getBibleBookName(
  book: number,
  version: keyof typeof BIBLE_VERSIONS
) {
  if (version === "niv") {
    return BIBLE_BOOKS_ENG[book as keyof typeof BIBLE_BOOKS_ENG];
  } else {
    return BIBLE_BOOKS_KOR[book as keyof typeof BIBLE_BOOKS_KOR];
  }
}

// 호환성을 위한 기본 BIBLE_BOOKS (한글)
export const BIBLE_BOOKS = BIBLE_BOOKS_KOR;

// 성경 번역본 옵션
export const BIBLE_VERSIONS = {
  kor_old: { name: "개역개정", table: "bible_kor_old" },
  kor_new: { name: "쉬운말성경", table: "bible_kor_new" },
  niv: { name: "NIV", table: "bible_niv" },
};

// 성경 구절 조회 함수
export async function getBibleVerses({
  version,
  book,
  chapter,
  startVerse,
  endVerse,
}: {
  version: keyof typeof BIBLE_VERSIONS;
  book: number;
  chapter: number;
  startVerse: number;
  endVerse?: number;
}) {
  try {
    const result = await api.bible.getVerses({
      book: book,
      chapter: chapter,
      startVerse: startVerse,
      endVerse: endVerse,
      version: version,
    });
    
    // API에서 반환된 데이터를 기존 형식에 맞게 변환
    const verses = (result.verses || []).map((verse: any) => ({
      ...verse,
      btext: verse.text || verse.btext
    }));
    
    return verses;
  } catch (error) {
    console.error("getBibleVerses API 오류:", error);
    throw error;
  }
}

// 성경 장 수 조회 함수
export async function getBibleChapters(
  book: number,
  version: keyof typeof BIBLE_VERSIONS = 'kor_old'
) {
  try {
    const result = await api.bible.getChapters(book, version);
    return result.chapters || [1];
  } catch (error) {
    console.error("getBibleChapters API 오류:", error);
    return [1];
  }
}

// 성경 절 수 조회 함수
export async function getBibleVerseCount(
  book: number,
  chapter: number,
  version: keyof typeof BIBLE_VERSIONS = 'kor_old'
) {
  try {
    const result = await api.bible.getVerseCount(book, chapter, version);
    return result.verseCount || 31;
  } catch (error) {
    console.error("getBibleVerseCount API 오류:", error);
    return 31;
  }
}

// 성경 구절을 에디터용 HTML로 포맷팅 (단일 번역본)
export function formatBibleVerses(
  verses: any[],
  book: number,
  chapter: number,
  version: keyof typeof BIBLE_VERSIONS
) {
  if (!verses.length) return "";

  const bookNameKor = BIBLE_BOOKS_KOR[book as keyof typeof BIBLE_BOOKS_KOR];
  const bookNameEng = BIBLE_BOOKS_ENG[book as keyof typeof BIBLE_BOOKS_ENG];
  const bookName = getBibleBookName(book, version);
  const versionName = BIBLE_VERSIONS[version].name;

  const verseRange =
    verses.length === 1
      ? verses[0].verse
      : `${verses[0].verse}-${verses[verses.length - 1].verse}`;

  // 대역 있는 것과 동일한 레이아웃 사용
  let html = `<span style="font-size: 0.8em; margin-bottom: 0rem;">${bookNameEng}</span><p style="margin-bottom: 0rem;"><span style="font-size: 1.4em;">${bookNameKor} ${chapter}:${verseRange}</span> <span style="font-size: 0.8em;">(${versionName})</span></p><hr>`;

  html += `<ol class="list-decimal ml-6" style="font-size: 1em;" start="${verses[0].verse}">`;

  verses.forEach((verse, index) => {
    // NIV 영어 성경의 경우 HTML 태그 정리
    let cleanText = verse.btext;
    if (version === "niv") {
      cleanText = cleanText.replace(/<br\s*\/?>/gi, " ");
      cleanText = cleanText.replace(/<sup>.*?<\/sup>/gi, "");
      cleanText = cleanText.replace(/▷\s*/gi, "");
      cleanText = cleanText.replace(/<i>.*?<\/i>/gi, "");
      cleanText = cleanText.replace(/Or\s+/gi, "");
    }

    html += `<li><strong>${cleanText}</strong></li>`;
  });

  html += `</ol><br><br>`;

  return html;
}

// 성경 구절을 에디터용 HTML로 포맷팅 (본문 + 대역)
export function formatBibleVersesWithSub(
  mainVerses: any[],
  subVerses: any[],
  book: number,
  chapter: number,
  mainVersion: keyof typeof BIBLE_VERSIONS,
  subVersion: keyof typeof BIBLE_VERSIONS
) {
  if (!mainVerses.length) return "";

  const bookNameKor = BIBLE_BOOKS_KOR[book as keyof typeof BIBLE_BOOKS_KOR];
  const bookNameEng = BIBLE_BOOKS_ENG[book as keyof typeof BIBLE_BOOKS_ENG];
  const bookName = getBibleBookName(book, mainVersion);
  const mainVersionName = BIBLE_VERSIONS[mainVersion].name;
  const subVersionName = BIBLE_VERSIONS[subVersion].name;

  const verseRange =
    mainVerses.length === 1
      ? mainVerses[0].verse
      : `${mainVerses[0].verse}-${mainVerses[mainVerses.length - 1].verse}`;

  let html = `<span style="font-size: 0.8em; margin-bottom: 0rem;">${bookNameEng}</span><p style="margin-bottom: 0rem;"><span style="font-size: 1.4em;">${bookNameKor} ${chapter}:${verseRange}</span> <span style="font-size: 0.8em;">(${mainVersionName} / ${subVersionName})</span></p><hr>`;

  html += `<ol class="list-decimal ml-6" style="font-size: 1em;" start="${mainVerses[0].verse}">`;

  mainVerses.forEach((mainVerse, index) => {
    // 해당 절의 대역 찾기
    const subVerse = subVerses.find((v) => v.verse === mainVerse.verse);

    // 본문
    let mainText = mainVerse.btext;
    if (mainVersion === "niv") {
      mainText = mainText.replace(/<br\s*\/?>/gi, " ");
      mainText = mainText.replace(/<sup>.*?<\/sup>/gi, "");
      mainText = mainText.replace(/▷\s*/gi, "");
      mainText = mainText.replace(/<i>.*?<\/i>/gi, "");
      mainText = mainText.replace(/Or\s+/gi, "");
    }

    let liContent = `<strong>${mainText}</strong>`;

    // 대역이 있으면 추가 (절 번호 없이, 작고 회색으로)
    if (subVerse) {
      let subText = subVerse.btext;
      if (subVersion === "niv") {
        subText = subText.replace(/<br\s*\/?>/gi, " ");
        subText = subText.replace(/<sup>.*?<\/sup>/gi, "");
        subText = subText.replace(/▷\s*/gi, "");
        subText = subText.replace(/<i>.*?<\/i>/gi, "");
        subText = subText.replace(/Or\s+/gi, "");
      }
      liContent += `<br><span style="color: #666666; font-size: 0.9em;">${subText}</span><br>`;
    }

    html += `<li>${liContent}</li>`;
  });

  html += `</ol><br><br>`;

  return html;
}
