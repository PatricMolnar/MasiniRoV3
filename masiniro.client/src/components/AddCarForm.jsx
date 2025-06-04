import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import SuccessPopup from "./SuccessPopup";

const AddCarForm = ({ onClose, onCarAdded }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    model: "",
    price: "",
    year: "",
    description: "",
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    // Check if total images exceed 6
    if (selectedImages.length + files.length > 6) {
      setPopupTitle("Upload Limit Exceeded");
      setPopupMessage("You can only upload up to 6 images maximum.");
      setShowErrorPopup(true);
      return;
    }

    // Validate each file
    const validFiles = [];
    const newPreviews = [];

    files.forEach((file) => {
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setPopupTitle("File Too Large");
        setPopupMessage(`${file.name} is too large. Maximum size is 10MB.`);
        setShowErrorPopup(true);
        return;
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setPopupTitle("Invalid File Type");
        setPopupMessage(
          `${file.name} is not a valid image format. Use JPEG, PNG, GIF, or WebP.`
        );
        setShowErrorPopup(true);
        return;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({
          file: file,
          url: e.target.result,
          name: file.name,
        });

        // Update previews when all files are processed
        if (newPreviews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedImages((prev) => [...prev, ...validFiles]);
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setPopupTitle("Login Required");
      setPopupMessage("You must be logged in to add a car listing.");
      setShowErrorPopup(true);
      return;
    }

    if (selectedImages.length === 0) {
      setPopupTitle("Images Required");
      setPopupMessage("Please upload at least one image of your car.");
      setShowErrorPopup(true);
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add basic form data
      formDataToSend.append("title", formData.title);
      formDataToSend.append("brand", formData.brand);
      formDataToSend.append("model", formData.model);
      formDataToSend.append("price", parseFloat(formData.price));
      formDataToSend.append("year", parseInt(formData.year));
      formDataToSend.append("description", formData.description);
      formDataToSend.append("userId", user.id);

      // Add images
      selectedImages.forEach((image, index) => {
        formDataToSend.append("images", image);
      });

      const response = await fetch("/api/CarListings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        setPopupTitle("Success!");
        setPopupMessage(
          "Car listing added successfully! Your car is now live on the marketplace."
        );
        setShowSuccessPopup(true);
      } else {
        const errorData = await response.text();
        setPopupTitle("Upload Failed");
        setPopupMessage(`Failed to add car listing: ${errorData}`);
        setShowErrorPopup(true);
      }
    } catch (error) {
      console.error("Error adding car:", error);
      setPopupTitle("Error Occurred");
      setPopupMessage(
        "An error occurred while adding the car listing. Please try again."
      );
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
    onCarAdded(); // Refresh the car list
    onClose(); // Close the form
  };

  const handleErrorClose = () => {
    setShowErrorPopup(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Car Listing</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-car-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., BMW X5 - Excellent Condition"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="brand">Brand *</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                placeholder="e.g., BMW"
              />
            </div>
            <div className="form-group">
              <label htmlFor="model">Model *</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                placeholder="e.g., X5"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price ($) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="25000"
              />
            </div>
            <div className="form-group">
              <label htmlFor="year">Year *</label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                min="1900"
                max="2025"
                placeholder="2018"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe your car's condition, features, history, etc."
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="images">
                Car Images * (Max 6 images, 10MB each)
              </label>

              {selectedImages.length < 6 && (
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="images"
                    name="images"
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    multiple
                    className="file-input"
                  />
                  <div className="file-upload-text">
                    📷 Click to upload car images
                    <br />
                    <span className="file-types">
                      JPEG, PNG, GIF, WebP (max 10MB each)
                    </span>
                    <br />
                    <span className="file-count">
                      {selectedImages.length}/6 images selected
                    </span>
                  </div>
                </div>
              )}

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  <h4>Selected Images:</h4>
                  <div className="preview-grid">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="image-preview-item">
                        <img
                          src={preview.url}
                          alt={`Car ${index + 1}`}
                          className="preview-image"
                        />
                        <div className="image-info">
                          <span className="image-name">{preview.name}</span>
                          <span className="image-size">
                            ({formatFileSize(selectedImages[index]?.size || 0)})
                          </span>
                        </div>
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => removeImage(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Adding..." : "Add Car Listing"}
            </button>
          </div>
        </form>
      </div>

      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={handleSuccessClose}
        title="Car Listing Added!"
        message={popupMessage}
        buttonText="Continue"
      />

      {/* Error Popup */}
      <SuccessPopup
        isOpen={showErrorPopup}
        onClose={handleErrorClose}
        title={popupTitle}
        message={popupMessage}
        buttonText="Try Again"
      />
    </div>
  );
};

export default AddCarForm;
