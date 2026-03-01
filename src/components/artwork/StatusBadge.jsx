import Badge from "@/components/artwork/Badge";

/**
 * StatusBadge
 * Maps an artwork status string + expiredBy to the correct Badge variant and label.
 * Pixel-identical to the duplicated status→Badge block in ArtworkCard, ArtworkDetail,
 * and ArtistApprovals.
 *
 * @param {"ACTIVE"|"INACTIVE"|"EXPIRED"|string} status
 * @param {"admin"|"auto"|null} [expiredBy]
 * @param {boolean} [animate]
 * @param {boolean} [withPing]
 * @param {string} [className]
 */
export default function StatusBadge({ status, expiredBy, animate = true, withPing = true, className = "" }) {
  if (!status) return null;

  const type =
    status === "ACTIVE"   ? "active"
    : status === "INACTIVE" ? "inactive"
    : status === "EXPIRED"  ? "expired"
    : "default";

  const label =
    status === "EXPIRED"
      ? expiredBy === "admin" ? "Expired (admin)"
        : expiredBy === "auto"  ? "Expired (auto)"
        : "Expired"
      : status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <Badge type={type} animate={animate} withPing={withPing} className={className}>
      {label}
    </Badge>
  );
}
