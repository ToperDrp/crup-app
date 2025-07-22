import React, { useState } from 'react';
import ChatbotSettings from './ChatbotSettings'; // Import the new settings component

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false); // State to control settings card visibility

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const newMessage = { sender: 'user', text: input };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput('');

    // Simulate API call to backend
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      let botReply = data.reply;

      if (data.data && Array.isArray(data.data)) {
        if (data.data.length > 0) {
          const tableHeaders = `
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Table</th>
                <th>Customers</th>
                <th>Buffet</th>
                <th>Price/Person</th>
                <th>Payment</th>
                <th>Total</th>
              </tr>
            </thead>
          `;
          const tableRows = data.data.map(sale => `
            <tr>
              <td>${sale.id}</td>
              <td>${sale.date}</td>
              <td>${sale.tableNumber}</td>
              <td>${sale.customerCount}</td>
              <td>${sale.buffetType}</td>
              <td>${sale.pricePerPerson}</td>
              <td>${sale.paymentMethod}</td>
              <td>${sale.totalAmount}</td>
            </tr>
          `).join('');
          botReply += `<div class="sales-table-container"><table class="sales-table">${tableHeaders}<tbody>${tableRows}</tbody></table></div>`;
        } else {
          botReply += '\nNo sales data available.';
        }
      }
      setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: botReply, isHtml: true }]);
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: 'Error: Could not connect to the chatbot service.' }]);
    }
  };

  return (
    <div className="chatbot-page-layout">
      <div className={`chatbot-container ${showSettings ? 'settings-open' : ''}`}>
        <div className="chatbot-header">
          <h1 className="chatbot-title">Chatbot</h1>
          <button className="chatbot-settings-btn" onClick={() => setShowSettings(!showSettings)}>
            ⚙️
          </button>
        </div>
        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chatbot-message ${msg.sender}`}>
              {msg.isHtml ? <div dangerouslySetInnerHTML={{ __html: msg.text }} /> : msg.text}
            </div>
          ))}
        </div>
        <div className="chatbot-input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            placeholder="Type your command..."
            className="chatbot-input"
          />
          <button onClick={handleSendMessage} className="chatbot-send-btn">Send</button>
        </div>
      </div>
      <ChatbotSettings showSettings={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default Chatbot;