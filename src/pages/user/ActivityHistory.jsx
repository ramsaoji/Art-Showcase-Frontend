import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import PageBackground from "@/components/common/PageBackground";
import PageHeader from "@/components/common/PageHeader";

import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import ActivityLogEntry from "@/features/activity-log/components/ActivityLogEntry";
import ActivityHistorySkeleton from "@/components/skeletons/ActivityHistorySkeleton";
import {
  ALL_ACTION_OPTIONS,
  ARTIST_ACTION_OPTIONS,
  exportLogsToExcel,
  getActionLabel,
} from "@/features/activity-log/utils/activityLogHelpers";
import { containerMotion } from "@/lib/motionConfigs";
import { ClockIcon } from "@heroicons/react/24/outline";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import SearchBar from "@/components/common/SearchBar";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackError } from "@/services/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { NO_REFETCH_ON_FOCUS } from "@/lib/queryOptions";
import { PERMISSIONS } from "@/lib/rbac";

const STATUS_OPTIONS = ["SUCCESS", "FAILED", "PARTIAL"];

const STAT_CARD_CLASS =
  "flex flex-col items-center justify-center bg-white/90 border border-gray-100 rounded-2xl shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300";

/**
 * ActivityHistory Page — Artist view
 * Route: /activity-history
 * Shows the artist's own activity log with filters and infinite scroll.
 */
export default function ActivityHistory() {
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Latches to true after first successful data load — never resets on filter change
  const hasLoadedOnce = useRef(false);
  const hasLoggedError = useRef(false);

  // Build query input
  const queryInput = {
    limit: 20,
    ...(search ? { search } : {}),
    ...(action ? { action } : {}),
    ...(status ? { status } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    isError,
    refetch,
  } = trpc.activityLog.getMyActivityLogs.useInfiniteQuery(queryInput, {
    getNextPageParam: (last) => last.nextCursor,
    keepPreviousData: true,
    ...NO_REFETCH_ON_FOCUS,
    onError: (err) => {
      if (!hasLoggedError.current) {
        trackError(
          err?.message || "Failed to load activity history.",
          "ActivityHistory",
        );
        hasLoggedError.current = true;
      }
    },
  });
  useEffect(() => {
    if (!isError) {
      hasLoggedError.current = false;
    }
  }, [isError]);

  // Latch hasLoadedOnce as soon as we get data for the first time
  if (data !== undefined && !hasLoadedOnce.current) {
    hasLoadedOnce.current = true;
  }
  const isInitialLoad = !hasLoadedOnce.current;
  const isRefetching = isFetching && !isInitialLoad;
  const allLogs = data?.pages.flatMap((p) => p.logs) ?? [];

  const topAction = (() => {
    if (!allLogs.length) return null;
    const counts = {};
    for (const log of allLogs)
      counts[log.action] = (counts[log.action] || 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? getActionLabel(top[0]) : null;
  })();
  const totalCount =
    data?.pages[0]?.logs !== undefined
      ? allLogs.length + (data.pages[data.pages.length - 1]?.hasMore ? "+" : "")
      : 0;

  const actionOptions = useMemo(() => {
    if (can(PERMISSIONS.AUDIT_READ_ANY)) {
      return ALL_ACTION_OPTIONS;
    }
    if (!allLogs.length) return ARTIST_ACTION_OPTIONS;
    const seen = new Set(allLogs.map((log) => log.action));
    const relevant = ARTIST_ACTION_OPTIONS.filter((opt) => seen.has(opt.value));
    return relevant.length > 0 ? relevant : ARTIST_ACTION_OPTIONS;
  }, [can, allLogs]);
  useEffect(() => {
    if (action && !actionOptions.some((opt) => opt.value === action)) {
      setAction("");
    }
  }, [action, actionOptions]);

  // Cache last known stat values so cards never blank out during filter refetch
  const lastStatsRef = useRef(null);
  if (allLogs.length > 0 || data !== undefined) {
    lastStatsRef.current = {
      total: allLogs.length,
      hasMore: data?.pages[data.pages.length - 1]?.hasMore ?? false,
      successful: allLogs.filter((l) => l.status === "SUCCESS").length,
      failed: allLogs.filter((l) => l.status === "FAILED").length,
      topAction,
    };
  }
  const cachedStats = lastStatsRef.current;
  const statsReady = !isInitialLoad || !isFetching;

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setAction("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  }, []);

  const trpcUtils = trpc.useUtils();
  const handleExportExcel = useCallback(async () => {
    // Re-fetch all matching logs without pagination if we want a complete export
    if (totalCount && totalCount > allLogs.length) {
      const result = await trpcUtils.activityLog.getMyActivityLogs.fetch({
        ...queryInput,
        limit: 10000, // Large limit to catch all for export
      });
      await exportLogsToExcel(result.logs, "artist");
    } else {
      await exportLogsToExcel(allLogs, "artist");
    }
  }, [allLogs, queryInput, totalCount, trpcUtils]);

  const hasActiveFilters = search || action || status || dateFrom || dateTo;

  return (
    <div className="relative min-h-screen bg-gray-50/50">
      <PageBackground variant="default" />

      <motion.div
        {...containerMotion}
        className="relative container mx-auto px-4 sm:px-8 py-12"
      >
        <PageHeader
          title="Activity History"
          subtitle="A complete record of all actions taken on your account and artworks."
          icon={<ClockIcon className="w-8 h-8 text-indigo-500" />}
        />

        {/* ── Initial full skeleton ─────────────────────────────── */}
        {isInitialLoad && isFetching ? (
          <ActivityHistorySkeleton />
        ) : isError ? (
          <ErrorState
            icon={ClockIcon}
            title="Failed to load activity"
            description="Something went wrong while fetching your activity logs. Please try again."
            primaryAction={
              <Button
                variant="default"
                className="rounded-full px-8 font-artistic text-base"
                onClick={() => refetch()}
              >
                Try again
              </Button>
            }
          />
        ) : (
          <>
            {/* ── Stats row — always visible after initial load ─────── */}
            {(isFetching && !isInitialLoad) || (!statsReady && !cachedStats) ? (
              <ActivityHistorySkeleton statsOnly />
            ) : cachedStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className={STAT_CARD_CLASS}>
                  <p className="text-xl sm:text-2xl font-bold font-artistic bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {cachedStats.total}
                    {cachedStats.hasMore ? "+" : ""}
                  </p>
                  <p className="text-xs font-sans text-gray-500 mt-1 text-center">
                    Events loaded
                  </p>
                </div>
                <div className={STAT_CARD_CLASS}>
                  <p className="text-xl sm:text-2xl font-bold font-artistic bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {cachedStats.successful}
                  </p>
                  <p className="text-xs font-sans text-gray-500 mt-1 text-center">
                    Successful
                  </p>
                </div>
                <div className={STAT_CARD_CLASS}>
                  <p className="text-xl sm:text-2xl font-bold font-artistic bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">
                    {cachedStats.failed}
                  </p>
                  <p className="text-xs font-sans text-gray-500 mt-1 text-center">
                    Failed
                  </p>
                </div>
                <div className={STAT_CARD_CLASS}>
                  <p className="text-sm font-bold font-artistic bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent leading-tight text-center">
                    {cachedStats.topAction ?? "—"}
                  </p>
                  <p className="text-xs font-sans text-gray-500 mt-1 text-center">
                    Top action
                  </p>
                </div>
              </div>
            ) : null}

            {/* ── Search + export bar ───────────────────────────────── */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-[220px] max-w-xl">
                <SearchBar
                  inline
                  value={search}
                  onChange={setSearch}
                  placeholder="Search activity, target, status…"
                  className="w-full bg-white/90 border border-gray-200 shadow-sm"
                />
              </div>
              {/* <div className="flex items-center gap-2 shrink-0">
                {allLogs.length > 0 && (
                  <button
                    onClick={handleExportExcel}
                    disabled={isRefetching}
                    className="group flex items-center gap-1.5 text-sm font-sans font-medium px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    Export Excel
                  </button>
                )}
              </div> */}
            </div>

            {/* ── Filters panel ─────────────────────────────────────── */}
            <div className="mb-6 bg-white/90 border border-gray-100 rounded-2xl shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-sans font-medium text-gray-600 mb-1">
                  Action
                </label>
                <Select
                  value={action || "ALL"}
                  onValueChange={(val) => setAction(val === "ALL" ? "" : val)}
                  disabled={isRefetching}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All actions</SelectItem>
                    {actionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-sans font-medium text-gray-600 mb-1">
                  Status
                </label>
                <Select
                  value={status || "ALL"}
                  onValueChange={(val) => setStatus(val === "ALL" ? "" : val)}
                  disabled={isRefetching}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-sans font-medium text-gray-600 mb-1">
                  Date range
                </label>
                <DateRangePicker
                  value={{ from: dateFrom || "", to: dateTo || "" }}
                  onChange={({ from, to }) => {
                    setDateFrom(from || "");
                    setDateTo(to || "");
                  }}
                  placeholder="Select date range"
                  disabled={isRefetching}
                  className="w-full"
                />
              </div>
              {hasActiveFilters && (
                <div className="col-span-full flex justify-end">
                  <button
                    onClick={handleClearFilters}
                    disabled={isRefetching}
                    className="text-xs font-sans text-gray-500 hover:text-red-500 underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* ── Timeline — reacts to fetching / empty / data ──────── */}
            {isFetching && !isInitialLoad ? (
              <ActivityHistorySkeleton timelineOnly count={4} />
            ) : allLogs.length === 0 ? (
              <EmptyState
                icon={ClockIcon}
                title="No activity yet"
                description={
                  hasActiveFilters
                    ? "No events match your current filters. Try adjusting or clearing them."
                    : "Your account actions will appear here as you use the platform."
                }
                action={
                  hasActiveFilters ? (
                    <Button
                      variant="default"
                      className="rounded-full px-8 font-artistic text-base"
                      onClick={handleClearFilters}
                    >
                      Clear all filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="relative border-l-2 border-dashed border-gray-200 ml-[22px] sm:ml-[30px] pl-[26px] sm:pl-[40px] flex flex-col gap-6 py-2">
                {allLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <ActivityLogEntry log={log} />
                  </div>
                ))}
                {hasNextPage && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-6 py-2.5 text-sm font-sans font-medium bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all disabled:opacity-50"
                    >
                      {isFetchingNextPage ? "Loading…" : "Load more"}
                    </button>
                  </div>
                )}
                {!hasNextPage && allLogs.length > 5 && (
                  <p className="text-center text-xs font-sans text-gray-400 pt-4">
                    — All events loaded —
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
