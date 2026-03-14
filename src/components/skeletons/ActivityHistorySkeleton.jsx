import { Skeleton } from "@/components/ui/skeleton";

/**
 * ActivityHistorySkeleton
 *
 * Major-structure skeleton for Activity History page:
 * - Stats cards (4 cards)
 * - Search + export row
 * - Filters panel (3 filters)
 * - Timeline entries (simplified)
 */
export default function ActivityHistorySkeleton({
  count = 4,
  timelineOnly = false,
  statsOnly = false,
}) {
  const STAT_CARD_CLASS =
    "flex flex-col items-center justify-center bg-white/90 border border-gray-100 rounded-2xl shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300";

  const timelineSection = (
    <div className="relative border-l-2 border-dashed border-gray-200 ml-[22px] sm:ml-[30px] pl-[26px] sm:pl-[40px] flex flex-col gap-6 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="group relative">
          <div className="absolute -left-[39px] sm:-left-[56px] top-[12px] sm:top-[14px] w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center z-10">
            <Skeleton className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full" />
          </div>
          <div className="backdrop-blur-md border rounded-2xl shadow-sm bg-white/80 border-gray-100 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-40 sm:w-52" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const statsSection = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div className={STAT_CARD_CLASS}>
        <Skeleton className="h-7 w-12 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className={STAT_CARD_CLASS}>
        <Skeleton className="h-7 w-12 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className={STAT_CARD_CLASS}>
        <Skeleton className="h-7 w-12 mb-2" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className={STAT_CARD_CLASS}>
        <Skeleton className="h-5 w-16 mb-2 leading-tight" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );

  if (statsOnly) return statsSection;
  if (timelineOnly) return timelineSection;

  return (
    <>
      {/* ── Stats bar skeleton ───────────────────────────────── */}
      {statsSection}

      {/* ── Search + filter bar skeleton ───────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-[220px] max-w-xl">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        {/* <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div> */}
      </div>

      {/* ── Filters panel skeleton ─────────────────────────────── */}
      <div className="mb-6 bg-white/90 border border-gray-100 rounded-2xl shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* ── Activity log entries skeleton ─────────────────────── */}
      {timelineSection}
    </>
  );
}
