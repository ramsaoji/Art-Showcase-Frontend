import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { trackPageView } from "./services/analytics";
import Loader from "./components/ui/Loader";

// Lazy load page components
const Home = lazy(() => import("./pages/Home"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const AddArtwork = lazy(() => import("./pages/AddArtwork"));
const EditArtwork = lazy(() => import("./pages/EditArtwork"));
const Login = lazy(() => import("./pages/Login"));
const ArtworkDetail = lazy(() => import("./pages/ArtworkDetail"));

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

function App() {
  return (
    // Removed duplicate AuthProvider and Router
    <>
      <ScrollToTop />
      <AnalyticsWrapper>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/artwork/:id" element={<ArtworkDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
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
            </Route>
          </Routes>
        </Suspense>
      </AnalyticsWrapper>
    </>
  );
}

export default App;
