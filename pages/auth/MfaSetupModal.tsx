import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { mfaService, MfaSetupData } from '../../services/mfaService';
import { Icons } from '../../constants';

interface MfaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDisableMode?: boolean;
}

const MfaSetupModal: React.FC<MfaSetupModalProps> = ({ isOpen, onClose, onSuccess, isDisableMode = false }) => {
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen && !isDisableMode) {
      setFetching(true);
      setError('');
      mfaService.setup()
        .then(data => setSetupData(data))
        .catch(err => setError(err.message))
        .finally(() => setFetching(false));
    } else {
      setSetupData(null);
      setCode('');
      setError('');
    }
  }, [isOpen, isDisableMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (isDisableMode) {
        await mfaService.disable(code);
      } else {
        await mfaService.verifySetup(code);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isDisableMode ? 'Disable Two-Factor Auth' : 'Setup Two-Factor Auth'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {fetching ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {!isDisableMode && setupData && (
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Scan this QR code with your authenticator app (like Google Authenticator or Authy).
                  </p>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <QRCodeSVG value={setupData.otpauth_url} size={200} />
                  </div>
                  <div className="text-xs text-center text-gray-500">
                    <p>Or enter this secret manually:</p>
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 block select-all">
                      {setupData.secret}
                    </code>
                  </div>
                </div>
              )}

              {isDisableMode && (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Please enter a code from your authenticator app to confirm you want to disable two-factor authentication.
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="totp-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enter Verification Code
                  </label>
                  <input
                    id="totp-code"
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full text-center tracking-widest text-2xl px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    placeholder="000000"
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 p-3 rounded-lg text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex justify-center items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    isDisableMode ? 'Disable MFA' : 'Verify and Enable'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MfaSetupModal;
