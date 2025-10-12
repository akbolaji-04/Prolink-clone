// src/app/jobs/new/page.jsx
'use client';

import { useState } from 'react';
import api from '../../../lib/api'; // Our smart API client

export default function NewJobPage() {
  // State for the form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: ''
  });

  // Handle changes in the input fields
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const jobData = {
        ...formData,
        job_type: 'digital' // For now, we hardcode it as 'digital'
      };

      // Send data to the backend using our api client
      const response = await api.post('/jobs', jobData);
      alert('Job posted successfully!');
      console.log(response.data);
      // Later, we can redirect the user to the job details page
      // For now, let's clear the form
      setFormData({ title: '', description: '', budget: '' });

    } catch (error) {
      console.error("Failed to post job", error);
      alert('Failed to post job: ' + (error.response?.data?.msg || 'Please try again.'));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Post a New Job</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Job Title</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              placeholder="e.g., I need a logo for my new company"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Job Description</label>
            <textarea
              id="description"
              name="description"
              rows="6"
              required
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              placeholder="Describe your project in detail..."
            />
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700">Budget (₦)</label>
            <input
              id="budget"
              name="budget"
              type="number"
              value={formData.budget}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              placeholder="e.g., 50000"
            />
          </div>

          <div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              Post Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}