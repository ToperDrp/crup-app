import React from 'react';

const ChatbotSettings = ({ onClose, showSettings }) => {
  return (
    <div className={`chatbot-settings-card ${showSettings ? 'open' : ''}`}>
      <div className="chatbot-settings-header">
        <h2>Chatbot Settings</h2>
        <button onClick={onClose} className="chatbot-settings-close-btn">×</button>
      </div>
      <div className="chatbot-settings-content">
        <div className="form-group">
          <label className="form-label">Prompt:</label>
          <textarea className="form-input" rows="4" placeholder="Enter initial prompt for the chatbot..."></textarea>
        </div>
        <div className="form-group">
          <label className="form-label">Model:</label>
          <select className="form-select">
            <option value="default">Default Model</option>
            <option value="model-a">Model A</option>
            <option value="model-b">Model B</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">API Key:</label>
          <input type="password" className="form-input" placeholder="Enter your API Key" />
        </div>
        <button className="btn btn-primary">Save Settings</button>
      </div>
    </div>
  );
};

export default ChatbotSettings;
