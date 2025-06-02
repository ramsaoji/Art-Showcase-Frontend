import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import About from "./pages/About";
import AddArtwork from "./pages/AddArtwork";
import EditArtwork from "./pages/EditArtwork";
import Login from "./pages/Login";
import ArtworkDetail from "./pages/ArtworkDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import { trackPageView } from "./services/analytics";

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

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AnalyticsWrapper>
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
        </AnalyticsWrapper>
      </Router>
    </AuthProvider>
  );
}

export default App;
