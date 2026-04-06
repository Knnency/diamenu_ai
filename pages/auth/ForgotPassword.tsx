import React, { useState } from 'react';
import { ViewState } from '../../types';
import { Icons } from '../../constants';
import { requestPasswordReset } from '../../services/authService';

interface ForgotPasswordProps {
  changeView: (view: ViewState) => void;
  onOtpSent: (email: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ changeView, onOtpSent }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      onOtpSent(email); // pass email up so ResetPassword can use it
      setSuccessMessage(`A 6-digit OTP has been sent to ${email}. Check your inbox.`);
      setCooldown(60); // Default cooldown after success
    } catch (err: any) {
      if (err.retryAfter) {
        setCooldown(err.retryAfter);
        setError(err.message || 'Please wait before requesting another code.');
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-slate-50 dark:bg-transparent px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <img src="/diamernu_glass_logo.png" alt="Logo" className="h-24 w-24 object-contain" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
            <input
              id="email-address" name="email" type="email" autoComplete="email" required
              disabled={!!successMessage}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:border-primary dark:focus:border-accent focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-accent sm:text-sm disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500"
              placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center">{error}</div>
          )}
          {successMessage && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg text-center font-medium">
              {successMessage}
            </div>
          )}

          <div>
            {successMessage ? (
              <button
                type="button"
                onClick={() => changeView(ViewState.RESET_PASSWORD)}
                className="group relative flex w-full justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                Enter OTP Code →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || cooldown > 0}
                className="group relative flex w-full justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </span>
                ) : cooldown > 0 ? (
                  `Send OTP in ${cooldown}s`
                ) : (
                  'Send OTP'
                )}
              </button>
            )}
          </div>
        </form>

        {!successMessage && (
          <div className="text-center text-sm">
            <button
              onClick={() => changeView(ViewState.LOGIN)}
              className="font-medium text-primary hover:text-teal-700 dark:text-accent dark:hover:text-lime-300 flex items-center justify-center w-full"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Back to Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
