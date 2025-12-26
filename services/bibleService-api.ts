import { api } from "@/lib/api";

// 성경 버전 정보 (실제 DB 테이블 기준)
export const BIBLE_VERSIONS = {
  kor_old: { table: "bible_kor_old", name: "개역개정" },
  kor_new: { table: "bible_kor_new", name: "새번역" },
  niv: { table: "bible_niv", name: "NIV" },
};

// 성경 책 정보 (API에서 가져올 수도 있지만 정적 데이터이므로 클라이언트에 유지)
export const BIBLE_BOOKS = {
  1: { kor: "창세기", eng: "Genesis" },
  2: { kor: "출애굽기", eng: "Exodus" },
  3: { kor: "레위기", eng: "Leviticus" },
  4: { kor: "민수기", eng: "Numbers" },
  5: { kor: "신명기", eng: "Deuteronomy" },
  6: { kor: "여호수아", eng: "Joshua" },
  7: { kor: "사사기", eng: "Judges" },
  8: { kor: "룻기", eng: "Ruth" },
  9: { kor: "사무엘상", eng: "1 Samuel" },
  10: { kor: "사무엘하", eng: "2 Samuel" },
  11: { kor: "열왕기상", eng: "1 Kings" },
  12: { kor: "열왕기하", eng: "2 Kings" },
  13: { kor: "역대상", eng: "1 Chronicles" },
  14: { kor: "역대하", eng: "2 Chronicles" },
  15: { kor: "에스라", eng: "Ezra" },
  16: { kor: "느헤미야", eng: "Nehemiah" },
  17: { kor: "에스더", eng: "Esther" },
  18: { kor: "욥기", eng: "Job" },
  19: { kor: "시편", eng: "Psalms" },
  20: { kor: "잠언", eng: "Proverbs" },
  21: { kor: "전도서", eng: "Ecclesiastes" },
  22: { kor: "아가", eng: "Song of Songs" },
  23: { kor: "이사야", eng: "Isaiah" },
  24: { kor: "예레미야", eng: "Jeremiah" },
  25: { kor: "예레미야애가", eng: "Lamentations" },
  26: { kor: "에스겔", eng: "Ezekiel" },
  27: { kor: "다니엘", eng: "Daniel" },
  28: { kor: "호세아", eng: "Hosea" },
  29: { kor: "요엘", eng: "Joel" },
  30: { kor: "아모스", eng: "Amos" },
  31: { kor: "오바댜", eng: "Obadiah" },
  32: { kor: "요나", eng: "Jonah" },
  33: { kor: "미가", eng: "Micah" },
  34: { kor: "나훔", eng: "Nahum" },
  35: { kor: "하박국", eng: "Habakkuk" },
  36: { kor: "스바냐", eng: "Zephaniah" },
  37: { kor: "학개", eng: "Haggai" },
  38: { kor: "스가랴", eng: "Zechariah" },
  39: { kor: "말라기", eng: "Malachi" },
  40: { kor: "마태복음", eng: "Matthew" },
  41: { kor: "마가복음", eng: "Mark" },
  42: { kor: "누가복음", eng: "Luke" },
  43: { kor: "요한복음", eng: "John" },
  44: { kor: "사도행전", eng: "Acts" },
  45: { kor: "로마서", eng: "Romans" },
  46: { kor: "고린도전서", eng: "1 Corinthians" },
  47: { kor: "고린도후서", eng: "2 Corinthians" },
  48: { kor: "갈라디아서", eng: "Galatians" },
  49: { kor: "에베소서", eng: "Ephesians" },
  50: { kor: "빌립보서", eng: "Philippians" },
  51: { kor: "골로새서", eng: "Colossians" },
  52: { kor: "데살로니가전서", eng: "1 Thessalonians" },
  53: { kor: "데살로니가후서", eng: "2 Thessalonians" },
  54: { kor: "디모데전서", eng: "1 Timothy" },
  55: { kor: "디모데후서", eng: "2 Timothy" },
  56: { kor: "디도서", eng: "Titus" },
  57: { kor: "빌레몬서", eng: "Philemon" },
  58: { kor: "히브리서", eng: "Hebrews" },
  59: { kor: "야고보서", eng: "James" },
  60: { kor: "베드로전서", eng: "1 Peter" },
  61: { kor: "베드로후서", eng: "2 Peter" },
  62: { kor: "요한일서", eng: "1 John" },
  63: { kor: "요한이서", eng: "2 John" },
  64: { kor: "요한삼서", eng: "3 John" },
  65: { kor: "유다서", eng: "Jude" },
  66: { kor: "요한계시록", eng: "Revelation" },
};

// API 기반 성경구절 가져오기 함수
export async function getBibleVerses(params: {
  version: keyof typeof BIBLE_VERSIONS;
  book: number;
  chapter: number;
  startVerse: number;
  endVerse?: number;
}) {
  try {
    const result = await api.bible.getVerses({
      book: params.book,
      chapter: params.chapter,
      startVerse: params.startVerse,
      endVerse: params.endVerse,
      version: params.version,
    });

    return result.verses || [];
  } catch (error) {
    console.error("getBibleVerses API 오류:", error);
    throw error;
  }
}

// API 기반 성경 장 수 조회 함수
export async function getBibleChapters(
  book: number,
  version: keyof typeof BIBLE_VERSIONS = "kor_old"
) {
  try {
    const result = await api.bible.getChapters(book, version);
    return result.chapters || [1];
  } catch (error) {
    console.error("getBibleChapters API 오류:", error);
    return [1];
  }
}

// API 기반 성경 절 수 조회 함수
export async function getBibleVerseCount(
  book: number,
  chapter: number,
  version: keyof typeof BIBLE_VERSIONS = "kor_old"
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

  const bookInfo = BIBLE_BOOKS[book as keyof typeof BIBLE_BOOKS];
  const bookName = bookInfo
    ? `${bookInfo.kor}(${bookInfo.eng})`
    : `Book ${book}`;
  const versionName = BIBLE_VERSIONS[version].name;

  let html = `<ol class="list-decimal ml-6" style="font-size: 1em;" start="${verses[0].verse}">
  <style>
    ol li::marker {
      font-size: 0.8em;
      font-weight: bold;
    }
  </style>`;

  verses.forEach((verse, index) => {
    // NIV 영어 성경의 경우 HTML 태그 정리
    let cleanText = verse.text;
    if (version === "niv") {
      // 1. ▷ 이후의 주석 부분 전체 제거 (줄바꿈 포함, Or 대안 번역 포함됨)
      cleanText = cleanText.replace(/▷[\s\S]*$/g, "");

      // 2. <sup> 태그와 내용 제거
      cleanText = cleanText.replace(/<sup[^>]*>.*?<\/sup>/gi, "");

      // 3. <i> 태그와 내용 제거
      cleanText = cleanText.replace(/<i[^>]*>.*?<\/i>/gi, "");

      // 4. <br> 태그 제거
      cleanText = cleanText.replace(/<br\s*\/?>/gi, " ");

      // 5. 여러 공백을 하나로 통합하고 앞뒤 공백 제거
      cleanText = cleanText.replace(/\s+/g, " ").trim();
    }

    html += `<li><strong>${cleanText}</strong><br></li>`;
  });

  html += `</ol>`;

  const verseRange =
    verses.length === 1
      ? verses[0].verse
      : `${verses[0].verse}-${verses[verses.length - 1].verse}`;

  html += `<p><em>- ${bookName} ${chapter}:${verseRange} (${versionName}) -</em></p>`;

  return html;
}

// 성경 구절을 에디터용 HTML로 포맷팅 (본문-대역 번역본)
export function formatBibleVersesWithSub(
  mainVerses: any[],
  subVerses: any[],
  book: number,
  chapter: number,
  mainVersion: keyof typeof BIBLE_VERSIONS,
  subVersion: keyof typeof BIBLE_VERSIONS
) {
  if (!mainVerses.length) return "";

  const bookInfo = BIBLE_BOOKS[book as keyof typeof BIBLE_BOOKS];
  const bookNameKor = bookInfo ? bookInfo.kor : `Book ${book}`;
  const bookNameEng = bookInfo ? bookInfo.eng : `Book ${book}`;
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
    let mainText = mainVerse.text;
    if (mainVersion === "niv") {
      // 1. ▷ 이후의 주석 부분 전체 제거 (줄바꿈 포함, Or 대안 번역 포함됨)
      mainText = mainText.replace(/▷[\s\S]*$/g, "");

      // 2. <sup> 태그와 내용 제거
      mainText = mainText.replace(/<sup[^>]*>.*?<\/sup>/gi, "");

      // 3. <i> 태그와 내용 제거
      mainText = mainText.replace(/<i[^>]*>.*?<\/i>/gi, "");

      // 4. <br> 태그 제거
      mainText = mainText.replace(/<br\s*\/?>/gi, " ");

      // 5. 여러 공백을 하나로 통합하고 앞뒤 공백 제거
      mainText = mainText.replace(/\s+/g, " ").trim();
    }

    let liContent = `<strong>${mainText}</strong>`;

    // 대역이 있으면 추가 (절 번호 없이, 작고 회색으로)
    if (subVerse) {
      let subText = subVerse.text;
      if (subVersion === "niv") {
        // 1. ▷ 이후의 주석 부분 전체 제거 (줄바꿈 포함, Or 대안 번역 포함됨)
        subText = subText.replace(/▷[\s\S]*$/g, "");

        // 2. <sup> 태그와 내용 제거
        subText = subText.replace(/<sup[^>]*>.*?<\/sup>/gi, "");

        // 3. <i> 태그와 내용 제거
        subText = subText.replace(/<i[^>]*>.*?<\/i>/gi, "");

        // 4. <br> 태그 제거
        subText = subText.replace(/<br\s*\/?>/gi, " ");

        // 5. 여러 공백을 하나로 통합하고 앞뒤 공백 제거
        subText = subText.replace(/\s+/g, " ").trim();
      }
      liContent += `<br><span style="color: #666666; font-size: 0.9em;">${subText}</span><br>`;
    }

    html += `<li>${liContent}</li>`;
  });

  html += `</ol>`;

  return html;
}

// 성경책 이름 가져오기 (버전에 따라)
export function getBibleBookName(
  book: number,
  version: keyof typeof BIBLE_VERSIONS
) {
  const bookInfo = BIBLE_BOOKS[book as keyof typeof BIBLE_BOOKS];
  if (!bookInfo) return `Book ${book}`;

  // 한글 번역본은 한글 이름, 영어 번역본은 영어 이름 우선
  if (version.startsWith("kor_")) {
    return bookInfo.kor;
  } else {
    return bookInfo.eng;
  }
}
