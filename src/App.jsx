
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import Settings from './components/Settings';
import Crud from './components/Crud';
import Login from './components/Login';
import Register from './components/Register'; // Import Register
import Chatbot from './components/Chatbot'; // Import Chatbot
import UserNavbar from './components/UserNavbar'; // Import UserNavbar
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const storedLoginStatus = localStorage.getItem('isLoggedIn');
    return storedLoginStatus === 'true';
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || '';
  });
  const [isCollapsed, setIsCollapsed] = useState(false); // Add isCollapsed state

  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setUsername(user);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', user); // Store username in localStorage
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username'); // Remove username from localStorage
  };

  const toggleSidebar = () => { // Add toggleSidebar function
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Router>
      <div className="app-container">
        {isLoggedIn && (
          <>
            <Sidebar onLogout={handleLogout} isCollapsed={isCollapsed} />
            <div className="main-content">
              <UserNavbar username={username} toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />
              <div className="page-content">
                <Routes>
                  <Route
                    path="/"
                    element={isLoggedIn ? <Home /> : <Navigate to="/login" replace />}
                  />
                  <Route
                    path="/settings"
                    element={isLoggedIn ? <Settings /> : <Navigate to="/login" replace />}
                  />
                  <Route
                    path="/crud"
                    element={isLoggedIn ? <Crud /> : <Navigate to="/login" replace />}
                  />
                  <Route
                    path="/chatbot"
                    element={isLoggedIn ? <Chatbot /> : <Navigate to="/login" replace />}
                  />
                </Routes>
              </div>
            </div>
          </>
        )}
        {!isLoggedIn && (
          <div className="auth-container">
            <Routes>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
