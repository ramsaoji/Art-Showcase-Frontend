/**
 * SectionHeader
 * Admin section title + description used at the top of each admin sub-panel.
 * Pixel-identical to every inline version in admin pages.
 *
 * @param {string} title
 * @param {string} [description]
 */
export default function SectionHeader({ title, description }) {
  return (
    <div className="font-sans w-full mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-800">{title}</h2>
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}
    </div>
  );
}
