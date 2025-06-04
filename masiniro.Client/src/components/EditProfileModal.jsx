import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import SuccessPopup from "./SuccessPopup";

const EditProfileModal = ({ isOpen, onClose, onProfileUpdated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [removeProfilePicture, setRemoveProfilePicture] = useState(false);
  const [errors, setErrors] = useState({});

  // Character limits
  const LIMITS = {
    username: 30,
    firstName: 50,
    lastName: 50,
    phoneNumber: 10,
  };

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
      });
      setProfilePicturePreview(user.profilePicturePath || null);
      setProfilePicture(null);
      setRemoveProfilePicture(false);
      setErrors({});
      setHasUnsavedChanges(false);
    }
  }, [isOpen, user]);

  // Track unsaved changes
  useEffect(() => {
    if (!user) return;

    const hasChanges =
      formData.username !== (user.username || "") ||
      formData.firstName !== (user.firstName || "") ||
      formData.lastName !== (user.lastName || "") ||
      formData.phoneNumber !== (user.phoneNumber || "") ||
      profilePicture !== null ||
      removeProfilePicture;

    setHasUnsavedChanges(hasChanges);
  }, [formData, profilePicture, removeProfilePicture, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Character limits
    if (LIMITS[name] && value.length > LIMITS[name]) {
      return;
    }

    // Phone number - only digits
    if (name === "phoneNumber") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
      }
      return;
    }

    // Name validation - block special characters
    if (name === "firstName" || name === "lastName") {
      const allowedChars = /^[a-zA-ZăâîșțĂÂÎȘȚàáéíóúüñçôõ0-9\s'-]*$/;
      if (!allowedChars.test(value)) {
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      const validation = validateProfilePicture(file);
      if (!validation.isValid) {
        setErrors((prev) => ({ ...prev, profilePicture: validation.error }));
        return;
      }

      setErrors((prev) => ({ ...prev, profilePicture: null }));
      setProfilePicture(file);
      setRemoveProfilePicture(false);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
    setRemoveProfilePicture(true);
    setErrors((prev) => ({ ...prev, profilePicture: null }));

    // Reset file input
    const fileInput = document.getElementById("profilePictureEdit");
    if (fileInput) fileInput.value = "";
  };

  const validateProfilePicture = (file) => {
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return {
        isValid: false,
        error: "Profile picture must be smaller than 5MB.",
      };
    }

    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return {
        isValid: false,
        error:
          "Profile picture must be a valid image file (JPEG, PNG, GIF, WebP).",
      };
    }

    return { isValid: true, error: null };
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters long.";
    }

    // Phone number validation
    if (formData.phoneNumber.length !== 10) {
      newErrors.phoneNumber = "Phone number must be exactly 10 digits.";
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("username", formData.username);
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("phoneNumber", formData.phoneNumber);
      formDataToSend.append(
        "removeProfilePicture",
        removeProfilePicture.toString()
      );

      if (profilePicture) {
        formDataToSend.append("profilePicture", profilePicture);
      }

      const response = await fetch(`/api/AppUsers/${user.id}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        setPopupTitle("Success!");
        setPopupMessage("Profile updated successfully!");
        setShowSuccessPopup(true);
        setHasUnsavedChanges(false);

        // Update the user context
        if (onProfileUpdated) {
          onProfileUpdated(data.user);
        }
      } else {
        const errorData = await response.json();
        setPopupTitle("Update Failed");
        setPopupMessage(errorData.message || "Failed to update profile.");
        setShowErrorPopup(true);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setPopupTitle("Error Occurred");
      setPopupMessage(
        "An error occurred while updating your profile. Please try again."
      );
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const handleUnsavedWarningConfirm = () => {
    setShowUnsavedWarning(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
    onClose();
  };

  const getCharacterCount = (fieldName) => {
    const current = formData[fieldName]?.length || 0;
    const max = LIMITS[fieldName];
    return `${current}/${max}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Edit Profile</h2>
            <button className="close-btn" onClick={handleClose}>
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="add-car-form">
            {/* Profile Picture Section */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="profilePictureEdit">
                  Profile Picture (Max 5MB)
                </label>

                {profilePicturePreview && !removeProfilePicture ? (
                  <div className="image-preview">
                    <img
                      src={
                        profilePicturePreview.startsWith("data:")
                          ? profilePicturePreview
                          : `http://localhost:5226${profilePicturePreview}`
                      }
                      alt="Profile preview"
                      className="preview-image"
                    />
                    <div className="image-info">
                      <span className="file-name">
                        {profilePicture
                          ? profilePicture.name
                          : "Current profile picture"}
                      </span>
                      {profilePicture && (
                        <span className="file-size">
                          ({formatFileSize(profilePicture.size)})
                        </span>
                      )}
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={handleRemoveProfilePicture}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="profilePictureEdit"
                      name="profilePicture"
                      onChange={handleProfilePictureChange}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      className="file-input"
                    />
                    <div className="file-upload-text">
                      📷 Click to upload profile picture
                      <br />
                      <span className="file-types">
                        JPEG, PNG, GIF, WebP (max 5MB)
                      </span>
                    </div>
                  </div>
                )}

                {errors.profilePicture && (
                  <span className="error-message">{errors.profilePicture}</span>
                )}
              </div>
            </div>

            {/* Username */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={errors.username ? "error" : ""}
                  maxLength={LIMITS.username}
                />
                <div className="character-count">
                  {getCharacterCount("username")}
                </div>
                {errors.username && (
                  <span className="error-message">{errors.username}</span>
                )}
              </div>
            </div>

            {/* Email (Read-only) */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email (Cannot be changed)</label>
                <input
                  type="email"
                  id="email"
                  value={user?.email || ""}
                  disabled
                  style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                />
              </div>
            </div>

            {/* First and Last Name */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={errors.firstName ? "error" : ""}
                  maxLength={LIMITS.firstName}
                />
                <div className="character-count">
                  {getCharacterCount("firstName")}
                </div>
                {errors.firstName && (
                  <span className="error-message">{errors.firstName}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={errors.lastName ? "error" : ""}
                  maxLength={LIMITS.lastName}
                />
                <div className="character-count">
                  {getCharacterCount("lastName")}
                </div>
                {errors.lastName && (
                  <span className="error-message">{errors.lastName}</span>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number *</label>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className={errors.phoneNumber ? "error" : ""}
                  maxLength="10"
                  placeholder="0712345678"
                />
                <div className="character-count">
                  {getCharacterCount("phoneNumber")}
                </div>
                {errors.phoneNumber && (
                  <span className="error-message">{errors.phoneNumber}</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      <SuccessPopup
        isOpen={showUnsavedWarning}
        onClose={() => setShowUnsavedWarning(false)}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave without saving?"
        buttonText="Leave Without Saving"
        cancelButton={true}
        onCancel={() => setShowUnsavedWarning(false)}
        onConfirm={handleUnsavedWarningConfirm}
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
        onClose={() => setShowErrorPopup(false)}
        title={popupTitle}
        message={popupMessage}
        buttonText="Try Again"
      />
    </>
  );
};

export default EditProfileModal;
