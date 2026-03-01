import { Button } from "@/components/ui/button";

/**
 * PurchaseFooter
 * "Request to Purchase" / "Artwork Sold" action footer for artwork cards and modals.
 * Extracted from ArtworkCard and ImageModal to eliminate the duplicated pattern.
 *
 * @param {boolean}  sold          - When true, renders the "Artwork Sold" disabled button
 * @param {Function} onRequest     - Called when the "Request to Purchase" button is clicked
 * @param {string}   [className]   - Extra classes on the wrapper div
 */
export default function PurchaseFooter({ sold, onRequest, className = "" }) {
  return (
    <div
      className={`flex justify-end border-t border-gray-200/50 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 ${className}`}
    >
      {!sold ? (
        <Button className="w-auto" onClick={onRequest}>
          Request to Purchase
        </Button>
      ) : (
        <Button variant="sold" className="w-auto">
          Artwork Sold
        </Button>
      )}
    </div>
  );
}
