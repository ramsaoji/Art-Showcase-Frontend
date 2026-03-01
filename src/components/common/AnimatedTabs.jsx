import { motion, AnimatePresence } from "framer-motion";
import { tabPillTransition, tabButtonTransition } from "@/lib/motionConfigs";

/**
 * AnimatedTabs
 * Spring-animated pill-style tab switcher used in AdminManagement and ArtistsManagement.
 * Pixel-identical to every inline version.
 *
 * @param {{ id: string, label: string }[]} tabs
 * @param {string} activeTab - id of the currently active tab
 * @param {Function} onChange - Called with the tab id when a tab is clicked
 * @param {string} layoutId - Framer Motion layoutId for the animated pill (must be unique per instance on the page)
 * @param {"outer"|"inner"} [variant="outer"] - "outer" uses white/60 pill (AdminManagement), "inner" uses indigo-50 pill (ArtistsManagement)
 * @param {"start"|"center"} [justify] - Override horizontal alignment; defaults to "start" for inner, "center" for outer
 */
export default function AnimatedTabs({ tabs, activeTab, onChange, layoutId, variant = "outer", justify }) {
  const pillClass =
    variant === "inner"
      ? "absolute z-0 h-full w-full bg-indigo-50 rounded-xl border border-indigo-100"
      : "absolute z-0 h-full w-full bg-white/60 rounded-xl";

  const activeClass =
    variant === "inner"
      ? "border-transparent text-indigo-700 font-bold shadow-sm"
      : "text-indigo-700 font-bold shadow";

  const inactiveClass =
    variant === "inner"
      ? "border-gray-200 text-gray-500 hover:text-indigo-500 hover:border-indigo-300 bg-white/50"
      : "text-gray-500 hover:text-indigo-500";

  const buttonBase =
    variant === "inner"
      ? "relative z-10 px-5 py-2 font-sans font-semibold text-sm transition-all duration-300 rounded-xl w-full sm:w-auto border"
      : "relative z-10 px-6 py-2 font-sans font-semibold text-base transition-all duration-300 rounded-xl w-full sm:w-auto";

  const justifyClass = (justify ?? (variant === "inner" ? "start" : "center")) === "start"
    ? "justify-start"
    : "justify-center";

  return (
    <div className={`flex flex-col sm:flex-row ${justifyClass} items-stretch sm:items-center ${variant === "inner" ? "gap-2" : "gap-2 sm:gap-0"} mb-4 relative`}>
      {tabs.map((tab) => (
        <div key={tab.id} className="flex w-full sm:w-auto relative">
          <AnimatePresence>
            {activeTab === tab.id && (
              <motion.div
                layoutId={layoutId}
                className={pillClass}
                style={{ left: 0, right: 0, top: 0, bottom: 0 }}
                transition={tabPillTransition}
              />
            )}
          </AnimatePresence>
          <motion.button
            layout
            type="button"
            className={`${buttonBase} ${activeTab === tab.id ? activeClass : inactiveClass}`}
            onClick={() => onChange(tab.id)}
            whileTap={{ scale: variant === "inner" ? 0.98 : 0.97 }}
            transition={tabButtonTransition}
          >
            {tab.label}
          </motion.button>
        </div>
      ))}
    </div>
  );
}
