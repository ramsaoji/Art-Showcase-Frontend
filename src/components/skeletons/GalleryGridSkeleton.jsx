import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryGridSkeleton({ count = 8, className = "" }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative bg-white/90 rounded-3xl shadow-2xl border border-white/20 ring-1 ring-white/10 flex flex-col h-[680px] overflow-hidden animate-in fade-in duration-300"
        >
          {/* Image section — mirrors h-[320px] rounded-t-3xl in ArtworkCard */}
          <div className="relative h-[320px] rounded-t-3xl overflow-hidden bg-gradient-to-br from-gray-900/50 to-black/30 flex-shrink-0">
            <Skeleton className="absolute inset-0 w-full h-full rounded-none bg-gray-200/80" />
            {/* Gradient overlay — same as real card */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            {/* Two overlay action buttons row — mirrors "Quick View" + "View Details" */}
            <div className="absolute bottom-0 inset-x-0 p-4 flex gap-2 justify-center">
              <Skeleton className="flex-1 min-w-[120px] max-w-[140px] h-9 rounded-xl bg-white/20" />
              <Skeleton className="flex-1 min-w-[120px] max-w-[140px] h-9 rounded-xl bg-indigo-500/30" />
            </div>
          </div>

          {/* Content section — mirrors p-6 flex-grow */}
          <div className="relative p-6 flex-grow bg-gradient-to-br from-white via-white to-gray-50/80 flex flex-col">
            <div className="flex flex-col h-full">
              {/* Title + Price row — mirrors flex items-start justify-between */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title — font-artistic text-2xl */}
                  <Skeleton className="h-7 w-3/4 rounded-md" />
                  {/* Artist name + year — font-artistic text-lg + bullet + year */}
                  <div className="flex items-center gap-2 mt-1">
                    <Skeleton className="h-5 w-28 rounded-md" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-10 rounded-md" />
                  </div>
                </div>
                {/* Price — DiscountPriceBadge flex-shrink-0 */}
                <div className="flex-shrink-0 space-y-1 text-right">
                  <Skeleton className="h-6 w-20 rounded-md" />
                </div>
              </div>

              {/* Description — line-clamp-3 */}
              <div className="space-y-2 mb-4">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-4 w-4/6 rounded-md" />
              </div>

              {/* Meta-tags row — style / material / dimensions chips */}
              <div className="flex flex-wrap items-center gap-2 mt-auto pb-4">
                <Skeleton className="h-6 w-16 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-xl" />
                <Skeleton className="h-6 w-24 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Purchase footer — mirrors PurchaseFooter border-t row */}
          <div className="px-6 py-3 border-t border-gray-200/50 bg-gradient-to-r from-white/90 to-gray-50/90 rounded-b-3xl flex-shrink-0">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
