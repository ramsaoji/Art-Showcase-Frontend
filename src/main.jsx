import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { trpc, trpcClient } from "./utils/trpc";
import PageLoader from "./components/ui/PageLoader";

// Performance monitoring
const reportWebVitals = (metric) => {
  // Analytics or console logging based on your needs
  if (process.env.NODE_ENV !== "production") {
    console.log(metric);
  }
  // In production, you could send to an analytics service
};

// Lazy load the main App component
const App = lazy(() => import("./App"));

// Create a performance observer to monitor long tasks
if ("PerformanceObserver" in window) {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Log long tasks (tasks that block the main thread for more than 50ms)
        if (process.env.NODE_ENV !== "production") {
          console.warn("Long task detected:", entry.duration, "ms");
        }
      }
    });

    observer.observe({ entryTypes: ["longtask"] });
  } catch (e) {
    console.error("PerformanceObserver for longtask not supported", e);
  }
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <App />
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>
);

// Report web vitals after the app has loaded
if ("requestIdleCallback" in window) {
  window.requestIdleCallback(() => {
    // Only import in browsers that support it
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(reportWebVitals); // Cumulative Layout Shift
      getFID(reportWebVitals); // First Input Delay
      getFCP(reportWebVitals); // First Contentful Paint
      getLCP(reportWebVitals); // Largest Contentful Paint
      getTTFB(reportWebVitals); // Time to First Byte
    });
  });
} else {
  // Fallback for browsers that don't support requestIdleCallback
  setTimeout(() => {
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(reportWebVitals);
      getFID(reportWebVitals);
      getFCP(reportWebVitals);
      getLCP(reportWebVitals);
      getTTFB(reportWebVitals);
    });
  }, 1000);
}
