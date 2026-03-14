import { motion } from "framer-motion";
import ExclamationTriangleIcon from "@heroicons/react/24/outline/ExclamationTriangleIcon";
import { fadeScaleMotion } from "@/lib/motionConfigs";

const SEVERITY_STYLES = {
  error: {
    iconContainer: "bg-red-50 border-red-100",
    icon: "text-red-400",
    title:
      "bg-gradient-to-r from-red-900 via-red-800 to-red-700 bg-clip-text text-transparent",
  },
  warning: {
    iconContainer: "bg-amber-50 border-amber-100",
    icon: "text-amber-400",
    title:
      "bg-gradient-to-r from-amber-900 via-amber-800 to-amber-700 bg-clip-text text-transparent",
  },
};

/**
 * ErrorState
 * Standardized centered error-state block used across the entire application.
 *
 * Two visual variants:
 *   "card"  (default) – renders with a white/glass card surface, border, and shadow.
 *   "plain"            – transparent background, no border/shadow.
 *
 * @param {React.ComponentType} [icon]               – Heroicon outline component (defaults to ExclamationTriangleIcon). Pass null to hide.
 * @param {"error"|"warning"}  [severity="error"]   – Visual tone for error vs warning.
 * @param {string}             title                – Short, clear heading (required).
 * @param {string}             [description]        – Helper text explaining the failure.
 * @param {React.ReactNode}    [primaryAction]      – Primary CTA (usually Retry).
 * @param {React.ReactNode}    [secondaryAction]    – Secondary CTA (Back/Return Home).
 * @param {"card"|"plain"}     [variant="card"]     – Visual style variant.
 * @param {string}             [className]          – Extra tailwind classes for fine-grained overrides.
 */
export default function ErrorState({
  icon: Icon = ExclamationTriangleIcon,
  severity = "error",
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = "card",
  className = "",
}) {
  const baseClasses = "flex flex-col items-center text-center";
  const variantClasses =
    variant === "plain"
      ? "py-10 px-6"
      : "py-14 px-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm";

  const styles = SEVERITY_STYLES[severity] || SEVERITY_STYLES.error;

  return (
    <motion.div
      {...fadeScaleMotion}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {Icon && (
        <div
          className={`mb-5 flex items-center justify-center w-16 h-16 rounded-2xl border shadow-sm ${styles.iconContainer}`}
        >
          <Icon className={`h-8 w-8 ${styles.icon}`} aria-hidden="true" />
        </div>
      )}

      <h3 className={`font-artistic text-2xl sm:text-3xl font-semibold ${styles.title}`}>
        {title}
      </h3>

      {description && (
        <p className="mt-3 text-base text-gray-500 font-sans max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
}
