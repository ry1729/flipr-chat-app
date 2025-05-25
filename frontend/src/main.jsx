import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Your main CSS file
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Create this context
import './styles/Theme.css'; // Import theme variables
import { ThemeProvider } from './context/ThemeContext'; // Import ThemeProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)