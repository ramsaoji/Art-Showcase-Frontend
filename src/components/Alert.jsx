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
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bg: "bg-amber-50/90",
    border: "border-amber-200",
    text: "text-amber-800",
    iconColor: "text-amber-600",
  },
  success: {
    icon: CheckCircleIcon,
    bg: "bg-green-50/90",
    border: "border-green-200",
    text: "text-green-800",
    iconColor: "text-green-600",
  },
  info: {
    icon: InformationCircleIcon,
    bg: "bg-blue-50/90",
    border: "border-blue-200",
    text: "text-blue-800",
    iconColor: "text-blue-600",
  },
};

export default function Alert({
  type = "info",
  message,
  className = "",
  showIcon = true,
  animate = true,
}) {
  if (!message) return null;

  const style = variants[type];
  const Icon = style.icon;

  const AlertContent = () => (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm ${style.bg} ${style.border} ${style.text} ${className}`}
    >
      {showIcon && (
        <Icon className={`h-5 w-5 flex-shrink-0 ${style.iconColor}`} />
      )}
      <div className="flex-1 text-base font-sans tracking-wide leading-relaxed">
        {message}
      </div>
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
