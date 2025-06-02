import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

export default function Footer() {
  const heartControls = useAnimation();
  const location = useLocation();
  const navigate = useNavigate();

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

  const handleLogoClick = (e) => {
    e.preventDefault();

    // If we're not on the home page, navigate home first
    if (location.pathname !== "/") {
      navigate("/");
    }

    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="relative mt-8">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-indigo-50/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_70%,_rgba(238,_242,_255,_0.2))]" />
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24">
          <div className="absolute top-6 left-6 w-8 h-px bg-gradient-to-r from-indigo-200 to-transparent transform -rotate-45" />
          <div className="absolute top-6 left-6 h-8 w-px bg-gradient-to-b from-indigo-200 to-transparent transform -rotate-45" />
        </div>
        <div className="absolute top-0 right-0 w-24 h-24">
          <div className="absolute top-6 right-6 w-8 h-px bg-gradient-to-l from-indigo-200 to-transparent transform rotate-45" />
          <div className="absolute top-6 right-6 h-8 w-px bg-gradient-to-b from-indigo-200 to-transparent transform rotate-45" />
        </div>

        {/* Floating elements */}
        <div className="hidden lg:block">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${15 + i * 15}%`,
                top: "20%",
              }}
              animate={{
                y: [-8, 8, -8],
              }}
              transition={{
                duration: 5,
                delay: i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="w-1 h-1 rounded-full bg-indigo-300/30" />
              <div className="absolute -inset-1 bg-indigo-100/20 blur-sm rounded-full" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top decorative line */}
          <div className="absolute inset-x-0 top-0 flex justify-center">
            <div className="w-48 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              <Link
                to="/"
                onClick={handleLogoClick}
                className="inline-block group"
              >
                <span className="font-artistic text-xl font-bold tracking-wide relative">
                  <span className="text-indigo-600">Art</span>
                  <span className="text-gray-900 group-hover:text-indigo-600 transition-colors">
                    Showcase
                  </span>
                  <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-indigo-300/0 via-indigo-300/50 to-indigo-300/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </span>
              </Link>
              <p className="font-sans text-sm text-gray-600 max-w-xs leading-relaxed">
                Discover and collect extraordinary artworks from talented
                artists around the world.
              </p>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="font-artistic text-base font-semibold mb-4 text-gray-900">
                Quick Links
              </h3>
              <ul className="space-y-2 font-sans">
                {[
                  { name: "Gallery", path: "/gallery" },
                  { name: "About Us", path: "/about" },
                  { name: "Contact", path: "/contact" },
                ].map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-gray-600 hover:text-indigo-600 transition-colors text-sm font-medium relative group inline-block"
                    >
                      {link.name}
                      <div className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-indigo-300/0 via-indigo-300/50 to-indigo-300/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-artistic text-base font-semibold mb-4 text-gray-900">
                Connect With Us
              </h3>
              <div className="font-sans text-sm text-gray-600">
                <a
                  href="mailto:art-showcase@techness.in"
                  className="inline-flex items-center space-x-2 group relative"
                >
                  <svg
                    className="w-4 h-4 text-indigo-500 transition-transform group-hover:scale-110 duration-300"
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
                  <span className="font-medium group-hover:text-indigo-600 transition-colors">
                    art-showcase@techness.in
                  </span>
                  <div className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-indigo-300/0 via-indigo-300/50 to-indigo-300/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative mt-8 pt-6"
          >
            {/* Top separator */}
            <div className="absolute inset-x-0 top-0 flex justify-center">
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 font-medium font-sans">
              <p>
                © {new Date().getFullYear()} Art Showcase. All rights reserved.
              </p>
              <p className="mt-2 sm:mt-0 flex items-center group">
                <span>Made with</span>
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
                <span>by Ram Saoji</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
