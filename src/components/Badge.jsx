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
  default: {
    base: "bg-gray-100 text-gray-800 border-gray-200",
    overlay: "bg-white/90 backdrop-blur-sm text-gray-600 border-gray-200",
    simple: "bg-gray-100 text-gray-800",
  },
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

  const BadgeContent = () => (
    <div
      className={`inline-flex items-center px-3 py-1.5 text-sm font-sans font-medium rounded-full shadow-sm border ${variantStyle} ${className}`}
    >
      <span className="relative inline-flex items-center">
        {children}
        {withPing && (
          <div className="absolute inset-0 rounded-full animate-ping bg-white/20" />
        )}
      </span>
    </div>
  );

  if (!animate) {
    return <BadgeContent />;
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      <BadgeContent />
    </motion.div>
  );
}
