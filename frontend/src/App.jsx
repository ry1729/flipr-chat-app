import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';

function App() {
  const { user } = useAuth();

  return (
    <>
      <ChatProvider>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/chats" /> : <HomePage />} />
          <Route
            path="/chats"
            element={user ? <ChatPage /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </ChatProvider>
      <ToastContainer />
    </>
  );
}

export default App;