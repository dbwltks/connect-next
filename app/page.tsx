import NewHomepage from "@/components/home/new-homepage";

// 고정 메뉴 데이터
const FIXED_MENU_ITEMS = [
  {
    id: "1",
    title: "교회소개",
    url: "/connect/about",
    submenu: [
      { id: "1-1", title: "교회소개", url: "/connect/about" },
      { id: "1-2", title: "인사말", url: "/connect/greeting" },
      { id: "1-3", title: "섬기는 사람들", url: "/connect/people" },
      { id: "1-4", title: "예배 및 위치안내", url: "/connect/church-info" },
    ],
  },
  {
    id: "2",
    title: "하나님과 커넥트",
    url: "/sermons/all-sermons",
    submenu: [
      { id: "2-1", title: "예배와 말씀", url: "/sermons/all-sermons" },
      { id: "2-2", title: "목회 컬럼 / 말씀 묵상", url: "/sermons/pastoral-column" },
      { id: "2-3", title: "BIBLE CONNECT IN", url: "/sermons/bcin" },
      { id: "2-4", title: "찬양과 간증", url: "/sermons/praise" },
    ],
  },
  {
    id: "3",
    title: "성도와 커넥트",
    url: "/connecting/info-board",
    submenu: [
      { id: "3-1", title: "교회소식", url: "/connecting/info-board" },
      { id: "3-2", title: "온라인 주보", url: "/connecting/weekly-bulletin" },
      { id: "3-3", title: "사진과 커넥트", url: "/connecting/in-pictures" },
      { id: "3-4", title: "미디어와 커넥트", url: "/connecting/media" },
      { id: "3-5", title: "일정표", url: "/connecting/calendar" },
    ],
  },
  {
    id: "4",
    title: "세상과 커넥트",
    url: "/mission/domestic-mission",
    submenu: [
      { id: "4-1", title: "국내 선교", url: "/mission/domestic-mission" },
      { id: "4-2", title: "국외 선교", url: "/mission/overseas-mission" },
      { id: "4-3", title: "협력 단체", url: "/mission/cooperating-group" },
    ],
  },
];

// 고정 배너 데이터
const FIXED_BANNERS = [
  {
    id: "1",
    title: "",
    subtitle: "",
    imageUrl: "https://www.youtube.com/watch?v=Xm48MdWq5sQ",
    image_height: "fullscreen",
    overlay_opacity: 0.3,
    hasButton: false,
    buttonText: "",
    buttonUrl: "",
  },
];

// 고정 위젯 데이터 (빈 배열 - 필요시 추가)
const FIXED_WIDGETS: any[] = [];

export default async function HomePage() {
  return <NewHomepage banners={FIXED_BANNERS} widgets={FIXED_WIDGETS} menuItems={FIXED_MENU_ITEMS} />;
}
