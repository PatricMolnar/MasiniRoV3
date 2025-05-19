import React from 'react';
import '../styles/CarMarketplace.css';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CarCard from '../components/CarCard';
import Footer from '../components/Footer';

const CarMarketplace = () => {
    return (
        <div>
            <Header />
            <div className="container">
                <SearchBar />
                <div className="car-grid">
                    <CarCard
                        image="https://via.placeholder.com/300x180"
                        title="2019 Toyota Corolla"
                        price="$14,000"
                        mileage="30,000 miles"
                    />
                    <CarCard
                        image="https://via.placeholder.com/300x180"
                        title="2021 Tesla Model 3"
                        price="$35,000"
                        mileage="10,000 miles"
                    />
                    {/* Add more CarCard components as needed */}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default CarMarketplace;
