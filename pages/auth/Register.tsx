import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { ViewState } from '../../types';
import { Icons } from '../../constants';
import { registerWithEmail, loginWithGoogle } from '../../services/authService';

interface RegisterProps {
  changeView: (view: ViewState) => void;
  onRegister: (userData: { name: string; email: string; password: string }) => Promise<void>;
}

const Register: React.FC<RegisterProps> = ({ changeView, onRegister }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setIsLoading(true);
    try {
      // Start registration process - this will send OTP for email verification
      await onRegister({ name, email, password });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setIsLoading(true);
    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      // Skip OTP for Google Sign-In users
      onRegister({ name: user.name || '', email: user.email || '', password: '' });
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-slate-50 dark:bg-transparent px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <Icons.Leaf />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Create an account</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Join DiaMenu to start your journey towards healthier eating.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input
                id="name" name="name" type="text" autoComplete="name" required
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:border-primary dark:focus:border-accent focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-accent sm:text-sm"
                placeholder="Juan dela Cruz" value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
              <input
                id="email-address" name="email" type="email" autoComplete="email" required
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:border-primary dark:focus:border-accent focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-accent sm:text-sm"
                placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                id="password" name="password" type="password" autoComplete="new-password" required
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:border-primary dark:focus:border-accent focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-accent sm:text-sm"
                placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center">{error}</div>
          )}

          <button type="submit" disabled={isLoading}
            className="group relative flex w-full justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors">
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : 'Create account'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600"></div></div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
          </div>
        </div>

        <div>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError('Google sign-up failed. Please try again.');
              setIsLoading(false);
            }}
            useOneTap
            theme="outline"
            size="large"
            text="signup_with"
            shape="rectangular"
          />
        </div>

        <div className="text-center text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button onClick={() => changeView(ViewState.LOGIN)} className="font-medium text-primary hover:text-teal-700 dark:text-accent dark:hover:text-lime-300">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
