// src/components/Navbar.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // <== IMPORT usePathname
import Link from 'next/link';
import api from '../lib/api';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname(); // <== This hook gets the current URL path

  useEffect(() => {
    const fetchUser = async () => {
      // Check for a token to avoid unnecessary API calls
      let token = null;
      try {
        token = localStorage.getItem('token');
      } catch (err) {
        console.warn('[Navbar] localStorage not available', err);
      }
      if (token) {
        try {
          const response = await api.get('/profiles/me');
          console.log('[Navbar] fetched user', response);
          setUser(response.data);
        } catch (error) {
          // If token is invalid, clear it
          try { localStorage.removeItem('token'); } catch (e) {}
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    fetchUser();
  }, [pathname]); // <== This is the magic: re-run this effect whenever the path changes

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50" style={{background: 'transparent'}}>
      <div className="site-container">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
              <div className="logo-badge">
                <img src="/prolink-logo.svg" alt="ProLink Nigeria" className="h-12 w-auto" />
              </div>
              <span className="sr-only">ProLink Nigeria</span>
            </Link>
            <div className="hidden sm:block">
              <input className="search-input" placeholder="Search jobs, people, projects..." aria-label="Search" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="font-medium">{user.full_name || user.email}</div>
                  <div className="muted text-sm">{user.user_type || ''}</div>
                </div>
                <Link href="/profile/edit">
                  <img className="avatar" src={user.profile_picture_url || '/default-avatar.png'} alt="Profile" />
                </Link>
                <button onClick={handleSignOut} className="btn btn-ghost px-3 py-2 border border-transparent hover:bg-red-50" style={{color: 'var(--danger)'}}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-muted">Login</Link>
                <Link href="/signup" className="btn btn-primary">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}