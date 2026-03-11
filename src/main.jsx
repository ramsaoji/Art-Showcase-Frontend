import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route } from "react-router-dom";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { trpc, trpcClient } from "@/lib/trpc";
import { STALE_TIME_MS } from "@/lib/queryOptions";
import PageLoader from "@/components/common/PageLoader";

// Performance monitoring — logs Core Web Vitals to console in development.
// To send to an analytics service in production, replace this with a fetch/beacon call.
const reportWebVitals = (metric) => {
  if (import.meta.env.DEV) {
    console.debug(`[Web Vitals] ${metric.name}:`, metric);
  }
};

// Lazy load the main App component
const App = lazy(() => import("./App"));

// Create a performance observer to monitor long tasks
if ("PerformanceObserver" in window) {
  try {
    const observer = new PerformanceObserver((list) => {
      // Long tasks (>50ms) are observed for monitoring
      // Could be sent to an analytics service
    });

    observer.observe({ entryTypes: ["longtask"] });
  } catch (e) {
    // PerformanceObserver for longtask not supported
  }
}

// Using global queryClient from lib/queryClient


import { queryClient } from "@/lib/queryClient";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
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
