import { Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

export default function Footer() {
  const heartControls = useAnimation();

  useEffect(() => {
    // Start the infinite animation sequence
    heartControls.start({
      scale: [1, 1.2, 1],
      color: ["#EF4444", "#EC4899", "#EF4444"],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    });
  }, [heartControls]);

  return (
    <footer className="relative mt-8 bg-white/80 backdrop-blur-sm border-t border-gray-100">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Decorative top border gradient */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-2"
          >
            <div className="font-artistic text-xl font-bold tracking-wide">
              <span className="text-indigo-600">Art</span>
              <span className="text-gray-900">Showcase</span>
            </div>
            <p className="font-sans text-sm text-gray-600 max-w-xs">
              Discover and collect extraordinary artworks from talented artists
              around the world.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-artistic text-base font-semibold mb-3 text-gray-900 tracking-wide">
              Quick Links
            </h3>
            <ul className="space-y-1.5 font-sans">
              <li>
                <Link
                  to="/gallery"
                  className="text-gray-600 hover:text-indigo-600 transition-colors text-sm font-medium"
                >
                  Gallery
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-600 hover:text-indigo-600 transition-colors text-sm font-medium"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-600 hover:text-indigo-600 transition-colors text-sm font-medium"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-artistic text-base font-semibold mb-3 text-gray-900 tracking-wide">
              Connect With Us
            </h3>
            <div className="font-sans text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">art-showcase@techness.in</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-6 pt-4 border-t border-gray-100/50"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 font-medium font-sans">
            <p>
              © {new Date().getFullYear()} Art Showcase. All rights reserved.
            </p>
            <p className="mt-2 sm:mt-0 flex items-center">
              Made with
              <motion.svg
                animate={heartControls}
                className="w-3.5 h-3.5 mx-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </motion.svg>
              by Ram Saoji
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
