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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/marketplace" element={<CarMarketplace />} />
          <Route path="/car/:id" element={<CarDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
