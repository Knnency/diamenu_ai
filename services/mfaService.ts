import apiFetch, { safeJson } from './authService';

export interface MfaSetupData {
  secret: string;
  otpauth_url: string;
}

export class MfaService {
  /**
   * Initiates MFA setup and returns the provisioning URL.
   */
  async setup(): Promise<MfaSetupData> {
    const res = await apiFetch('/api/auth/mfa/setup/', { method: 'GET' });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.detail || 'Failed to setup MFA.');
    return data as MfaSetupData;
  }

  /**
   * Verifies the TOTP code to complete MFA setup.
   */
  async verifySetup(code: string): Promise<boolean> {
    const res = await apiFetch('/api/auth/mfa/verify-setup/', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.detail || 'Invalid MFA code for setup.');
    return true;
  }

  /**
   * Disables MFA for the current user.
   */
  async disable(code: string): Promise<boolean> {
    const res = await apiFetch('/api/auth/mfa/disable/', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.detail || 'Failed to disable MFA.');
    return true;
  }

  /**
   * Verifies the MFA code during login.
   * If successful, returns the user data and stores tokens.
   */
  async loginVerify(mfaToken: string, code: string): Promise<any> {
    const res = await apiFetch('/api/auth/mfa/login-verify/', {
      method: 'POST',
      body: JSON.stringify({ mfa_token: mfaToken, code }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.detail || 'Invalid MFA code during login.');
    
    // Dynamically get storeTokens if needed, but we can do it via localStorage similarly to authService
    // or we could export storeTokens from authService.
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data.user;
  }
}

export const mfaService = new MfaService();
