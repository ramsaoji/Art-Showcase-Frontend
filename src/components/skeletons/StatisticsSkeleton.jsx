import { Skeleton } from "@/components/ui/skeleton";

export default function StatisticsSkeleton({ count = 3 }) {
  return (
    <section className="relative py-10 sm:py-20 overflow-hidden">
      <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Skeleton className="h-10 sm:h-12 w-3/4 max-w-md mx-auto mb-4" />
          <Skeleton className="h-6 w-2/3 max-w-2xl mx-auto" />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="relative pt-10 p-6 bg-white/90 rounded-2xl border border-gray-100 shadow-xl"
            >
              <div className="absolute -top-4 left-6">
                <Skeleton className="w-12 h-12 rounded-xl shadow-lg" />
              </div>
              <div className="mt-0">
                <Skeleton className="h-9 w-24 rounded-md mb-2" />
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-3 w-32 rounded-md mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
