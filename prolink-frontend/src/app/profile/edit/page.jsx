// src/app/profile/edit/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Make sure this is imported
import axios from 'axios';
import api from '../../../lib/api';

// IMPORTANT: Double-check these details from your Cloudinary dashboard.
// I noticed a space at the end of your preset name, which might be a typo.
const CLOUDINARY_CLOUD_NAME = 'dtv41sa4b';
const CLOUDINARY_UPLOAD_PRESET = 'y3p7gfda'; // Removed the trailing space

export default function EditProfilePage() {
    const router = useRouter(); // Initialize the router
    const [formData, setFormData] = useState({ fullName: '', bio: '', phoneNumber: '' });
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

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
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleImageChange = (e) => setProfileImageFile(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            let imageUrl = null;
            if (profileImageFile) {
                const uploadData = new FormData();
                uploadData.append('file', profileImageFile);
                uploadData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const response = await axios.post(
                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                    uploadData
                );
                imageUrl = response.data.secure_url;
            }

            if (imageUrl) {
                await api.put('/profiles/me/picture', { profile_picture_url: imageUrl });
            }

            await api.put('/profiles/me', formData);
            alert('Profile updated successfully!');
            router.push('/dashboard'); // <-- THIS IS THE NEW LINE THAT REDIRECTS

        } catch (error) {
            console.error("Failed to update profile", error);
            alert('Failed to update profile. Check your Cloudinary details.');
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center">Edit Your Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium">Profile Picture</label>
                        <input
                            type="file"
                            onChange={handleImageChange}
                            accept="image/*"
                            className="w-full mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                    </div>
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium">Full Name</label>
                        <input id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium">Bio</label>
                        <textarea id="bio" name="bio" rows="4" value={formData.bio} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium">Phone Number</label>
                        <input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <button
                        type="submit"
                        disabled={isUploading}
                        className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                        {isUploading ? 'Updating...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}
