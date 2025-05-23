import React from 'react';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';

function HomePage() {
  const [isLogin, setIsLogin] = React.useState(true); // Toggle between login/register

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
      <h1>Welcome to Flipr Chat!</h1>
      {isLogin ? (
        <Login toggleForm={() => setIsLogin(false)} />
      ) : (
        <Register toggleForm={() => setIsLogin(true)} />
      )}
    </div>
  );
}

export default HomePage;