import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SuccessPopup from "../components/SuccessPopup";
import "../styles/Auth.css";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    profilePicture: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [checkingUniqueness, setCheckingUniqueness] = useState({
    username: false,
    email: false,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Character limits
  const LIMITS = {
    username: 30,
    email: 100,
    password: 50,
    firstName: 50,
    lastName: 50,
    phoneNumber: 10,
  };

  // Validation functions
  const validateUsername = (username) => {
    if (username.length < 3) {
      return "Username must be at least 3 characters long";
    }
    if (username.length > LIMITS.username) {
      return `Username cannot exceed ${LIMITS.username} characters`;
    }
    return null;
  };

  const validateEmail = (email) => {
    if (email.length > LIMITS.email) {
      return `Email cannot exceed ${LIMITS.email} characters`;
    }
    // More specific email validation for .ro format
    const emailRegex = /^[^\s@]+@[^\s@]+\.(ro|com|org|net|edu|gov)$/i;
    if (!emailRegex.test(email)) {
      return "Email must be in format: example@domain.ro (or .com, .org, etc.)";
    }
    return null;
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    if (password.length > LIMITS.password) {
      return `Password cannot exceed ${LIMITS.password} characters`;
    }
    if (password.includes(" ")) {
      return "Password cannot contain spaces";
    }
    return null;
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return "Phone number must be exactly 10 digits";
    }
    return null;
  };

  const validateName = (name, fieldName) => {
    if (name.length > LIMITS.firstName) {
      // Same limit for both names
      return `${fieldName} cannot exceed ${LIMITS.firstName} characters`;
    }
    // Allow letters, numbers, spaces, and common name characters but block special symbols
    const nameRegex = /^[a-zA-ZăâîșțĂÂÎȘȚàáéíóúüñçôõ0-9\s'-]+$/;
    if (!nameRegex.test(name)) {
      return `${fieldName} can only contain letters, numbers, spaces, and basic punctuation (-, ')`;
    }
    return null;
  };

  const validateProfilePicture = (file) => {
    if (!file) return null; // Optional field

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return "Profile picture must be smaller than 5MB";
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
      return "Profile picture must be a valid image file (JPEG, PNG, GIF, WebP)";
    }

    return null;
  };

  // Check if username/email already exists
  const checkUniqueness = async (field, value) => {
    if (!value || value.length < 3) return; // Don't check if too short

    setCheckingUniqueness((prev) => ({ ...prev, [field]: true }));

    try {
      const response = await fetch(
        `/api/AppUsers/check-${field}/${encodeURIComponent(value)}`
      );
      const data = await response.json();

      if (!response.ok || data.exists) {
        setErrors((prev) => ({
          ...prev,
          [field]: `This ${field} is already taken. Please choose a different one.`,
        }));
      } else {
        // Clear error if unique
        setErrors((prev) => ({
          ...prev,
          [field]: null,
        }));
      }
    } catch (error) {
      console.log(`Could not check ${field} uniqueness:`, error);
      // Don't show error to user for network issues during typing
    } finally {
      setCheckingUniqueness((prev) => ({ ...prev, [field]: false }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    const usernameError = validateUsername(formData.username);
    if (usernameError) newErrors.username = usernameError;

    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    // Password validation
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Phone number validation
    const phoneError = validatePhoneNumber(formData.phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else {
      const firstNameError = validateName(formData.firstName, "First name");
      if (firstNameError) newErrors.firstName = firstNameError;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else {
      const lastNameError = validateName(formData.lastName, "Last name");
      if (lastNameError) newErrors.lastName = lastNameError;
    }

    // Profile picture validation
    const profilePictureError = validateProfilePicture(formData.profilePicture);
    if (profilePictureError) newErrors.profilePicture = profilePictureError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Check character limits first
    if (LIMITS[name] && value.length > LIMITS[name]) {
      return; // Don't update if exceeds limit
    }

    // Handle different input restrictions based on field
    if (name === "password" && value.includes(" ")) {
      return; // Don't update if password contains spaces
    }

    if (name === "phoneNumber") {
      // Only allow digits and limit to 10 characters
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 10) {
        setFormData((prevState) => ({
          ...prevState,
          [name]: digitsOnly,
        }));
      }
      return;
    }

    if (name === "firstName" || name === "lastName") {
      // Block special characters but allow letters, numbers, spaces, and basic punctuation
      const allowedChars = /^[a-zA-ZăâîșțĂÂÎȘȚàáéíóúüñçôõ0-9\s'-]*$/;
      if (!allowedChars.test(value)) {
        return; // Don't update if contains forbidden characters
      }
    }

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // Check uniqueness for username and email after a delay
    if (name === "username" || name === "email") {
      setTimeout(() => {
        if (formData[name] === value) {
          // Only check if value hasn't changed
          checkUniqueness(name, value);
        }
      }, 1000); // Wait 1 second after user stops typing
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      const fileError = validateProfilePicture(file);
      if (fileError) {
        setErrors((prev) => ({
          ...prev,
          profilePicture: fileError,
        }));
        return;
      }

      // Clear any previous errors
      setErrors((prev) => ({
        ...prev,
        profilePicture: null,
      }));

      // Set file in form data
      setFormData((prev) => ({
        ...prev,
        profilePicture: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    setFormData((prev) => ({
      ...prev,
      profilePicture: null,
    }));
    setPreviewImage(null);
    setErrors((prev) => ({
      ...prev,
      profilePicture: null,
    }));

    // Reset file input
    const fileInput = document.getElementById("profilePicture");
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      console.log("Frontend validation failed:", errors);
      return;
    }

    // Check if there are any pending uniqueness checks
    if (checkingUniqueness.username || checkingUniqueness.email) {
      setErrors({
        general: "Please wait while we verify your username and email...",
      });
      return;
    }

    setLoading(true);

    try {
      // Create FormData for form submission (supports file upload)
      const formDataToSend = new FormData();
      formDataToSend.append("username", formData.username);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("phoneNumber", formData.phoneNumber);

      if (formData.profilePicture) {
        formDataToSend.append("profilePicture", formData.profilePicture);
      }

      const response = await fetch("/api/AppUsers/register", {
        method: "POST",
        body: formDataToSend, // Don't set Content-Type header, let browser set it for FormData
      });

      if (response.ok) {
        setShowSuccessPopup(true);
      } else {
        const responseText = await response.text();

        // Handle specific errors
        if (response.status === 409) {
          setErrors({
            general:
              "Username or email already exists. Please choose different ones.",
          });
        } else if (response.status === 400) {
          setErrors({ general: `Invalid data provided: ${responseText}` });
        } else {
          setErrors({
            general: `Registration failed: ${
              responseText || "Please try again."
            }`,
          });
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({
        general:
          "Network error occurred. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
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

  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
    navigate("/login");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create Account</h2>

        {errors.general && (
          <div className="error-message general-error">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter username (min 3 characters)"
              className={errors.username ? "error" : ""}
              maxLength={LIMITS.username}
            />
            <div className="character-count">
              {getCharacterCount("username")}
            </div>
            {checkingUniqueness.username && (
              <span className="checking">Checking availability...</span>
            )}
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="firstName">First Name *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="Enter your first name"
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
              placeholder="Enter your last name"
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

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="example@yahoo.ro"
              className={errors.email ? "error" : ""}
              maxLength={LIMITS.email}
            />
            <div className="character-count">{getCharacterCount("email")}</div>
            {checkingUniqueness.email && (
              <span className="checking">Checking availability...</span>
            )}
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number *</label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              placeholder="0712345678 (exactly 10 digits)"
              className={errors.phoneNumber ? "error" : ""}
              maxLength="10"
            />
            <div className="character-count">
              {getCharacterCount("phoneNumber")}
            </div>
            {errors.phoneNumber && (
              <span className="error-message">{errors.phoneNumber}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Min 6 characters, no spaces"
              className={errors.password ? "error" : ""}
              maxLength={LIMITS.password}
            />
            <div className="character-count">
              {getCharacterCount("password")}
            </div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter your password"
              className={errors.confirmPassword ? "error" : ""}
              maxLength={LIMITS.password}
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="profilePicture" className="file-upload-label">
              📷 Profile Picture (Optional)
            </label>

            {!previewImage ? (
              <div className="file-upload-area">
                <input
                  type="file"
                  id="profilePicture"
                  name="profilePicture"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className={`file-input ${
                    errors.profilePicture ? "error" : ""
                  }`}
                />
                <div className="file-upload-text">
                  Choose image file (max 5MB)
                  <br />
                  <span className="file-types">JPEG, PNG, GIF, WebP</span>
                </div>
              </div>
            ) : (
              <div className="image-preview">
                <img
                  src={previewImage}
                  alt="Profile preview"
                  className="preview-image"
                />
                <div className="image-info">
                  <span className="file-name">
                    {formData.profilePicture.name}
                  </span>
                  <span className="file-size">
                    ({formatFileSize(formData.profilePicture.size)})
                  </span>
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={removeProfilePicture}
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            )}

            {errors.profilePicture && (
              <span className="error-message">{errors.profilePicture}</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={
              loading || checkingUniqueness.username || checkingUniqueness.email
            }
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>

      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={handleSuccessClose}
        title="Registration Successful!"
        message="Your account has been created successfully! Please login with your new credentials to start using MasiniRo."
        buttonText="Go to Login"
      />
    </div>
  );
}

export default Register;
