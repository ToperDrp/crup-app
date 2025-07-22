
import React, { useState } from 'react';

const AddSaleModal = ({ isOpen, onClose, onAddSale }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Defaults to today
    tableNumber: '',
    customerCount: '',
    buffetType: 'Standard',
    pricePerPerson: 399,
    paymentMethod: 'QR Code',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newSale = {
      
      ...formData,
      tableNumber: parseInt(formData.tableNumber),
      customerCount: parseInt(formData.customerCount),
      pricePerPerson: parseInt(formData.pricePerPerson),
      totalAmount: parseInt(formData.customerCount) * parseInt(formData.pricePerPerson),
    };
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSale),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const addedSale = await response.json();
      onAddSale(addedSale); // Pass the sale data returned from the server
      onClose(); // Close modal after submission
    } catch (error) {
      console.error('Error adding sale:', error);
      alert('Failed to add sale. Please try again.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Sale</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Table Number</label>
            <input type="number" name="tableNumber" value={formData.tableNumber} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Customer Count</label>
            <input type="number" name="customerCount" value={formData.customerCount} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Buffet Type</label>
            <select name="buffetType" value={formData.buffetType} onChange={handleChange}>
              <option value="Standard">Standard (399)</option>
              <option value="Premium">Premium (599)</option>
              <option value="Seafood">Seafood (799)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Payment Method</label>
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
              <option value="QR Code">QR Code</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSaleModal;
