import { Card, CardContent } from "@/components/ui/card";
import { IPage, IWidget, IBannerWidgetOptions } from "@/types/index";

interface BannerWidgetProps {
  widget: IWidget & {
    display_options?: IBannerWidgetOptions;
  };
  page?: IPage;
}

export function BannerWidget({ widget, page }: BannerWidgetProps) {
  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-[21/9] bg-gradient-to-r from-blue-600 to-blue-400">
          {widget.display_options?.banner_image ? (
            <img
              src={widget.display_options.banner_image}
              alt={widget.display_options.banner_title || "배너"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h3 className="text-2xl font-bold mb-2">
                  {widget.display_options?.banner_title || "배너 제목"}
                </h3>
                <p className="text-sm opacity-90">
                  {widget.display_options?.banner_subtitle || "배너 부제목"}
                </p>
              </div>
            </div>
          )}
          {widget.display_options?.banner_link && (
            <a
              href={widget.display_options.banner_link}
              className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300"
              target="_blank"
              rel="noopener noreferrer"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
