import * as React from "react";
import {
  endOfMonth,
  format,
  isSameDay,
  isValid,
  startOfMonth,
  subDays,
} from "date-fns";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  XCircleIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function parseDate(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return isValid(parsed) ? parsed : undefined;
}

function toDateOnlyString(date) {
  return date ? format(date, "yyyy-MM-dd") : "";
}

function isRangeMatch(range, from, to) {
  if (!range?.from || !from) return false;
  const effectiveTo = range.to || range.from;
  const compareTo = to || from;
  return isSameDay(range.from, from) && isSameDay(effectiveTo, compareTo);
}

function getQuickRanges(today) {
  return [
    { id: "today", label: "Today", range: { from: today, to: today } },
    { id: "last7", label: "Last 7 days", range: { from: subDays(today, 6), to: today } },
    { id: "last30", label: "Last 30 days", range: { from: subDays(today, 29), to: today } },
    { id: "month", label: "This month", range: { from: startOfMonth(today), to: endOfMonth(today) } },
  ];
}

function getDisplayLabel(from, to, quickRanges) {
  if (!from) return "Any time";

  const matchedPreset = quickRanges.find((preset) => isRangeMatch(preset.range, from, to));
  if (matchedPreset) return matchedPreset.label;

  if (!to || isSameDay(from, to)) {
    return format(from, "dd MMM yyyy");
  }

  return `${format(from, "dd MMM")} - ${format(to, "dd MMM")}`;
}

const DateRangePicker = React.forwardRef(
  (
    {
      value,
      onChange,
      disabled,
      className,
      placeholder = "Select date range",
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [showCustom, setShowCustom] = React.useState(false);
    const today = React.useMemo(() => new Date(), []);
    const quickRanges = React.useMemo(() => getQuickRanges(today), [today]);

    const parsedFrom = parseDate(value?.from);
    const parsedTo = parseDate(value?.to);
    const [draft, setDraft] = React.useState({ from: parsedFrom, to: parsedTo });

    React.useEffect(() => {
      if (!open) {
        setDraft({ from: parseDate(value?.from), to: parseDate(value?.to) });
        setShowCustom(false);
      }
    }, [open, value?.from, value?.to]);

    const displayLabel = getDisplayLabel(parsedFrom, parsedTo, quickRanges);

    const applyRange = React.useCallback(
      (range) => {
        if (!range?.from) {
          onChange?.({ from: "", to: "" });
          setOpen(false);
          return;
        }

        onChange?.({
          from: toDateOnlyString(range.from),
          to: toDateOnlyString(range.to || range.from),
        });
        setOpen(false);
      },
      [onChange]
    );

    const handleClear = React.useCallback(
      (event) => {
        event?.stopPropagation();
        onChange?.({ from: "", to: "" });
        setDraft({ from: undefined, to: undefined });
        setShowCustom(false);
        setOpen(false);
      },
      [onChange]
    );

    const hasValue = !!parsedFrom;
    const isPresetActive = (range) => isRangeMatch(range, parsedFrom, parsedTo);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            disabled={disabled}
            aria-haspopup="dialog"
            className={cn(
              "flex h-auto w-full items-center gap-2 rounded-xl border border-gray-200 bg-transparent px-4 py-3 font-sans text-base shadow-sm transition-colors outline-none md:text-sm",
              "hover:border-indigo-200 hover:bg-indigo-50/20",
              "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              hasValue ? "text-gray-900" : "text-gray-400",
              className
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-indigo-400" />
            <span className="min-w-0 flex-1 truncate text-left">
              {hasValue ? displayLabel : placeholder}
            </span>
            {hasValue ? (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear date range"
                onClick={handleClear}
                className="shrink-0 cursor-pointer text-gray-400 transition-colors hover:text-red-500"
              >
                <XCircleIcon className="h-4 w-4" />
              </span>
            ) : (
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-300" />
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={6}
          className="w-[min(86vw,18rem)] overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl box-border"
        >
          {!showCustom ? (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => applyRange(undefined)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-sans text-[13px] text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span>Any time</span>
                {!hasValue && <CheckIcon className="h-4 w-4 text-indigo-600" />}
              </button>

              {quickRanges.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyRange(preset.range)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-sans text-[13px] transition-colors",
                    isPresetActive(preset.range)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <span>{preset.label}</span>
                  {isPresetActive(preset.range) && <CheckIcon className="h-4 w-4" />}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowCustom(true)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-sans text-[13px] text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span>Custom range</span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustom(false)}
                  className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 font-sans text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
                  Back
                </button>
                <span className="font-sans text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                  Custom range
                </span>
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-0.5 box-border">
                <Calendar
                  mode="range"
                  selected={draft}
                  onSelect={(range) => setDraft(range ?? { from: undefined, to: undefined })}
                  numberOfMonths={1}
                  initialFocus
                  className="mx-auto !p-1"
                  style={{ "--cell-size": "1.6rem" }}
                  classNames={{
                    root: "w-full",
                    day_today: "!bg-indigo-50 !text-indigo-700",
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 px-1 pb-0.5">
                <p className="min-w-0 truncate font-sans text-[11px] text-gray-500">
                  {draft.from
                    ? draft.to
                      ? `${format(draft.from, "dd MMM")} - ${format(draft.to, "dd MMM yyyy")}`
                      : `${format(draft.from, "dd MMM yyyy")}`
                    : "Choose a start date"}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs"
                    onClick={() => {
                      setDraft({ from: parsedFrom, to: parsedTo });
                      setShowCustom(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-2.5 text-xs"
                    onClick={() => applyRange(draft)}
                    disabled={!draft.from}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }
);

DateRangePicker.displayName = "DateRangePicker";

export { DateRangePicker };
