import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

export default function ArtworkDetailSkeleton() {
  const { user } = useAuth();
  const showPurchaseButtons = !user;

  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-transparent backdrop-blur-xl rounded-3xl shadow-lg md:shadow-2xl border border-white/20 overflow-hidden md:ring-1 ring-white/10 min-h-[85vh] animate-in fade-in duration-300">
          <div className="flex flex-col xl:flex-row h-full min-h-[85vh]">
            {/* Image section */}
            <div className="relative flex-1 flex items-center justify-center bg-gray-100 h-[50vh] md:h-[60vh] xl:min-h-[60vh] xl:h-auto overflow-hidden">
              <div className="relative w-full h-[50vh] md:h-[60vh] xl:h-full flex items-center justify-center p-4 sm:p-8">
                <Skeleton className="w-[90%] h-[85%] sm:w-[80%] sm:h-[90%] xl:w-[75%] xl:h-[85%] max-w-3xl rounded-lg md:rounded-xl shadow-lg md:shadow-2xl" />
              </div>
            </div>

            {/* Details section */}
            <div className="relative flex-shrink-0 w-full xl:w-[32rem] bg-gradient-to-br from-white via-white to-gray-50/80 backdrop-blur-xl p-4 sm:p-6 xl:p-8 flex flex-col border-l border-white/20">
              {/* Title + share button row */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <Skeleton className="h-8 sm:h-9 xl:h-10 w-3/4 rounded-lg" />
                <Skeleton className="h-11 w-11 sm:h-12 sm:w-12 rounded-full flex-shrink-0" />
              </div>

              {/* Artist section */}
              <div className="mb-6 sm:mb-8 bg-white/80 rounded-2xl p-3 sm:p-4 border border-indigo-100/50">
                <Skeleton className="h-3.5 w-14 mb-2" />
                <Skeleton className="h-7 w-2/5 rounded-md" />
              </div>

              {/* Price */}
              <div className="mb-6 sm:mb-8">
                <Skeleton className="h-10 w-36 rounded-2xl" />
              </div>

              {/* Scrollable content region */}
              <div className="flex-1 overflow-hidden space-y-6 sm:space-y-8">
                {/* Description */}
                <div className="bg-gray-50/60 rounded-2xl p-3 sm:p-4 border border-gray-200/50">
                  <Skeleton className="h-3.5 w-24 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    "Style",
                    "Material",
                    "Dimensions",
                    "Year",
                    "Added",
                  ].map((label) => (
                    <div key={label} className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/60">
                      <Skeleton className="h-3 w-14 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Purchase footer */}
              {showPurchaseButtons && (
                <div className="flex sm:justify-start border-t border-gray-200/50 bg-white/90 backdrop-blur-xl py-3 sm:py-4 mt-4 sm:mt-6">
                  <Skeleton className="h-11 w-full sm:w-60 rounded-md" />
                </div>
              )}

              {/* Back to gallery link row */}
              <div className="pt-4 sm:pt-6 border-t border-gray-200/50">
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
