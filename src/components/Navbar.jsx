import { Fragment, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Gallery", href: "/gallery" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAdmin, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

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
    <div className="fixed top-0 left-0 right-0 z-50">
      <Disclosure as="nav" className="relative">
        {({ open }) => (
          <>
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={classNames(
                "backdrop-blur-xl transition-all duration-500 relative overflow-hidden",
                isScrolled
                  ? "bg-white/95 shadow-sm shadow-black/[0.03]"
                  : "bg-white/90"
              )}
            >
              {/* Background decorative elements */}
              <div className="absolute inset-0">
                {/* Multi-layered gradient background */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-100/50 via-transparent to-indigo-100/50 pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,_transparent_50%,_rgba(236,_252,_255,_0.5)_100%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,_transparent_50%,_rgba(244,_238,_255,_0.5)_100%)]" />
                </div>

                {/* Ornamental corner details */}
                <div className="absolute top-0 left-0 w-32 h-32">
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-indigo-300" />
                  <div className="absolute top-3 left-3 w-2 h-2 bg-indigo-300 rounded-full" />
                </div>
                <div className="absolute top-0 right-0 w-32 h-32">
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-indigo-300" />
                  <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-300 rounded-full" />
                </div>

                {/* Subtle animated floating elements */}
                <div className="hidden lg:block">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${20 + i * 15}%`,
                        top: "50%",
                      }}
                      initial={{ y: 0 }}
                      animate={{
                        y: [-6, 6, -6],
                      }}
                      transition={{
                        duration: 4,
                        delay: i * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-400/60" />
                      <div className="absolute -inset-3 bg-indigo-200/30 blur-md rounded-full" />
                    </motion.div>
                  ))}
                </div>

                {/* Bottom decorative border */}
                <div className="absolute bottom-0 left-0 right-0">
                  <div className="h-[2px] bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <div className="w-16 h-[2px] bg-gradient-to-r from-transparent to-indigo-300" />
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    <div className="w-16 h-[2px] bg-gradient-to-l from-transparent to-indigo-300" />
                  </div>
                </div>
              </div>

              <div className="mx-auto max-w-7xl relative">
                <div className="flex h-16 sm:h-20 justify-between items-center px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center">
                    <motion.div
                      className="flex flex-shrink-0 items-center"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Link
                        to="/"
                        onClick={handleLogoClick}
                        className="relative group"
                      >
                        <span className="font-artistic text-2xl sm:text-3xl font-bold tracking-wide">
                          <span className="text-indigo-600">Art</span>
                          <span className="text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                            Showcase
                          </span>
                        </span>
                        <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                      </Link>
                    </motion.div>
                    <div className="hidden sm:ml-6 lg:ml-12 sm:flex sm:space-x-2 lg:space-x-3">
                      {navigation.map((item, index) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="p-2"
                        >
                          <Link
                            to={item.href}
                            className="relative group px-3 py-2 text-base lg:text-lg font-sans tracking-wide transition-all duration-300"
                          >
                            <span
                              className={classNames(
                                "relative z-10 transition-colors duration-300 font-sans",
                                location.pathname === item.href
                                  ? "text-indigo-600 font-semibold"
                                  : "text-gray-700 group-hover:text-indigo-600"
                              )}
                            >
                              {item.name}
                            </span>
                            <div className="absolute inset-0 bg-indigo-50 scale-95 opacity-0 group-hover:opacity-100 rounded-lg transition-all duration-300" />
                            {location.pathname === item.href && (
                              <motion.div
                                layoutId="navbar-active"
                                className="absolute inset-0 bg-indigo-50 rounded-lg"
                                transition={{
                                  type: "spring",
                                  bounce: 0.2,
                                  duration: 0.6,
                                }}
                              />
                            )}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {isAdmin && (
                      <motion.div
                        className="hidden sm:flex items-center space-x-4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                      >
                        <Link
                          to="/add-artwork"
                          className="inline-flex items-center px-5 py-2.5 text-base font-sans font-medium rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow"
                        >
                          Add Artwork
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="inline-flex items-center px-5 py-2.5 text-base font-sans font-medium rounded-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                        >
                          Logout
                        </button>
                      </motion.div>
                    )}

                    <div className="flex items-center sm:hidden">
                      <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300">
                        <span className="sr-only">Open main menu</span>
                        {open ? (
                          <XMarkIcon
                            className="block h-6 w-6"
                            aria-hidden="true"
                          />
                        ) : (
                          <Bars3Icon
                            className="block h-6 w-6"
                            aria-hidden="true"
                          />
                        )}
                      </Disclosure.Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Disclosure.Panel className="sm:hidden">
                    <div className="backdrop-blur-xl bg-white/95 shadow-sm border-t border-indigo-50">
                      <div className="space-y-1 px-4 pb-3 pt-2">
                        {navigation.map((item) => (
                          <Disclosure.Button
                            key={item.name}
                            as={Link}
                            to={item.href}
                            className={classNames(
                              location.pathname === item.href
                                ? "text-indigo-600 bg-indigo-50 font-semibold"
                                : "text-gray-700 hover:text-indigo-600 hover:bg-indigo-50",
                              "block px-4 py-2.5 text-base font-sans rounded-lg transition-all duration-300"
                            )}
                          >
                            {item.name}
                          </Disclosure.Button>
                        ))}
                      </div>
                      {isAdmin && (
                        <div className="flex flex-col space-y-4 px-4 pt-4 pb-6">
                          <Link
                            to="/add-artwork"
                            className="inline-flex items-center justify-center px-5 py-2.5 text-base font-sans font-medium rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all duration-300"
                          >
                            Add Artwork
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="inline-flex items-center justify-center px-5 py-2.5 text-base font-sans font-medium rounded-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </Disclosure.Panel>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </Disclosure>
    </div>
  );
}
