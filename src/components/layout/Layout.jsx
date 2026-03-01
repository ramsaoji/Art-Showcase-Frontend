import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";

// Hoist static background to avoid reconciling on every Layout render (rendering-hoist-jsx)
const LAYOUT_BACKGROUND = (
  <>
    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />
    <div className="absolute -top-96 left-1/2 transform -translate-x-1/2">
      <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-100/40 to-purple-100/40 blur-3xl" />
    </div>
    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
    <div className="absolute left-0 bottom-0 w-96 h-96 bg-gradient-to-tr from-amber-500/10 to-pink-500/10 rounded-full blur-3xl" />
    <svg className="absolute inset-0 w-full h-full opacity-[0.015]" aria-hidden="true">
      <pattern
        id="layout-grid"
        x="0"
        y="0"
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 40 0 L 0 0 0 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </pattern>
      <rect width="100%" height="100%" fill="url(#layout-grid)" />
    </svg>
  </>
);

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="relative h-full flex flex-col">
      <ScrollToTop />
      <div className="fixed inset-0 pointer-events-none">
        {LAYOUT_BACKGROUND}
      </div>
      <Navbar />
      <main
        id="main-scroll-container"
        className="relative flex-1 overflow-y-auto"
      >
        {/* key forces a full unmount+remount of page content on navigation,
            which resets any nested scroll containers and prevents stale positions */}
        <div key={pathname} className="relative min-h-screen">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
}

