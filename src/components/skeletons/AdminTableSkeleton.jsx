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
 * AdminTableSkeleton
 *
 * Props:
 *   rows         — number of skeleton rows (default 5)
 *   columns      — total column count including the actions column (default 6, matches ActivityLogs)
 *                  ArtistApprovals = 7, ArtistQuotaLimits = 4, ActivityLogs = 6
 *   actionButtons — number of action button placeholders in the last column (default 2)
 *                  ArtistApprovals = up to 3, ArtistQuotaLimits = 1, ActivityLogs = chevron (1)
 */
export default function AdminTableSkeleton({ rows = 5, columns = 6, actionButtons = 2 }) {
  const dataColumns = columns - 1;

  return (
    <div className="w-full bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-4 animate-in fade-in duration-300">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[700px] w-full text-left font-sans">
          <TableHeader className="bg-gray-50/80 border-b border-gray-100">
            <TableRow className="hover:bg-transparent border-0">
              {Array.from({ length: dataColumns }).map((_, i) => (
                <TableHead key={i} className="px-5 py-4">
                  <Skeleton className={`h-3.5 ${i === 0 ? "w-32" : i === 1 ? "w-28" : "w-20"}`} />
                </TableHead>
              ))}
              {/* Actions column header */}
              <TableHead className="px-5 py-4">
                <Skeleton className="h-3.5 w-16" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow
                key={i}
                className="border-b border-gray-100/50 hover:bg-transparent"
              >
                {Array.from({ length: dataColumns }).map((_, j) => (
                  <TableCell key={j} className="px-5 py-4">
                    {/* First two columns: text cells (name, email) */}
                    {j <= 1 ? (
                      <Skeleton className={`h-4 ${j === 0 ? "w-36" : "w-44"} max-w-[180px]`} />
                    ) : (
                      /* Middle columns: often badge cells (Verified, Active, Approved, count) */
                      <Skeleton className="h-5 w-16 rounded-full" />
                    )}
                  </TableCell>
                ))}
                {/* Actions cell */}
                <TableCell className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: actionButtons }).map((_, k) => (
                      <Skeleton key={k} className="h-7 w-[88px] rounded-md" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
