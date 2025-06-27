import { motion } from "framer-motion";
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const variants = {
  error: {
    icon: XCircleIcon,
    bg: "bg-red-50/90",
    border: "border-red-200",
    text: "text-red-800",
    iconColor: "text-red-600",
    button:
      "text-red-800 hover:bg-red-100 focus:ring-offset-red-50/90 focus:ring-red-600",
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bg: "bg-amber-50/90",
    border: "border-amber-200",
    text: "text-amber-800",
    iconColor: "text-amber-600",
    button:
      "text-amber-800 hover:bg-amber-100 focus:ring-offset-amber-50/90 focus:ring-amber-600",
  },
  success: {
    icon: CheckCircleIcon,
    bg: "bg-green-50/90",
    border: "border-green-200",
    text: "text-green-800",
    iconColor: "text-green-600",
    button:
      "text-green-800 hover:bg-green-100 focus:ring-offset-green-50/90 focus:ring-green-600",
  },
  info: {
    icon: InformationCircleIcon,
    bg: "bg-blue-50/90",
    border: "border-blue-200",
    text: "text-blue-800",
    iconColor: "text-blue-600",
    button:
      "text-blue-800 hover:bg-blue-100 focus:ring-offset-blue-50/90 focus:ring-blue-600",
  },
};

export default function Alert({
  type = "info",
  message,
  className = "",
  showIcon = true,
  animate = true,
  onRetry,
}) {
  if (!message) return null;

  const style = variants[type];
  const Icon = style.icon;

  const AlertContent = () => (
    <div
      className={`flex items-center justify-between gap-3 p-4 rounded-xl border backdrop-blur-sm font-sans ${style.bg} ${style.border} ${style.text} ${className}`}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <Icon className={`h-5 w-5 flex-shrink-0 mt-1 ${style.iconColor}`} />
        )}
        <div className="flex-1 tracking-wide leading-relaxed">{message}</div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className={`ml-4 flex-shrink-0 rounded-md px-2 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${style.button}`}
        >
          Retry
        </button>
      )}
    </div>
  );

  if (!animate) {
    return <AlertContent />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <AlertContent />
    </motion.div>
  );
}
