// 금지어 목록 및 검증 유틸리티

// 금지어 카테고리별 목록
export const forbiddenWords = {
  // 관리자 및 운영 관련
  admin: [
    "관리자",
    "관리",
    "운영자",
    "운영진",
    "admin",
    "administrator",
    "moderator",
    "mod",
    "최고관리자",
    "슈퍼관리자",
    "master",
    "root",
    "owner",
    "시스템",
    "system",
  ],

  // 종교 관련 (교회 커뮤니티에서 민감한 용어)
  religious: [
    "담임목사",
    "목사님",
    "전도사님",
    "목사",
    "전도사",
    "장로",
    "권사",
    "집사",
    "교회",
    "교단",
    "종교",
    "하나님",
    "예수님",
    "성령님",
    "주님",
    "예수",
    "그리스도",
  ],

  // 비속어 및 욕설
  profanity: [
    "바보",
    "멍청이",
    "등신",
    "병신",
    "새끼",
    "개새끼",
    "개놈",
    "년",
    "련",
    "좆",
    "씨발",
    "시발",
    "존나",
    "개같은",
    "지랄",
    "닥쳐",
    "꺼져",
  ],

  // 위험한 단어
  dangerous: ["죽어", "자살", "살인", "폭력", "테러", "범죄", "마약", "도박"],
};

// 모든 금지어를 하나의 배열로 통합
export const allForbiddenWords = [
  ...forbiddenWords.admin,
  ...forbiddenWords.religious,
  ...forbiddenWords.profanity,
  ...forbiddenWords.dangerous,
];

// 금지어 체크 함수
export function checkForbiddenWords(text: string): {
  isValid: boolean;
  forbiddenWord?: string;
  category?: keyof typeof forbiddenWords;
} {
  if (!text || typeof text !== "string") {
    return { isValid: true };
  }

  const lowerText = text.toLowerCase().trim();

  // 카테고리별로 체크
  for (const [category, words] of Object.entries(forbiddenWords)) {
    for (const word of words) {
      if (lowerText.includes(word.toLowerCase())) {
        return {
          isValid: false,
          forbiddenWord: word,
          category: category as keyof typeof forbiddenWords,
        };
      }
    }
  }

  return { isValid: true };
}

// 메시지 생성 함수
export function getForbiddenWordMessage(
  forbiddenWord: string,
  category?: keyof typeof forbiddenWords
): string {
  const categoryMessages = {
    admin: "관리자 관련 용어는 사용할 수 없습니다",
    religious: "종교 관련 용어는 사용할 수 없습니다",
    profanity: "부적절한 언어는 사용할 수 없습니다",
    dangerous: "위험한 단어는 사용할 수 없습니다",
  };

  const baseMessage = `'${forbiddenWord}'는 사용할 수 없는 단어입니다`;

  if (category && categoryMessages[category]) {
    return `${baseMessage} (${categoryMessages[category]})`;
  }

  return baseMessage;
}

// 닉네임/디스플레이 이름 전체 검증 함수
export function validateDisplayName(name: string): {
  isValid: boolean;
  message?: string;
} {
  const trimmedName = name.trim();

  // 길이 체크
  if (trimmedName.length < 2) {
    return { isValid: false, message: "2자 이상 입력해주세요" };
  }

  if (trimmedName.length > 10) {
    return { isValid: false, message: "10자 이하로 입력해주세요" };
  }

  // 금지어 체크
  const forbiddenCheck = checkForbiddenWords(trimmedName);
  if (!forbiddenCheck.isValid) {
    return {
      isValid: false,
      message: getForbiddenWordMessage(
        forbiddenCheck.forbiddenWord!,
        forbiddenCheck.category
      ),
    };
  }

  return { isValid: true };
}
