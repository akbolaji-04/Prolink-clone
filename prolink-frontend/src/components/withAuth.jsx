// src/components/withAuth.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const withAuth = (WrappedComponent) => {
  // This is the component that will be returned
  const AuthComponent = (props) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Check for a token on the client-side
      let token = null;
      try {
        token = localStorage.getItem('token');
      } catch (err) {
        console.warn('[withAuth] localStorage not available', err);
      }
      
      console.log('[withAuth] token=', token);
      if (!token) {
        // If no token is found, redirect to the login page immediately
        router.replace('/login');
      } else {
        // If a token exists, allow the wrapped component to render
        setIsLoading(false);
      }
    }, [router]);

    if (isLoading) {
      // Show a generic loading state while we check for the token
      return <div className="text-center mt-20 text-gray-500">Verifying session...</div>;
    }

    // If everything is fine, render the actual page (e.g., the Dashboard)
    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;
