import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityHistorySkeleton({ count = 4 }) {
  return (
    <div className="relative border-l-2 border-dashed border-gray-100 ml-[22px] sm:ml-[30px] pl-[26px] sm:pl-[40px] flex flex-col gap-6 py-2 mt-8 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="group relative">
          {/* Outer Floating Icon Node */}
          <div className="absolute -left-[43px] sm:-left-[61px] top-[14px] sm:top-[16px] w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 border-white ring-1 ring-gray-100 bg-gray-50 flex items-center justify-center z-10">
             <Skeleton className="w-4 h-4 sm:w-5 sm:h-5 rounded-md" />
          </div>

          {/* Card Content Container */}
          <div className="backdrop-blur-md border rounded-2xl shadow-sm bg-white/50 border-gray-100 p-4 sm:p-5 pb-4">
            <div className="min-w-0 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Action badge */}
                <Skeleton className="h-5 w-24 rounded-full" />
                
                {/* Status badge (optional) */}
                {i % 3 === 0 && <Skeleton className="h-5 w-16 rounded-full" />}
                
                {/* Target label */}
                <Skeleton className="h-4 w-40 max-w-[200px]" />
                
                {/* Timestamp */}
                <span className="ml-auto flex items-center gap-1.5 shrink-0">
                  <Skeleton className="h-3 w-16" />
                </span>
              </div>
              
              {/* Metadata summary line */}
              <Skeleton className="h-4 w-2/3 max-w-sm mt-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
