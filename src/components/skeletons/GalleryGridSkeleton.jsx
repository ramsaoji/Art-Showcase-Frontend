import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryGridSkeleton({ count = 8, className = "" }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative bg-white/90 rounded-3xl shadow-2xl border border-white/20 ring-1 ring-white/10 flex flex-col h-[680px] overflow-hidden animate-in fade-in duration-300"
        >
          {/* Image section */}
          <div className="relative h-[320px] rounded-t-3xl overflow-hidden bg-gray-100 flex-shrink-0">
            <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
          </div>

          {/* Content section */}
          <div className="relative p-6 flex-grow bg-gradient-to-br from-white via-white to-gray-50/80 flex flex-col">
            <div className="flex flex-col h-full">
              {/* Title + price row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-7 w-3/4 rounded-md" />
                  <div className="flex items-center gap-2 mt-1">
                    <Skeleton className="h-5 w-28 rounded-md" />
                    <Skeleton className="h-4 w-10 rounded-md" />
                  </div>
                </div>
                <div className="flex-shrink-0 space-y-1 text-right">
                  <Skeleton className="h-6 w-20 rounded-md" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 mb-4">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-4 w-4/6 rounded-md" />
              </div>

              {/* Meta tags */}
              <div className="flex flex-wrap items-center gap-2 mt-auto pb-4">
                <Skeleton className="h-6 w-16 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-xl" />
                <Skeleton className="h-6 w-24 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Purchase footer */}
          <div className="px-6 py-3 border-t border-gray-200/50 bg-white/90 rounded-b-3xl flex-shrink-0">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
