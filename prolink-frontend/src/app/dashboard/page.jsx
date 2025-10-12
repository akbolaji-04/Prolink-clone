// src/app/dashboard/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import withAuth from '../../components/withAuth'; // Import our new "security gate"

function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // This useEffect is now much simpler. It ONLY runs if withAuth lets it.
  useEffect(() => {
    const fetchProfile = async () => {
      let timeoutId;
      try {
        console.log('[Dashboard] starting fetchProfile, token=', typeof window !== 'undefined' ? localStorage.getItem('token') : null);

        // Create a timeout so a hanging network request doesn't leave the UI stuck.
        const fetchPromise = api.get('/profiles/me');
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('timeout')), 10000);
        }); // 10s
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        if (timeoutId) clearTimeout(timeoutId);
        console.log('[Dashboard] fetchProfile response:', response);
        setProfile(response.data);
      } catch (err) {
        console.error('[Dashboard] Failed to fetch profile', err);
        // Save the error so the UI can show helpful details
        setError(err?.message || String(err));
        // The HOC will handle auth errors, so this is for other issues.
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // small helper to decode JWT payload client-side without verification (dev-only)
  const decodeJwt = (token) => {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = parts[1];
      // atob is available in the browser
      const json = decodeURIComponent(
        atob(payload)
          .split('')
          .map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  };

  const handleRetry = () => {
    // simple way to re-run the effect: bump attempt and re-run the fetch
    setLoading(true);
    setError(null);
    setAttempt(a => a + 1);
    // Re-run fetchProfile manually
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        console.log('[Dashboard] retry fetchProfile token=', token);
        const response = await api.get('/profiles/me');
        setProfile(response.data);
      } catch (err) {
        console.error('[Dashboard] retry Failed to fetch profile', err);
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    })();
  };

  // Show loading only while fetching. If loading finished but there's no profile,
  // render a small debug block to help diagnose the blank screen issue.
  if (loading) {
    return <div className="text-center mt-20 text-gray-500">Loading Dashboard...</div>;
  }

  if (!profile) {
    // Show some helpful debug information in dev so we can see token state and provide a fallback
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const decoded = token ? decodeJwt(token) : null;

    // If we can decode a payload, offer a minimal fallback dashboard so the UI isn't blank.
    const fallbackProfile = decoded && (decoded.user || decoded) ? {
      email: decoded.user?.email || decoded.email || '(no-email)',
      full_name: decoded.user?.full_name || decoded.full_name || '',
      user_type: decoded.user?.user_type || decoded.user_type || 'client',
      id: decoded.user?.id || decoded.id || null,
    } : null;

    if (fallbackProfile && !error) {
      // if there's a decoded fallback and there isn't an explicit error, optimistically render
      return (
        <div className="min-h-screen p-4 sm:p-8">
          <div className="site-container">
            <div className="card p-6 text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard (Offline - fallback)</h1>
              <p className="mb-4 muted">You're currently offline or the API is not responding. Showing cached profile data.</p>
              <div className="space-y-3">
                <p><strong>Email:</strong> {fallbackProfile.email}</p>
                <p><strong>Full Name:</strong> {fallbackProfile.full_name || 'Not set'}</p>
                <p><strong>Account Type:</strong> <span className="capitalize font-medium">{fallbackProfile.user_type}</span></p>
              </div>
              <div className="mt-6">
                <button onClick={handleRetry} className="btn btn-primary">Retry</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center mt-20 text-gray-500">
        <p>{error ? `Error fetching profile: ${error}` : 'No profile data was returned.'}</p>
        <div className="mt-4 bg-white inline-block p-4 rounded text-left">
          <strong>Debug</strong>
          <pre className="mt-2">{JSON.stringify({ token, error }, null, 2)}</pre>
          <div className="mt-3">
            <button onClick={handleRetry} className="px-3 py-2 bg-indigo-600 text-white rounded">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Dashboard Content ---
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="site-container">
        <div className="card">
          <div className="card-body">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome back{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋</h1>
            <p className="muted mb-4">Here's a quick overview of your account.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat">
                <div className="text-sm muted">Account</div>
                <div className="font-semibold">{profile.email}</div>
              </div>
              <div className="stat">
                <div className="text-sm muted">Role</div>
                <div className="font-semibold capitalize">{profile.user_type}</div>
              </div>
              <div className="stat">
                <div className="text-sm muted">Member ID</div>
                <div className="font-semibold">{profile.id}</div>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard/messages" className="block w-full p-4 card hover:shadow-lg" style={{background: 'linear-gradient(180deg, rgba(16,185,129,0.08), rgba(16,185,129,0.04))'}}>
                <div className="font-bold text-lg">My Messages 📩</div>
                <div className="text-sm muted">View all your conversations.</div>
              </Link>
              <Link href="/profile/edit" className="block w-full p-4 card hover:shadow-lg" style={{background: 'linear-gradient(180deg, rgba(79,70,229,0.08), rgba(79,70,229,0.04))'}}>
                <div className="font-bold text-lg">Edit Profile ✏️</div>
                <div className="text-sm muted">Update your personal details.</div>
              </Link>
              {profile.user_type === 'provider' && (
                <>
                  <Link href="/dashboard/portfolio" className="block w-full p-4 card hover:shadow-lg" style={{background: 'linear-gradient(180deg, rgba(124,58,237,0.06), rgba(124,58,237,0.03))'}}>
                    <div className="font-bold text-lg">Add to Portfolio 🖼️</div>
                    <div className="text-sm muted">Showcase your best work.</div>
                  </Link>
                  <Link href="/jobs" className="block w-full p-4 card hover:shadow-lg" style={{background: 'linear-gradient(180deg, rgba(55,65,81,0.06), rgba(55,65,81,0.03))'}}>
                    <div className="font-bold text-lg">Browse Jobs 🔍</div>
                    <div className="text-sm muted">See all available projects.</div>
                  </Link>
                </>
              )}
              {profile.user_type === 'client' && (
                <>
                  <Link href="/jobs/new" className="block w-full p-4 card hover:shadow-lg" style={{background: 'linear-gradient(180deg, rgba(239,68,68,0.06), rgba(239,68,68,0.03))'}}>
                    <div className="font-bold text-lg">Post a New Job 📝</div>
                    <div className="text-sm muted">Find the perfect talent.</div>
                  </Link>
                  <Link href="/dashboard/my-jobs" className="block w-full p-4 card hover:shadow-lg" style={{background: 'linear-gradient(180deg, rgba(17,24,39,0.06), rgba(17,24,39,0.03))'}}>
                    <div className="font-bold text-lg">My Posted Jobs 📋</div>
                    <div className="text-sm muted">View and manage your job posts.</div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==> THE FINAL FIX: Wrap the page in our new security gate <==
export default withAuth(DashboardPage);

