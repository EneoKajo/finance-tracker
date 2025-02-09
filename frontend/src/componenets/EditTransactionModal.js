import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/TransactionModal.css";
import { Edit } from 'lucide-react';


const incomeCategories = ["salary", "freelance", "investment", "other"];

const categories = [
  "food",
  "bills",
  "transportation",
  "entertainment",
  "testing",
];
const transactionTypes = ["income", "outcome"];

const EditTransactionModal = ({
  isOpen,
  onClose,
  transaction,
  onTransactionUpdate,
}) => {
  const [type, setType] = useState("income"); // Default to 'income'
  const [amount, setAmount] = useState(""); // Default to empty string
  const [description, setDescription] = useState(""); // Default to empty string
  const [category, setCategory] = useState(""); // Default to empty string
  const [error, setError] = useState("");
  const [isChanged, setIsChanged] = useState(false);

  // Set initial state from transaction prop
  useEffect(() => {
    if (transaction) {
      setType(transaction.type || "income");
      setAmount(Math.abs(transaction.amount || 0).toString());
      setDescription(transaction.description || "");
      setCategory(transaction.category || "");
    }
  }, [transaction]);

  // Check if any field has changed
  useEffect(() => {
    if (transaction) {
      const hasChanged =
        type !== transaction.type ||
        Math.abs(parseFloat(amount || 0)) !== Math.abs(transaction.amount) ||
        description !== transaction.description ||
        category !== transaction.category;
      setIsChanged(hasChanged);
    }
  }, [amount, description, category, type, transaction]);

  if (!isOpen || !transaction) return null; // Only render if transaction is available

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        const token = localStorage.getItem("authToken");
        const axiosInstance = axios.create({
          baseURL: "http://localhost:5000",
          headers: { Authorization: `Bearer ${token}` },
        });

        await axiosInstance.delete(`/delete-transaction/${transaction.id}`);
        onTransactionUpdate();
        onClose();
      } catch (error) {
        setError(error.response?.data?.error || "Failed to delete transaction");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isChanged) return;

    try {
      const token = localStorage.getItem("authToken");
      const axiosInstance = axios.create({
        baseURL: "http://localhost:5000",
        headers: { Authorization: `Bearer ${token}` },
      });

      await axiosInstance.put(`/edit-transaction/${transaction.id}`, {
        amount,
        type,
        description,
        category,
      });

      onTransactionUpdate();
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || "Failed to update transaction");
    }
  };

  const getCategoryOptions = () => {
    return type === "income" ? incomeCategories : categories;
  };


  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>
          <Edit style={{ marginBottom: "6px" }} size={20} className="modal-title-icon" />
          Edit Transaction
        </h2>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {getCategoryOptions().map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              {transactionTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`edit-btn ${!isChanged ? "disabled" : ""}`}
              disabled={!isChanged}
            >
              Update
            </button>
            <button type="button" className="delete-btn" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;