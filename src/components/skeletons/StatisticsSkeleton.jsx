import { Skeleton } from "@/components/ui/skeleton";

export default function StatisticsSkeleton() {
  return (
    <section className="relative py-10 sm:py-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
        </div>
      </div>

      <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Skeleton className="h-10 sm:h-12 w-3/4 max-w-md mx-auto mb-4 bg-gray-200" />
          <Skeleton className="h-6 w-2/3 max-w-sm mx-auto bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="relative p-6 bg-gradient-to-br from-white/50 via-white/60 to-gray-50/50 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl"
            >
              {/* Icon placeholder */}
              <div className="absolute -top-4 left-6">
                <Skeleton className="w-12 h-12 bg-gray-200 rounded-xl shadow-lg" />
              </div>

              {/* Content placeholder */}
              <div className="mt-4">
                <Skeleton className="h-10 w-24 bg-gray-300 rounded-md mb-2" />
                <Skeleton className="h-4 w-28 bg-gray-200 rounded-md" />
                <Skeleton className="h-3 w-24 bg-gray-200 rounded-md mt-3 opacity-60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
