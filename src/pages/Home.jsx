import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import ArrowRightIcon from "@heroicons/react/20/solid/ArrowRightIcon";
import { trpc } from "@/lib/trpc";
import EmptyState from "@/components/common/EmptyState";
import ImageModal from "@/components/artwork/ImageModal";
import ArtworkCard from "@/components/artwork/ArtworkCard";
import HeroCarousel from "@/components/sections/HeroCarousel";
import ErrorState from "@/components/common/ErrorState";
import GalleryGridSkeleton from "@/components/skeletons/GalleryGridSkeleton";
import {
  trackArtworkInteraction,
  trackUserAction,
  trackError,
} from "@/services/analytics";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import ScrollToTopButton from "@/components/layout/ScrollToTopButton";
import Statistics from "@/components/sections/Statistics";

// Hoist static animation variants outside component (rendering-hoist-jsx)
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

// Hoist static motion configurations
const motionViewport = { once: true };
const headerInitial = { opacity: 0, y: 20 };
const headerAnimate = { opacity: 1, y: 0 };
const headerTransition = { duration: 0.5 };
const titleTransition = { duration: 0.5, delay: 0.1 };
const descriptionTransition = { duration: 0.5, delay: 0.2 };
const viewAllTransition = { duration: 0.5, delay: 0.3 };

// Hoist static animation keyframes
const floatingAnimation1 = {
  y: [0, -10, 0],
  opacity: [0.5, 1, 0.5],
};
const floatingTransition1 = {
  duration: 3,
  repeat: Infinity,
  repeatType: "reverse",
};
const floatingAnimation2 = {
  y: [0, 10, 0],
  opacity: [0.5, 1, 0.5],
};
const floatingTransition2 = {
  duration: 2.5,
  repeat: Infinity,
  repeatType: "reverse",
};
const floatingAnimation3 = {
  scale: [1, 1.5, 1],
  opacity: [0.5, 1, 0.5],
};
const floatingTransition3 = {
  duration: 2,
  repeat: Infinity,
  repeatType: "reverse",
};

// Hoist static motion props for artwork cards
const artworkCardInitial = { opacity: 0, y: 20 };
const artworkCardAnimate = { opacity: 1, y: 0 };
const artworkCardExit = { opacity: 0, y: -20 };

// Helper to create transition with delay (avoids object creation in loop)
const getArtworkTransition = (index) => ({
  delay: index * 0.1,
  duration: 0.3,
});

export default function Home() {
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const hasLoggedError = useRef(false);

  const {
    data: featuredArtworks = [],
    isLoading,
    refetch,
    error,
  } = trpc.artwork.getFeaturedArtworks.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
    onError: (err) => {
      if (!hasLoggedError.current) {
        trackError(
          getFriendlyErrorMessage(err) || "Failed to load featured artworks.",
          "HomeFeaturedArtworks"
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

  const handleDelete = useCallback(
    (deletedId) => {
      refetch();
      if (selectedArtwork?.id === deletedId) {
        setSelectedArtwork(null);
      }
      trackArtworkInteraction("featured_artwork_delete_from_home", deletedId);
    },
    [refetch, selectedArtwork?.id]
  );

  // Memoize event handlers for stable references (rerender-functional-setstate)
  const handleViewAllClick = useCallback(() => {
    trackUserAction("view_all_featured");
  }, []);

  const handleArtworkSelect = useCallback((artwork) => {
    setSelectedArtwork(artwork);
    trackArtworkInteraction("quick_view_from_home", artwork.id, artwork.title);
  }, []);

  // Memoize selected artwork index to avoid repeated findIndex calls (js-cache-function-results)
  const selectedArtworkIndex = useMemo(() => {
    if (!selectedArtwork) return -1;
    return featuredArtworks.findIndex((artwork) => artwork.id === selectedArtwork.id);
  }, [selectedArtwork, featuredArtworks]);

  // Memoize modal navigation handlers (rerender-functional-setstate)
  const handlePrevious = useCallback(() => {
    if (selectedArtworkIndex > 0) {
      const prevArtwork = featuredArtworks[selectedArtworkIndex - 1];
      setSelectedArtwork(prevArtwork);
      trackArtworkInteraction(
        "view_previous_from_home",
        prevArtwork.id,
        prevArtwork.title
      );
    }
  }, [selectedArtworkIndex, featuredArtworks]);

  const handleNext = useCallback(() => {
    if (selectedArtworkIndex < featuredArtworks.length - 1) {
      const nextArtwork = featuredArtworks[selectedArtworkIndex + 1];
      setSelectedArtwork(nextArtwork);
      trackArtworkInteraction(
        "view_next_from_home",
        nextArtwork.id,
        nextArtwork.title
      );
    }
  }, [selectedArtworkIndex, featuredArtworks]);

  // Memoize modal close handler (rerender-functional-setstate)
  const handleModalClose = useCallback(() => {
    setSelectedArtwork(null);
  }, []);

  return (
    <div className="bg-white/40">
      {/* Hero Section */}
      <div className="relative">
        <HeroCarousel />
      </div>

      {/* Featured Artworks Section */}
      <section className="relative py-10 sm:py-20 overflow-hidden bg-white/50">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white/95" />
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white" />
          <div className="absolute -top-96 left-1/2 transform -translate-x-1/2">
            <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-100/40 to-purple-100/40 blur-3xl" />
          </div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute left-0 bottom-0 w-96 h-96 bg-gradient-to-tr from-amber-500/10 to-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ">
          <div className="flex flex-col items-center text-center mb-16 sm:mb-20 ">
            <motion.div
              initial={headerInitial}
              whileInView={headerAnimate}
              viewport={motionViewport}
              transition={headerTransition}
              className="relative flex items-center justify-center gap-2 text-indigo-600 font-body italic text-2xl mb-6 px-4 sm:px-16 w-full"
            >
              {/* Decorative elements */}
              <div className="absolute left-0 -top-8 w-20 h-20 bg-gradient-to-tr from-amber-500/20 to-pink-500/20 rounded-full blur-xl" />
              <div className="absolute right-0 -top-8 w-20 h-20 bg-gradient-to-tl from-indigo-500/20 to-purple-500/20 rounded-full blur-xl" />
              <div className="absolute left-1/2 -translate-x-1/2 -top-4 w-32 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-full blur-2xl" />

              {/* Decorative lines */}
              <div className="relative flex items-center gap-3 sm:gap-4 min-w-0">
                <span className="hidden sm:block w-12 sm:w-16 h-[2px] bg-indigo-600/50 rounded-full" />
                <div className="relative whitespace-nowrap">
                  <span className="relative z-10">Curated Selection</span>
                  {/* Decorative brush stroke */}
                  <svg
                    className="absolute -bottom-3 left-0 w-full h-3 text-indigo-600/20"
                    viewBox="0 0 100 12"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,0 Q25,12 50,6 T100,0"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                  </svg>
                </div>
                <span className="hidden sm:block w-12 sm:w-16 h-[2px] bg-indigo-600/50 rounded-full" />
              </div>

              {/* Additional floating elements */}
              <motion.div
                className="absolute -left-8 top-1/2 w-4 h-4 rounded-full bg-indigo-400/30"
                animate={floatingAnimation1}
                transition={floatingTransition1}
              />
              <motion.div
                className="absolute -right-8 top-1/2 w-4 h-4 rounded-full bg-amber-400/30"
                animate={floatingAnimation2}
                transition={floatingTransition2}
              />
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 -bottom-4 w-3 h-3 rounded-full bg-rose-400/30"
                animate={floatingAnimation3}
                transition={floatingTransition3}
              />
            </motion.div>

            <motion.h2
              initial={headerInitial}
              whileInView={headerAnimate}
              viewport={motionViewport}
              transition={titleTransition}
              className="font-artistic text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6"
            >
              Featured Artworks
            </motion.h2>

            <motion.p
              initial={headerInitial}
              whileInView={headerAnimate}
              viewport={motionViewport}
              transition={descriptionTransition}
              className="text-xl text-gray-600 max-w-2xl leading-relaxed font-sans"
            >
              Discover our handpicked selection of exceptional pieces that
              showcase the finest in contemporary art.
            </motion.p>
          </div>

          {isLoading ? (
            <div className="space-y-8">
              <GalleryGridSkeleton count={3} className="!grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-3 xl:!grid-cols-3 !gap-8 sm:!gap-10" />
            </div>
          ) : error ? (
            <div className="max-w-xl mx-auto">
              <ErrorState
                variant="plain"
                title="Failed to load featured artworks"
                description={
                  getFriendlyErrorMessage(error) ||
                  "An unexpected error occurred while fetching featured artworks."
                }
                primaryAction={
                  <Button
                    variant="default"
                    className="rounded-full px-8 font-artistic text-base"
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                }
                secondaryAction={
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full px-6 font-artistic text-base"
                  >
                    <Link to="/gallery">Browse Gallery</Link>
                  </Button>
                }
              />
            </div>
          ) : featuredArtworks.length === 0 ? (
            <EmptyState
              title="No featured artworks"
              description="No artworks have been featured yet. Browse the full gallery to explore our collection."
              action={
                <Button asChild variant="default" className="rounded-full px-8 font-artistic text-base">
                  <Link to="/gallery">Browse Gallery</Link>
                </Button>
              }
            />
          ) : (
            <>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10"
                variants={container}
                initial="hidden"
                animate="show"
              >
                <AnimatePresence>
                  {featuredArtworks.map((artwork, index) => (
                    <motion.div
                      key={artwork.id}
                      initial={artworkCardInitial}
                      animate={artworkCardAnimate}
                      exit={artworkCardExit}
                      transition={getArtworkTransition(index)}
                    >
                      <ArtworkCard
                        key={artwork.id}
                        artwork={artwork}
                        onDelete={handleDelete}
                        onQuickView={handleArtworkSelect}
                        priority={index < 3} // Prioritize loading for first 3 images
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={headerInitial}
                whileInView={headerAnimate}
                viewport={motionViewport}
                transition={viewAllTransition}
                className="mt-16 text-center"
              >
                <Button asChild variant="outline" className="rounded-full px-8 py-3 h-auto border-2 border-indigo-600/20 bg-white/80 backdrop-blur-sm font-artistic text-lg text-indigo-600 hover:bg-indigo-50/80">
                  <Link to="/gallery?featured=featured" onClick={handleViewAllClick}>
                    View All Featured Works
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            </>
          )}
        </div>
      </section>

      {/* Stats Section - Data loading handled internally */}
      <Statistics />

      {selectedArtwork && (
        <ImageModal
          isOpen={!!selectedArtwork}
          onClose={handleModalClose}
          image={selectedArtwork}
          onPrevious={handlePrevious}
          onNext={handleNext}
          hasPrevious={selectedArtworkIndex > 0}
          hasNext={selectedArtworkIndex < featuredArtworks.length - 1}
        />
      )}
      <ScrollToTopButton />
    </div>
  );
}
