/**
 * activityLogHelpers.js
 * Central display logic for activity log entries.
 * Used by both artist ActivityHistory and admin ActivityLogs pages.
 */
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ─── Category groupings ────────────────────────────────────────────────────
export const ACTION_CATEGORIES = {
  AUTH:    ["AUTH_LOGIN_SUCCESS","AUTH_LOGIN_FAILED","AUTH_REGISTER","AUTH_EMAIL_VERIFIED","AUTH_PASSWORD_CHANGED","AUTH_VERIFICATION_RESENT"],
  ARTWORK: ["ARTWORK_CREATED","ARTWORK_UPDATED","ARTWORK_DELETED","ARTWORK_STATUS_CHANGED","ARTWORK_IMAGE_UPLOADED","ARTWORK_IMAGE_DELETED","ARTWORK_IMAGE_REORDERED","ARTWORK_ENQUIRY_SENT","ARTWORK_MARKED_SOLD","ARTWORK_DISCOUNT_SET","ARTWORK_EXPIRY_SET","ARTWORK_EXPIRED_AUTO","ARTWORK_AI_DESCRIPTION_GENERATED"],
  ADMIN:   ["ADMIN_ARTIST_APPROVED","ADMIN_ARTIST_REJECTED","ADMIN_USER_DEACTIVATED","ADMIN_USER_REACTIVATED","ADMIN_USER_DELETED","ADMIN_USER_UPDATED","ADMIN_QUOTA_CHANGED","ADMIN_CAROUSEL_UPDATED","ADMIN_FEATURED_UPDATED","ADMIN_ARTWORK_CREATED_FOR_ARTIST"],
  SYSTEM:  ["SYSTEM_ARTWORK_EXPIRED","SYSTEM_EMAIL_SENT","SYSTEM_EMAIL_FAILED"],
};

export function getActionCategory(action) {
  for (const [cat, actions] of Object.entries(ACTION_CATEGORIES)) {
    if (actions.includes(action)) return cat;
  }
  return "OTHER";
}

// ─── Human-readable labels ─────────────────────────────────────────────────
const ACTION_LABELS = {
  AUTH_LOGIN_SUCCESS:               "Logged in",
  AUTH_LOGIN_FAILED:                "Login failed",
  AUTH_REGISTER:                    "Account created",
  AUTH_EMAIL_VERIFIED:              "Email verified",
  AUTH_PASSWORD_CHANGED:            "Password changed",
  AUTH_VERIFICATION_RESENT:         "Verification email resent",
  ARTWORK_CREATED:                  "Artwork uploaded",
  ARTWORK_UPDATED:                  "Artwork updated",
  ARTWORK_DELETED:                  "Artwork deleted",
  ARTWORK_STATUS_CHANGED:           "Artwork status changed",
  ARTWORK_IMAGE_UPLOADED:           "Image uploaded",
  ARTWORK_IMAGE_DELETED:            "Image deleted",
  ARTWORK_IMAGE_REORDERED:          "Images reordered",
  ARTWORK_ENQUIRY_SENT:             "Purchase enquiry sent",
  ARTWORK_MARKED_SOLD:              "Artwork marked sold",
  ARTWORK_DISCOUNT_SET:             "Discount applied",
  ARTWORK_EXPIRY_SET:               "Expiry date set",
  ARTWORK_EXPIRED_AUTO:             "Artwork auto-expired",
  ARTWORK_AI_DESCRIPTION_GENERATED: "AI description generated",
  ADMIN_ARTIST_APPROVED:            "Artist approved",
  ADMIN_ARTIST_REJECTED:            "Artist rejected",
  ADMIN_USER_DEACTIVATED:           "User deactivated",
  ADMIN_USER_REACTIVATED:           "User reactivated",
  ADMIN_USER_DELETED:               "User deleted",
  ADMIN_USER_UPDATED:               "User settings updated",
  ADMIN_QUOTA_CHANGED:              "Quota limit changed",
  ADMIN_CAROUSEL_UPDATED:           "Carousel updated",
  ADMIN_FEATURED_UPDATED:           "Featured artworks updated",
  ADMIN_ARTWORK_CREATED_FOR_ARTIST: "Artwork created for artist",
  SYSTEM_ARTWORK_EXPIRED:           "Artworks auto-expired (system)",
  SYSTEM_EMAIL_SENT:                "Email sent",
  SYSTEM_EMAIL_FAILED:              "Email failed to send",
};

export function getActionLabel(action) {
  return ACTION_LABELS[action] ?? action;
}

// ─── Category badge colours (Tailwind) ─────────────────────────────────────
export const CATEGORY_STYLES = {
  AUTH:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500",   icon: null },
  ARTWORK:{ bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500", icon: null },
  ADMIN:  { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500",  icon: null },
  SYSTEM: { bg: "bg-gray-50",   text: "text-gray-600",   border: "border-gray-200",   dot: "bg-gray-400",   icon: null },
  OTHER:  { bg: "bg-gray-50",   text: "text-gray-600",   border: "border-gray-200",   dot: "bg-gray-400",   icon: null },
};

export function getCategoryStyle(action) {
  return CATEGORY_STYLES[getActionCategory(action)] ?? CATEGORY_STYLES.OTHER;
}

// ─── Status badge colours ───────────────────────────────────────────────────
export const STATUS_STYLES = {
  SUCCESS: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  FAILED:  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"     },
  PARTIAL: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
};

export function getStatusStyle(status) {
  return STATUS_STYLES[status] ?? STATUS_STYLES.SUCCESS;
}

// ─── Role badge colours ─────────────────────────────────────────────────────
export const ROLE_STYLES = {
  SUPER_ADMIN: { bg: "bg-violet-100", text: "text-violet-700" },
  ARTIST:      { bg: "bg-blue-100",   text: "text-blue-700"   },
  SYSTEM:      { bg: "bg-gray-100",   text: "text-gray-600"   },
  ANONYMOUS:   { bg: "bg-slate-100",  text: "text-slate-600"  },
};

export function getRoleStyle(role) {
  return ROLE_STYLES[role] ?? { bg: "bg-gray-100", text: "text-gray-600" };
}

// ─── IP masking (privacy) ──────────────────────────────────────────────────
export function maskIp(ip) {
  if (!ip) return "—";
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`;
  return ip.slice(0, 8) + "…";
}

// ─── Human-readable metadata summary ──────────────────────────────────────
export function getMetadataSummary(action, metadata) {
  if (!metadata) return null;
  try {
    const m = typeof metadata === "string" ? JSON.parse(metadata) : metadata;

    // Helper: format a date briefly
    const fmtDate = (d) =>
      d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;
    const fmtDateShort = (d) =>
      d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : null;

    switch (action) {

      // ── Artwork creation ─────────────────────────────────────────────────
      case "ARTWORK_CREATED": {
        const parts = [];
        if (m.price)            parts.push(`₹${Number(m.price).toLocaleString("en-IN")}`);
        if (m.material)         parts.push(m.material);
        if (m.style)            parts.push(m.style);
        if (m.year)             parts.push(String(m.year));
        if (m.imagesCount != null) parts.push(`${m.imagesCount} image${m.imagesCount !== 1 ? "s" : ""}`);
        if (m.discountPercent)  parts.push(`${m.discountPercent}% off`);
        return parts.length > 0 ? parts.join(" · ") : null;
      }
      case "ADMIN_ARTWORK_CREATED_FOR_ARTIST": {
        const parts = [];
        if (m.artistName)       parts.push(m.artistName);
        if (m.price)            parts.push(`₹${Number(m.price).toLocaleString("en-IN")}`);
        if (m.material)         parts.push(m.material);
        if (m.style)            parts.push(m.style);
        if (m.imagesCount != null) parts.push(`${m.imagesCount} image${m.imagesCount !== 1 ? "s" : ""}`);
        if (m.status && m.status !== "ACTIVE") parts.push(m.status);
        if (m.featured)         parts.push("Featured");
        return parts.length > 0 ? parts.join(" · ") : null;
      }

      // ── Artwork update ───────────────────────────────────────────────────
      case "ARTWORK_UPDATED": {
        const changes =
          m.changes && typeof m.changes === "object" ? Object.keys(m.changes) : [];
        const parts = [];
        if (m.artistName) parts.push(m.artistName);
        if (changes.length > 0)
          parts.push(`${changes.length} field${changes.length !== 1 ? "s" : ""} changed: ${changes.join(", ")}`);
        if (m.imageChanges) {
          const ic = m.imageChanges;
          const imgParts = [];
          if (ic.added)    imgParts.push(`+${ic.added} added`);
          if (ic.deleted)  imgParts.push(`−${ic.deleted} removed`);
          if (ic.updated)  imgParts.push(`${ic.updated} replaced`);
          if (ic.reordered) imgParts.push(typeof ic.reordered === 'number' && ic.reordered > 0 ? `${ic.reordered} reordered` : "reordered");
          if (imgParts.length > 0) parts.push(`Images: ${imgParts.join(", ")}`);
        }
        return parts.length > 0 ? parts.join(" · ") : null;
      }

      // ── Artwork delete ───────────────────────────────────────────────────
      case "ARTWORK_DELETED": {
        const parts = [];
        if (m.artistName) parts.push(m.artistName);
        if (m.price != null) parts.push(`₹${Number(m.price).toLocaleString("en-IN")}`);
        if (m.status) parts.push(m.status);
        if (m.imagesCount != null) parts.push(`${m.imagesCount} image${m.imagesCount !== 1 ? "s" : ""}`);
        return parts.length > 0 ? parts.join(" · ") : null;
      }

      // ── Status change ────────────────────────────────────────────────────
      case "ARTWORK_STATUS_CHANGED":
        if (m.from && m.to) return `${m.from} → ${m.to}`;
        if (m.status) return m.status;
        return null;

      // ── Enquiry ──────────────────────────────────────────────────────────
      case "ARTWORK_ENQUIRY_SENT": {
        const parts = [];
        if (m.customerName) parts.push(m.customerName);
        if (m.customerEmail) parts.push(m.customerEmail);
        if (m.price != null) parts.push(`₹${Number(m.price).toLocaleString("en-IN")}${m.discounted ? ` (${m.discountPercent}% off)` : ""}`);
        if (Array.isArray(m.emailsSent) && m.emailsSent.length > 0) parts.push(`Notified: ${m.emailsSent.join(", ")}`);
        return parts.length > 0 ? parts.join(" · ") : null;
      }

      // ── Marked sold ──────────────────────────────────────────────────────
      case "ARTWORK_MARKED_SOLD": {
        const parts = [];
        if (m.artistName) parts.push(m.artistName);
        if (m.price)      parts.push(`₹${Number(m.price).toLocaleString("en-IN")}`);
        return parts.length > 0 ? parts.join(" · ") : null;
      }

      // ── Discount ─────────────────────────────────────────────────────────
      case "ARTWORK_DISCOUNT_SET": {
        const parts = [];
        if (m.discountPercent) parts.push(`${m.discountPercent}% off`);
        if (m.discountStartAt && m.discountEndAt)
          parts.push(`${fmtDateShort(m.discountStartAt)} – ${fmtDateShort(m.discountEndAt)}`);
        return parts.length > 0 ? parts.join(" · ") : null;
      }

      // ── Expiry ───────────────────────────────────────────────────────────
      case "ARTWORK_EXPIRY_SET":
        return m.expiresAt ? `Expires ${fmtDate(m.expiresAt)}` : null;
      case "ARTWORK_EXPIRED_AUTO":
        return m.previousStatus ? `Was ${m.previousStatus}` : null;

      // ── Image operations ─────────────────────────────────────────────────
      case "ARTWORK_IMAGE_UPLOADED":
        return m.imagesCount != null
          ? `${m.imagesCount} image${m.imagesCount !== 1 ? "s" : ""} uploaded`
          : null;
      case "ARTWORK_IMAGE_DELETED":
        return m.imagesCount != null
          ? `${m.imagesCount} image${m.imagesCount !== 1 ? "s" : ""} remaining`
          : null;
      case "ARTWORK_IMAGE_REORDERED":
        return m.imagesCount != null
          ? `${m.imagesCount} image${m.imagesCount !== 1 ? "s" : ""} reordered`
          : null;

      // ── AI description ───────────────────────────────────────────────────
      case "ARTWORK_AI_DESCRIPTION_GENERATED":
        return m.remaining != null ? `${m.remaining} uses remaining today` : null;

      // ── Auth ─────────────────────────────────────────────────────────────
      case "AUTH_LOGIN_SUCCESS":
        return null;
      case "AUTH_LOGIN_FAILED":
        return m.reason ? `Reason: ${m.reason}` : null;
      case "AUTH_REGISTER":
        return m.role ? `Role: ${m.role}` : null;
      case "AUTH_VERIFICATION_RESENT":
        return null;
      case "AUTH_EMAIL_VERIFIED":
      case "AUTH_PASSWORD_CHANGED":
        return null;

      // ── Admin user actions ───────────────────────────────────────────────
      case "ADMIN_ARTIST_APPROVED":
      case "ADMIN_ARTIST_REJECTED":
        return m.email ? m.email : null;
      case "ADMIN_USER_DEACTIVATED":
      case "ADMIN_USER_REACTIVATED": {
        const parts = [];
        if (m.email) parts.push(m.email);
        if (m.artworksAffected != null) parts.push(`${m.artworksAffected} artwork${m.artworksAffected !== 1 ? "s" : ""} ${m.active ? "re-activated" : "deactivated"}`);
        return parts.length > 0 ? parts.join(" · ") : null;
      }
      case "ADMIN_USER_DELETED":
        return m.email ? m.email : null;
      case "ADMIN_USER_UPDATED": {
        if (m.changes && typeof m.changes === "object") {
          const keys = Object.keys(m.changes);
          if (keys.length > 0) return `${keys.length} field${keys.length !== 1 ? "s" : ""} changed: ${keys.join(", ")}`;
        }
        return null;
      }
      case "ADMIN_QUOTA_CHANGED": {
        const parts = [];
        if (m.quotaType) parts.push(m.quotaType);
        if (m.newValue != null) parts.push(`→ ${m.newValue}`);
        return parts.length > 0 ? parts.join(" · ") : null;
      }
      case "ADMIN_CAROUSEL_UPDATED": {
        const parts = [];
        if (m.imagesCount != null) parts.push(`${m.imagesCount} image${m.imagesCount !== 1 ? "s" : ""}`);
        if (m.artworksCount != null) parts.push(`${m.artworksCount} artwork${m.artworksCount !== 1 ? "s" : ""}`);
        // delta
        const delta = [];
        if (m.added)    delta.push(`+${m.added} added`);
        if (m.removed)  delta.push(`−${m.removed} removed`);
        if (m.reordered) delta.push(`${m.reordered} moved`);
        if (delta.length > 0) parts.push(delta.join(", "));
        if (m.artists && typeof m.artists === "object") {
          const names = Object.values(m.artists).map((a) => a.artistName).filter(Boolean);
          if (names.length > 0) parts.push(names.join(", "));
        }
        return parts.length > 0 ? parts.join(" · ") : null;
      }
      case "ADMIN_FEATURED_UPDATED": {
        const parts = [];
        if (m.artworksCount != null) parts.push(`${m.artworksCount} artwork${m.artworksCount !== 1 ? "s" : ""}`);
        // delta
        const delta = [];
        if (m.added)    delta.push(`+${m.added} featured`);
        if (m.removed)  delta.push(`−${m.removed} unfeatured`);
        if (m.reordered) delta.push(`${m.reordered} reordered`);
        if (delta.length > 0) parts.push(delta.join(", "));
        if (m.artists && typeof m.artists === "object") {
          const names = Object.values(m.artists).map((a) => a.artistName).filter(Boolean);
          if (names.length > 0) parts.push(names.join(", "));
        }
        return parts.length > 0 ? parts.join(" · ") : null;
      }

      // ── System ───────────────────────────────────────────────────────────
      case "SYSTEM_ARTWORK_EXPIRED":
        return m.count != null ? `${m.count} artwork${m.count !== 1 ? "s" : ""} expired` : null;
      case "SYSTEM_EMAIL_SENT":
      case "SYSTEM_EMAIL_FAILED": {
        const parts = [];
        if (m.to || m.email)  parts.push(m.to || m.email);
        if (m.subject)        parts.push(m.subject);
        return parts.length > 0 ? parts.join(" · ") : null;
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}

// ─── Timestamp formatting ──────────────────────────────────────────────────
export function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatAbsoluteTime(dateStr) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ─── Excel export ────────────────────────────────────────────────────────────
export async function exportLogsToExcel(logs, role = "admin") {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Art Showcase App";
  workbook.calcProperties.fullCalcOnLoad = true;
  
  const sheet = workbook.addWorksheet("Audit Logs", {
    views: [{ state: 'frozen', ySplit: 1 }] // Freeze header row
  });

  const columns = [
    { header: "Date & Time", key: "date", width: 22 },
    { header: "Actor Name", key: "actor", width: 20 },
    { header: "Actor Role", key: "role", width: 15 },
    { header: "Category", key: "category", width: 14 },
    { header: "Action", key: "action", width: 28 },
    { header: "Target", key: "target", width: 30 },
    { header: "Status", key: "status", width: 12 },
    { header: "Summary", key: "summary", width: 45 },
    { header: "Error Message", key: "error", width: 25 },
  ];

  if (role !== "artist") {
    columns.push({ header: "IP Address", key: "ip", width: 16 });
  }
  columns.push({ header: "Raw Metadata", key: "raw", width: 50 });

  sheet.columns = columns;

  // Style Header Row
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12, name: "Calibri" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" } // Indigo 600
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    // Add subtle grid borders
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF3730A3' } },
      bottom: { style: 'thin', color: { argb: 'FF3730A3' } },
      left: { style: 'thin', color: { argb: 'FF3730A3' } },
      right: { style: 'thin', color: { argb: 'FF3730A3' } }
    };
  });

  // Populate data
  logs.forEach((l) => {
    const rowData = {
      date: formatAbsoluteTime(l.createdAt),
      actor: l.actorName ?? "—",
      role: l.actorRole ?? "—",
      category: getActionCategory(l.action),
      action: getActionLabel(l.action),
      target: l.targetLabel ?? l.targetType ?? "—",
      status: l.status,
      summary: getMetadataSummary(l.action, l.metadata) || "—",
      error: l.errorMsg ?? "—",
      raw: l.metadata ? JSON.stringify(l.metadata, null, 2) : "—"
    };

    if (role !== "artist") {
      rowData.ip = maskIp(l.ipAddress);
    }

    const row = sheet.addRow(rowData);

    // Keep row heights compact and standard (approx 1 line)
    row.height = 20;
    
    // Formatting cell alignment (wrapText: false prevents rows from getting massively tall with JSON data)
    row.alignment = { vertical: 'middle', wrapText: false };
    
    // Specifically format status
    const statusCell = row.getCell("status");
    statusCell.font = { bold: true };
    statusCell.alignment = { horizontal: "center", vertical: "middle" };
    if (l.status === "SUCCESS") statusCell.font.color = { argb: "FF059669" };
    else if (l.status === "FAILED") statusCell.font.color = { argb: "FFDC2626" };
    else if (l.status === "PARTIAL") statusCell.font.color = { argb: "FFD97706" };

    row.getCell("date").alignment = { horizontal: "center", vertical: "middle" };
    row.getCell("role").alignment = { horizontal: "center", vertical: "middle" };
    row.getCell("category").alignment = { horizontal: "center", vertical: "middle" };
    
    if (role !== "artist") {
      row.getCell("ip").alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  // Create standard grid lines format
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header
      row.eachCell((cell) => {
        cell.border = {
          bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
          right: { style: 'hair', color: { argb: 'FFE5E7EB' } }
        };
      });
    }
  });

  // Generate binary and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
  const formattedDate = new Date().toISOString().slice(0, 10);
  saveAs(blob, `art-showcase-${role}-audit-logs-${formattedDate}.xlsx`);
}

// ─── All action options for filter dropdown ────────────────────────────────
export const ALL_ACTION_OPTIONS = Object.keys(ACTION_LABELS).map((k) => ({
  value: k,
  label: ACTION_LABELS[k],
}));

// Actions visible to artists in Activity History filters
const ARTIST_ACTION_SET = new Set([
  ...ACTION_CATEGORIES.AUTH,
  ...ACTION_CATEGORIES.ARTWORK,
  ...ACTION_CATEGORIES.SYSTEM,
]);

export const ARTIST_ACTION_OPTIONS = ALL_ACTION_OPTIONS.filter((opt) =>
  ARTIST_ACTION_SET.has(opt.value)
);

export function getActionOptionsForRole(role) {
  if (role === "SUPER_ADMIN") return ALL_ACTION_OPTIONS;
  if (role === "ARTIST") return ARTIST_ACTION_OPTIONS;
  return ARTIST_ACTION_OPTIONS;
}
