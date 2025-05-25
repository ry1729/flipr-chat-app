// src/components/common/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/ThemeToggle.css';

function ThemeToggle() {
  const { theme, toggleTheme, isDarkMode } = useTheme();

  return (
    <div className="theme-toggle-container">
      <button
        className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
        onClick={toggleTheme}
        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        <div className="toggle-track">
          <div className="toggle-thumb">
            <span className="toggle-icon">
              {isDarkMode ? '🌙' : '☀️'}
            </span>
          </div>
        </div>
        <span className="toggle-label">
          {isDarkMode ? 'Dark' : 'Light'}
        </span>
      </button>
    </div>
  );
}

export default ThemeToggle;