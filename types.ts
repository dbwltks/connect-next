export interface IWidget {
  id: string;
  type: string;
  title?: string;
  content?: string;
  settings?: any;
  column_position: number;
  order: number;
  width: number;
  height?: number;
  display_options?: {
    item_count?: number;
    sort_by?: "views" | "likes" | "comments";

    // LocationWidget
    location_title?: string;
    location_subtitle?: string;
    address?: string;
    phone?: string;
    email?: string;
    map_url?: string;
    embed_map_url?: string;

    [key: string]: any; // 다른 위젯의 display_options도 허용
  };
  is_active: boolean;
  page_id?: string | null;
}
