import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryGridSkeleton({ count = 8, className = "" }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 auto-rows-max ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="group relative bg-white/90 rounded-3xl shadow-lg border border-gray-100 flex flex-col h-[680px] overflow-hidden"
        >
          {/* Image skeleton */}
          <div className="relative h-[320px] rounded-t-3xl overflow-hidden bg-gray-100 flex-shrink-0">
            <Skeleton className="w-full h-full rounded-none" />
          </div>

          {/* Content skeleton */}
          <div className="p-6 flex-grow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-7 w-3/4 rounded-md" />
                  <Skeleton className="h-5 w-1/2 rounded-md" />
                </div>
                <Skeleton className="h-8 w-1/4 rounded-md" />
              </div>

              {/* Badges */}
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>

              {/* Description rows */}
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-4 w-4/6 rounded-md" />
              </div>
            </div>

            {/* Footer / buttons */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
