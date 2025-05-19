import React from 'react';
import '../styles/CarMarketplace.css';

const CarCard = ({ image, title, price, mileage }) => (
    <div className="car-card">
        <img src={image} alt={title} />
        <div className="car-details">
            <h3>{title}</h3>
            <p>Price: {price}</p>
            <p>Mileage: {mileage}</p>
        </div>
    </div>
);

export default CarCard;