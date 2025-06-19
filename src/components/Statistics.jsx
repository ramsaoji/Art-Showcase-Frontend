import { memo } from "react";
import { motion } from "framer-motion";
import { PhotoIcon, StarIcon } from "@heroicons/react/24/outline";
import { trpc } from "../utils/trpc";
import { useAuth } from "../contexts/AuthContext";
// import Loader from "./ui/Loader";

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
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="relative p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-shadow duration-300"
  >
    <div className="absolute -top-4 left-6">
      <div className="p-3 bg-indigo-600/90 backdrop-blur-sm rounded-xl shadow-lg">
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="mt-4">
      <div className="font-artistic text-3xl font-bold text-gray-900">
        {value?.toLocaleString() || "0"}
        <span className="text-indigo-600">+</span>
      </div>
      <p className="mt-1 text-sm font-sans text-gray-600">{label}</p>
      {subtext && (
        <p className="mt-2 text-xs font-sans text-gray-500 italic">{subtext}</p>
      )}
    </div>
  </motion.div>
));

const SkeletonCard = ({ delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="relative p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-shadow duration-300 animate-pulse"
  >
    {/* Icon placeholder */}
    <div className="absolute -top-4 left-6">
      <div className="p-3 bg-gray-300 rounded-xl shadow-lg w-12 h-12" />
    </div>

    {/* Content placeholder */}
    <div className="mt-4">
      <div className="h-10 w-24 bg-gray-300 rounded-md mb-2" />
      <div className="h-4 w-28 bg-gray-200 rounded-md" />
      <div className="h-3 w-24 bg-gray-200 rounded-md mt-3" />
    </div>
  </motion.div>
);

StatCard.displayName = "StatCard";

export default function Statistics() {
  const { data, isLoading, error } = trpc.artwork.getArtworkStats.useQuery();
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
  const cards = [
    {
      icon: PhotoIcon,
      label: isSuperAdmin || isArtist ? "Total Artworks" : "Active Artworks",
      value: isSuperAdmin || isArtist ? totalArtworksCount : activeCount,
      subtext:
        isSuperAdmin || isArtist
          ? "All artworks in the system"
          : "Currently available to the public",
      delay: 0.1,
    },
  ];

  if (isSuperAdmin || isArtist) {
    cards.push(
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

  cards.push(
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

  // if (isLoading) {
  //   return (
  //     <section className="py-20 px-4 text-center flex flex-col items-center justify-center gap-6">
  //       <Loader size="medium" />
  //       <p className="text-gray-500 font-sans text-sm">Loading statistics...</p>
  //     </section>
  //   );
  // }

  if (isLoading) {
    return (
      <section className="relative py-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl" />
          </div>
        </div>

        <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="font-artistic text-4xl sm:text-5xl font-bold text-gray-400 tracking-wide mb-4">
              Our Growing Community
            </div>
            <div className="font-sans text-lg text-gray-400 max-w-2xl mx-auto">
              Loading community stats...
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[0.1, 0.2, 0.3].map((delay) => (
              <SkeletonCard key={delay} delay={delay} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl font-sans text-sm"
          >
            {error.message ||
              "An unexpected error occurred while fetching statistics."}
          </motion.div>
        </div>
      </section>
    );
  }

  if (allZero) return null;

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl" />
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
