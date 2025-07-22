import React, { useState, useEffect } from 'react';

import AddSaleModal from './AddSaleModal'; // Import the modal
import EditSaleModal from './EditSaleModal'; // Import the edit modal

const Crud = () => {
  const [sales, setSales] = useState([]); // Initialize with empty array
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales');
      const data = await response.json();
      setSales(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const handleAddSale = (addedSale) => {
    setSales([...sales, addedSale]);
  };

  const handleEditClick = (sale) => {
    setSaleToEdit(sale);
    setIsEditModalOpen(true);
  };

  const handleUpdateSale = async (updatedSale) => {
    try {
      const response = await fetch(`/api/sales/${updatedSale.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSale),
      });
      if (response.ok) {
        fetchSales(); // Re-fetch all sales to ensure data consistency
      } else {
        console.error('Failed to update sale:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating sale:', error);
    }
  };

  const handleDeleteSale = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await fetch(`/api/sales/${id}`, {
          method: 'DELETE',
        });
        fetchSales(); // Re-fetch all sales to ensure data consistency
      } catch (error) {
        console.error('Error deleting sale:', error);
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Sales Data</h1>
        <button className="add-btn" onClick={() => setIsModalOpen(true)}>+</button>
      </div>
      <table className="crud-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Table</th>
            <th>Customers</th>
            <th>Buffet Type</th>
            <th>Total Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.id}</td>
              <td>{sale.date}</td>
              <td>{sale.tableNumber}</td>
              <td>{sale.customerCount}</td>
              <td>{sale.buffetType}</td>
              <td>{sale.totalAmount != null ? sale.totalAmount.toLocaleString() : '-'}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => handleEditClick(sale)}>Edit</button>
                <button className="btn btn-danger" onClick={() => handleDeleteSale(sale.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <AddSaleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddSale={handleAddSale} 
      />

      <EditSaleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateSale={handleUpdateSale}
        saleToEdit={saleToEdit}
      />
    </div>
  );
};

export default Crud;