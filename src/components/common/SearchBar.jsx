import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";
import XMarkIcon from "@heroicons/react/24/outline/XMarkIcon";
import { Input } from "@/components/ui/input";

/**
 * SearchBar
 * Controlled search input used in admin list pages.
 * Default layout matches artist admin tabs; `inline` variant renders just the input.
 *
 * @param {string} value
 * @param {Function} onChange - Debounced callback receiving the input value
 * @param {string} [placeholder]
 * @param {string} [className]
 * @param {boolean} [inline] - when true, render only the Input (no outer flex/margins)
 * @param {number} [debounceMs=400] - debounce delay for onChange
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  inline = false,
  disabled = false,
  debounceMs = 400,
  ...rest
}) {
  const [localValue, setLocalValue] = useState(value ?? "");
  const prevValueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      setLocalValue(value ?? "");
      prevValueRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const debouncedChange = useMemo(
    () =>
      debounce((nextValue) => {
        onChangeRef.current?.(nextValue);
      }, debounceMs),
    [debounceMs]
  );

  useEffect(() => () => debouncedChange.cancel(), [debouncedChange]);

  const handleChange = (e) => {
    const nextValue = e.target.value;
    setLocalValue(nextValue);
    if (debounceMs > 0) {
      debouncedChange(nextValue);
    } else {
      onChangeRef.current?.(nextValue);
    }
  };

  const handleClear = () => {
    setLocalValue("");
    prevValueRef.current = "";
    debouncedChange.cancel();
    onChangeRef.current?.("");
  };

  if (inline) {
    return (
      <div className="relative w-full sm:w-96 lg:w-[460px]">
        <Input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`pr-10 ${className}`}
          {...rest}
        />
        {localValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 items-stretch sm:items-center justify-between w-full ${className}`}>
      <div className="relative w-full sm:w-96 lg:w-[460px]">
        <Input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
          {...rest}
        />
        {localValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
