// src/app/profiles/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../lib/api';

export default function ProfilePage() {
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null); // One state for all profile data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchProfile = async () => {
        try {
          // The API now returns a single, combined object in one trip
          const response = await api.get(`/profiles/${id}`);
          setProfileData(response.data);
        } catch (error) {
          console.error("Failed to fetch profile", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [id]);

  if (loading) return <div className="text-center mt-20">Loading profile...</div>;
  if (!profileData) return <div className="text-center mt-20">Profile not found.</div>;

  // Destructure the single data object for easier access in JSX
  const { full_name, bio, profile_picture_url, portfolio } = profileData;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md border">
        {/* Profile Header */}
        <div className="flex items-center space-x-6">
          <img className="w-24 h-24 rounded-full object-cover" src={profile_picture_url || '/default-avatar.png'} alt={full_name} />
          <div>
            <h1 className="text-3xl font-bold">{full_name || 'ProLink User'}</h1>
            <p className="text-gray-600">Service Provider</p>
          </div>
        </div>

        <hr className="my-6" />

        {/* About Me Section */}
        <div>
          <h2 className="text-xl font-semibold mb-2">About Me</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{bio || 'No bio yet.'}</p>
        </div>

        <hr className="my-6" />

        {/* Portfolio Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Portfolio 🖼️</h2>
          {portfolio && portfolio.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {portfolio.map(item => (
                <a key={item.id} href={item.file_url_or_link} target="_blank" rel="noopener noreferrer" className="border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-indigo-600">{item.title}</h3>
                    <p className="text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No portfolio items have been added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
