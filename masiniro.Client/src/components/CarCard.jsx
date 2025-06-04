import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/CarMarketplace.css";

const backendUrl = "http://localhost:5226";

const CarCard = ({ id, imageUrl, title, price, mileage, userId }) => {
  // NEW: Add userId prop
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if this is the user's own listing
  const isOwnListing = user && userId && user.id === userId;

  // Check if this car is favorited when component mounts
  useEffect(() => {
    if (user && !isOwnListing) {
      // Only check favorites if not own listing
      checkFavoriteStatus();
    }
  }, [user, id, isOwnListing]);

  const checkFavoriteStatus = async () => {
    if (!user || isOwnListing) return;

    try {
      const response = await fetch(
        `/api/Favorites/check?userId=${user.id}&carListingId=${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.isFavorited);
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const handleSaveToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Please log in to save listings");
      return;
    }

    if (isOwnListing) {
      alert(
        "You cannot favorite your own listings. Check 'My Listings' to manage your cars."
      );
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(
          `/api/Favorites?userId=${user.id}&carListingId=${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );

        if (response.ok) {
          setIsFavorited(false);
        } else {
          throw new Error("Failed to remove from favorites");
        }
      } else {
        // Add to favorites
        const response = await fetch("/api/Favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            userId: user.id,
            carListingId: id,
          }),
        });

        if (response.ok) {
          setIsFavorited(true);
        } else {
          const errorData = await response.json();
          if (
            errorData.message &&
            errorData.message.includes("cannot favorite your own")
          ) {
            alert("You cannot favorite your own listings.");
          } else if (
            errorData.message &&
            errorData.message.includes("already in your favorites")
          ) {
            setIsFavorited(true);
          } else {
            throw new Error("Failed to add to favorites");
          }
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorites. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <Link
            to={`/car/${id}`}
            className="view-details-button"
            style={{ flex: 1, textAlign: "center" }}
          >
            View Details
          </Link>
          {/* UPDATED: Only show save button if user is logged in AND it's not their own listing */}
          {user && !isOwnListing && (
            <button
              onClick={handleSaveToggle}
              disabled={isLoading}
              className={`save-listing-btn ${isFavorited ? "favorited" : ""}`}
              style={{
                background: isFavorited ? "#dc3545" : "#28a745",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                fontSize: "0.9rem",
                fontWeight: "500",
                transition: "all 0.2s ease",
              }}
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              {isLoading ? "..." : isFavorited ? "❤️ Saved" : "🤍 Save"}
            </button>
          )}
          {/* OPTIONAL: Show indicator for own listings */}
          {isOwnListing && (
            <div
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#f8f9fa",
                color: "#6c757d",
                borderRadius: "6px",
                fontSize: "0.9rem",
                fontWeight: "500",
                border: "1px solid #dee2e6",
              }}
            >
              Your Listing
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarCard;
