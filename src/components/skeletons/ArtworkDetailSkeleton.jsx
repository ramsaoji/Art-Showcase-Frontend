import { Skeleton } from "@/components/ui/skeleton";

export default function ArtworkDetailSkeleton() {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-transparent backdrop-blur-xl rounded-3xl shadow-lg md:shadow-2xl border border-white/20 overflow-hidden md:ring-1 ring-white/10 min-h-[85vh] animate-in fade-in duration-300">
          <div className="flex flex-col xl:flex-row h-full min-h-[85vh]">

            {/* ── Image Section ─────────────────────────────────── */}
            <div className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900/50 to-black/30 h-[50vh] md:h-[60vh] xl:min-h-[60vh] xl:h-auto overflow-hidden">
              {/* Blurred background fill */}
              <div className="absolute inset-0 w-full h-full">
                <Skeleton className="absolute inset-0 w-full h-full rounded-none bg-white/5" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-pink-600/30 mix-blend-overlay opacity-50" />
                <div className="absolute inset-0 bg-black/40" />
              </div>

              {/* Main image placeholder */}
              <div className="relative z-10 w-full h-[50vh] md:h-[60vh] xl:h-full flex items-center justify-center p-4 sm:p-8">
                <Skeleton className="w-[90%] h-[85%] sm:w-[80%] sm:h-[90%] xl:w-[75%] xl:h-[85%] max-w-3xl rounded-lg md:rounded-xl shadow-lg md:shadow-2xl bg-white/10 md:ring-1 md:ring-white/20" />
              </div>

              {/* Carousel prev/next nav buttons */}
              <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30">
                <Skeleton className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/15" />
              </div>
              <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30">
                <Skeleton className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/15" />
              </div>

              {/* Carousel dots indicator */}
              <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/30 rounded-full px-3 py-1.5">
                {[0, 1, 2].map((d) => (
                  <Skeleton key={d} className={`rounded-full bg-white/40 ${d === 0 ? "w-2.5 h-2.5" : "w-2 h-2 opacity-60"}`} />
                ))}
              </div>

              {/* Badges overlay — top-left (Featured / Sold) */}
              <div className="absolute top-4 left-4 z-30 flex gap-2 flex-wrap max-w-[calc(100%-5rem)]">
                <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
                <Skeleton className="h-6 w-14 rounded-full bg-white/20" />
              </div>

              {/* Status badge — top-right */}
              <div className="absolute top-4 right-4 z-30">
                <Skeleton className="h-6 w-20 rounded-full bg-white/15" />
              </div>
            </div>

            {/* ── Details Section ───────────────────────────────── */}
            <div className="relative flex-shrink-0 w-full xl:w-[32rem] bg-gradient-to-br from-white via-white to-gray-50/80 backdrop-blur-xl p-4 sm:p-6 xl:p-8 flex flex-col border-l border-white/20">

              {/* Title + share button row */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                {/* Title: font-artistic text-xl sm:text-2xl xl:text-3xl */}
                <Skeleton className="h-8 sm:h-9 xl:h-10 w-3/4 rounded-lg bg-gray-200/60" />
                {/* Share button: rounded-full h-11 w-11 sm:h-12 sm:w-12 */}
                <Skeleton className="h-11 w-11 sm:h-12 sm:w-12 rounded-full flex-shrink-0 bg-gray-200/60" />
              </div>

              {/* Artist section — indigo gradient box */}
              <div className="mb-6 sm:mb-8 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-2xl p-3 sm:p-4 border border-indigo-100/50">
                {/* "ARTIST" label: text-sm uppercase */}
                <Skeleton className="h-3.5 w-14 mb-2 bg-indigo-200/60" />
                {/* Artist name: font-artistic text-lg sm:text-xl */}
                <Skeleton className="h-7 w-2/5 rounded-md bg-indigo-200/60" />
              </div>

              {/* Price — DiscountPriceBadge size="lg" */}
              <div className="mb-6 sm:mb-8">
                <Skeleton className="h-10 w-36 rounded-2xl bg-gray-200/60" />
              </div>

              {/* Scrollable content region — flex-1 overflow-y-auto */}
              <div className="flex-1 overflow-hidden space-y-6 sm:space-y-8">

                {/* Description box */}
                <div className="bg-gray-50/80 rounded-2xl p-3 sm:p-4 border border-gray-200/50">
                  {/* "DESCRIPTION" label */}
                  <Skeleton className="h-3.5 w-24 mb-3 bg-gray-200/60" />
                  <Skeleton className="h-4 w-full mb-2 bg-gray-200/60" />
                  <Skeleton className="h-4 w-full mb-2 bg-gray-200/60" />
                  <Skeleton className="h-4 w-3/4 bg-gray-200/60" />
                </div>

                {/* Details grid — grid-cols-1 sm:grid-cols-2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Style, Material, Dimensions, Year — standard white tiles */}
                  {["Style", "Material", "Dimensions", "Year"].map((label) => (
                    <div key={label} className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60">
                      <Skeleton className="h-3 w-14 mb-2 bg-gray-200/60" />
                      <Skeleton className="h-4 w-20 bg-gray-200/60" />
                    </div>
                  ))}
                  {/* Instagram link tile — pink gradient */}
                  <div className="bg-gradient-to-r from-pink-50/80 to-purple-50/80 rounded-xl p-3 sm:p-4 border border-pink-200/60">
                    <Skeleton className="h-3 w-20 mb-2 bg-pink-200/60" />
                    <Skeleton className="h-4 w-28 bg-pink-200/60" />
                  </div>
                  {/* YouTube link tile — red gradient */}
                  <div className="bg-gradient-to-r from-red-50/80 to-orange-50/80 rounded-xl p-3 sm:p-4 border border-red-200/60">
                    <Skeleton className="h-3 w-24 mb-2 bg-red-200/60" />
                    <Skeleton className="h-4 w-28 bg-red-200/60" />
                  </div>
                </div>
              </div>

              {/* Purchase footer — border-t, py-3 sm:py-4, mt-4 sm:mt-6 */}
              <div className="flex sm:justify-start border-t border-gray-200/50 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl py-3 sm:py-4 mt-4 sm:mt-6">
                <Skeleton className="h-11 w-full sm:w-60 rounded-md bg-gray-200/60" />
              </div>

              {/* Back to gallery link row — pt-4 sm:pt-6 border-t */}
              <div className="pt-4 sm:pt-6 border-t border-gray-200/50">
                {/* Arrow icon + "Back to Gallery" text */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded bg-gray-200/60" />
                  <Skeleton className="h-4 w-28 rounded bg-gray-200/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
