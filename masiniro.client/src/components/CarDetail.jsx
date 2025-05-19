import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/CarDetail.css';

const CarDetail = () => {
    const { id } = useParams();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCarDetails = async () => {
            try {
                const response = await fetch(`/api/CarListings/${id}`);
                if (!response.ok) {
                    throw new Error('Car not found');
                }
                const data = await response.json();
                setCar(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCarDetails();
    }, [id]);

    if (loading) {
        return <div className="car-detail-loading">Loading...</div>;
    }

    if (error) {
        return <div className="car-detail-error">Error: {error}</div>;
    }

    if (!car) {
        return <div className="car-detail-not-found">Car not found</div>;
    }

    return (
        <div className="car-detail-container">
            <div className="car-detail-header">
                <h1>{car.title}</h1>
                <p className="car-price">${car.price.toLocaleString()}</p>
            </div>
            
            <div className="car-detail-content">
                <div className="car-image-container">
                    <img src={car.imageUrl} alt={car.title} className="car-detail-image" />
                </div>
                
                <div className="car-info">
                    <div className="car-specs">
                        <h2>Specifications</h2>
                        <div className="specs-grid">
                            <div className="spec-item">
                                <span className="spec-label">Brand</span>
                                <span className="spec-value">{car.brand}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Model</span>
                                <span className="spec-value">{car.model}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Year</span>
                                <span className="spec-value">{car.year}</span>
                            </div>
                        </div>
                    </div>

                    <div className="car-description">
                        <h2>Description</h2>
                        <p>{car.description}</p>
                    </div>

                    <div className="car-actions">
                        <button className="contact-button">Contact Seller</button>
                        <button className="save-button">Save Listing</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarDetail; 