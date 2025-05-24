import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: notes, error } = await supabase.from("notes").select();

  if (error) {
    return <div>에러 발생: {error.message}</div>;
  }

  return <pre>{JSON.stringify(notes, null, 2)}</pre>;
}
