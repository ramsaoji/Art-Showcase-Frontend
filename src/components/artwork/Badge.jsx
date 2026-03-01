import { motion } from "framer-motion";

const variants = {
  sold: {
    base: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-400/30",
    overlay: "bg-white/90 backdrop-blur-sm text-red-600 border-red-200",
    simple: "bg-red-100 text-red-800",
  },
  featured: {
    base: "bg-gradient-to-r from-amber-400 to-amber-500 text-white border-amber-300/30",
    overlay: "bg-white/90 backdrop-blur-sm text-amber-600 border-amber-200",
    simple: "bg-amber-100 text-amber-800",
  },
  active: {
    base: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400/30",
    overlay: "bg-white/90 backdrop-blur-sm text-green-600 border-green-200",
    simple: "bg-green-100 text-green-800",
  },
  inactive: {
    base: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-yellow-400/30",
    overlay: "bg-white/90 backdrop-blur-sm text-yellow-600 border-yellow-200",
    simple: "bg-yellow-100 text-yellow-800",
  },
  expired: {
    base: "bg-gradient-to-r from-red-400 to-red-500 text-white border-red-400/30",
    overlay: "bg-white/90 backdrop-blur-sm text-red-600 border-red-200",
    simple: "bg-red-100 text-red-800",
  },
  default: {
    base: "bg-gray-100 text-gray-800 border-gray-200",
    overlay: "bg-white/90 backdrop-blur-sm text-gray-600 border-gray-200",
    simple: "bg-gray-100 text-gray-800",
  },
};

// Ping ring colors per badge type — defined at module level to prevent
// re-creating an object on every render (each key maps to a Tailwind bg color class)
const pingColors = {
  active: "bg-green-400/30",
  inactive: "bg-yellow-400/30",
  expired: "bg-red-400/30",
  sold: "bg-red-400/30",
  featured: "bg-amber-400/30",
  default: "bg-gray-400/30",
};

const animationConfig = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  whileHover: { scale: 1.05 },
};

export default function Badge({
  type = "default",
  variant = "base",
  children,
  className = "",
  animate = false,
  withPing = false,
}) {
  const style = variants[type] || variants.default;
  const variantStyle = style[variant] || style.base;
  const pingColor = pingColors[type] || pingColors.default;

  const badgeContent = (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-sans ${variantStyle} ${
        animate ? "animate-bounce" : ""
      } ${className}`}
    >
      {children}
      {withPing && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-30 animate-ping ${pingColor}`}
        />
      )}
    </span>
  );

  if (!animate) {
    return badgeContent;
  }

  return (
    <motion.div {...animationConfig}>
      {badgeContent}
    </motion.div>
  );
}
