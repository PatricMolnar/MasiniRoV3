import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ContactSellerPopup from "../components/ContactSellerPopup";
import "../styles/CarDetail.css";

const backendUrl = "http://localhost:5226";

const CarDetail = () => {
  const { id } = useParams();
  const { user } = useAuth(); // Get current logged-in user
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        const response = await fetch(`/api/CarListings/${id}`);
        if (!response.ok) {
          throw new Error("Car not found");
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

  // Parse images from JSON string or use single image
  const getCarImages = () => {
    if (!car?.imageUrl) return [];

    try {
      // Try to parse as JSON array (new format)
      if (car.imageUrl.startsWith("[") && car.imageUrl.endsWith("]")) {
        return JSON.parse(car.imageUrl);
      } else {
        // Single image (old format or external URL)
        return [car.imageUrl];
      }
    } catch (error) {
      // If JSON parsing fails, treat as single image
      return car.imageUrl ? [car.imageUrl] : [];
    }
  };

  const images = getCarImages();

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

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  const handleContactSeller = () => {
    setShowContactPopup(true);
  };

  const handleClosePopup = () => {
    setShowContactPopup(false);
  };

  if (loading) {
    return <div className="car-detail-loading">Loading...</div>;
  }

  if (error) {
    return <div className="car-detail-error">Error: {error}</div>;
  }

  if (!car) {
    return <div className="car-detail-not-found">Car not found</div>;
  }

  const sellerInfo = {
    name: car.sellerName,
    phone: car.sellerPhone,
    email: car.sellerEmail,
  };

  const currentImage =
    images.length > 0 ? getImageUrl(images[currentImageIndex]) : null;

  // Check if current user is the owner of this listing
  const isOwner = user && car && user.id === car.userId;

  return (
    <div className="car-detail-container">
      <div className="car-detail-header">
        <h1>{car.title}</h1>
        <p className="car-price">${car.price.toLocaleString()}</p>
      </div>

      <div className="car-detail-content">
        <div className="car-image-section">
          {/* Main Image Display */}
          <div className="main-image-container">
            {currentImage ? (
              <>
                <img
                  src={currentImage}
                  alt={`${car.title} - Image ${currentImageIndex + 1}`}
                  className="car-detail-image"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div
                  className="image-placeholder main-placeholder"
                  style={{ display: "none" }}
                >
                  📷 Image not available
                </div>

                {/* Navigation arrows for main image */}
                {images.length > 1 && (
                  <>
                    <button
                      className="main-image-nav-btn prev-btn"
                      onClick={prevImage}
                      title="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      className="main-image-nav-btn next-btn"
                      onClick={nextImage}
                      title="Next image"
                    >
                      ›
                    </button>

                    {/* Image counter */}
                    <div className="image-counter">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="image-placeholder main-placeholder">
                📷 No image available
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="thumbnail-gallery">
              <h4>All Images</h4>
              <div className="thumbnails-container">
                {images.map((imagePath, index) => {
                  const thumbnailUrl = getImageUrl(imagePath);
                  return (
                    <div
                      key={index}
                      className={`thumbnail ${
                        index === currentImageIndex ? "active" : ""
                      }`}
                      onClick={() => goToImage(index)}
                    >
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={`${car.title} thumbnail ${index + 1}`}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="thumbnail-placeholder"
                        style={{ display: thumbnailUrl ? "none" : "flex" }}
                      >
                        📷
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
            {!isOwner && (
              <>
                <button
                  className="contact-button"
                  onClick={handleContactSeller}
                >
                  Contact Seller
                </button>
                <button className="save-button">Save Listing</button>
              </>
            )}
            {isOwner && (
              <div className="owner-notice">
                <p>✅ This is your listing</p>
                <p>View it from "My Listings" to edit or delete</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Seller Popup */}
      <ContactSellerPopup
        isOpen={showContactPopup}
        onClose={handleClosePopup}
        sellerInfo={sellerInfo}
        carTitle={car.title}
      />
    </div>
  );
};

export default CarDetail;
