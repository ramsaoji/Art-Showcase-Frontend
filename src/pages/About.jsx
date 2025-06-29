import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="relative min-h-screen bg-white/50 overflow-x-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-80 left-1/2 transform -translate-x-1/2 w-full flex justify-center">
          <div className="w-[90vw] max-w-[800px] h-[90vw] max-h-[800px] rounded-full bg-gradient-to-r from-indigo-500/10 via-indigo-600/10 to-indigo-700/10 blur-3xl" />
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <div className="w-60 sm:w-96 h-60 sm:h-96 rounded-full bg-gradient-to-br from-indigo-500/8 via-indigo-600/8 to-indigo-700/8 blur-3xl" />
        </div>
      </div>

      {/* Hero section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1 w-full">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-artistic text-5xl lg:text-6xl font-bold text-gray-900 tracking-wide mb-6 text-center lg:text-left"
            >
              About Us
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 text-lg sm:text-xl font-sans text-gray-600 leading-relaxed text-center lg:text-left"
            >
              Welcome to ArtShowcase, where we bridge the gap between
              exceptional artists and art enthusiasts. Our platform is dedicated
              to making fine art accessible, discoverable, and collectible.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link
                to="/gallery"
                className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white font-sans text-base hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 transition-all duration-300"
              >
                Explore Gallery
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center text-base font-sans text-gray-600 hover:text-indigo-700 transition-colors duration-300"
              >
                Contact Us <span className="ml-2">→</span>
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <motion.div
              className="absolute -right-4 top-1/2 w-2 h-2 rounded-full bg-indigo-500/50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 2,
                delay: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-artistic text-4xl sm:text-5xl font-bold text-gray-900 tracking-wide text-center"
          >
            Empowering Artists, Inspiring Collectors
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl font-sans text-gray-600 leading-relaxed text-center"
          >
            We believe in creating meaningful connections between artists and
            art lovers, fostering a community that celebrates creativity and
            supports artistic excellence.
          </motion.p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-10 sm:mt-12 lg:mt-16 max-w-4xl"
        >
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
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
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1 }}
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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
            <Link
              to="/signup"
              className="inline-flex items-center px-6 py-3 rounded-full bg-white text-gray-900 font-sans text-base hover:bg-gray-50 transition-colors duration-300"
            >
              Get Started
            </Link>
            {/* <Link
              to="/gallery"
              className="inline-flex items-center text-base font-sans text-white hover:text-gray-200 transition-colors duration-300"
            >
              Learn More <span className="ml-2">→</span>
            </Link> */}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
