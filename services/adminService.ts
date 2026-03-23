import apiFetch, { safeJson } from './authService';

export interface AdminUser {
    id: number;
    email: string;
    name: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    date_joined: string;
    mfa_enabled: boolean;
    password?: string;
    profile?: any;
}

export const getAdminUsers = async (): Promise<AdminUser[]> => {
    const res = await apiFetch('/api/auth/admin/users/', {
        method: 'GET',
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.detail || 'Failed to fetch admin users.');
    return data.results || data;
};

export const createAdminUser = async (user: Partial<AdminUser>): Promise<AdminUser> => {
    const res = await apiFetch('/api/auth/admin/users/', {
        method: 'POST',
        body: JSON.stringify(user),
    });
    const data = await safeJson(res);
    if (!res.ok) {
        throw new Error(data.detail || Object.values(data).join(' ') || 'Failed to create user.');
    }
    return data;
};

export const updateAdminUser = async (id: number, user: Partial<AdminUser>): Promise<AdminUser> => {
    const res = await apiFetch(`/api/auth/admin/users/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(user),
    });
    const data = await safeJson(res);
    if (!res.ok) {
        throw new Error(data.detail || Object.values(data).join(' ') || 'Failed to update user.');
    }
    return data;
};

export const deleteAdminUser = async (id: number): Promise<void> => {
    const res = await apiFetch(`/api/auth/admin/users/${id}/`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        if (res.status !== 204) {
             const data = await safeJson(res);
             throw new Error(data.detail || 'Failed to delete user.');
        }
    }
};
