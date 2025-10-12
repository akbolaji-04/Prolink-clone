// src/app/dashboard/portfolio/page.jsx
'use client';

import { useState } from 'react';
import api from '../../../lib/api';

export default function AddPortfolioPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_url_or_link: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/profiles/me/portfolio', formData);
      alert('Portfolio item added successfully!');
      // Clear the form
      setFormData({ title: '', description: '', file_url_or_link: '' });
    } catch (error) {
      console.error("Failed to add portfolio item", error);
      alert('Failed to add item. Please try again.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Add to Your Portfolio</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium">Title</label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium">Description</label>
            <textarea name="description" rows="4" value={formData.description} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/>
          </div>
          <div>
            <label htmlFor="file_url_or_link" className="block text-sm font-medium">Link to Work 🔗 (or image URL)</label>
            <input type="url" name="file_url_or_link" required value={formData.file_url_or_link} onChange={handleChange} className="w-full mt-1 p-2 border rounded" placeholder="https://..."/>
          </div>
          <button type="submit" className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700">Add Item</button>
        </form>
      </div>
    </div>
  );
}