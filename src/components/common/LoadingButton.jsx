import { Button } from "@/components/ui/button";
import Loader from "@/components/common/Loader";

/**
 * LoadingButton
 * shadcn Button with an inline Loader shown while loading.
 * Pixel-identical to every inline submit-button + spinner pattern.
 *
 * @param {boolean} loading - Shows spinner + loadingLabel when true
 * @param {string} [loadingLabel] - Text displayed while loading (e.g. "Signing in...")
 * @param {React.ReactNode} children - Default label
 * All other Button props (variant, size, className, disabled, etc.) are forwarded.
 */
export default function LoadingButton({ loading, loadingLabel, children, disabled, loaderColor, ...props }) {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading ? (
        <>
          <Loader size="xsmall" color={loaderColor ?? "indigo-600"} />
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
