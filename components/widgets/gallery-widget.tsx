import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IBoardPost, IPage, IWidget, IGalleryWidgetOptions } from "@/types/index";
import Link from "next/link";

interface GalleryWidgetProps {
  widget: IWidget & {
    display_options?: IGalleryWidgetOptions;
  };
  page?: IPage;
  posts?: IBoardPost[];
}

export function GalleryWidget({
  widget,
  page,
  posts = [],
}: GalleryWidgetProps) {
  const columns = widget.display_options?.columns || 4;
  const showTitle = widget.display_options?.show_title ?? true;
  const showDate = widget.display_options?.show_date ?? true;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{widget.title || page?.title || "갤러리"}</CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length > 0 ? (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {posts.map((post) => (
              <div
                key={post.id}
                className="group relative overflow-hidden rounded-lg aspect-square bg-gray-100"
              >
                {post.thumbnail ? (
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                    {showTitle && (
                      <h4 className="text-sm font-medium line-clamp-2">{post.title}</h4>
                    )}
                    {showDate && (
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-gray-500">등록된 게시물이 없습니다.</div>
        )}

        <div className="mt-4 text-center">
          <Link href={page?.slug || "/"} className="text-xs text-blue-600 hover:underline">
            더보기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
