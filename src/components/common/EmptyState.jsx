import { motion } from "framer-motion";
import PhotoIcon from "@heroicons/react/24/outline/PhotoIcon";
import { fadeScaleMotion } from "@/lib/motionConfigs";

/**
 * EmptyState
 * Standardized centered empty-state block used across the entire application.
 *
 * Two visual variants:
 *   "card"  (default) – renders with a white/glass card surface, border, and shadow.
 *                        Use on open page areas (gallery, admin tables, home, activity logs).
 *   "plain"            – transparent background, no border/shadow.
 *                        Use when already inside a card/panel container
 *                        (e.g. FeaturedArtworksManagement, CarouselManagement list panels).
 *
 * @param {React.ComponentType} [icon]            – Heroicon outline component (defaults to PhotoIcon). Pass null to hide.
 * @param {string}              title             – Short, clear heading (required).
 * @param {string}              [description]     – Helper text explaining why it's empty.
 * @param {React.ReactNode}     [action]          – Primary CTA — pass a <Button> from ui/button.
 * @param {"card"|"plain"}      [variant="card"]  – Visual style variant.
 * @param {string}              [className]       – Extra tailwind classes for fine-grained overrides.
 */
export default function EmptyState({
  icon: Icon = PhotoIcon,
  title,
  description,
  action,
  variant = "card",
  className = "",
}) {
  const baseClasses = "flex flex-col items-center text-center";

  const variantClasses =
    variant === "plain"
      ? "py-10 px-6"
      : "py-14 px-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm";

  return (
    <motion.div
      {...fadeScaleMotion}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {/* Icon pill */}
      {Icon && (
        <div className="mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm">
          <Icon className="h-8 w-8 text-indigo-400" aria-hidden="true" />
        </div>
      )}

      {/* Title */}
      <h3 className="font-artistic text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-3 text-base text-gray-500 font-sans max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {/* Action */}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
