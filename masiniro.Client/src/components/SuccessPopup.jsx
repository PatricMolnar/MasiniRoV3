import React from "react";

const SuccessPopup = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "Continue",
  cancelButton = false,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <div className="success-popup-overlay" onClick={handleBackdropClick}>
      <div
        className="success-popup-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`success-popup-header ${
            cancelButton ? "warning-header" : ""
          }`}
        >
          <div className="success-icon">{cancelButton ? "⚠️" : "🎉"}</div>
          <h3>{title}</h3>
          <button className="success-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="success-popup-body">
          <p>{message}</p>

          <div className="success-actions">
            {cancelButton ? (
              <>
                <button className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="delete-btn" onClick={handleConfirm}>
                  {buttonText}
                </button>
              </>
            ) : (
              <button className="success-primary-btn" onClick={handleConfirm}>
                {buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPopup;
