import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userExists, setUserExists] = useState(null); // Track if user exists

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (error) {
      setError("");
      setUserExists(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Please provide both username/email and password.");
      return;
    }

    setLoading(true);
    setError("");
    setUserExists(null);

    try {
      const response = await fetch("/api/Auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update auth context with user data
        const result = await login(formData.username, formData.password);
        if (result.success) {
          navigate("/marketplace");
        }
      } else {
        // Handle specific error cases
        if (response.status === 401) {
          if (data.message.includes("User account not found")) {
            setError(
              "❌ Username/email not found. Please check your username or create a new account."
            );
            setUserExists(false);
          } else if (data.message.includes("Incorrect password")) {
            setError(
              "❌ Password is incorrect. Please check your password and try again."
            );
            setUserExists(true);
          } else {
            setError(data.message || "Invalid credentials.");
          }
        } else {
          setError(data.message || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        "Network error occurred. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login</h2>

        {error && (
          <div className="error-message general-error">
            {error}
            {userExists === false && (
              <div style={{ marginTop: "10px", fontSize: "0.9rem" }}>
                💡 <strong>Tip:</strong> Don't have an account?{" "}
                <Link to="/register" style={{ color: "#007bff" }}>
                  Register here
                </Link>
              </div>
            )}
            {userExists === true && (
              <div style={{ marginTop: "10px", fontSize: "0.9rem" }}>
                💡 <strong>Tip:</strong> Try checking your password or use
                "Forgot Password" if available.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter your username or email"
              className={error ? "error" : ""}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className={error ? "error" : ""}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
