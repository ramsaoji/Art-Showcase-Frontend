/**
 * PageBackground
 * Renders the decorative blurred gradient blobs used as background decoration
 * on every full-page layout. Pixel-identical to every existing inline version.
 *
 * @param {"default"|"extended"|"purple"} [variant="default"]
 *   "default"  — large top-center + right-mid (Login, Signup, Contact, ChangePassword, VerifyEmail)
 *   "extended" — default + bottom-left blob (AddArtwork, EditArtwork, Gallery)
 *   "purple"   — purple/blue tones (AdminManagement)
 */
export default function PageBackground({ variant = "default" }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Top-center large blob */}
      <div className="absolute -top-96 left-1/2 transform -translate-x-1/2">
        <div
          className={`w-[800px] h-[800px] rounded-full blur-3xl ${
            variant === "purple"
              ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10"
              : "bg-gradient-to-r from-indigo-100/30 to-purple-100/30"
          }`}
        />
      </div>

      {/* Right-mid medium blob */}
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
        <div
          className={`w-96 h-96 rounded-full blur-3xl ${
            variant === "purple"
              ? "bg-gradient-to-br from-blue-400/10 to-transparent"
              : "bg-gradient-to-br from-indigo-100/20 to-purple-100/20"
          }`}
        />
      </div>

      {/* Bottom-left blob — only for "extended" variant */}
      {variant === "extended" && (
        <div className="absolute -bottom-64 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-purple-500/5 to-indigo-500/5 blur-3xl" />
      )}
    </div>
  );
}
