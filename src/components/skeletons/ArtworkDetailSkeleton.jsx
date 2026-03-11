import { Skeleton } from "@/components/ui/skeleton";

export default function ArtworkDetailSkeleton() {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-transparent backdrop-blur-xl rounded-3xl shadow-lg md:shadow-2xl border border-white/20 overflow-hidden md:ring-1 ring-white/10 min-h-[85vh]">
          <div className="flex flex-col xl:flex-row h-full min-h-[85vh]">
            {/* Image Section Skeleton */}
            <div className="relative flex-1 flex items-center justify-center bg-gray-200/50 h-[50vh] md:h-[60vh] xl:min-h-[60vh] xl:h-auto animate-pulse">
                <Skeleton className="w-full h-full rounded-none" />
            </div>

            {/* Details Section Skeleton */}
            <div className="relative flex-shrink-0 w-full xl:w-[32rem] bg-gradient-to-br from-white via-white to-gray-50/80 backdrop-blur-xl p-4 sm:p-6 xl:p-8 flex flex-col border-l border-white/20">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <Skeleton className="h-10 w-3/4 rounded-lg" />
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>

              {/* Artist section */}
              <div className="mb-6 sm:mb-8 bg-indigo-50/50 rounded-2xl p-3 sm:p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-1/2 rounded-md" />
              </div>

              {/* Price */}
              <div className="mb-6 sm:mb-8">
                <Skeleton className="h-12 w-1/3 rounded-lg" />
              </div>

              {/* Description & Specs */}
              <div className="flex-1 space-y-6 sm:space-y-8">
                <div className="bg-gray-50/80 rounded-2xl p-3 sm:p-4">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white/60 rounded-xl p-3 sm:p-4">
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200/50">
                <Skeleton className="h-12 w-full sm:w-60 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
