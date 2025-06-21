import { Fragment, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

const navigation = [
  { name: "Home", href: "/", icon: "🏠" },
  { name: "Gallery", href: "/gallery", icon: "🖼️" },
  { name: "About", href: "/about", icon: "ℹ️" },
  { name: "Contact", href: "/contact", icon: "✉️" },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSuperAdmin, isArtist, user, logout } = useAuth();
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle click outside mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();

    if (location.pathname !== "/") {
      navigate("/");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Get user display name or email
  const getUserDisplayName = () => {
    if (!user) return "";
    return user.artistName || user.email?.split("@")[0] || "User";
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    return displayName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Dynamically build navigation array
  const navLinks = [
    ...navigation,
    ...(isSuperAdmin
      ? [{ name: "Artist Approvals", href: "/admin", icon: "✔️" }]
      : []),
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <nav className="relative">
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={classNames(
            "backdrop-blur-xl transition-all duration-500 relative",
            isScrolled
              ? "bg-white/95 shadow-sm shadow-black/[0.03]"
              : "bg-white/90"
          )}
        >
          {/* Decorative bottom border */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4">
              <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-r from-transparent to-indigo-300" />
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-400" />
              <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-l from-transparent to-indigo-300" />
            </div>
          </div>

          <div className="container mx-auto relative">
            <div className="flex h-14 sm:h-16 lg:h-20 items-center justify-between px-3 sm:px-4 lg:px-8">
              {/* Logo and Desktop Navigation (lg+) */}
              <div className="flex items-center gap-x-4 lg:gap-x-6">
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
                    <span className="font-artistic text-lg sm:text-xl lg:text-2xl font-bold tracking-wide">
                      <span className="text-indigo-600">Art</span>
                      <span className="text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                        Showcase
                      </span>
                    </span>
                    <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </Link>
                </motion.div>

                {/* Desktop Navigation (lg+) */}
                <div className="hidden lg:flex items-center h-full min-w-0 pr-8">
                  {navLinks.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={classNames(
                        "flex items-center flex-shrink",
                        index === 0 ? "ml-0" : "ml-1 lg:ml-2"
                      )}
                    >
                      <Link
                        to={item.href}
                        className={classNames(
                          "relative group px-2 lg:px-3 py-2.5 text-sm lg:text-base font-sans tracking-wide transition-all duration-300 flex items-center whitespace-nowrap h-auto",
                          (
                            item.href === "/admin"
                              ? location.pathname.startsWith("/admin")
                              : location.pathname === item.href
                          )
                            ? "text-indigo-600 font-semibold"
                            : "text-gray-700 group-hover:text-indigo-600"
                        )}
                      >
                        <span className="whitespace-nowrap relative z-10">
                          {item.name}
                        </span>
                        <div className="absolute inset-x-0 top-1 bottom-1 bg-indigo-50 scale-95 opacity-0 group-hover:opacity-100 rounded-lg transition-all duration-300" />
                        {(item.href === "/admin"
                          ? location.pathname.startsWith("/admin")
                          : location.pathname === item.href) && (
                          <motion.div
                            layoutId="navbar-active"
                            className="absolute inset-x-0 top-1 bottom-1 bg-indigo-50 rounded-lg"
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

              {/* Right side - User actions */}
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 ml-auto">
                {user ? (
                  <>
                    {/* Desktop: Add Artwork button and User Menu in same flex row with gap */}
                    <div className="hidden lg:flex items-center space-x-4">
                      {(isSuperAdmin || isArtist) && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        >
                          <Link
                            to="/add-artwork"
                            className="inline-flex items-center px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base font-sans font-medium rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all duration-300 whitespace-nowrap"
                          >
                            <span className="hidden sm:inline">
                              Add Artwork
                            </span>
                            <span className="sm:hidden">Add</span>
                          </Link>
                        </motion.div>
                      )}
                      {/* User Menu - Desktop */}
                      <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                      >
                        <Menu as="div" className="relative">
                          <Menu.Button className="flex items-center space-x-2 p-1 sm:p-1 rounded-full hover:bg-gray-50 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {user.photoURL || user.avatar ? (
                              <img
                                className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-indigo-200 transition-all duration-300"
                                src={user.photoURL || user.avatar}
                                alt={getUserDisplayName()}
                              />
                            ) : (
                              <div className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-xs sm:text-sm ring-2 ring-transparent group-hover:ring-indigo-200 transition-all duration-300 font-sans">
                                {getUserInitials()}
                              </div>
                            )}
                            <div className="hidden md:block text-left min-w-0">
                              <p className="text-sm lg:text-base font-medium text-gray-700 truncate max-w-24 lg:max-w-32 font-sans">
                                {getUserDisplayName()}
                              </p>
                              {(isSuperAdmin || isArtist) && (
                                <p className="text-xs text-indigo-600 font-medium font-sans">
                                  {isSuperAdmin ? "Admin" : "Artist"}
                                </p>
                              )}
                            </div>
                            <ChevronDownIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-300" />
                          </Menu.Button>

                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-900 truncate font-sans">
                                  {getUserDisplayName()}
                                </p>
                                <p className="text-xs text-gray-500 truncate font-sans">
                                  {user.email}
                                </p>
                              </div>

                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={handleLogout}
                                    className={classNames(
                                      active
                                        ? "bg-gray-50 text-red-600"
                                        : "text-gray-700",
                                      "block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 hover:text-red-600 transition-colors duration-200 font-sans"
                                    )}
                                  >
                                    Sign out
                                  </button>
                                )}
                              </Menu.Item>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </motion.div>

                      {/* User Avatar - Mobile (shows in mobile menu) */}
                      <div className="sm:hidden flex items-center">
                        {user.photoURL || user.avatar ? (
                          <img
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-200"
                            src={user.photoURL || user.avatar}
                            alt={getUserDisplayName()}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium font-sans text-sm ring-2 ring-indigo-200">
                            {getUserInitials()}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  // Login button for non-authenticated users
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <Link
                      to="/login"
                      className="hidden sm:inline-flex items-center px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base font-sans font-medium rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all duration-300 whitespace-nowrap"
                    >
                      Login
                    </Link>
                  </motion.div>
                )}

                {/* Hamburger menu for mobile/tablet (lg:hidden) */}
                <div className="flex items-center lg:hidden">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300"
                  >
                    <span className="sr-only">Open main menu</span>
                    {isMobileMenuOpen ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="lg:hidden bg-white absolute left-0 right-0 top-full z-50 shadow-2xl border-t border-gray-100"
          >
            <div className="container mx-auto px-2">
              {/* User profile section for authenticated users */}
              {user && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    {user.photoURL || user.avatar ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-200"
                        src={user.photoURL || user.avatar}
                        alt={getUserDisplayName()}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium font-sans text-sm ring-2 ring-indigo-200">
                        {getUserInitials()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate font-sans">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500 truncate font-sans">
                        {user.email}
                      </p>
                      {(isSuperAdmin || isArtist) && (
                        <p className="text-xs text-indigo-600 font-medium font-sans">
                          {isSuperAdmin ? "Admin" : "Artist"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 pb-3 space-y-1">
                {navLinks.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={classNames(
                      "block px-2 py-2 rounded-lg font-sans text-base transition-all duration-200",
                      location.pathname === item.href ||
                        (item.href === "/admin" &&
                          location.pathname.startsWith("/admin"))
                        ? "text-indigo-700 font-semibold bg-indigo-50"
                        : "text-gray-700 hover:text-indigo-700 hover:bg-indigo-50"
                    )}
                  >
                    <span className="whitespace-nowrap">{item.name}</span>
                  </Link>
                ))}
              </div>
              {user ? (
                <>
                  {(isSuperAdmin || isArtist) && (
                    <Link
                      to="/add-artwork"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 text-base font-sans font-medium rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all duration-300 mt-2"
                    >
                      Add Artwork
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full px-4 py-3 text-base font-sans font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 mt-2 mb-4"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-base font-sans font-medium rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all duration-300 mt-2 mb-4"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
