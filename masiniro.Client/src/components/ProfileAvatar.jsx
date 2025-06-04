import React from "react";

const ProfileAvatar = ({
  user,
  size = "medium",
  className = "",
  showName = false,
}) => {
  const backendUrl = "http://localhost:5226";

  const getImageUrl = (profilePicturePath) => {
    if (!profilePicturePath) return null;

    if (profilePicturePath.startsWith("/uploads/")) {
      return backendUrl + profilePicturePath;
    }

    if (profilePicturePath.startsWith("http")) {
      return profilePicturePath;
    }

    return backendUrl + "/" + profilePicturePath;
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return first + last;
  };

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "profile-avatar-small";
      case "medium":
        return "profile-avatar-medium";
      case "large":
        return "profile-avatar-large";
      default:
        return "profile-avatar-medium";
    }
  };

  const profileImageUrl = user?.profilePicturePath
    ? getImageUrl(user.profilePicturePath)
    : null;
  const initials = getInitials(user?.firstName, user?.lastName);

  return (
    <div className={`profile-avatar-container ${className}`}>
      <div className={`profile-avatar ${getSizeClasses()}`}>
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt={`${user?.firstName || ""} ${user?.lastName || ""}`}
            className="profile-avatar-image"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="profile-avatar-placeholder"
          style={{ display: profileImageUrl ? "none" : "flex" }}
        >
          {initials || "👤"}
        </div>
      </div>
      {showName && (
        <span className="profile-name">
          {user?.firstName || user?.username || "User"}
        </span>
      )}
    </div>
  );
};

export default ProfileAvatar;
