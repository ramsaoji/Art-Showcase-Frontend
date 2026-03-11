import { useLocation } from "react-router-dom";
import React, { useEffect, lazy, Suspense } from "react";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { trackPageView } from "@/services/analytics";
import RouteSuspenseFallback from "@/components/common/RouteSuspenseFallback";
import { Toaster } from "@/components/ui/sonner";
import RouteErrorBoundary from "@/components/common/RouteErrorBoundary";
import Home from "./pages/Home";

const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const AddArtwork = lazy(() => import("./pages/AddArtwork"));
const EditArtwork = lazy(() => import("./pages/EditArtwork"));
const Login = lazy(() => import("./pages/Login"));
const ArtworkDetail = lazy(() => import("./pages/ArtworkDetail"));
const Signup = lazy(() => import("./pages/Signup"));
const AdminManagement = lazy(() => import("./pages/admin/AdminManagement"));
const ChangePassword = lazy(() => import("./pages/user/ChangePassword"));
const ActivityHistory = lazy(() => import("./pages/user/ActivityHistory"));


// Analytics wrapper component
function AnalyticsWrapper({ children }) {
  const pathname = useLocation().pathname;

  useEffect(() => {
    try {
      trackPageView(pathname);
    } catch {
      // Page view tracking failed silently
    }
  }, [pathname]);

  return children;
}

const PAGE_LOADER_FALLBACK = (
  <RouteSuspenseFallback />
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Error is displayed in the UI via getDerivedStateFromError
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      let friendlyMessage =
        "We're sorry, but an unexpected error occurred. Please try refreshing the page.";
      if (
        this.state.error &&
        this.state.error.message &&
        this.state.error.message.includes(
          "Failed to fetch dynamically imported module"
        )
      ) {
        friendlyMessage =
          "You appear to be offline or the page failed to load. Please check your internet connection and try again.";
      }
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 p-4">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <p className="text-center mb-4">{friendlyMessage}</p>
          {import.meta.env.DEV && this.state.error && (
            <details className="text-sm text-red-600 bg-red-100 p-2 rounded w-full max-w-md overflow-auto">
              <summary>Error Details</summary>
              <pre className="whitespace-pre-wrap break-all">
                {this.state.error.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";

function RootLayout() {
  return (
    <AnalyticsWrapper>
      <ErrorBoundary>
        <Toaster position="top-right" richColors />
        <Suspense fallback={PAGE_LOADER_FALLBACK}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </AnalyticsWrapper>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/verify-email", element: <VerifyEmail /> },
      {
        element: <Layout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { path: "/", element: <Home /> },
          { path: "/gallery", element: <Gallery /> },
          { path: "/artwork/:id", element: <ArtworkDetail /> },
          { path: "/about", element: <About /> },
          { path: "/contact", element: <Contact /> },
          { path: "/login", element: <Login /> },
          { path: "/signup", element: <Signup /> },
          {
            path: "/add-artwork",
            element: (
              <ProtectedRoute>
                <AddArtwork />
              </ProtectedRoute>
            ),
          },
          {
            path: "/edit-artwork/:id",
            element: (
              <ProtectedRoute>
                <EditArtwork />
              </ProtectedRoute>
            ),
          },
          {
            path: "/admin",
            element: (
              <ProtectedRoute superAdminOnly>
                <AdminManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "/change-password",
            element: (
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            ),
          },
          {
            path: "/activity-history",
            element: (
              <ProtectedRoute>
                <ActivityHistory />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
