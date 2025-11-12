import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SharedLayout from '@/components/SharedLayout';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      // Handle OAuth error
      setError(getErrorMessage(errorParam));
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      return;
    }

    if (token) {
      // Store the JWT token
      localStorage.setItem('authToken', token);
      
      // Redirect to dashboard or home
      navigate('/');
    } else {
      setError('No authentication token received');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [searchParams, navigate]);

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'google_auth_failed':
        return 'Google authentication failed. Please try again.';
      case 'github_auth_failed':
        return 'GitHub authentication failed. Please try again.';
      case 'auth_failed':
        return 'Authentication failed. Please try again.';
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <SharedLayout>
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          {error ? (
            <>
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
              <p className="text-gray-600 mb-4">{error}</p>
              <p className="text-sm text-gray-500">Redirecting to login page...</p>
            </>
          ) : (
            <>
              <div className="text-blue-500 text-5xl mb-4">🔄</div>
              <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
              <p className="text-gray-600">Please wait while we complete your login.</p>
              <div className="mt-6">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
              </div>
            </>
          )}
        </div>
      </div>
    </SharedLayout>
  );
};

export default AuthCallback;
