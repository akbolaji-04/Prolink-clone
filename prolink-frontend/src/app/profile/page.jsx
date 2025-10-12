// src/app/profile/edit/page.jsx
'use client';

import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(true);

  // 1. Fetch the current profile data to pre-fill the form
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profiles/me');
        setFormData({
          fullName: response.data.full_name || '',
          bio: response.data.bio || '',
          phoneNumber: response.data.phone_number || ''
        });
      } catch (error) {
        console.error("Failed to fetch profile", error);
        alert("Could not load your profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 2. Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/profiles/me', formData);
      alert('Profile updated successfully!');
      console.log(response.data);
      // Later, we'll redirect to the dashboard
    } catch (error) {
      console.error("Failed to update profile", error);
      alert('Failed to update profile.');
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Edit Your Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows="4"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}