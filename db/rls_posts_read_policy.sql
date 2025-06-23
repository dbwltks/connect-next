-- RLS policy to allow public read access to board_posts
CREATE POLICY "Allow public read access to board_posts"
ON public.board_posts
FOR SELECT
TO anon, authenticated
USING (true); 