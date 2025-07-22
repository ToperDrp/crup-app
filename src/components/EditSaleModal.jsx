import React, { useState, useEffect } from 'react';

const EditSaleModal = ({ isOpen, onClose, onUpdateSale, saleToEdit }) => {
  const [formData, setFormData] = useState({}); // Initialize with an empty object

  useEffect(() => {
    if (saleToEdit) {
      setFormData(saleToEdit);
    }
  }, [saleToEdit]);

  if (!isOpen || !saleToEdit) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedSale = {
      ...formData,
      tableNumber: parseInt(formData.tableNumber),
      customerCount: parseInt(formData.customerCount),
      pricePerPerson: parseInt(formData.pricePerPerson),
      totalAmount: parseInt(formData.customerCount) * parseInt(formData.pricePerPerson),
    };
    onUpdateSale(updatedSale);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Sale</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ID</label>
            <input type="text" name="id" value={formData.id || ''} disabled />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date || ''} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Table Number</label>
            <input type="number" name="tableNumber" value={formData.tableNumber || ''} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Customer Count</label>
            <input type="number" name="customerCount" value={formData.customerCount || ''} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Buffet Type</label>
            <select name="buffetType" value={formData.buffetType || 'Standard'} onChange={handleChange}>
              <option value="Standard">Standard (399)</option>
              <option value="Premium">Premium (599)</option>
              <option value="Seafood">Seafood (799)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Payment Method</label>
            <select name="paymentMethod" value={formData.paymentMethod || 'QR Code'} onChange={handleChange}>
              <option value="QR Code">QR Code</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Update</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSaleModal;