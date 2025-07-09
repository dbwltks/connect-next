import { Skeleton } from "@/components/ui/skeleton";

export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-[10] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="xl:container px-4 xl:px-0 flex h-16 items-center">
        {/* 데스크톱 헤더 */}
        <div className="hidden md:flex items-center w-full">
          {/* 로고 영역 */}
          <div className="flex items-center">
            <Skeleton className="h-12 w-32" />
          </div>
          
          {/* 메뉴 영역 */}
          <nav className="flex-1 flex items-center justify-center">
            <div className="flex gap-8 items-center">
              {[...Array(4)].map((_, i: any) => (
                <Skeleton key={i} className="h-6 w-16" />
              ))}
            </div>
          </nav>
          
          {/* 우측 메뉴 */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>

        {/* 모바일 헤더 */}
        <div className="flex items-center w-full h-16 md:hidden">
          {/* 햄버거 메뉴 */}
          <div className="w-[56px] h-16 flex justify-center items-center">
            <Skeleton className="h-6 w-6" />
          </div>
          
          {/* 중앙 로고 */}
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="h-10 w-24" />
          </div>
          
          {/* 우측 메뉴 */}
          <div className="w-[70px] flex justify-end">
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </header>
  );
}