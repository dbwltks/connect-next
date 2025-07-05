import { createClient } from "@/utils/supabase/client";

// 콘텐츠(페이지) 단일 조회
export async function fetchContent(pageId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("id", pageId)
    .single();
  if (error) throw error;
  return data;
}

// 콘텐츠(페이지) 저장/수정
export async function saveContent({
  pageId,
  content,
  fullWidth,
}: {
  pageId: string;
  content: string;
  fullWidth: boolean;
}) {
  const supabase = createClient();
  const result = await supabase
    .from("cms_pages")
    .update({
      content,
      full_width: fullWidth,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId)
    .select(); // 업데이트된 row 반환
  console.log("saveContent result:", result);
  if (result.error) throw result.error;
  if (!result.data || result.data.length === 0) {
    throw new Error(
      "저장에 실패했습니다. (해당 id의 페이지가 존재하지 않거나 권한이 없습니다)"
    );
  }
  return result.data[0];
}

// 콘텐츠(페이지) 삭제
export async function deleteContent(pageId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("cms_pages").delete().eq("id", pageId);
  if (error) throw error;
}

// 콘텐츠(페이지) 여러 개 불러오기 (옵션)
export async function fetchContents(filter: any = {}) {
  const supabase = createClient();
  let query = supabase.from("cms_pages").select("*");
  Object.entries(filter).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// 콘텐츠(페이지) upsert (존재하면 update, 없으면 insert)
export async function upsertContent({
  pageId,
  content,
  fullWidth,
}: {
  pageId: string;
  content: string;
  fullWidth: boolean;
}) {
  // 먼저 해당 page가 존재하는지 확인
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cms_pages")
    .select("id")
    .eq("id", pageId)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116: no rows found

  if (data) {
    // 이미 있으면 update
    return await saveContent({ pageId, content, fullWidth });
  } else {
    // 없으면 insert
    const result = await supabase
      .from("cms_pages")
      .insert([
        {
          id: pageId,
          content,
          full_width: fullWidth,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    if (result.error) throw result.error;
    return result.data;
  }
}
