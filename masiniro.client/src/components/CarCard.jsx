import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/CarMarketplace.css';

const backendUrl = "http://localhost:5226";

const CarCard = ({ id, image, title, price, mileage }) => (
    <div className="car-card">
        <img src={image && image.startsWith('/images/') ? backendUrl + image : image} alt={title} />
        <div className="car-details">
            <h3>{title}</h3>
            <p>Price: ${price.toLocaleString()}</p>
            <p>Mileage: {mileage}</p>
            <Link to={`/car/${id}`} className="view-details-button">
                View Details
            </Link>
        </div>
    </div>
);

export default CarCard;