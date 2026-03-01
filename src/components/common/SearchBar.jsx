import { Input } from "@/components/ui/input";

/**
 * SearchBar
 * Controlled search input used in admin list pages.
 * Pixel-identical to every inline version.
 *
 * @param {string} value
 * @param {Function} onChange
 * @param {string} [placeholder]
 * @param {string} [className]
 */
export default function SearchBar({ value, onChange, placeholder = "Search...", className = "" }) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 items-stretch sm:items-center justify-between w-full ${className}`}>
      <Input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full sm:w-80"
      />
    </div>
  );
}
