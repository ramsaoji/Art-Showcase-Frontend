import { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { PhotoIcon, StarIcon } from "@heroicons/react/24/outline";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

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

StatCard.displayName = "StatCard";

export default function Statistics() {
  const [stats, setStats] = useState({
    totalArtworks: 0,
    featuredCount: 0,
    soldCount: 0,
  });

  useEffect(() => {
    const unsubscribers = [];

    // Total artworks
    const artworksQuery = query(collection(db, "artworks"));
    unsubscribers.push(
      onSnapshot(artworksQuery, (snapshot) => {
        setStats((prev) => ({
          ...prev,
          totalArtworks: snapshot.size,
        }));
      })
    );

    // Featured artworks
    const featuredQuery = query(
      collection(db, "artworks"),
      where("featured", "==", true)
    );
    unsubscribers.push(
      onSnapshot(featuredQuery, (snapshot) => {
        setStats((prev) => ({
          ...prev,
          featuredCount: snapshot.size,
        }));
      })
    );

    // Sold artworks
    const soldQuery = query(
      collection(db, "artworks"),
      where("sold", "==", true)
    );
    unsubscribers.push(
      onSnapshot(soldQuery, (snapshot) => {
        setStats((prev) => ({
          ...prev,
          soldCount: snapshot.size,
        }));
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const cards = [
    {
      icon: PhotoIcon,
      label: "Total Artworks",
      value: stats.totalArtworks,
      subtext: "Unique pieces in our gallery",
      delay: 0.1,
    },
    {
      icon: StarIcon,
      label: "Featured Works",
      value: stats.featuredCount,
      subtext: "Curated by our team",
      delay: 0.2,
    },
    {
      icon: INRIcon,
      label: "Artworks Sold",
      value: stats.soldCount,
      subtext: "Finding new homes",
      delay: 0.3,
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl" />
        </div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
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
            <StatCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              subtext={card.subtext}
              delay={card.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
