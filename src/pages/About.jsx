import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-96 left-1/2 transform -translate-x-1/2">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-100/30 to-purple-100/30 blur-3xl" />
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <div className="w-96 h-96 rounded-full bg-gradient-to-br from-indigo-100/20 to-purple-100/20 blur-3xl" />
        </div>
      </div>

      {/* Hero section */}
      <div className="relative">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-24">
          <div className="lg:pt-4">
            <div className="mx-auto max-w-2xl">
              <div className="max-w-lg">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="font-artistic text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-wide mb-6"
                >
                  About Us
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mt-6 text-lg font-sans text-gray-600 leading-relaxed"
                >
                  Welcome to ArtShowcase, where we bridge the gap between
                  exceptional artists and art enthusiasts. Our platform is
                  dedicated to making fine art accessible, discoverable, and
                  collectible.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-8 flex items-center gap-x-6"
                >
                  <Link
                    to="/gallery"
                    className="inline-flex items-center px-6 py-3 rounded-full bg-indigo-600 text-white font-sans text-base hover:bg-indigo-500 transition-colors duration-300"
                  >
                    Explore Gallery
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center text-base font-sans text-gray-600 hover:text-indigo-600 transition-colors duration-300"
                  >
                    Contact Us <span className="ml-2">→</span>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 sm:mt-20 lg:mt-0"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10" />
              <img
                src="https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-4.0.3"
                alt="Gallery interior"
                className="w-full h-auto object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mission section */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl lg:text-center"
        >
          {/* Decorative lines and text */}
          <div className="relative flex items-center gap-3 sm:gap-4 min-w-0 justify-center mb-8">
            <span className="hidden sm:block w-12 sm:w-16 h-[2px] bg-gradient-to-r from-transparent via-indigo-600/50 to-transparent rounded-full" />
            <div className="relative whitespace-nowrap">
              <span className="relative z-10 text-2xl font-artistic text-indigo-600">
                Our Mission
              </span>
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
            <span className="hidden sm:block w-12 sm:w-16 h-[2px] bg-gradient-to-r from-transparent via-indigo-600/50 to-transparent rounded-full" />

            {/* Decorative dots */}
            <motion.div
              className="absolute -left-4 top-1/2 w-2 h-2 rounded-full bg-indigo-400/50"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <motion.div
              className="absolute -right-4 top-1/2 w-2 h-2 rounded-full bg-indigo-400/50"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                delay: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          </div>

          {/* Additional floating elements */}
          <motion.div
            className="absolute -left-8 top-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-indigo-400/40 to-purple-400/40"
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
            className="absolute -right-8 top-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400/40 to-orange-400/40"
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
            className="absolute left-1/2 -translate-x-1/2 -bottom-4 w-3 h-3 rounded-full bg-gradient-to-br from-rose-400/40 to-pink-400/40"
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

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-artistic text-4xl sm:text-5xl font-bold text-gray-900 tracking-wide"
          >
            Empowering Artists, Inspiring Collectors
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-xl font-sans text-gray-600 leading-relaxed"
          >
            We believe in creating meaningful connections between artists and
            art lovers, fostering a community that celebrates creativity and
            supports artistic excellence.
          </motion.p>

          {/* Decorative corner elements */}
          <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none">
            <motion.div
              className="absolute top-4 left-4 w-2 h-2 rounded-full bg-indigo-400/30"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <motion.div
              className="absolute top-8 left-8 w-1 h-1 rounded-full bg-purple-400/30"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 1.5,
                delay: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none">
            <motion.div
              className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-400/30"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <motion.div
              className="absolute top-8 right-8 w-1 h-1 rounded-full bg-purple-400/30"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 1.5,
                delay: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-10 sm:mt-12 lg:mt-16 max-w-2xl lg:max-w-none"
        >
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-8 lg:max-w-none lg:grid-cols-3 lg:gap-y-12">
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
                className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100"
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
      </div>

      {/* CTA section */}
      <div className="relative mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative isolate overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-16 sm:py-20 lg:py-24 text-center shadow-2xl rounded-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10" />
          <h2 className="relative mx-auto max-w-2xl font-artistic text-3xl sm:text-4xl font-bold tracking-wide text-white mb-6">
            Join Our Art Community
          </h2>
          <p className="relative mx-auto max-w-xl text-lg font-sans text-gray-300 leading-relaxed">
            Whether you're an artist looking to showcase your work or a
            collector seeking unique pieces, we invite you to be part of our
            growing community.
          </p>
          <div className="relative mt-8 sm:mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/contact"
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
      </div>
    </div>
  );
}
