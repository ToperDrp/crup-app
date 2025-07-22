import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Sidebar = ({ onLogout, isCollapsed }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {!isCollapsed && <h2 className="sidebar-title">Menu</h2>}
      <ul className="sidebar-menu">
        <li>
          <Link to="/" className="sidebar-menu-item">
            {!isCollapsed && "Home"}
          </Link>
        </li>
        <li>
          <Link to="/chatbot" className="sidebar-menu-item">
            {!isCollapsed && "Chatbot"}
          </Link>
        </li>
        <li>
          <Link to="/crud" className="sidebar-menu-item">
            {!isCollapsed && "Manage Data"}
          </Link>
        </li>
        <li>
          <Link to="/settings" className="sidebar-menu-item">
            {!isCollapsed && "Settings"}
          </Link>
        </li>
        </ul>
      <button onClick={handleLogout} className="sidebar-logout-btn">
        {!isCollapsed && "Logout"}
      </button>
    </div>
  );
};

export default Sidebar;