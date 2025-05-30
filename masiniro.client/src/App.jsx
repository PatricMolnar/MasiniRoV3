import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import CarMarketplace from './pages/CarMarketPlace';
import Login from './pages/Login';
import Register from './pages/Register';
import CarDetail from './components/CarDetail';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/marketplace" element={<CarMarketplace />} />
                <Route path="/car/:id" element={<CarDetail />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;