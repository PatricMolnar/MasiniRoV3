import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EditProfileModal from "../components/EditProfileModal";
import ProfileAvatar from "../components/ProfileAvatar";
import "../styles/CarMarketplace.css";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, updateUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleBackToMarketplace = () => {
    navigate("/marketplace");
  };

  const handleMyListings = () => {
    navigate("/my-listings");
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleProfileUpdated = (updatedUser) => {
    // Update the auth context with new user data
    updateUser(updatedUser);
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="loading">Loading profile...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="error">Please log in to view your profile</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container">
        <div className="profile-container">
          <h2>My Profile</h2>

          {/* Profile Picture */}
          <div className="profile-picture-section">
            <ProfileAvatar
              user={user}
              size="large"
              className="profile-page-avatar"
            />
          </div>

          <div className="profile-info">
            <div className="profile-field">
              <label>Username:</label>
              <span>{user.username}</span>
            </div>

            <div className="profile-field">
              <label>Email:</label>
              <span>{user.email}</span>
            </div>

            <div className="profile-field">
              <label>First Name:</label>
              <span>{user.firstName}</span>
            </div>

            <div className="profile-field">
              <label>Last Name:</label>
              <span>{user.lastName}</span>
            </div>

            <div className="profile-field">
              <label>Phone Number:</label>
              <span>{user.phoneNumber}</span>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn-primary" onClick={handleEditProfile}>
              Edit Profile
            </button>
            <button className="btn-secondary" onClick={handleMyListings}>
              My Listings
            </button>
            <button className="btn-secondary" onClick={handleBackToMarketplace}>
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
      <Footer />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
};

export default Profile;
