import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageBackground from "@/components/common/PageBackground";
import { Button } from "@/components/ui/button";

// Hoisted static motion configurations (rendering-hoist-jsx)
const heroTitleMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const heroDescriptionMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: 0.1 },
};

const heroButtonsMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: 0.2 },
};

const heroImageMotion = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, delay: 0.3 },
};

const missionSectionMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const missionTitleMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay: 0.1 },
};

const missionDescriptionMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay: 0.2 },
};

const missionCardsContainerMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay: 0.2 },
};

const ctaSectionMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const floatingDotAnimation1 = {
  scale: [1, 1.2, 1],
  opacity: [0.5, 1, 0.5],
};

const floatingDotTransition1 = {
  duration: 2,
  repeat: Infinity,
  repeatType: "reverse",
};

const floatingDotAnimation2 = {
  scale: [1, 1.2, 1],
  opacity: [0.5, 1, 0.5],
};

const floatingDotTransition2 = {
  duration: 2,
  delay: 0.5,
  repeat: Infinity,
  repeatType: "reverse",
};

const missionCardMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const getMissionCardTransition = (index) => ({ delay: 0.2 + index * 0.1 });

// Hoist mission cards data to avoid recreating array on every render (rendering-hoist-jsx)
const MISSION_CARDS = [
  {
    title: "Curated Excellence",
    description:
      "We carefully select and showcase exceptional artworks from both emerging and established artists, ensuring a diverse and high-quality collection.",
  },
  {
    title: "Global Reach",
    description:
      "Our platform connects artists with art enthusiasts worldwide, breaking down geographical barriers and creating new opportunities.",
  },
  {
    title: "Secure Transactions",
    description:
      "We provide a safe and transparent environment for art transactions, ensuring both artists and collectors feel confident and protected.",
  },
];

/**
 * About page — static marketing page describing the platform's mission and values.
 */
export default function About() {
  return (
    <div className="relative min-h-screen bg-white/50 overflow-x-hidden">
      <PageBackground />

      {/* Hero section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1 w-full">
            <motion.h1
              {...heroTitleMotion}
              className="font-artistic text-5xl lg:text-6xl font-bold text-gray-900 tracking-wide mb-6 text-center lg:text-left"
            >
              About Us
            </motion.h1>
            <motion.p
              {...heroDescriptionMotion}
              className="mt-6 text-lg sm:text-xl font-sans text-gray-600 leading-relaxed text-center lg:text-left"
            >
              Welcome to ArtShowcase, where we bridge the gap between
              exceptional artists and art enthusiasts. Our platform is dedicated
              to making fine art accessible, discoverable, and collectible.
            </motion.p>
            <motion.div
              {...heroButtonsMotion}
              className="mt-8 flex flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Button asChild className="rounded-full px-6 font-artistic">
                <Link to="/gallery">Explore Gallery</Link>
              </Button>
              <Button asChild variant="ghost" className="text-gray-600 hover:text-indigo-700 font-sans">
                <Link to="/contact">Contact Us →</Link>
              </Button>
            </motion.div>
          </div>
          <motion.div
            {...heroImageMotion}
            className="flex-1 w-full mt-10 lg:mt-0"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-xl mx-auto max-w-md lg:max-w-none">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-indigo-600/10 to-indigo-700/10" />
              <img
                src="https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-4.0.3"
                alt="Gallery interior"
                className="w-full h-auto object-cover aspect-[4/3]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          {...missionSectionMotion}
          className="lg:text-center"
        >
          <div className="relative flex items-center gap-3 sm:gap-4 min-w-0 justify-center mb-8">
            <span className="hidden sm:block w-12 sm:w-16 h-[2px] bg-gradient-to-r from-transparent via-indigo-600/50 to-transparent rounded-full" />
            <div className="relative whitespace-nowrap">
              <span className="relative z-10 text-2xl font-artistic text-indigo-600">
                Our Mission
              </span>
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
            <span className="hidden sm:block w-12 sm:w-16 h-[2px] bg-gradient-to-r from-transparent via-indigo-600/50 to-transparent rounded-full" />
            <motion.div
              className="absolute -left-4 top-1/2 w-2 h-2 rounded-full bg-indigo-500/50"
              animate={floatingDotAnimation1}
              transition={floatingDotTransition1}
            />
            <motion.div
              className="absolute -right-4 top-1/2 w-2 h-2 rounded-full bg-indigo-500/50"
              animate={floatingDotAnimation2}
              transition={floatingDotTransition2}
            />
          </div>
          <motion.p
            {...missionTitleMotion}
            className="font-artistic text-4xl sm:text-5xl font-bold text-gray-900 tracking-wide text-center"
          >
            Empowering Artists, Inspiring Collectors
          </motion.p>
          <motion.p
            {...missionDescriptionMotion}
            className="mt-6 text-lg sm:text-xl font-sans text-gray-600 leading-relaxed text-center"
          >
            We believe in creating meaningful connections between artists and
            art lovers, fostering a community that celebrates creativity and
            supports artistic excellence.
          </motion.p>
        </motion.div>
        <motion.div
          {...missionCardsContainerMotion}
          className="mx-auto mt-10 sm:mt-12 lg:mt-16 max-w-4xl"
        >
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MISSION_CARDS.map((item, index) => (
              <motion.div
                key={item.title}
                {...missionCardMotion}
                transition={getMissionCardTransition(index)}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow border border-gray-100 min-h-[220px] flex flex-col"
              >
                <dt className="font-artistic text-xl font-semibold text-gray-900 mb-4">
                  {item.title}
                </dt>
                <dd className="text-base font-sans text-gray-600 leading-relaxed">
                  {item.description}
                </dd>
              </motion.div>
            ))}
          </dl>
        </motion.div>
      </section>

      {/* CTA section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          {...ctaSectionMotion}
          className="relative isolate overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-16 sm:py-20 lg:py-24 text-center shadow-2xl rounded-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-indigo-600/10 to-indigo-700/10" />
          <h2 className="relative mx-auto max-w-2xl font-artistic text-3xl sm:text-4xl font-bold tracking-wide text-white mb-6 text-center">
            Join Our Art Community
          </h2>
          <p className="relative mx-auto max-w-2xl text-lg sm:text-xl font-sans text-gray-300 leading-relaxed text-center">
            Whether you're an artist looking to showcase your work or a
            collector seeking unique pieces, we invite you to be part of our
            growing community.
          </p>
          <div className="relative mt-8 sm:mt-10 flex flex-row items-center justify-center gap-x-4 gap-y-0 flex-wrap">
            <Button asChild variant="outline" className="rounded-full px-6 font-artistic bg-white text-gray-900 hover:bg-gray-50 border-white/40">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
