/**
 * ResultCount
 * "Showing X of Y {label}" row used in admin list pages.
 * Pixel-identical to every inline version.
 *
 * @param {number} count - Visible / current-page count
 * @param {number} total - Total count
 * @param {string} [label="items"]
 */
export default function ResultCount({ count, total, label = "items" }) {
  return (
    <div className="mb-4 text-sm text-gray-500 font-sans text-right">
      Showing{" "}
      <span className="font-semibold text-gray-900">{count}</span> of{" "}
      <span className="font-semibold text-gray-900">{total}</span> {label}
    </div>
  );
}
