import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * ActivityLogsSkeleton
 *
 * Major-structure skeleton for Activity Logs page:
 * - Stats cards (4 cards)
 * - Search + export row
 * - Filters panel (4 filters)
 * - Table rows (simplified)
 */
export default function ActivityLogsSkeleton({
  rows = 5,
  tableOnly = false,
  statsOnly = false,
}) {
  const tableSection = (
    <div className="w-full bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden pb-2 mb-4">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[820px] w-full text-left font-sans">
          <TableHeader className="bg-gray-50/80 border-b border-gray-100">
            <TableRow className="hover:bg-transparent border-0">
              <TableHead className="w-[15%] px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                <Skeleton className="h-3.5 w-20" />
              </TableHead>
              <TableHead className="w-[20%] px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                <Skeleton className="h-3.5 w-12" />
              </TableHead>
              <TableHead className="w-[12%] px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                <Skeleton className="h-3.5 w-14" />
              </TableHead>
              <TableHead className="w-[38%] px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                <Skeleton className="h-3.5 w-16" />
              </TableHead>
              <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                <Skeleton className="h-3.5 w-12" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow
                key={i}
                className="group border-b border-gray-100 hover:bg-gray-50/50 bg-white"
              >
                <TableCell className="px-4 py-3 sm:py-3.5 whitespace-nowrap align-middle">
                  <Skeleton className="h-3.5 w-20 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </TableCell>
                <TableCell className="px-4 py-3 sm:py-3.5 whitespace-nowrap align-middle max-w-[160px]">
                  <Skeleton className="h-3.5 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </TableCell>
                <TableCell className="px-4 py-3 sm:py-3.5 whitespace-nowrap align-middle">
                  <Skeleton className="h-3.5 w-20" />
                </TableCell>
                <TableCell className="px-4 py-3 sm:py-3.5 align-middle max-w-[160px]">
                  <Skeleton className="h-3.5 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </TableCell>
                <TableCell className="px-4 py-3 sm:py-3.5 whitespace-nowrap align-middle">
                  <Skeleton className="h-3.5 w-16" />
                </TableCell>
                <TableCell className="px-4 py-3 sm:py-3.5 align-middle">
                  <Skeleton className="h-3.5 w-4" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const statsSection = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center bg-white/90 border border-gray-100 rounded-2xl shadow-sm p-5 min-w-0"
        >
          <Skeleton className={`h-6 w-16 mb-2`} />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );

  if (statsOnly) return statsSection;
  if (tableOnly) return tableSection;

  return (
    <>
      {/* ── Stats bar skeleton ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center bg-white/90 border border-gray-100 rounded-2xl shadow-sm p-5 min-w-0"
          >
            <Skeleton className={`h-6 w-16 mb-2`} />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>

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
      <div className="mb-5 bg-white/90 border border-gray-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* ── Table skeleton ─────────────────────────────────────── */}
      {tableSection}
    </>
  );
}
