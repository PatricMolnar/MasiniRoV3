import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfileAvatar from "./ProfileAvatar";
import "../styles/CarMarketplace.css";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1>MasiniRo</h1>
      </div>

      <div className="header-right">
        {user && (
          <>
            <div className="header-user-info">
              <ProfileAvatar
                user={user}
                size="small"
                className="header-avatar"
              />
              <span className="username">{user.firstName}</span>
            </div>
            <button className="profile-btn" onClick={handleProfileClick}>
              Profile
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
