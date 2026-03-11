import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminTableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="w-full bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-4 animate-in fade-in duration-300">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[600px] w-full text-left font-sans">
          <TableHeader className="bg-gray-50/80 border-b border-gray-100">
            <TableRow className="hover:bg-transparent border-0">
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i} className="px-5 py-4">
                  <Skeleton className={`h-4 ${i === 0 ? "w-32" : "w-24"}`} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow
                key={i}
                className="border-b border-gray-100/50 hover:bg-transparent"
              >
                {Array.from({ length: columns }).map((_, j) => (
                  <TableCell key={j} className="px-5 py-4">
                    {j === columns - 1 ? (
                      <div className="flex gap-2 justify-end">
                        <Skeleton className="h-8 w-16 rounded-md" />
                        <Skeleton className="h-8 w-16 rounded-md" />
                      </div>
                    ) : (
                      <Skeleton className={`h-4 ${j === 0 ? "w-40" : "w-28"} max-w-[150px]`} />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
