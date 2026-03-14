import { memo, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import PhotoIcon from "@heroicons/react/24/outline/PhotoIcon";
import StarIcon from "@heroicons/react/24/outline/StarIcon";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import StatisticsSkeleton from "@/components/skeletons/StatisticsSkeleton";
import { trackError } from "@/services/analytics";

// Custom INR Icon component
const INRIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const StatCard = memo(({ icon: Icon, label, value, subtext, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    className="relative p-6 bg-gradient-to-br from-white/80 via-white/90 to-gray-50/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
  >
    <div className="absolute -top-4 left-6">
      <div className="p-3 bg-gradient-to-br from-indigo-500/90 to-indigo-600/90 backdrop-blur-sm rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="mt-4">
      <div className="font-artistic text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
        {value?.toLocaleString() || "0"}
        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
          +
        </span>
      </div>
      <p className="mt-1 text-sm font-sans font-semibold text-gray-700 uppercase tracking-wide">
        {label}
      </p>
      {subtext && (
        <p className="mt-2 text-xs font-sans text-gray-500 italic">{subtext}</p>
      )}
    </div>
  </motion.div>
));


StatCard.displayName = "StatCard";

export default function Statistics() {
  const hasLoggedError = useRef(false);
  const { data, isLoading, error } =
    trpc.artwork.getArtworkStats.useQuery(undefined, {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
      onError: (err) => {
        if (!hasLoggedError.current) {
          trackError(
            getFriendlyErrorMessage(err) ||
              "An unexpected error occurred while fetching statistics.",
            "Statistics"
          );
          hasLoggedError.current = true;
        }
      },
    });
  useEffect(() => {
    if (!error) {
      hasLoggedError.current = false;
    }
  }, [error]);
  const { isSuperAdmin, isArtist } = useAuth();
  const {
    totalArtworksCount = 0,
    activeCount = 0,
    inactiveCount = 0,
    expiredCount = 0,
    featuredArtworksCount = 0,
    soldArtworksCount = 0,
  } = data ?? {};

  const allZero =
    totalArtworksCount === 0 &&
    featuredArtworksCount === 0 &&
    soldArtworksCount === 0;

  // Build cards array based on role
  const cards = useMemo(() => {
    const list = [
      {
        icon: PhotoIcon,
        label:
          isSuperAdmin || isArtist ? "Total Artworks" : "Artworks on Display",
        value: isSuperAdmin || isArtist ? totalArtworksCount : activeCount,
        subtext:
          isSuperAdmin || isArtist
            ? "All artworks in the system"
            : "Explore art from our community",
        delay: 0.1,
      },
    ];

    if (isSuperAdmin || isArtist) {
      list.push(
        {
          icon: PhotoIcon,
          label: "Active",
          value: activeCount,
          subtext: "Active artworks",
          delay: 0.15,
        },
        {
          icon: PhotoIcon,
          label: "Inactive",
          value: inactiveCount,
          subtext: "Inactive artworks",
          delay: 0.18,
        },
        {
          icon: PhotoIcon,
          label: "Expired",
          value: expiredCount,
          subtext: "Expired artworks",
          delay: 0.21,
        }
      );
    }

    list.push(
      {
        icon: StarIcon,
        label: "Featured Works",
        value: featuredArtworksCount,
        subtext: "Curated Selection",
        delay: 0.25,
      },
      {
        icon: INRIcon,
        label: "Artworks Sold",
        value: soldArtworksCount,
        subtext: "Finding new homes",
        delay: 0.3,
      }
    );
    return list;
  }, [
    isSuperAdmin,
    isArtist,
    totalArtworksCount,
    activeCount,
    inactiveCount,
    expiredCount,
    featuredArtworksCount,
    soldArtworksCount,
  ]);

  if (isLoading) {
    return <StatisticsSkeleton />;
  }

  if (error) {
    return null;
  }

  if (allZero) return null;

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
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-artistic text-4xl sm:text-5xl font-bold text-gray-900 tracking-wide mb-4"
          >
            Our Growing Community
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-sans text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Join our thriving community of artists and art enthusiasts
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {cards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
