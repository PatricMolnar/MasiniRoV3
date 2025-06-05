import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import SuccessPopup from "./SuccessPopup";

const EditCarForm = ({ isOpen, onClose, onCarUpdated, carData }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: carData?.title || "",
    brand: carData?.brand || "",
    model: carData?.model || "",
    price: carData?.price || "",
    year: carData?.year || "",
    mileage: carData?.mileage || "",
    horsepower: carData?.horsepower || "",
    cubicCapacity: carData?.cubicCapacity || "",
    engineType: carData?.engineType || "",
    description: carData?.description || "",
    images: [],
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [originalImages, setOriginalImages] = useState([]); // Keep track of original images
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");

  // Initialize form with existing car data
  useEffect(() => {
    if (isOpen && carData) {
      setFormData({
        title: carData.title || "",
        brand: carData.brand || "",
        model: carData.model || "",
        price: carData.price?.toString() || "",
        year: carData.year?.toString() || "",
        mileage: carData.mileage || "",
        horsepower: carData.horsepower || "",
        cubicCapacity: carData.cubicCapacity || "",
        engineType: carData.engineType || "",
        description: carData.description || "",
      });

      // Parse existing images
      let images = [];
      try {
        if (carData.imageUrl) {
          if (
            carData.imageUrl.startsWith("[") &&
            carData.imageUrl.endsWith("]")
          ) {
            images = JSON.parse(carData.imageUrl);
          } else {
            images = [carData.imageUrl];
          }
        }
      } catch (error) {
        images = carData.imageUrl ? [carData.imageUrl] : [];
      }

      setOriginalImages([...images]); // Store original images
      setExistingImages([...images]); // Current images (can be modified)
      setSelectedImages([]);
      setImagePreviews([]);
    }
  }, [isOpen, carData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    // Check if total images (existing + new) exceed 6
    if (existingImages.length + selectedImages.length + files.length > 6) {
      setPopupTitle("Upload Limit Exceeded");
      setPopupMessage("You can only have up to 6 images maximum.");
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

  const removeNewImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const backendUrl = "http://localhost:5226";

    if (imagePath.startsWith("/uploads/")) {
      return backendUrl + imagePath;
    }
    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    if (imagePath.startsWith("/images/")) {
      return backendUrl + imagePath;
    }
    return imagePath;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setPopupTitle("Login Required");
      setPopupMessage("You must be logged in to edit a car listing.");
      setShowErrorPopup(true);
      return;
    }

    // Check if we have at least one image (existing or new)
    if (existingImages.length === 0 && selectedImages.length === 0) {
      setPopupTitle("Images Required");
      setPopupMessage("Please keep at least one image for your car.");
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
      formDataToSend.append("mileage", parseInt(formData.mileage));
      formDataToSend.append("horsepower", parseInt(formData.horsepower));
      formDataToSend.append("cubicCapacity", parseInt(formData.cubicCapacity));
      formDataToSend.append("engineType", formData.engineType);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("userId", user.id);

      // FIXED: Check if images have changed
      const imagesChanged =
        JSON.stringify(existingImages.sort()) !==
          JSON.stringify(originalImages.sort()) || selectedImages.length > 0;

      if (imagesChanged) {
        // If user removed some existing images or added new ones, we need to update all images

        if (selectedImages.length > 0) {
          // User added new images - replace all with new images
          selectedImages.forEach((image, index) => {
            formDataToSend.append("images", image);
          });
        } else if (existingImages.length !== originalImages.length) {
          // User only removed existing images - send a special flag to update with remaining images
          formDataToSend.append(
            "keepExistingImages",
            JSON.stringify(existingImages)
          );
        }
      }
      // If no images changed, don't send any image data

      const response = await fetch(`/api/CarListings/${carData.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        setPopupTitle("Success!");
        setPopupMessage(
          "Car listing updated successfully! Your changes are now live."
        );
        setShowSuccessPopup(true);
      } else {
        const errorData = await response.text();
        setPopupTitle("Update Failed");
        setPopupMessage(`Failed to update car listing: ${errorData}`);
        setShowErrorPopup(true);
      }
    } catch (error) {
      console.error("Error updating car:", error);
      setPopupTitle("Error Occurred");
      setPopupMessage(
        "An error occurred while updating the car listing. Please try again."
      );
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
    onCarUpdated(); // Refresh the car list
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

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Edit Car Listing</h2>
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
                <select
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="brand-dropdown"
                >
                  <option value="">Select a brand</option>
                  <option value="Audi">Audi</option>
                  <option value="BMW">BMW</option>
                  <option value="Mercedes-Benz">Mercedes-Benz</option>
                  <option value="Volkswagen">Volkswagen</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Honda">Honda</option>
                  <option value="Ford">Ford</option>
                  <option value="Chevrolet">Chevrolet</option>
                  <option value="Nissan">Nissan</option>
                  <option value="Hyundai">Hyundai</option>
                  <option value="Kia">Kia</option>
                  <option value="Mazda">Mazda</option>
                  <option value="Subaru">Subaru</option>
                  <option value="Lexus">Lexus</option>
                  <option value="Infiniti">Infiniti</option>
                  <option value="Acura">Acura</option>
                  <option value="Volvo">Volvo</option>
                  <option value="Porsche">Porsche</option>
                  <option value="Jaguar">Jaguar</option>
                  <option value="Land Rover">Land Rover</option>
                  <option value="Jeep">Jeep</option>
                  <option value="Chrysler">Chrysler</option>
                  <option value="Dodge">Dodge</option>
                  <option value="Cadillac">Cadillac</option>
                  <option value="Lincoln">Lincoln</option>
                  <option value="Buick">Buick</option>
                  <option value="GMC">GMC</option>
                  <option value="Tesla">Tesla</option>
                  <option value="Genesis">Genesis</option>
                  <option value="Alfa Romeo">Alfa Romeo</option>
                  <option value="Maserati">Maserati</option>
                  <option value="Bentley">Bentley</option>
                  <option value="Rolls-Royce">Rolls-Royce</option>
                  <option value="Ferrari">Ferrari</option>
                  <option value="Lamborghini">Lamborghini</option>
                  <option value="McLaren">McLaren</option>
                  <option value="Aston Martin">Aston Martin</option>
                  <option value="Bugatti">Bugatti</option>
                  <option value="Koenigsegg">Koenigsegg</option>
                  <option value="Pagani">Pagani</option>
                  <option value="Dacia">Dacia</option>
                  <option value="Renault">Renault</option>
                  <option value="Peugeot">Peugeot</option>
                  <option value="Citroën">Citroën</option>
                  <option value="Fiat">Fiat</option>
                  <option value="Mitsubishi">Mitsubishi</option>
                  <option value="Suzuki">Suzuki</option>
                  <option value="Isuzu">Isuzu</option>
                  <option value="Saab">Saab</option>
                  <option value="Skoda">Skoda</option>
                  <option value="SEAT">SEAT</option>
                  <option value="Smart">Smart</option>
                  <option value="Mini">Mini</option>
                  <option value="Other">Other</option>
                </select>
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
                  max={new Date().getFullYear() + 1}
                  placeholder="2018"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mileage">Mileage (km) *</label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="e.g., 50000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="horsepower">Horsepower (CP) *</label>
                <input
                  type="number"
                  id="horsepower"
                  name="horsepower"
                  value={formData.horsepower}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="e.g., 150"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cubicCapacity">Cubic Capacity (cm³) *</label>
                <input
                  type="number"
                  id="cubicCapacity"
                  name="cubicCapacity"
                  value={formData.cubicCapacity}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="e.g., 2000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="engineType">Engine Type *</label>
                <select
                  id="engineType"
                  name="engineType"
                  value={formData.engineType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Engine Type</option>
                  <option value="I3">Inline 3</option>
                  <option value="I4">Inline 4</option>
                  <option value="I5">Inline 5</option>
                  <option value="I6">Inline 6</option>
                  <option value="V6">V6</option>
                  <option value="V8">V8</option>
                  <option value="V10">V10</option>
                  <option value="V12">V12</option>
                  <option value="W12">W12</option>
                  <option value="W16">W16</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Other">Other</option>
                </select>
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
                  Car Images * (Max 6 images total, 10MB each)
                </label>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="existing-images">
                    <h4>Current Images:</h4>
                    <div className="preview-grid">
                      {existingImages.map((imagePath, index) => (
                        <div
                          key={`existing-${index}`}
                          className="image-preview-item"
                        >
                          <img
                            src={getImageUrl(imagePath)}
                            alt={`Car ${index + 1}`}
                            className="preview-image"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <div
                            className="image-placeholder"
                            style={{ display: "none" }}
                          >
                            📷 Image not available
                          </div>
                          <div className="image-info">
                            <span className="image-name">
                              Current Image {index + 1}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeExistingImage(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Images */}
                {existingImages.length + selectedImages.length < 6 && (
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
                      📷 Click to upload new car images
                      <br />
                      <span className="file-types">
                        JPEG, PNG, GIF, WebP (max 10MB each)
                      </span>
                      <br />
                      <span className="file-count">
                        {existingImages.length + selectedImages.length}/6 images
                      </span>
                    </div>
                  </div>
                )}

                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="image-previews">
                    <h4>New Images to Upload:</h4>
                    <div className="preview-grid">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={`new-${index}`}
                          className="image-preview-item"
                        >
                          <img
                            src={preview.url}
                            alt={`New Car ${index + 1}`}
                            className="preview-image"
                          />
                          <div className="image-info">
                            <span className="image-name">{preview.name}</span>
                            <span className="image-size">
                              (
                              {formatFileSize(selectedImages[index]?.size || 0)}
                              )
                            </span>
                          </div>
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeNewImage(index)}
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
                {loading ? "Updating..." : "Update Car Listing"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={handleSuccessClose}
        title="Car Listing Updated!"
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
    </>
  );
};

export default EditCarForm;
