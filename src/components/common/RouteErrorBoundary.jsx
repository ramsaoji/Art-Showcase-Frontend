import { useRouteError, useNavigate, isRouteErrorResponse } from "react-router-dom";
import { useEffect, useRef } from "react";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { trackError } from "@/services/analytics";

export default function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const hasLoggedError = useRef(false);

  console.error("Route Error:", error);

  const isRouteError = isRouteErrorResponse(error);
  const isChunkLoadError = error?.message?.includes(
    "Failed to fetch dynamically imported module"
  );

  let title = "Something went wrong";
  let friendlyMessage =
    "We're sorry, an unexpected error occurred while loading this page.";

  if (isRouteError) {
    if (error.status === 404) {
      title = "Page not found";
      friendlyMessage =
        "The page you're looking for doesn't exist or has been moved.";
    } else if (error.status === 403) {
      title = "Access denied";
      friendlyMessage = "You don't have permission to view this page.";
    } else if (error.status >= 500) {
      title = "Server error";
      friendlyMessage =
        "Our servers ran into an issue. Please try again in a moment.";
    } else {
      title = "Unable to load page";
      friendlyMessage = error.statusText || friendlyMessage;
    }
  } else if (isChunkLoadError) {
    title = "Page failed to load";
    friendlyMessage =
      "You appear to be offline or the page failed to load. Please check your internet connection and try again.";
  }

  useEffect(() => {
    if (!hasLoggedError.current) {
      trackError(
        (error && (error.message || error.statusText)) ||
          "Route error encountered.",
        "RouteErrorBoundary"
      );
      hasLoggedError.current = true;
    }
  }, [error]);

  return (
    <div className="flex flex-col justify-center items-center min-h-[50vh] p-6 max-w-2xl mx-auto space-y-6">
      <ErrorState
        variant="plain"
        title={title}
        description={friendlyMessage}
        primaryAction={
          isChunkLoadError ? (
            <Button
              variant="default"
              className="rounded-full px-8 font-artistic text-base"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          ) : (
            <Button
              variant="default"
              className="rounded-full px-8 font-artistic text-base"
              onClick={() => navigate("/")}
            >
              Return Home
            </Button>
          )
        }
        secondaryAction={
          <Button
            variant="outline"
            className="rounded-full px-6 font-artistic text-base"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        }
      />
      {import.meta.env.DEV && error?.message && (
        <details className="text-sm text-red-600 bg-red-100 p-4 rounded-xl w-full overflow-auto mt-4 text-left">
          <summary className="cursor-pointer font-semibold mb-2">Technical Details</summary>
          <pre className="whitespace-pre-wrap break-words">{error.message}</pre>
          {error.stack && (
            <pre className="whitespace-pre-wrap break-words mt-2 text-xs opacity-80">{error.stack}</pre>
          )}
        </details>
      )}
    </div>
  );
}
