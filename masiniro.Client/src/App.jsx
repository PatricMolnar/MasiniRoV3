import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import "./App.css";
import CarMarketplace from "./pages/CarMarketPlace";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CarDetail from "./components/CarDetail";
import Profile from "./pages/Profile";
import MyListings from "./pages/MyListings";
import ChatPage from "./pages/ChatPage";
import Favorites from "./pages/Favorites"; // NEW: Import Favorites

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/chat" element={<ChatPage />} /> {/* Chatbot route */}
          <Route path="/favorites" element={<Favorites />} /> {/* Your route */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/marketplace" element={<CarMarketplace />} />
          <Route path="/car/:id" element={<CarDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/favorites" element={<Favorites />} />{" "}
          {/* NEW: Favorites route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
