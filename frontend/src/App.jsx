import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage'; // Assuming HomePage is your LoginPage
import ChatPage from './pages/ChatPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext'; // <--- Import ThemeProvider

function App() {
  const { user } = useAuth();

  return (
    // Wrap the entire application with ThemeProvider
    <ThemeProvider> 
      <ChatProvider>
        <Routes>
          {/* If user is logged in, navigate to /chats, otherwise show HomePage (LoginPage) */}
          <Route path="/" element={user ? <Navigate to="/chats" /> : <HomePage />} />
          {/* If user is logged in, show ChatPage, otherwise navigate to / (login) */}
          <Route
            path="/chats"
            element={user ? <ChatPage /> : <Navigate to="/" replace />}
          />
          {/* Fallback route for any unmatched paths */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </ChatProvider>
      <ToastContainer /> {/* ToastContainer should typically be outside the Providers if possible, but inside is fine */}
    </ThemeProvider>
  );
}

export default App;