import React, { useState } from 'react';

export default function AddCarForm({ onClose, onCarAdded }) {
  const [form, setForm] = useState({
    title: '',
    brand: '',
    model: '',
    price: '',
    year: '',
    description: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState(null);
  const [validationMsg, setValidationMsg] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setValidationMsg('');
  };

  const handleFileChange = e => {
    setImageFile(e.target.files[0]);
    setValidationMsg('');
  };

  const validate = () => {
    if (!form.title || !form.brand || !form.model || !form.price || !form.year || !form.description || !imageFile) {
      setValidationMsg('All fields and an image are required.');
      return false;
    }
    if (isNaN(Number(form.price)) || Number(form.price) <= 0) {
      setValidationMsg('Price must be a positive number.');
      return false;
    }
    if (isNaN(Number(form.year)) || Number(form.year) < 1900 || Number(form.year) > new Date().getFullYear()) {
      setValidationMsg('Year must be a valid year.');
      return false;
    }
    setValidationMsg('');
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      formData.append('imageFile', imageFile);
      const response = await fetch('/api/CarListings/upload', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to add car');
      onCarAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="add-car-form-modal">
      <form className="add-car-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <h2>Add Car Listing</h2>
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <input name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} required />
        <input name="model" placeholder="Model" value={form.model} onChange={handleChange} required />
        <input name="price" placeholder="Price" type="number" value={form.price} onChange={handleChange} required />
        <input name="year" placeholder="Year" type="number" value={form.year} onChange={handleChange} required />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
        <input name="imageFile" type="file" accept="image/*" onChange={handleFileChange} required />
        {validationMsg && <div className="error">{validationMsg}</div>}
        <div className="add-car-form-buttons">
          <button type="submit">Add Car</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
} 