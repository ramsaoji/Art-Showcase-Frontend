import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightIcon, HeartIcon, StarIcon } from "@heroicons/react/20/solid";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import ImageModal from "../components/ImageModal";
import ArtworkCard from "../components/ArtworkCard";
import HeroCarousel from "../components/HeroCarousel";
import Alert from "../components/Alert";
import Loader from "../components/ui/Loader";

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

export default function Home() {
  const [featuredArtworks, setFeaturedArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeaturedArtworks = async () => {
      setLoading(true);
      try {
        const artworksQuery = query(
          collection(db, "artworks"),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(artworksQuery);
        const allArtworks = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }));

        const featuredArtworks = allArtworks
          .filter((artwork) => artwork.featured === true)
          .slice(0, 3);

        setFeaturedArtworks(featuredArtworks);
      } catch (err) {
        console.error("Error loading featured artworks:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedArtworks();
  }, []);

  const handleDelete = (deletedId) => {
    setFeaturedArtworks((prev) =>
      prev.filter((artwork) => artwork.id !== deletedId)
    );
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative">
        <HeroCarousel />
      </div>

      {/* Featured Artworks Section */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
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

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-16 sm:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
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
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
              <motion.div
                className="absolute -right-8 top-1/2 w-4 h-4 rounded-full bg-amber-400/30"
                animate={{
                  y: [0, 10, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 -bottom-4 w-3 h-3 rounded-full bg-rose-400/30"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-artistic text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6"
            >
              Featured Artworks
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-body text-xl text-gray-600 max-w-2xl leading-relaxed"
            >
              Discover our handpicked selection of exceptional pieces that
              showcase the finest in contemporary art.
            </motion.p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader size="large" />
            </div>
          ) : error ? (
            <div className="max-w-2xl mx-auto">
              <Alert
                type="error"
                message={error}
                className="text-center py-8"
              />
            </div>
          ) : featuredArtworks.length === 0 ? (
            <motion.div
              className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <PhotoIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 font-artistic text-xl font-semibold text-gray-900">
                No featured artworks
              </h3>
              <p className="mt-2 font-body text-gray-500">
                Check back later for our featured collection.
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                  {/* Large gradient orbs */}
                  <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-500/10 to-pink-500/10 blur-3xl" />
                  <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-indigo-500/10 to-purple-500/10 blur-3xl" />

                  {/* Animated floating elements */}
                  <motion.div
                    className="absolute top-1/3 left-1/4 w-32 h-32"
                    animate={{
                      y: [-20, 20, -20],
                      rotate: [0, 45, 0],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-indigo-500/5 to-purple-500/5 blur-2xl" />
                  </motion.div>

                  <motion.div
                    className="absolute bottom-1/3 right-1/4 w-40 h-40"
                    animate={{
                      y: [20, -20, 20],
                      rotate: [0, -45, 0],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-amber-500/5 to-pink-500/5 blur-2xl" />
                  </motion.div>

                  {/* Decorative patterns */}
                  <svg
                    className="absolute top-1/2 left-0 w-40 h-40 text-indigo-500/5"
                    viewBox="0 0 100 100"
                  >
                    <pattern
                      id="grid"
                      x="0"
                      y="0"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </pattern>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>

                  <svg
                    className="absolute bottom-0 right-0 w-40 h-40 text-amber-500/5"
                    viewBox="0 0 100 100"
                  >
                    <pattern
                      id="dots"
                      x="0"
                      y="0"
                      width="10"
                      height="10"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="5" cy="5" r="1" fill="currentColor" />
                    </pattern>
                    <rect width="100" height="100" fill="url(#dots)" />
                  </svg>

                  {/* Animated lines */}
                  <motion.div
                    className="absolute top-0 left-1/2 w-[1px] h-32 bg-gradient-to-b from-indigo-500/0 via-indigo-500/10 to-indigo-500/0"
                    animate={{
                      scaleY: [1, 1.5, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  />
                  <motion.div
                    className="absolute bottom-0 left-1/3 w-[1px] h-40 bg-gradient-to-b from-amber-500/0 via-amber-500/10 to-amber-500/0"
                    animate={{
                      scaleY: [1, 1.3, 1],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  />
                </div>

                <AnimatePresence>
                  {featuredArtworks.map((artwork) => (
                    <ArtworkCard
                      key={artwork.id}
                      artwork={artwork}
                      onDelete={handleDelete}
                      onQuickView={setSelectedArtwork}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-16 text-center"
              >
                <Link
                  to="/gallery?filter=featured"
                  className="inline-flex items-center px-8 py-3 border-2 border-indigo-600/20 rounded-full bg-white/80 backdrop-blur-sm font-artistic text-lg text-indigo-600 hover:bg-indigo-50/80 transition-colors duration-300"
                >
                  View All Featured Works
                  <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </section>

      <ImageModal
        isOpen={!!selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
        image={selectedArtwork}
        onPrevious={() => {
          const currentIndex = featuredArtworks.findIndex(
            (artwork) => artwork.id === selectedArtwork?.id
          );
          if (currentIndex > 0) {
            setSelectedArtwork(featuredArtworks[currentIndex - 1]);
          }
        }}
        onNext={() => {
          const currentIndex = featuredArtworks.findIndex(
            (artwork) => artwork.id === selectedArtwork?.id
          );
          if (currentIndex < featuredArtworks.length - 1) {
            setSelectedArtwork(featuredArtworks[currentIndex + 1]);
          }
        }}
        hasPrevious={
          featuredArtworks.findIndex(
            (artwork) => artwork.id === selectedArtwork?.id
          ) > 0
        }
        hasNext={
          featuredArtworks.findIndex(
            (artwork) => artwork.id === selectedArtwork?.id
          ) <
          featuredArtworks.length - 1
        }
      />
    </div>
  );
}
