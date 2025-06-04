import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import "../styles/CarMarketplace.css";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import CarCard from "../components/CarCard";
import Footer from "../components/Footer";
import AddCarForm from "../components/AddCarForm";

const CarMarketplace = () => {
  const [allCars, setAllCars] = useState([]); // Store all cars
  const [filteredCars, setFilteredCars] = useState([]); // Store filtered results
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const navigate = useNavigate();

  const fetchCars = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/CarListings");
      if (!response.ok) {
        throw new Error("Failed to fetch cars");
      }
      const data = await response.json();
      setAllCars(data);
      setFilteredCars(data); // Initially show all cars
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  // Search and filter function
  const handleSearchChange = (searchTerm, filters) => {
    setSearching(true);

    // Simulate a small delay for better UX
    setTimeout(() => {
      let filtered = [...allCars];

      // Text search (title, brand, model, description)
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (car) =>
            car.title.toLowerCase().includes(search) ||
            car.brand.toLowerCase().includes(search) ||
            car.model.toLowerCase().includes(search) ||
            car.description.toLowerCase().includes(search)
        );
      }

      // Price range filter
      if (filters.minPrice) {
        filtered = filtered.filter(
          (car) => car.price >= parseFloat(filters.minPrice)
        );
      }
      if (filters.maxPrice) {
        filtered = filtered.filter(
          (car) => car.price <= parseFloat(filters.maxPrice)
        );
      }

      // Year range filter
      if (filters.minYear) {
        filtered = filtered.filter(
          (car) => car.year >= parseInt(filters.minYear)
        );
      }
      if (filters.maxYear) {
        filtered = filtered.filter(
          (car) => car.year <= parseInt(filters.maxYear)
        );
      }

      // Brand filter
      if (filters.brand) {
        filtered = filtered.filter(
          (car) => car.brand.toLowerCase() === filters.brand.toLowerCase()
        );
      }

      // Sort results
      switch (filters.sortBy) {
        case "oldest":
          filtered.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          break;
        case "priceLow":
          filtered.sort((a, b) => a.price - b.price);
          break;
        case "priceHigh":
          filtered.sort((a, b) => b.price - a.price);
          break;
        case "yearNew":
          filtered.sort((a, b) => b.year - a.year);
          break;
        case "yearOld":
          filtered.sort((a, b) => a.year - b.year);
          break;
        case "newest":
        default:
          filtered.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
      }

      setFilteredCars(filtered);
      setSearching(false);
    }, 100);
  };

  const handleCarAdded = () => {
    fetchCars(); // Refresh all cars and reset filters
  };

  // Function to navigate to the chat page
  const handleFindCarClick = () => {
    navigate('/chat');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div>
      <Header />
      <div className="container">
        <div className="button-container">
          <button className="add-car-btn" onClick={() => setShowForm(true)}>
            Add Car Listing
          </button>
          <button className="add-car-btn" onClick={handleFindCarClick}>
            Find Your Perfect Car
          </button>
        </div>
        {showForm && (
          <AddCarForm
            onClose={() => setShowForm(false)}
            onCarAdded={handleCarAdded}
          />
        )}

        <SearchBar
          onSearchChange={handleSearchChange}
          totalResults={filteredCars.length}
          isSearching={searching}
        />

        {filteredCars.length === 0 && !loading ? (
          <div className="no-results">
            <h3>🔍 No cars found</h3>
            <p>Try adjusting your search terms or filters</p>
          </div>
        ) : (
          <div className="car-grid">
            {filteredCars.map((car) => (
              <CarCard
                key={car.id}
                id={car.id}
                imageUrl={car.imageUrl}
                title={car.title}
                price={car.price}
                mileage={`${car.mileage?.toLocaleString() || "N/A"} miles`}
                userId={car.userId} // NEW: Pass userId to CarCard
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CarMarketplace;
