import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import '../styles/CarMarketplace.css';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CarCard from '../components/CarCard';
import CarDetail from '../components/CarDetail';
import Footer from '../components/Footer';
import AddCarForm from '../components/AddCarForm';

const CarMarketplace = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const fetchCars = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/CarListings');
            if (!response.ok) {
                throw new Error('Failed to fetch cars');
            }
            const data = await response.json();
            setCars(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCars();
    }, []);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <Router>
            <div>
                <Header />
                <Routes>
                    <Route path="/" element={
                        <div className="container">
                            <button className="add-car-btn" onClick={() => setShowForm(true)}>
                                Add Car Listing
                            </button>
                            {showForm && (
                                <AddCarForm
                                    onClose={() => setShowForm(false)}
                                    onCarAdded={fetchCars}
                                />
                            )}
                            <SearchBar />
                            <div className="car-grid">
                                {cars.map(car => (
                                    <CarCard
                                        key={car.id}
                                        id={car.id}
                                        image={car.imageUrl}
                                        title={car.title}
                                        price={car.price}
                                        mileage={`${car.mileage?.toLocaleString() || 'N/A'} miles`}
                                    />
                                ))}
                            </div>
                        </div>
                    } />
                    <Route path="/car/:id" element={<CarDetail />} />
                </Routes>
                <Footer />
            </div>
        </Router>
    );
};

export default CarMarketplace;
