import { motion } from "framer-motion";
import { formContainerMotion } from "@/lib/motionConfigs";

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

/**
 * FormCard
 * Animated glassmorphism card wrapper for all form pages.
 * Pixel-identical to every inline version.
 *
 * @param {React.ReactNode} children
 * @param {"sm"|"md"|"lg"|"xl"|"2xl"|"3xl"|"4xl"} [maxWidth="xl"]
 * @param {boolean} [noPadding=false] - Omit built-in p-8/p-10 padding (for pages that supply their own inner padding)
 * @param {string} [className] - Additional classes appended to the wrapper
 */
export default function FormCard({ children, maxWidth = "xl", noPadding = false, className = "" }) {
  return (
    <motion.div
      {...formContainerMotion}
      className={`${maxWidthMap[maxWidth] ?? "max-w-xl"} mx-auto bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100 ${noPadding ? "" : "p-8 sm:p-10"} ${className}`}
    >
      {children}
    </motion.div>
  );
}
