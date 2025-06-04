import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/CarMarketplace.css";

const backendUrl = "http://localhost:5226";

const CarCard = ({ id, imageUrl, title, price, mileage }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Parse images from JSON string or use single image
  let images = [];
  try {
    if (imageUrl) {
      // Try to parse as JSON array (new format)
      if (imageUrl.startsWith("[") && imageUrl.endsWith("]")) {
        images = JSON.parse(imageUrl);
      } else {
        // Single image (old format or external URL)
        images = [imageUrl];
      }
    }
  } catch (error) {
    // If JSON parsing fails, treat as single image
    images = imageUrl ? [imageUrl] : [];
  }

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If it starts with /uploads/, prepend backend URL
    if (imagePath.startsWith("/uploads/")) {
      return backendUrl + imagePath;
    }

    // If it's a full URL (http/https), use as is
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // If it starts with /images/, prepend backend URL (legacy support)
    if (imagePath.startsWith("/images/")) {
      return backendUrl + imagePath;
    }

    // Default case
    return imagePath;
  };

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const currentImage =
    images.length > 0 ? getImageUrl(images[currentImageIndex]) : null;

  return (
    <div className="car-card">
      <div className="car-image-container">
        {currentImage ? (
          <>
            <img
              src={currentImage}
              alt={title}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div className="image-placeholder" style={{ display: "none" }}>
              📷 Image not available
            </div>

            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <button
                  className="image-nav-btn prev-btn"
                  onClick={prevImage}
                  title="Previous image"
                >
                  ‹
                </button>
                <button
                  className="image-nav-btn next-btn"
                  onClick={nextImage}
                  title="Next image"
                >
                  ›
                </button>

                {/* Image indicators */}
                <div className="image-indicators">
                  {images.map((_, index) => (
                    <span
                      key={index}
                      className={`indicator ${
                        index === currentImageIndex ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="image-placeholder">📷 No image available</div>
        )}
      </div>
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
};

export default CarCard;
