import React from "react";

const ContactSellerPopup = ({ isOpen, onClose, sellerInfo, carTitle }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCallSeller = () => {
    // This will open the phone dialer on mobile devices
    window.location.href = `tel:${sellerInfo.phone}`;
  };

  return (
    <div className="popup-overlay" onClick={handleBackdropClick}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3>Contact Seller</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="popup-body">
          <div className="car-info">
            <h4>{carTitle}</h4>
          </div>

          <div className="seller-info">
            <div className="seller-detail">
              <label>Seller Name:</label>
              <span>{sellerInfo.name}</span>
            </div>

            <div className="seller-detail">
              <label>Phone Number:</label>
              <span className="phone-number">{sellerInfo.phone}</span>
            </div>

            {sellerInfo.email && (
              <div className="seller-detail">
                <label>Email:</label>
                <span>{sellerInfo.email}</span>
              </div>
            )}
          </div>

          <div className="contact-actions">
            <button className="call-btn" onClick={handleCallSeller}>
              📞 Call Seller
            </button>
            <button className="close-popup-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSellerPopup;
