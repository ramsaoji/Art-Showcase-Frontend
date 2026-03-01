import { motion } from "framer-motion";
import { containerMotion } from "@/lib/motionConfigs";

/**
 * PageHeader
 * Animated page title + optional subtitle used on every full page.
 * Pixel-identical to every inline version.
 *
 * @param {string} title - Large artistic heading text
 * @param {string} [subtitle] - Smaller descriptive subtitle
 * @param {"h1"|"h2"} [as="h1"] - Semantic heading level
 * @param {string} [className] - Additional wrapper classes
 */
export default function PageHeader({ title, subtitle, as: Tag = "h1", className = "" }) {
  return (
    <motion.div {...containerMotion} className={`text-center mb-12 ${className}`}>
      <Tag className="text-5xl lg:text-6xl font-bold mb-4 font-artistic text-center tracking-wide text-gray-900">
        {title}
      </Tag>
      {subtitle && (
        <p className="text-lg sm:text-xl font-sans text-gray-600 leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
