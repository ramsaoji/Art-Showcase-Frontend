import { formatPrice } from "@/utils/formatters";

/**
 * DiscountPriceBadge
 * Clean, minimalistic pricing display aligned with the Art Showcase aesthetic.
 * Uses native flex wrapping to ensure flawless mobile responsiveness.
 */
export default function DiscountPriceBadge({
  originalPrice,
  discountedPrice,
  discountPercent,
  size = "md",
  variant = "gradient",
  className = "",
  hideBadge = false,
}) {
  const hasDiscount = discountPercent > 0;

  const sizes = {
    sm: {
      main: "text-base sm:text-lg",
      strike: "text-[13px] sm:text-sm",
      badge: "text-[10px]",
      pillPx: "px-2",
    },
    card: {
      main: "text-lg md:text-xl lg:text-2xl",
      strike: "text-[13px] md:text-sm lg:text-base",
      badge: "text-[10px] md:text-[10px] lg:text-[11px]",
      pillPx: "px-2 md:px-2 lg:px-2.5",
    },
    md: {
      main: "text-xl sm:text-2xl",
      strike: "text-[15px] sm:text-base",
      badge: "text-[11px]",
      pillPx: "px-2.5",
    },
    lg: {
      main: "text-3xl sm:text-4xl",
      strike: "text-lg",
      badge: "text-sm",
      pillPx: "px-3",
    },
  };

  const variants = {
    gradient: "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent",
    light: "text-white",
    dark: "text-gray-900",
  };

  const sz = sizes[size] || sizes.md;
  const colorClass = variants[variant] || variants.gradient;

  if (!hasDiscount) {
    return (
      <div className={`flex ${className}`}>
        <p className={`font-artistic font-bold tracking-wide leading-none py-1 m-0 ${sz.main} ${colorClass}`}>
          {formatPrice(originalPrice)}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1.5 ${className}`}>
      {/* 1. Discounted price — prominent, using app's gradients */}
      <p className={`font-artistic font-bold tracking-wide leading-none py-1 m-0 ${sz.main} ${colorClass}`}>
        {formatPrice(discountedPrice)}
      </p>

      {/* 2. Group for Original Price & Percent Badge */}
      <div className="flex items-center gap-2 mt-0.5">
        <span 
          className={`font-sans font-medium line-through leading-none ${sz.strike} ${
            variant === 'light' 
              ? 'text-white/90 decoration-white/60 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' 
              : 'text-gray-400 decoration-gray-300'
          }`}
        >
          {formatPrice(originalPrice)}
        </span>
        
        {!hideBadge && (
          <div 
            className={`flex items-center shrink-0 ${sz.pillPx} ${
              variant === 'light' 
                ? 'bg-black/40 backdrop-blur-md border border-white/20 shadow-sm rounded-full' 
                : 'bg-rose-50 border border-rose-100/50 rounded-full'
            }`}
            style={{ paddingTop: '0.35rem', paddingBottom: '0.35rem' }}
          >
            {variant === 'light' && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5 shrink-0"></span>
            )}
            <span 
              className={`font-sans font-bold uppercase tracking-wider leading-none ${sz.badge} ${
                variant === 'light' ? 'text-white font-medium' : 'text-rose-500'
              }`}
            >
              {discountPercent}% OFF
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
