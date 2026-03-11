import React, { useState } from 'react';
import { ViewState } from '../../types';
import { Icons } from '../../constants';
import { verifyRegistrationOTP, sendRegistrationOTP } from '../../services/authService';

interface VerifyOTPProps {
  changeView: (view: ViewState) => void;
  onVerify: (userData: object) => void;
  email: string;
  onResendOTP?: () => Promise<void>;
}

const VerifyOTP: React.FC<VerifyOTPProps> = ({ changeView, onVerify, email, onResendOTP }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (otp.length < 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setIsLoading(true);

    try {
      const userData = await verifyRegistrationOTP(email, otp);
      onVerify(userData);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage('');
    setError('');
    
    try {
      if (onResendOTP) {
        await onResendOTP();
      } else {
        await sendRegistrationOTP(email);
      }
      setResendMessage('A new verification code has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <Icons.Check />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a 6-digit verification code to your email address. Please enter it below to complete your registration.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                maxLength={6}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm text-center tracking-widest font-mono text-lg"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow digits
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg text-center">
              {error}
            </div>
          )}

          {resendMessage && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded-lg text-center">
              {resendMessage}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <p className="text-gray-600">
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={isResending}
              className="font-medium text-primary hover:text-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          </p>
        </div>
        
        <div className="text-center text-sm mt-4">
          <button
            onClick={() => changeView(ViewState.REGISTER)}
            className="font-medium text-gray-500 hover:text-gray-700 flex items-center justify-center w-full"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
