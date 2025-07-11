import { Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect, lazy, Suspense } from "react";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { trackPageView } from "./services/analytics";
import Loader from "./components/ui/Loader";
import Home from "./pages/Home";
import VerifyEmail from "./pages/VerifyEmail";

// Lazy load page components
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

// Analytics wrapper component
function AnalyticsWrapper({ children }) {
  const location = useLocation();

  useEffect(() => {
    // Track page view in Firebase Analytics
    try {
      trackPageView(location.pathname);
    } catch (error) {
      console.debug("Failed to track page view:", error);
    }
  }, [location]);

  return children;
}

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader size="large" />
  </div>
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
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
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

function App() {
  return (
    // Removed duplicate AuthProvider and Router
    <>
      <ScrollToTop />
      <AnalyticsWrapper>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/artwork/:id" element={<ArtworkDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                  path="/add-artwork"
                  element={
                    <ProtectedRoute>
                      <AddArtwork />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-artwork/:id"
                  element={
                    <ProtectedRoute>
                      <EditArtwork />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ProtectedRoute superAdminOnly>
                        <AdminManagement />
                      </ProtectedRoute>
                    </Suspense>
                  }
                />
                <Route
                  path="/change-password"
                  element={
                    <ProtectedRoute>
                      <ChangePassword />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AnalyticsWrapper>
    </>
  );
}

export default App;
