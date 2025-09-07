# Widget Settings 분리 구조

각 위젯별 설정을 별도 파일로 분리하여 관리하는 구조입니다.

## 폴더 구조

```
widget-settings/
├── index.tsx                   # 메인 라우터 컴포넌트
├── types.ts                   # 공통 타입 정의
├── RecentCommentsSettings.tsx # 최근 댓글 위젯 설정
├── PopularPostsSettings.tsx   # 인기 게시글 위젯 설정
├── MediaSettings.tsx          # 미디어 위젯 설정 (TODO)
├── BoardSettings.tsx          # 게시판 위젯 설정 (TODO)
└── ... (다른 위젯들)
```

## 사용 방법

1. **새 위젯 설정 파일 생성**:
   ```tsx
   // MyWidgetSettings.tsx
   "use client";
   
   import { WidgetSettingsComponentProps } from "./types";
   
   export function MyWidgetSettings({ widget, onSave }: WidgetSettingsComponentProps) {
     const updateWidget = (updates: any) => {
       const updatedWidget = { ...widget, ...updates };
       onSave(updatedWidget);
     };
   
     return (
       <div className="space-y-4">
         <h4 className="font-medium text-sm">My Widget 설정</h4>
         {/* 설정 UI */}
       </div>
     );
   }
   ```

2. **index.tsx에 추가**:
   ```tsx
   import { MyWidgetSettings } from "./MyWidgetSettings";
   
   // switch문에 케이스 추가
   case "my-widget":
     return <MyWidgetSettings {...commonProps} />;
   ```

3. **기존 WidgetSettings.tsx에서 조건 추가**:
   ```tsx
   {(editingWidget.type === "my-widget") && (
     <WidgetSettingsRenderer ... />
   )}
   ```

## 완료된 위젯

- ✅ `recent-comments` - 최근 댓글 위젯
- ✅ `popular-posts` - 인기 게시글 위젯

## TODO: 분리할 위젯들

- [ ] `page` - 페이지 위젯
- [ ] `board` - 게시판 목록 위젯
- [ ] `board-section` - 게시판 섹션 위젯
- [ ] `media` - 미디어 위젯
- [ ] `location` - 위치 위젯
- [ ] `menu-list` - 메뉴 목록 위젯
- [ ] `login` - 로그인 위젯
- [ ] `strip` - 스트립 위젯
- [ ] `carousel` - 캐러셀 위젯
- [ ] `calendar` - 캘린더 위젯
- [ ] `simple-calendar` - 간단 캘린더 위젯
- [ ] `programs` - 프로그램 위젯

## 장점

1. **코드 분리**: 각 위젯 설정이 독립된 파일로 관리
2. **유지보수성**: 특정 위젯 설정만 수정하기 쉬움
3. **재사용성**: 설정 컴포넌트를 다른 곳에서도 사용 가능
4. **타입 안정성**: 위젯별 타입 정의 가능
5. **코드 가독성**: 큰 파일을 작은 단위로 분할