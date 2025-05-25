// src/pages/HomePage.jsx
import React from 'react';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';
import './../styles/HomePage.css';
import './../styles/HomePageGraphics.css'; // This will contain the "cool" graphics

function HomePage() {
  const [isLogin, setIsLogin] = React.useState(true); // Toggle between login/register

  return (
    <div className="homepage-container">
      {/* Dynamic Graphics Section - Framed within a mock device */}
      <div className="homepage-graphics-area">
        <div className="mock-device">
          <div className="device-notch"></div> {/* Represents a phone notch */}
          <div className="device-screen">
            {/* Chat Bubbles */}
            <div className="graphic-chat-bubble graphic-incoming delay-1">
              <span className="bubble-content">Hey there! 👋</span>
              <div className="graphic-avatar-mini graphic-avatar-1"></div>
            </div>
            <div className="graphic-chat-bubble graphic-outgoing delay-2">
              <span className="bubble-content">Hi! Long time no chat. 😊</span>
            </div>
            <div className="graphic-chat-bubble graphic-incoming delay-3">
              <span className="bubble-content">Just sharing this new file.</span>
              <div className="graphic-avatar-mini graphic-avatar-2"></div>
            </div>
            <div className="graphic-chat-bubble graphic-file-transfer delay-4">
              <span className="file-icon-mock"></span>
              <span className="file-name">App_Design.sketch</span>
              <span className="transfer-progress">75%</span>
            </div>
            <div className="graphic-typing-indicator delay-5">
              <span></span><span></span><span></span>
            </div>
            <div className="graphic-chat-bubble graphic-outgoing delay-6">
              <span className="bubble-content">Awesome! Can't wait to see it.</span>
            </div>

            {/* Input Bar Mock */}
            <div className="mock-input-bar">
              <span className="mock-input-placeholder">Type a message...</span>
              <div className="mock-icon mock-icon-attachment"></div>
              <div className="mock-icon mock-icon-send"></div>
            </div>

            {/* Background elements (e.g., floating emojis, connection indicators) */}
            <div className="floating-element element-wifi"></div>
            <div className="floating-element element-emoji"></div>
            <div className="floating-element element-check"></div>
          </div>
        </div>
      </div>

      {/* Main Content (Heading and Auth Forms) */}
      <div className="homepage-content">
        <h1 className="hero-heading">Welcome to Flipr Chat!</h1>
        {/* Wrapper for Auth Forms */}
        <div className="auth-form-wrapper">
            {isLogin ? (
              <Login toggleForm={() => setIsLogin(false)} />
            ) : (
              <Register toggleForm={() => setIsLogin(true)} />
            )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;