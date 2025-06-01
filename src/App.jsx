import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Gallery from "./pages/Gallery";
import Featured from "./pages/Featured";
import Contact from "./pages/Contact";
import About from "./pages/About";
import SearchResults from "./pages/SearchResults";
import Footer from "./components/Footer";
import AddArtwork from "./pages/AddArtwork";
import EditArtwork from "./pages/EditArtwork";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/featured" element={<Featured />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/search" element={<SearchResults />} />
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
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
