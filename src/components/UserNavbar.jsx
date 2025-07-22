import React from 'react';

const UserNavbar = ({ username, toggleSidebar, isCollapsed }) => {
  return (
    <div className="user-navbar">
      <button onClick={toggleSidebar} className="toggle-sidebar-btn">
        {isCollapsed ? '>' : '<'}
      </button>
      <span>Welcome, {username}!</span>
    </div>
  );
};

export default UserNavbar;
