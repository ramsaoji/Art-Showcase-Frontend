import { useState, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import Loader from "@/components/common/Loader";
import EmptyState from "@/components/common/EmptyState";
import SectionHeader from "@/components/common/SectionHeader";
import SearchBar from "@/components/common/SearchBar";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_ACTION_OPTIONS,
  exportLogsToCSV,
  getActionCategory,
  maskIp,
  getActionLabel,
  getCategoryStyle,
  getStatusStyle,
  getRoleStyle,
  formatAbsoluteTime,
  formatRelativeTime,
  getMetadataSummary,
} from "@/features/activity-log/utils/activityLogHelpers";
import {
  ArrowDownTrayIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import ShieldCheckIcon from "@heroicons/react/24/outline/ShieldCheckIcon";
import PaintBrushIcon from "@heroicons/react/24/outline/PaintBrushIcon";
import Cog6ToothIcon from "@heroicons/react/24/outline/Cog6ToothIcon";
import CpuChipIcon from "@heroicons/react/24/outline/CpuChipIcon";
import ClipboardDocumentListIcon from "@heroicons/react/24/outline/ClipboardDocumentListIcon";

const CATEGORY_ICONS = {
  AUTH: ShieldCheckIcon,
  ARTWORK: PaintBrushIcon,
  ADMIN: Cog6ToothIcon,
  SYSTEM: CpuChipIcon,
  OTHER: ClipboardDocumentListIcon,
};

const STATUS_OPTIONS = ["SUCCESS", "FAILED", "PARTIAL"];
const ROLE_OPTIONS   = ["ARTIST", "SUPER_ADMIN", "SYSTEM", "ANONYMOUS"];

function humanizeMetadataKey(key) {
  if (!key) return "";
  const withSpaces = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  const lower = withSpaces.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function summarizeMetadataValue(value) {
  if (value == null) return "—";

  const type = typeof value;

  if (type === "boolean") return value ? "Yes" : "No";

  if (type === "string") {
    // ISO date string → format it nicely
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      try {
        return new Date(value).toLocaleString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit", hour12: true,
        });
      } catch {}
    }
    return value.length > 80 ? `${value.slice(0, 77)}…` : value;
  }

  if (type === "number") return String(value);

  if (Array.isArray(value)) {
    const count = value.length;
    if (count === 0) return "Empty list";
    // If it's a simple array of strings/numbers, join them.
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      return value.join(", ");
    }
    return `${count} ${count === 1 ? "item" : "items"}`;
  }

  if (type === "object") {
    const keys = Object.keys(value);
    const count = keys.length;
    return count === 0 ? "—" : `${count} ${count === 1 ? "field" : "fields"}`;
  }

  return "—";
}

function formatChangeValue(value) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      try {
        return new Date(value).toLocaleString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit", hour12: true,
        });
      } catch {}
    }
    return value.length > 60 ? `${value.slice(0, 57)}…` : value;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && value.updated) return "(updated)";
  return String(value);
}

function getChangePair(value) {
  if (!value || typeof value !== "object") return null;
  const before = value.before ?? value.from;
  const after  = value.after ?? value.to;
  if (before === undefined && after === undefined) return null;
  return { before, after };
}

/**
 * Detects { [userId]: { artistName, artworks|images: number } }
 */
function isArtistsMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.values(value);
  if (entries.length === 0) return false;
  return entries.every(
    (v) => v && typeof v === "object" && "artistName" in v && ("artworks" in v || "images" in v || "count" in v)
  );
}

function ArtistsMapDisplay({ value }) {
  const entries = Object.values(value);
  return (
    <div className="flex flex-wrap gap-1.5 mt-0.5">
      {entries.map((a, i) => {
        const count = a.artworks ?? a.images ?? a.count ?? 0;
        const unit  = "artworks" in a ? "artwork" : "images" in a ? "image" : "artwork";
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] font-sans text-indigo-700 font-medium"
          >
            {a.artistName || "Unknown"}
            <span className="bg-indigo-100 text-indigo-600 rounded-full px-1.5 py-px text-[10px] font-semibold">
              {count} {unit}{count !== 1 ? "s" : ""}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Stat card used in the top stats bar */
function StatCard({ label, value, gradient }) {
  return (
    <div className="flex flex-col bg-white/90 border border-gray-100 rounded-2xl shadow-sm p-5 min-w-0 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <span
        className={`text-2xl font-bold font-artistic bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
      >
        {value ?? "—"}
      </span>
      <span className="text-xs font-sans text-gray-500 mt-1 leading-tight">{label}</span>
    </div>
  );
}

/**
 * AdminActivityLogs
 * Admin-only audit panel — dense table view with full filters, CSV export,
 * and click-to-expand metadata rows.
 */
export default function AdminActivityLogs() {
  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch]     = useState("");
  const [actorRole, setActorRole] = useState("");
  const [action, setAction]     = useState("");
  const [status, setStatus]     = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ── Expanded row state ────────────────────────────────────────────────────
  const [expandedId, setExpandedId] = useState(null);
  const [rawJsonForId, setRawJsonForId] = useState(null);

  const queryInput = {
    limit: 50,
    ...(search    ? { search }    : {}),
    ...(actorRole ? { actorRole } : {}),
    ...(action    ? { action }    : {}),
    ...(status    ? { status }    : {}),
    ...(dateFrom  ? { dateFrom }  : {}),
    ...(dateTo    ? { dateTo }    : {}),
  };

  // ── Infinite query ────────────────────────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = trpc.activityLog.getAdminActivityLogs.useInfiniteQuery(queryInput, {
    getNextPageParam: (last) => last.nextCursor,
    keepPreviousData: true,
    // Always refetch when this tab/page is opened so admins see the latest events
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });

  // ── Stats query ───────────────────────────────────────────────────────────
  const { data: stats } = trpc.activityLog.getActivityLogStats.useQuery(
    undefined,
    {
      // Keep stats in sync with the latest logs whenever the tab is opened
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnReconnect: true,
    }
  );

  const allLogs = data?.pages.flatMap((p) => p.logs) ?? [];
  const totalCount = data?.pages[0]?.totalCount;
  const hasActiveFilters = search || actorRole || action || status || dateFrom || dateTo;

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setActorRole("");
    setAction("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  }, []);

  const handleExportCSV = useCallback(() => {
    exportLogsToCSV(allLogs);
  }, [allLogs]);

  const toggleRow = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <>
      <SectionHeader
        title="Activity Audit Logs"
        description="Full audit trail of all platform actions — logins, artwork operations, admin actions, and system events."
      />

      {/* ── Stats bar ──────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total events"      value={stats.totalLogs?.toLocaleString()}      gradient="from-indigo-600 to-purple-600" />
          <StatCard label="Last 24 hours"     value={stats.logsLast24h?.toLocaleString()}    gradient="from-blue-600 to-cyan-600" />
          <StatCard label="Failed events"     value={stats.failedLogs?.toLocaleString()}     gradient="from-red-500 to-rose-600" />
          <StatCard
            label="Top action"
            value={stats.topActions?.[0] ? getActionLabel(stats.topActions[0].action) : "—"}
            gradient="from-amber-500 to-orange-500"
          />
        </div>
      )}

      {/* ── Search + filter bar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-[220px] max-w-md">
          <SearchBar
            inline
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actor, target…"
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 text-sm font-sans font-medium px-3 py-2 rounded-xl border transition-colors ${
              hasActiveFilters
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-4 h-4 flex items-center justify-center text-[10px] bg-indigo-600 text-white rounded-full font-bold">
                ·
              </span>
            )}
          </button>

          {allLogs.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-sm font-sans font-medium px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>
          )}

          <span className="text-xs font-sans text-gray-400 whitespace-nowrap">
            {isLoading
              ? "Loading…"
              : totalCount != null
              ? `${totalCount.toLocaleString()} total`
              : `${allLogs.length} loaded`}
            {hasActiveFilters && " (filtered)"}
          </span>
        </div>
      </div>

      {/* ── Filters panel ───────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            key="filters"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mb-5 bg-gray-50/80 border border-gray-100 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-sans font-medium text-gray-500 mb-1 uppercase tracking-wide">Role</label>
                <Select
                  value={actorRole || "ALL"}
                  onValueChange={(val) => setActorRole(val === "ALL" ? "" : val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All roles</SelectItem>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-[11px] font-sans font-medium text-gray-500 mb-1 uppercase tracking-wide">Action</label>
                <Select
                  value={action || "ALL"}
                  onValueChange={(val) => setAction(val === "ALL" ? "" : val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All actions</SelectItem>
                    {ALL_ACTION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-[11px] font-sans font-medium text-gray-500 mb-1 uppercase tracking-wide">Status</label>
                <Select
                  value={status || "ALL"}
                  onValueChange={(val) => setStatus(val === "ALL" ? "" : val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-[11px] font-sans font-medium text-gray-500 mb-1 uppercase tracking-wide">From</label>
                <DateTimePicker
                  value={dateFrom || ""}
                  onChange={(val) => setDateFrom(val || "")}
                  placeholder="From date & time"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans font-medium text-gray-500 mb-1 uppercase tracking-wide">To</label>
                <DateTimePicker
                  value={dateTo || ""}
                  onChange={(val) => setDateTo(val || "")}
                  placeholder="To date & time"
                />
              </div>

              {hasActiveFilters && (
                <div className="col-span-full flex justify-end">
                  <button
                    onClick={handleClearFilters}
                    className="text-xs font-sans text-gray-500 hover:text-red-500 underline transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader size="medium" />
        </div>
      ) : isError ? (
        <div className="text-center py-10">
          <p className="text-gray-500 font-sans text-sm">Failed to load logs.</p>
          <button onClick={() => refetch()} className="mt-3 text-sm text-indigo-600 underline">Retry</button>
        </div>
      ) : allLogs.length === 0 ? (
        <EmptyState
          title="No logs found"
          description={hasActiveFilters ? "Try adjusting your filters." : "Activity logs will appear here as events are recorded."}
        />
      ) : (
        <>
          <div className="w-full overflow-x-auto rounded-xl custom-scrollbar pb-10">
            <table className="min-w-[820px] w-full text-left font-sans border-separate border-spacing-y-2.5">
              <thead>
                <tr>
                  {[
                    { label: "Timestamp", width: "w-[15%]" },
                    { label: "Actor", width: "w-[20%]" },
                    { label: "Action", width: "w-[12%]" },
                    { label: "Target", width: "w-[38%]" },
                    { label: "Status", width: "w-[10%]" },
                    { label: "", width: "w-[5%]" }
                  ].map((h, i) => (
                    <th key={i} className={`px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${h.width}`}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allLogs.map((log) => {
                  const catStyle     = getCategoryStyle(log.action);
                  const statusStyle  = getStatusStyle(log.status);
                  const roleStyle    = getRoleStyle(log.actorRole);
                  const metaSummary  = getMetadataSummary(log.action, log.metadata);
                  const category     = getActionCategory(log.action);
                  const CategoryIcon = CATEGORY_ICONS[category] || CATEGORY_ICONS.OTHER;
                  const isExpanded   = expandedId === log.id;
                  const _meta = log.metadata || {};
                  const _isAuthRoleOnly = (log.action === "AUTH_LOGIN_SUCCESS" || log.action === "AUTH_REGISTER");
                  const _filteredKeys = Object.keys(_meta).filter((k) => !(_isAuthRoleOnly && k === "role"));
                  const hasMetadata = _filteredKeys.length > 0;

                  return (
                    <Fragment key={log.id}>
                      <tr
                        className={`group ${
                          hasMetadata ? "cursor-pointer" : "cursor-default"
                        }`}
                        onClick={hasMetadata ? () => toggleRow(log.id) : undefined}
                      >
                        {/* Timestamp */}
                        <td className={`px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap align-middle rounded-l-2xl border-y border-l border-gray-100 bg-white group-hover:bg-gray-50 transition-colors ${isExpanded ? "rounded-bl-none border-b-transparent relative" : "shadow-sm"}`}>
                          {isExpanded && <div className="absolute left-0 bottom-0 h-px w-full bg-gradient-to-r from-transparent to-gray-100" />}
                          <div>
                            <p className="text-xs font-sans text-gray-700 font-medium">
                              {formatRelativeTime(log.createdAt)}
                            </p>
                            <p className="text-[10px] font-sans text-gray-400">
                              {formatAbsoluteTime(log.createdAt)}
                            </p>
                          </div>
                        </td>

                        {/* Actor */}
                        <td className={`px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap align-middle max-w-[160px] border-y border-gray-100 bg-white group-hover:bg-gray-50 transition-colors ${isExpanded ? "border-b-transparent" : "shadow-sm"}`}>
                          <p className="text-xs font-sans text-gray-800 font-medium truncate" title={log.actorName}>
                            {log.actorName ?? "—"}
                          </p>
                          {log.actorRole && (
                            <span className={`text-[10px] font-sans px-1.5 py-0.5 rounded-full ${roleStyle.bg} ${roleStyle.text}`}>
                              {log.actorRole}
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className={`px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap align-middle border-y border-gray-100 bg-white group-hover:bg-gray-50 transition-colors ${isExpanded ? "border-b-transparent" : "shadow-sm"}`}>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                            <CategoryIcon className={`w-4 h-4 ${catStyle.text}`} aria-hidden="true" />
                            {getActionLabel(log.action)}
                          </span>
                        </td>

                        {/* Target */}
                        <td className={`px-3 sm:px-4 py-3 sm:py-3.5 align-middle max-w-[160px] border-y border-gray-100 bg-white group-hover:bg-gray-50 transition-colors ${isExpanded ? "border-b-transparent" : "shadow-sm"}`}>
                          {log.targetLabel ? (
                            <p className="text-xs font-sans text-gray-700 truncate" title={log.targetLabel}>
                              {log.targetLabel}
                            </p>
                          ) : log.targetType ? (
                            <span className="text-[11px] font-sans text-gray-400 italic">{log.targetType}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                          {metaSummary && (
                            <p className="text-[10px] font-sans text-gray-400 truncate">{metaSummary}</p>
                          )}
                        </td>

                        {/* Status */}
                        <td className={`px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap align-middle border-y border-gray-100 bg-white group-hover:bg-gray-50 transition-colors ${isExpanded ? "border-b-transparent" : "shadow-sm"}`}>
                          <span className={`text-[11px] font-semibold font-sans px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            {log.status}
                          </span>
                          {log.errorMsg && (
                            <p className="text-[10px] font-sans text-red-500 mt-0.5 italic max-w-[120px] truncate" title={log.errorMsg}>
                              {log.errorMsg}
                            </p>
                          )}
                        </td>

                        {/* IP */}
                        {/* <td className="px-3 py-3 whitespace-nowrap align-middle">
                          <span className="text-[10px] font-mono text-gray-400">{maskIp(log.ipAddress)}</span>
                        </td> */}

                        {/* Expand */}
                        <td className={`px-3 sm:px-4 py-3 sm:py-3.5 align-middle rounded-r-2xl border-y border-r border-gray-100 bg-white group-hover:bg-gray-50 transition-colors ${isExpanded ? "rounded-br-none border-b-transparent relative" : "shadow-sm"}`}>
                          {isExpanded && <div className="absolute right-0 bottom-0 h-px w-full bg-gradient-to-l from-transparent to-gray-100" />}
                          {hasMetadata && (
                            <button
                              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                              onClick={(e) => { e.stopPropagation(); toggleRow(log.id); }}
                            >
                              {isExpanded
                                ? <ChevronUpIcon className="w-3.5 h-3.5" />
                                : <ChevronDownIcon className="w-3.5 h-3.5" />
                              }
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expandable metadata row */}
                      {isExpanded && hasMetadata && (
                        <tr key={`${log.id}-meta`} className="bg-indigo-50/20 backdrop-blur-sm relative">
                          <td colSpan={6} className="px-4 sm:px-6 pb-5 pt-2 rounded-b-2xl border-b border-x border-gray-100/50 shadow-sm relative top-[-1px]">
                            <div className="rounded-2xl border border-indigo-100/40 bg-white/90 shadow-sm px-5 py-4">
                              {(() => {
                                const metadata = log.metadata || {};
                                const isAuthRoleRedundant = log.action === "AUTH_LOGIN_SUCCESS" || log.action === "AUTH_REGISTER";
                                const topLevelEntries = Object.entries(metadata).filter(
                                    ([key]) => key !== "changes" && key !== "imageChanges"
                                      && key !== "addedArtworks" && key !== "removedArtworks"
                                      && key !== "reorderedArtworks" && key !== "featuredSnapshot"
                                      && key !== "carouselSnapshot"
                                      && !(isAuthRoleRedundant && key === "role")
                                  );
                                const changesObject =
                                  metadata.changes && typeof metadata.changes === "object"
                                    ? metadata.changes
                                    : null;
                                return (
                                  <>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2">
                                        <p className="text-[11px] font-sans font-medium text-gray-600 uppercase tracking-wide">
                                          Details
                                        </p>
                                        <p className="text-[11px] font-sans text-gray-400">
                                          {Object.keys(metadata).length}{" "}
                                          {Object.keys(metadata).length === 1 ? "field" : "fields"}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setRawJsonForId((prev) => (prev === log.id ? null : log.id));
                                        }}
                                        className="text-[11px] font-sans text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline"
                                      >
                                        {rawJsonForId === log.id ? "Hide raw JSON" : "View raw JSON"}
                                      </button>
                                    </div>

                                    {topLevelEntries.length > 0 && (
                                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                        {topLevelEntries.map(([key, value]) => {
                                          const isArtists = key === "artists" && isArtistsMap(value);
                                          return (
                                            <div key={key} className={isArtists ? "sm:col-span-2" : "min-w-0"}>
                                              <dt className="text-[11px] font-sans font-medium text-gray-500 truncate">
                                                {humanizeMetadataKey(key)}
                                              </dt>
                                              <dd className="text-xs font-sans text-gray-800">
                                                {isArtists ? (
                                                  <ArtistsMapDisplay value={value} />
                                                ) : (
                                                  <span
                                                    className="truncate block"
                                                    title={
                                                      typeof value === "string" || typeof value === "number" || typeof value === "boolean"
                                                        ? String(value)
                                                        : undefined
                                                    }
                                                  >
                                                    {summarizeMetadataValue(value)}
                                                  </span>
                                                )}
                                              </dd>
                                            </div>
                                          );
                                        })}
                                      </dl>
                                    )}

                                    {/* ── Field changes (before → after) ── */}
                                    {changesObject && Object.keys(changesObject).length > 0 && (
                                      <div className="mt-3 border-t border-dashed border-gray-200 pt-3">
                                        <p className="text-[11px] font-sans font-medium text-gray-600 uppercase tracking-wide mb-1.5">
                                          Changes
                                        </p>
                                        <div className="rounded-lg border border-gray-100 bg-white/80 overflow-hidden">
                                          <div className="grid grid-cols-3 gap-2 px-3 py-1.5 bg-gray-50/80 text-[11px] font-sans font-medium text-gray-500">
                                            <span>Field</span>
                                            <span>Before</span>
                                            <span>After</span>
                                          </div>
                                          <div className="divide-y divide-gray-100">
                                            {Object.entries(changesObject).map(([fieldKey, value]) => {
                                              const pair = getChangePair(value);
                                              return (
                                                <div
                                                  key={fieldKey}
                                                  className="grid grid-cols-3 gap-2 px-3 py-1.5 text-xs font-sans text-gray-800"
                                                >
                                                  <span className="font-medium text-gray-600 truncate">
                                                    {humanizeMetadataKey(fieldKey)}
                                                  </span>
                                                  {pair ? (
                                                    <>
                                                      <span className="truncate text-red-600/80" title={pair.before != null ? formatChangeValue(pair.before) : "—"}>
                                                        {formatChangeValue(pair.before)}
                                                      </span>
                                                      <span className="truncate text-emerald-600/90" title={pair.after != null ? formatChangeValue(pair.after) : "—"}>
                                                        {formatChangeValue(pair.after)}
                                                      </span>
                                                    </>
                                                  ) : (
                                                    <span className="col-span-2 truncate text-gray-500 italic">
                                                      {summarizeMetadataValue(value)}
                                                    </span>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* ── Image changes ── */}
                                    {metadata.imageChanges && typeof metadata.imageChanges === "object" && (
                                      <div className="mt-3 border-t border-dashed border-gray-200 pt-3">
                                        <p className="text-[11px] font-sans font-medium text-gray-600 uppercase tracking-wide mb-1.5">
                                          Image changes
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {Object.entries(metadata.imageChanges).map(([k, v]) =>
                                            v ? (
                                              <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-[11px] font-sans text-purple-700 font-medium">
                                                {humanizeMetadataKey(k)}{typeof v === "number" ? `: ${v}` : ""}
                                              </span>
                                            ) : null
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* ── Added artworks ── */}
                                    {Array.isArray(metadata.addedArtworks) && metadata.addedArtworks.length > 0 && (
                                      <div className="mt-3 border-t border-dashed border-gray-200 pt-3">
                                        <p className="text-[11px] font-sans font-medium text-emerald-700 uppercase tracking-wide mb-1.5">
                                          ✦ Added ({metadata.addedArtworks.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {metadata.addedArtworks.map((a, i) => (
                                            <span key={i} className="inline-flex flex-wrap items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-sans text-emerald-700 font-medium">
                                              <span className="font-semibold">{a.artworkTitle || a.title || "Untitled"}</span>
                                              {a.artistName && <span className="text-emerald-500">· {a.artistName}</span>}
                                              {a.order != null && <span className="bg-emerald-200 text-emerald-700 rounded-full px-1.5 py-px text-[10px] font-bold">Slot #{a.order + 1}</span>}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* ── Removed artworks ── */}
                                    {Array.isArray(metadata.removedArtworks) && metadata.removedArtworks.length > 0 && (
                                      <div className="mt-3 border-t border-dashed border-gray-200 pt-3">
                                        <p className="text-[11px] font-sans font-medium text-red-600 uppercase tracking-wide mb-1.5">
                                          ✦ Removed ({metadata.removedArtworks.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {metadata.removedArtworks.map((a, i) => (
                                            <span key={i} className="inline-flex flex-wrap items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-[11px] font-sans text-red-600 font-medium">
                                              <span className="font-semibold">{a.artworkTitle || a.title || "Untitled"}</span>
                                              {a.artistName && <span className="text-red-400">· {a.artistName}</span>}
                                              {/* Featured logs use 'order', carousel logs use 'previousOrder' */}
                                              {a.previousOrder != null && <span className="bg-red-100 text-red-500 rounded-full px-1.5 py-px text-[10px] font-bold">Was #{a.previousOrder + 1}</span>}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* ── Reordered artworks ── */}
                                    {Array.isArray(metadata.reorderedArtworks) && metadata.reorderedArtworks.length > 0 && (
                                      <div className="mt-3 border-t border-dashed border-gray-200 pt-3">
                                        <p className="text-[11px] font-sans font-medium text-amber-600 uppercase tracking-wide mb-1.5">
                                          ✦ Reordered ({metadata.reorderedArtworks.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {metadata.reorderedArtworks.map((a, i) => (
                                            <span key={i} className="inline-flex flex-wrap items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[11px] font-sans text-amber-700 font-medium">
                                              <span className="font-semibold">{a.artworkTitle || a.title || "Untitled"}</span>
                                              {a.artistName && <span className="text-amber-500">· {a.artistName}</span>}
                                              {a.from != null && a.to != null && (
                                                <span className="bg-amber-100 text-amber-700 rounded-full px-1.5 py-px text-[10px] font-bold">
                                                  #{a.from + 1} → #{a.to + 1}
                                                </span>
                                              )}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* ── Final featured snapshot ── */}
                                    {Array.isArray(metadata.featuredSnapshot) && metadata.featuredSnapshot.length > 0 && (
                                      <div className="mt-3 border-t border-dashed border-gray-200 pt-3">
                                        <p className="text-[11px] font-sans font-medium text-indigo-700 uppercase tracking-wide mb-1.5">
                                          ✦ Final featured order
                                        </p>
                                        <ol className="space-y-0.5">
                                          {metadata.featuredSnapshot.map((a, i) => (
                                            <li key={i} className="flex items-center gap-2 text-[11px] font-sans text-gray-700">
                                              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 font-bold text-[9px] shrink-0">{i + 1}</span>
                                              <span className="font-medium truncate">{a.title || "Untitled"}</span>
                                              {a.artistName && <span className="text-gray-400 truncate">· {a.artistName}</span>}
                                            </li>
                                          ))}
                                        </ol>
                                      </div>
                                    )}

                                    {/* ── Final carousel snapshot ── */}
                                    {Array.isArray(metadata.carouselSnapshot) && metadata.carouselSnapshot.length > 0 && (
                                      <div className="mt-3 border-t border-dashed border-gray-200 pt-3">
                                        <p className="text-[11px] font-sans font-medium text-indigo-700 uppercase tracking-wide mb-1.5">
                                          ✦ Final carousel order
                                        </p>
                                        <ol className="space-y-0.5">
                                          {metadata.carouselSnapshot.map((a, i) => (
                                            <li key={i} className="flex items-center gap-2 text-[11px] font-sans text-gray-700">
                                              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-purple-100 text-purple-600 font-bold text-[9px] shrink-0">{(a.order ?? i) + 1}</span>
                                              <span className="font-medium truncate">{a.artworkTitle || "Untitled"}</span>
                                              {a.artistName && <span className="text-gray-400 truncate">· {a.artistName}</span>}
                                            </li>
                                          ))}
                                        </ol>
                                      </div>
                                    )}
                                    {rawJsonForId === log.id && (
                                      <pre className="mt-3 p-2.5 bg-gray-900 text-[11px] font-mono text-gray-100 rounded-lg overflow-x-auto leading-relaxed custom-scrollbar">
                                        {JSON.stringify(metadata, null, 2)}
                                      </pre>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-2.5 text-sm font-sans font-medium bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading…" : "Load more rows"}
              </button>
            </div>
          )}

          {!hasNextPage && allLogs.length > 10 && (
            <p className="text-center text-xs font-sans text-gray-400 mt-6">
              — All {allLogs.length} events loaded —
            </p>
          )}
        </>
      )}
    </>
  );
}
