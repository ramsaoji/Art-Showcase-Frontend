import { Skeleton } from "@/components/ui/skeleton";

export default function StatisticsSkeleton({ count = 3 }) {
  return (
    <section className="relative py-10 sm:py-20 overflow-hidden">
      {/* Background decoration — identical to real Statistics section */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
        </div>
      </div>

      <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header — mirrors "Our Growing Community" h2 + subtitle p */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          {/* h2: font-artistic text-4xl sm:text-5xl */}
          <Skeleton className="h-10 sm:h-12 w-3/4 max-w-md mx-auto mb-4 bg-gray-200" />
          {/* subtitle: font-sans text-lg max-w-2xl */}
          <Skeleton className="h-6 w-2/3 max-w-2xl mx-auto bg-gray-100" />
        </div>

        {/* Cards grid — mirrors grid-cols-1 sm:grid-cols-3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="relative pt-10 p-6 bg-gradient-to-br from-white/80 via-white/90 to-gray-50/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl"
            >
              {/* Floating icon badge — absolute -top-4 left-6, p-3 rounded-xl */}
              <div className="absolute -top-4 left-6">
                <Skeleton className="w-12 h-12 bg-indigo-200/80 rounded-xl shadow-lg" />
              </div>

              {/* Content — mirrors mt-4 block */}
              <div className="mt-0">
                {/* Value: font-artistic text-3xl font-bold */}
                <Skeleton className="h-9 w-24 bg-gray-300 rounded-md mb-2" />
                {/* Label: text-sm font-sans font-semibold uppercase tracking-wide */}
                <Skeleton className="h-4 w-28 bg-gray-200 rounded-md" />
                {/* Subtext: text-xs italic */}
                <Skeleton className="h-3 w-32 bg-gray-100 rounded-md mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
