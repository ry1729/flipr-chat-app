// src/components/loadingSpinner.jsx
import React from 'react';
import '../styles/LoadingSpinner.css'; // Create this CSS file

function LoadingSpinner() {
  return (
    <div className="spinner-container">
      <div className="loading-spinner"></div>
    </div>
  );
}

export default LoadingSpinner;