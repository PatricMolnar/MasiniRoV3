import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SuccessPopup from "../components/SuccessPopup";
import "../styles/CarMarketplace.css";

const MyListings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Popup states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [carToDelete, setCarToDelete] = useState(null);

  // Backend URL configuration
  const backendUrl = "http://localhost:5226";

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/CarListings/user/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyListings(data);
      } else {
        throw new Error("Failed to fetch your listings");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get the correct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    // If it starts with /images/, prepend backend URL
    if (imageUrl.startsWith("/images/")) {
      return backendUrl + imageUrl;
    }

    // If it's a full URL (http/https), use as is
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }

    // If it's a relative path, prepend backend URL
    return backendUrl + "/" + imageUrl;
  };

  const handleEdit = (carId) => {
    // Navigate to edit page (we'll implement this later)
    console.log("Edit car:", carId);
    setPopupTitle("Feature Coming Soon");
    setPopupMessage("Edit functionality will be available in a future update!");
    setShowErrorPopup(true);
  };

  const handleDeleteClick = (carId, carTitle) => {
    setCarToDelete({ id: carId, title: carTitle });
    setPopupTitle("Delete Car Listing");
    setPopupMessage(
      `Are you sure you want to delete "${carTitle}"? This action cannot be undone.`
    );
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);

    if (!carToDelete) return;

    try {
      const response = await fetch(
        `/api/CarListings/${carToDelete.id}?userId=${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.ok) {
        setPopupTitle("Success!");
        setPopupMessage(
          `"${carToDelete.title}" has been deleted successfully!`
        );
        setShowSuccessPopup(true);
        fetchMyListings(); // Refresh the list
      } else {
        const error = await response.text();
        setPopupTitle("Delete Failed");
        setPopupMessage(`Failed to delete listing: ${error}`);
        setShowErrorPopup(true);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setPopupTitle("Error Occurred");
      setPopupMessage(
        "An error occurred while deleting the listing. Please try again."
      );
      setShowErrorPopup(true);
    } finally {
      setCarToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setCarToDelete(null);
  };

  const handleViewDetails = (carId) => {
    navigate(`/car/${carId}`);
  };

  const handleBackToMarketplace = () => {
    navigate("/marketplace");
  };

  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
  };

  const handleErrorClose = () => {
    setShowErrorPopup(false);
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="loading">Loading your listings...</div>
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
            <h2>My Car Listings</h2>
            <button className="btn-secondary" onClick={handleBackToMarketplace}>
              Back to Marketplace
            </button>
          </div>

          {myListings.length === 0 ? (
            <div className="empty-listings">
              <h3>You haven't posted any cars yet</h3>
              <p>Click "Add Car Listing" to post your first car!</p>
              <button className="btn-primary" onClick={handleBackToMarketplace}>
                Go to Marketplace
              </button>
            </div>
          ) : (
            <div className="listings-grid">
              {myListings.map((car) => {
                const imageUrl = getImageUrl(car.imageUrl);
                console.log("Car object:", car);
                console.log("Original ImageUrl:", car.imageUrl);
                console.log("Processed ImageUrl:", imageUrl);

                return (
                  <div key={car.id} className="listing-card">
                    <div className="listing-image">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={car.title}
                          onError={(e) => {
                            console.log("Image failed to load:", imageUrl);
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                          onLoad={() => {
                            console.log("Image loaded successfully:", imageUrl);
                          }}
                        />
                      ) : null}
                      <div
                        className="image-placeholder"
                        style={{
                          display: !imageUrl ? "flex" : "none",
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
                        Posted: {new Date(car.createdAt).toLocaleDateString()}
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
                        className="btn-edit"
                        onClick={() => handleEdit(car.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteClick(car.id, car.title)}
                      >
                        Delete
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

      {/* Delete Confirmation Popup */}
      <SuccessPopup
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        title={popupTitle}
        message={popupMessage}
        buttonText="Delete"
        cancelButton={true}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={handleSuccessClose}
        title={popupTitle}
        message={popupMessage}
        buttonText="Continue"
      />

      {/* Error Popup */}
      <SuccessPopup
        isOpen={showErrorPopup}
        onClose={handleErrorClose}
        title={popupTitle}
        message={popupMessage}
        buttonText="OK"
      />
    </div>
  );
};

export default MyListings;
