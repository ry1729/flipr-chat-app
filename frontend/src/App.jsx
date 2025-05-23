import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './context/AuthContext'; // Custom hook for auth context
import { ChatProvider } from './context/ChatContext'; // Import ChatProvider


function App() {
  const { user } = useAuth(); // Get user from auth context

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/chats" /> : <HomePage />} />
      <Route
        path="/chats"
        element={user ? <ChatPage /> : <Navigate to="/" replace />}
      />
      {/* Add more routes like /profile, /settings etc. */}
      <Route path="*" element={<div>404 Not Found</div>} /> {/* Basic 404 */}
    </Routes>
  );
}

export default App;