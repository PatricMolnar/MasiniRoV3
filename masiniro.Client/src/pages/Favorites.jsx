import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SuccessPopup from "../components/SuccessPopup";
import "../styles/CarMarketplace.css";

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Popup states
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");

  // Backend URL configuration
  const backendUrl = "http://localhost:5226";

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/Favorites/user/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      } else {
        throw new Error("Failed to fetch your favorites");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    let imagePath = imageUrl;

    try {
      if (imageUrl.startsWith("[") && imageUrl.endsWith("]")) {
        const imageArray = JSON.parse(imageUrl);
        if (imageArray.length > 0) {
          imagePath = imageArray[0];
        } else {
          return null;
        }
      }
    } catch (error) {
      imagePath = imageUrl;
    }

    if (imagePath.startsWith("/uploads/")) {
      return backendUrl + imagePath;
    }

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    if (imagePath.startsWith("/images/")) {
      return backendUrl + imagePath;
    }

    if (!imagePath.startsWith("/")) {
      return backendUrl + "/" + imagePath;
    }

    return backendUrl + imagePath;
  };

  const handleRemoveFromFavorites = async (carId, carTitle) => {
    try {
      const response = await fetch(
        `/api/Favorites?userId=${user.id}&carListingId=${carId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.ok) {
        setPopupTitle("Removed!");
        setPopupMessage(`"${carTitle}" has been removed from your favorites.`);
        setShowSuccessPopup(true);
        fetchFavorites(); // Refresh the list
      } else {
        const error = await response.text();
        setPopupTitle("Remove Failed");
        setPopupMessage(`Failed to remove from favorites: ${error}`);
        setShowErrorPopup(true);
      }
    } catch (error) {
      console.error("Remove favorite error:", error);
      setPopupTitle("Error Occurred");
      setPopupMessage(
        "An error occurred while removing from favorites. Please try again."
      );
      setShowErrorPopup(true);
    }
  };

  const handleViewDetails = (carId) => {
    navigate(`/car/${carId}`);
  };

  const handleBackToProfile = () => {
    navigate("/profile");
  };

  const handleBackToMarketplace = () => {
    navigate("/marketplace");
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="loading">Loading your favorites...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="error">Error: {error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container">
        <div className="my-listings-container">
          <div className="page-header">
            <h2>My Favorite Cars ❤️</h2>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn-secondary" onClick={handleBackToProfile}>
                Back to Profile
              </button>
              <button
                className="btn-secondary"
                onClick={handleBackToMarketplace}
              >
                Browse Cars
              </button>
            </div>
          </div>

          {favorites.length === 0 ? (
            <div className="empty-listings">
              <h3>No favorite cars yet</h3>
              <p>Start browsing and save cars you're interested in!</p>
              <button className="btn-primary" onClick={handleBackToMarketplace}>
                Browse Car Marketplace
              </button>
            </div>
          ) : (
            <div className="listings-grid">
              {favorites.map((favorite) => {
                const car = favorite.car;
                const imageUrl = getImageUrl(car.imageUrl);

                return (
                  <div key={favorite.favoriteId} className="listing-card">
                    <div className="listing-image">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={car.title}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : (
                        <div
                          className="image-placeholder"
                          style={{
                            display: "flex",
                            height: "200px",
                            backgroundColor: "#f8f9fa",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#6c757d",
                            fontSize: "1rem",
                          }}
                        >
                          📷 No Image Available
                        </div>
                      )}

                      <div
                        className="image-placeholder"
                        style={{
                          display: "none",
                          height: "200px",
                          backgroundColor: "#f8f9fa",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6c757d",
                          fontSize: "1rem",
                        }}
                      >
                        📷 Image not available
                      </div>
                    </div>

                    <div className="listing-content">
                      <h3 className="listing-title">{car.title}</h3>
                      <div className="listing-details">
                        <span className="car-brand">
                          {car.brand} {car.model}
                        </span>
                        <span className="car-year">{car.year}</span>
                      </div>
                      <div className="listing-price">
                        ${car.price.toLocaleString()}
                      </div>
                      <div className="listing-date">
                        Saved: {new Date(favorite.savedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="listing-actions">
                      <button
                        className="btn-view"
                        onClick={() => handleViewDetails(car.id)}
                      >
                        View Details
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() =>
                          handleRemoveFromFavorites(car.id, car.title)
                        }
                      >
                        Remove ❤️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={popupTitle}
        message={popupMessage}
        buttonText="Continue"
      />

      {/* Error Popup */}
      <SuccessPopup
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        title={popupTitle}
        message={popupMessage}
        buttonText="OK"
      />
    </div>
  );
};

export default Favorites;
