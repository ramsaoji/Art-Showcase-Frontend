import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCategoryStyle,
  getStatusStyle,
  getActionLabel,
  getActionCategory,
  getMetadataSummary,
  formatRelativeTime,
  formatAbsoluteTime,
} from "@/features/activity-log/utils/activityLogHelpers";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
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

function humanizeMetadataKey(key) {
  if (!key) return "";
  const withSpaces = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  const lower = withSpaces.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function formatDateTime(str) {
  try {
    return new Date(str).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch {
    return str;
  }
}

function summarizeMetadataValue(value) {
  if (value == null) return "Not available";

  const type = typeof value;

  if (type === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value);
    return value.length > 80 ? `${value.slice(0, 77)}…` : value;
  }

  if (type === "number" || type === "boolean") {
    const text = String(value);
    return text.length > 80 ? `${text.slice(0, 77)}…` : text;
  }

  if (Array.isArray(value)) {
    const count = value.length;
    if (count === 0) return "Empty list";
    // If it's a simple array of strings/numbers, join them.
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      return value.join(", ");
    }
    return `${count} ${count === 1 ? "item" : "items"} in list`;
  }

  if (type === "object") {
    const keys = Object.keys(value);
    const count = keys.length;
    return count === 0
      ? "Empty details"
      : `${count} ${count === 1 ? "field" : "fields"} in details`;
  }

  return "Details available";
}

function formatChangeValue(value) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value);
    return value.length > 60 ? `${value.slice(0, 57)}…` : value;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && value !== null && value.updated) return "(updated)";
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
 * Detects the special `artists` metadata map:
 * { [userId]: { artistName, artworks|images: number } }
 */
function isArtistsMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.values(value);
  if (entries.length === 0) return false;
  return entries.every(
    (v) => v && typeof v === "object" && ("artistName" in v) && ("artworks" in v || "images" in v || "count" in v)
  );
}

/**
 * Renders the `artists` map as a compact, readable list of artist names + counts.
 */
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

/**
 * ActivityLogEntry
 * A single row in the activity timeline.
 * Shared between artist ActivityHistory and admin ActivityLogs pages.
 *
 * Props:
 *   log         - single activity log object from tRPC
 *   showActor   - (admin only) show actor name + role column
 *   showIp      - (admin only) show IP address
 */
export default function ActivityLogEntry({ log, showActor = false, showIp = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw]   = useState(false);
  const categoryStyle = getCategoryStyle(log.action);
  const statusStyle   = getStatusStyle(log.status);
  const category      = getActionCategory(log.action);
  const CategoryIcon  = CATEGORY_ICONS[category] || CATEGORY_ICONS.OTHER;
  const metaSummary   = getMetadataSummary(log.action, log.metadata);
  const metadata      = log.metadata || {};
  const isAuthRoleRedundant = log.action === "AUTH_LOGIN_SUCCESS" || log.action === "AUTH_REGISTER";
  const topLevelEntries = Object.entries(metadata).filter(
    ([key]) =>
      key !== "changes" &&
      key !== "imageChanges" &&
      key !== "addedArtworks" &&
      key !== "removedArtworks" &&
      key !== "reorderedArtworks" &&
      key !== "featuredSnapshot" &&
      key !== "carouselSnapshot" &&
      !(isAuthRoleRedundant && key === "role")
  );
  const changesObject   = metadata.changes && typeof metadata.changes === "object"
    ? metadata.changes
    : null;
  const hasMetadata = topLevelEntries.length > 0 || !!changesObject || !!metadata.imageChanges ||
    Array.isArray(metadata.addedArtworks) || Array.isArray(metadata.removedArtworks) ||
    Array.isArray(metadata.reorderedArtworks);

  const handleToggleExpanded = () => {
    setExpanded((v) => !v);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={hasMetadata ? handleToggleExpanded : undefined}
      className={`group relative ${hasMetadata ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Outer Floating Icon Node */}
      <div 
        className={`absolute -left-[43px] sm:-left-[61px] top-[14px] sm:top-[16px] w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 border-white ring-1 ring-gray-100/50 shadow-sm flex items-center justify-center z-10 ${categoryStyle.bg}`}
      >
        <CategoryIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${categoryStyle.text}`} aria-hidden="true" />
      </div>

      {/* Card Content Container */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm hover:shadow-md group-hover:border-indigo-100 transition-all duration-300">
        <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 pb-3">
          {/* Main content */}
          <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Action badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-sans border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
            >
              {getActionLabel(log.action)}
            </span>

            {/* Status badge */}
            {log.status !== "SUCCESS" && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-sans border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                {log.status}
              </span>
            )}

            {/* Target label */}
            {log.targetLabel && (
              <span className="text-xs font-sans text-gray-600 truncate max-w-[200px]" title={log.targetLabel}>
                — <em>{log.targetLabel}</em>
              </span>
            )}
          </div>

          {/* Actor row (admin view) */}
          {showActor && log.actorName && (
            <p className="mt-1 text-xs font-sans text-gray-500">
              By <span className="font-medium text-gray-700">{log.actorName}</span>
              {log.actorRole && (
                <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  {log.actorRole}
                </span>
              )}
            </p>
          )}

          {/* Metadata summary line */}
          {metaSummary && (
            <p className="mt-0.5 text-xs font-sans text-gray-500">{metaSummary}</p>
          )}

          {/* Error message */}
          {log.errorMsg && (
            <p className="mt-0.5 text-xs font-sans text-red-500 italic">{log.errorMsg}</p>
          )}

          {/* Expanded metadata */}
          <AnimatePresence>
            {expanded && hasMetadata && (
              <motion.div
                key="meta"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-2xl border border-indigo-100/40 bg-indigo-50/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] px-4 py-3.5">
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
                        setShowRaw((v) => !v);
                      }}
                      className="text-[11px] font-sans text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline"
                    >
                      {showRaw ? "Hide raw JSON" : "View raw JSON"}
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

                  {changesObject && Object.keys(changesObject).length > 0 && (
                    <div className="mt-3 border-t border-dashed border-gray-200 pt-3">
                      <p className="text-[11px] font-sans font-medium text-gray-600 uppercase tracking-wide mb-1.5">
                        Changes
                      </p>
                      <div className="rounded-lg border border-gray-100 bg-white/80 overflow-hidden">
                        <div className="grid grid-cols-3 gap-2 px-3 py-1.5 bg-gray-50/80 text-[11px] font-sans font-medium text-gray-500">
                          <span>Field</span>
                          <span>From</span>
                          <span>To</span>
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
                                      {pair.before != null ? formatChangeValue(pair.before) : "—"}
                                    </span>
                                    <span className="truncate text-emerald-600/90" title={pair.after != null ? formatChangeValue(pair.after) : "—"}>
                                      {pair.after != null ? formatChangeValue(pair.after) : "—"}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="col-span-2 truncate text-gray-500 italic">
                                      {summarizeMetadataValue(value)}
                                    </span>
                                  </>
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
                          <span key={i} className="inline-flex flex-wrap items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[11px] font-sans text-amber-600 font-medium">
                            <span className="font-semibold">{a.artworkTitle || a.title || "Untitled"}</span>
                            {a.artistName && <span className="text-amber-500">· {a.artistName}</span>}
                            {a.from != null && a.to != null && <span className="bg-amber-200 text-amber-800 rounded-full px-1.5 py-px text-[10px] font-bold">#{a.from + 1} ➝ #{a.to + 1}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {showRaw && (
                    <pre className="mt-3 p-2.5 bg-gray-900 text-[11px] font-mono text-gray-100 rounded-lg overflow-x-auto leading-relaxed custom-scrollbar">
                      {JSON.stringify(metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side — timestamp + IP + expand indicator */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
          <time
            title={formatAbsoluteTime(log.createdAt)}
            className="text-xs font-sans text-gray-400 whitespace-nowrap"
          >
            {formatRelativeTime(log.createdAt)}
          </time>
          {showIp && log.ipAddress && (
            <span className="text-[10px] font-mono text-gray-400">
              {log.ipAddress.replace(/(\d+)\.(\d+)\.\d+\.\d+/, "$1.$2.xxx.xxx")}
            </span>
          )}
          {hasMetadata && (
            <span
              className="mt-1 p-1 rounded-lg text-gray-300 group-hover:text-gray-500 transition-colors pointer-events-none"
              aria-hidden="true"
            >
              {expanded ? (
                <ChevronUpIcon className="w-3.5 h-3.5" />
              ) : (
                <ChevronDownIcon className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
      </div>
    </motion.div>
  );
}
