import { motion } from "framer-motion";
import PhotoIcon from "@heroicons/react/24/outline/PhotoIcon";
import { fadeScaleMotion } from "@/lib/motionConfigs";

/**
 * EmptyState
 * Centred icon + title + description + optional action CTA.
 * Pixel-identical to every inline empty-state block across the codebase.
 *
 * @param {React.ComponentType} [icon] - Heroicon component (defaults to PhotoIcon)
 * @param {string} title
 * @param {string} [description]
 * @param {React.ReactNode} [action] - Optional CTA button / link
 * @param {string} [className]
 */
export default function EmptyState({
  icon: Icon = PhotoIcon,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <motion.div
      {...fadeScaleMotion}
      className={`text-center py-10 ${className}`}
    >
      {Icon && <Icon className="mx-auto h-16 w-16 text-gray-400/80" />}
      <h3 className="mt-4 font-artistic text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
        {title}
      </h3>
      {description && (
        <p className="mt-4 text-lg text-gray-500 font-sans">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
