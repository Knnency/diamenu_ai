import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { ViewState } from '../../types';
import { Icons } from '../../constants';
// @ts-ignore
import { loginWithEmail, loginWithGoogle } from '../../services/authService';
import MfaLoginModal from './MfaLoginModal';

interface LoginProps {
  changeView: (view: ViewState) => void;
  onLogin: (user: object) => void;
}

const Login: React.FC<LoginProps> = ({ changeView, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result: any = await loginWithEmail(email, password);
      if (result.mfa_required) {
        setMfaToken(result.mfa_token);
        setShowMfaModal(true);
      } else {
        onLogin(result.user);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setIsLoading(true);
    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Google login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .delay-100 { animation-delay: 100ms; }
          .delay-200 { animation-delay: 200ms; }
          .delay-300 { animation-delay: 300ms; }
          .delay-400 { animation-delay: 400ms; }
          
          .spring-hover {
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
          }
          .spring-hover:hover {
            transform: translateY(-2px) scale(1.01);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          }
          .spring-hover:active {
            transform: translateY(1px) scale(0.98);
          }
        `}
      </style>

      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-900 overflow-hidden">

        {/* Left Side: Brand Story & Abstract Visuals (60%) */}
        <div className="hidden lg:flex w-[60%] relative flex-col justify-center items-start p-16 xl:p-24 overflow-hidden bg-primary/5 dark:bg-primary/10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-screen animate-pulse duration-10000" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-500/20 blur-3xl opacity-40 mix-blend-multiply dark:mix-blend-screen" style={{ animation: "pulse 8s infinite alternate" }} />

          <div className={`relative z-10 max-w-2xl opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <div className="mb-8">
              <img src="/diamernu_glass_logo.png" alt="Logo" className="w-24 h-24 object-contain shadow-2xl shadow-primary/20 rounded-2xl" />
            </div>
            <h1 className="text-5xl xl:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-6">
              Welcome back to <span className="text-primary transparent">DiaMenu.</span>
            </h1>
            <p className="text-lg xl:text-xl text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-xl">
              Sign in to continue accessing your personalized meal plans, comprehensive nutritional audits, and smart insights.
            </p>
          </div>
        </div>

        {/* Right Side: Form (40%) */}
        <div className="w-full lg:w-[40%] flex items-center justify-center p-6 sm:p-12 relative z-10 bg-white dark:bg-gray-800 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-none border-l border-gray-100 dark:border-gray-700">
          <div className="w-full max-w-sm">
            <div className={`mb-8 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
              <div className="lg:hidden mb-6">
                <img src="/diamernu_glass_logo.png" alt="Logo" className="w-16 h-16 object-contain" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Please enter your details to sign in.</p>
            </div>

            <form className={`space-y-5 opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`} onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="group relative">
                  <label htmlFor="email-address" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 transition-colors group-focus-within:text-primary dark:group-focus-within:text-accent">Email address</label>
                  <input
                    id="email-address" name="email" type="email" autoComplete="email" required
                    className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/50 text-gray-900 dark:text-white px-4 py-3 transition-all duration-200 focus:border-primary dark:focus:border-accent focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-accent/20 sm:text-sm hover:border-gray-300 dark:hover:border-gray-500"
                    placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="group relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 transition-colors group-focus-within:text-primary dark:group-focus-within:text-accent">Password</label>
                    <button type="button" onClick={() => changeView(ViewState.FORGOT_PASSWORD)}
                      className="text-xs font-medium text-primary hover:text-teal-700 dark:text-accent dark:hover:text-lime-300 transition-colors bg-transparent border-b border-transparent hover:border-primary dark:hover:border-accent">
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="password" name="password" type="password" autoComplete="current-password" required
                    className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/50 text-gray-900 dark:text-white px-4 py-3 transition-all duration-200 focus:border-primary dark:focus:border-accent focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-accent/20 sm:text-sm hover:border-gray-300 dark:hover:border-gray-500"
                    placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-3 rounded-lg text-center animate-fade-up">
                  {error}
                </div>
              )}

              <button type="submit" disabled={isLoading}
                className="spring-hover relative flex w-full justify-center rounded-lg bg-primary px-4 py-3.5 text-sm font-bold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </button>
            </form>

            <div className={`mt-8 relative opacity-0 ${mounted ? 'animate-fade-up delay-300' : ''}`}>
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className={`mt-6 flex justify-center opacity-0 ${mounted ? 'animate-fade-up delay-400' : ''}`}>
              <div className="spring-hover w-[384px] max-w-full inline-block">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in was cancelled or failed.')}
                  text="signin_with"
                  shape="rectangular"
                  size="large"
                  width="384"
                />
              </div>
            </div>

            <div className={`mt-8 text-center text-sm opacity-0 ${mounted ? 'animate-fade-up delay-400' : ''}`}>
              <p className="text-gray-500 dark:text-gray-400">
                Don't have an account?{' '}
                <button onClick={() => changeView(ViewState.REGISTER)} className="font-semibold text-primary hover:text-teal-700 dark:text-accent dark:hover:text-lime-400 transition-colors bg-transparent border-b border-transparent hover:border-primary dark:hover:border-accent">
                  Sign up for free
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <MfaLoginModal
        isOpen={showMfaModal}
        mfaToken={mfaToken}
        onCancel={() => setShowMfaModal(false)}
        onSuccess={(user) => {
          setShowMfaModal(false);
          onLogin(user);
        }}
      />
    </>
  );
};

export default Login;
