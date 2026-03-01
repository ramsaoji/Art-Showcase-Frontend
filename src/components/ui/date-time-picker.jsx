/**
 * DateTimePicker
 * shadcn Calendar + Popover + 12-hour time inputs with AM/PM for "Expires At".
 *
 * Design tokens applied:
 *   • font-sans everywhere (no font-artistic)
 *   • indigo-600 selected day, indigo-500 focus ring
 *   • rounded-xl trigger, rounded-xl popover
 *   • gray-200 borders
 *
 * Value contract: receives / emits an ISO-8601 string  (or "" / undefined).
 */

import * as React from "react";
import { format, isValid } from "date-fns";
import { CalendarIcon, XCircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseISO(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return isValid(d) ? d : undefined;
}

/** Convert 24h hour + period to 12h display hour (1–12). */
function to12h(h24) {
  const h = h24 % 12;
  return h === 0 ? 12 : h;
}

/** Convert 12h hour + period back to 24h. */
function to24h(h12, period) {
  if (period === "AM") {
    return h12 === 12 ? 0 : h12;
  } else {
    return h12 === 12 ? 12 : h12 + 12;
  }
}

function padZero(n, len = 2) {
  return String(n).padStart(len, "0");
}

function buildISO(date, h24, minutes) {
  if (!date) return "";
  const d = new Date(date);
  d.setHours(h24, minutes, 0, 0);
  return d.toISOString();
}


// ─── Component ───────────────────────────────────────────────────────────────

const DateTimePicker = React.forwardRef(
  ({ value, onChange, disabled, className, placeholder = "Pick date & time" }, ref) => {
    const parsed = parseISO(value);

    // Derive 12h state from parsed value
    const init24h = parsed ? parsed.getHours() : 0;
    const initMinutes = parsed ? parsed.getMinutes() : 0;
    const initPeriod = init24h < 12 ? "AM" : "PM";
    const init12h = to12h(init24h);

    const [hours12, setHours12] = React.useState(init12h);
    const [minutes, setMinutes] = React.useState(initMinutes);
    const [period, setPeriod] = React.useState(initPeriod);

    // Sync local time whenever external value changes
    React.useEffect(() => {
      const d = parseISO(value);
      if (d) {
        const h24 = d.getHours();
        const m = d.getMinutes();
        setHours12(to12h(h24));
        setMinutes(m);
        setPeriod(h24 < 12 ? "AM" : "PM");
      } else {
        setHours12(12);
        setMinutes(0);
        setPeriod("AM");
      }
    }, [value]);

    // ── Emit any change as ISO ───────────────────────────────────────────────

    const emit = React.useCallback(
      (date, h12, mins, per) => {
        const h24 = to24h(h12, per);
        onChange?.(buildISO(date, h24, mins));
      },
      [onChange]
    );

    // ── Day selection ────────────────────────────────────────────────────────

    const handleDaySelect = (day) => {
      if (!day) {
        onChange?.("");
        return;
      }
      emit(day, hours12, minutes, period);
    };

    // ── Hours ────────────────────────────────────────────────────────────────

    // shadcn Select fires onValueChange(string), not a DOM event
    const handleHoursChange = (val) => {
      const num = Number(val);
      setHours12(num);
      if (parsed) emit(parsed, num, minutes, period);
    };

    // ── Minutes ──────────────────────────────────────────────────────────────

    const handleMinutesChange = (val) => {
      const num = Number(val);
      setMinutes(num);
      if (parsed) emit(parsed, hours12, num, period);
    };

    // ── AM / PM ──────────────────────────────────────────────────────────────

    const togglePeriod = (p) => {
      setPeriod(p);
      if (parsed) emit(parsed, hours12, minutes, p);
    };

    // ── Clear ────────────────────────────────────────────────────────────────

    const handleClear = (e) => {
      e.stopPropagation();
      setHours12(12);
      setMinutes(0);
      setPeriod("AM");
      onChange?.("");
    };

    // ── Formatted display ────────────────────────────────────────────────────

    const displayValue = parsed
      ? `${format(parsed, "PPP")} · ${padZero(Number(hours12))}:${padZero(Number(minutes))} ${period}`
      : null;

    // ────────────────────────────────────────────────────────────────────────

    return (
      <Popover>
        {/* Trigger */}
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            disabled={disabled}
            aria-haspopup="dialog"
            className={cn(
              "flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-transparent px-4 py-3",
              "font-sans text-sm shadow-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              !parsed ? "text-gray-400" : "text-gray-900",
              className
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-indigo-400" />
            <span className="flex-1 text-left truncate font-sans">
              {displayValue ?? placeholder}
            </span>
            {parsed && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear date"
                onClick={handleClear}
                className="ml-auto text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <XCircleIcon className="h-4 w-4" />
              </span>
            )}
          </button>
        </PopoverTrigger>

        {/* Popover panel */}
        <PopoverContent
          className="w-auto p-0 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden"
          align="start"
          sideOffset={6}
        >
          {/* Calendar — indigo selected day */}
          <Calendar
            mode="single"
            selected={parsed}
            onSelect={handleDaySelect}
            initialFocus
            classNames={{
              root: "w-full",
              day_selected:
                "!bg-indigo-600 !text-white hover:!bg-indigo-700 focus:!bg-indigo-600",
              day_today:
                "!bg-indigo-50 !text-indigo-700",
            }}
          />

          {/* ── Time row ─────────────────────────────────────────────── */}
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
            {/* Label */}
            <span className="text-xs font-sans font-medium text-gray-400 shrink-0 uppercase tracking-wider">
              Time
            </span>

            {/* Hours : Minutes  |  AM/PM */}
            <div className="flex items-center gap-1">

              {/* ── Hours ── */}
              <Select
                value={padZero(Number(hours12) || 12)}
                onValueChange={handleHoursChange}
              >
                <SelectTrigger
                  aria-label="Hours"
                  className="w-16 h-9 px-2 rounded-lg border-gray-200 font-sans text-sm font-medium text-gray-800 focus:ring-indigo-500"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48 font-sans">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <SelectItem key={h} value={padZero(h)} className="font-sans text-sm">
                      {padZero(h)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Colon */}
              <span className="text-gray-400 font-semibold font-sans text-sm select-none">:</span>

              {/* ── Minutes ── */}
              <Select
                value={padZero(Number(minutes) || 0)}
                onValueChange={handleMinutesChange}
              >
                <SelectTrigger
                  aria-label="Minutes"
                  className="w-16 h-9 px-2 rounded-lg border-gray-200 font-sans text-sm font-medium text-gray-800 focus:ring-indigo-500"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48 font-sans">
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <SelectItem key={m} value={padZero(m)} className="font-sans text-sm">
                      {padZero(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* ── AM / PM segmented control ── */}
              <div className="ml-1 h-9 flex items-stretch gap-0.5 bg-gray-100 rounded-lg p-0.5">
                {["AM", "PM"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePeriod(p)}
                    className={cn(
                      "h-full px-3 rounded-md text-xs font-sans font-semibold transition-all duration-150 select-none",
                      period === p
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-500 hover:text-indigo-600"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

DateTimePicker.displayName = "DateTimePicker";

export { DateTimePicker };
