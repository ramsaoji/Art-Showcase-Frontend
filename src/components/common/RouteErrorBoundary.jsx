import { useRouteError, useNavigate } from "react-router-dom";
import Alert from "@/components/common/Alert";
import { Button } from "@/components/ui/button";

export default function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error("Route Error:", error);

  let friendlyMessage = "We're sorry, an unexpected error occurred while loading this page.";
  if (error?.message?.includes("Failed to fetch dynamically imported module")) {
    friendlyMessage = "You appear to be offline or the page failed to load. Please check your internet connection and try again.";
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-[50vh] p-6 max-w-2xl mx-auto space-y-6">
      <Alert 
        type="error" 
        message={friendlyMessage} 
        onRetry={() => window.location.reload()}
      />
      <div className="flex space-x-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button onClick={() => navigate("/")}>
          Return Home
        </Button>
      </div>
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
