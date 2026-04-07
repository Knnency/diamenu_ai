import React, { useState, useEffect } from 'react';
import { AdminUser } from '../../services/adminService';
import { getMediaUrl } from '../../utils/urlUtils';
import { Icons } from '../../constants';

interface UserModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onSave: (user: FormData | Partial<AdminUser>) => Promise<void>;
}

export const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<AdminUser>>({
    name: '',
    email: '',
    password: '',
    is_active: true,
    is_superuser: false,
    is_staff: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removePicture, setRemovePicture] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        is_active: user.is_active,
        is_superuser: user.is_superuser,
        is_staff: user.is_staff
      });
      setPreviewUrl(user.profile_picture ? getMediaUrl(user.profile_picture) : null);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validation: 2MB limit
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }
      // Validation: Format
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        setError('Only JPG, PNG and WEBP are supported');
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setRemovePicture(false);
      setError('');
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemovePicture(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = new FormData();
      if (formData.name) data.append('name', formData.name);
      if (formData.email) data.append('email', formData.email);
      if (formData.password) data.append('password', formData.password);
      data.append('is_active', String(formData.is_active));
      data.append('is_superuser', String(formData.is_superuser));
      data.append('is_staff', String(formData.is_staff));
      
      if (selectedFile) {
        data.append('profile_picture', selectedFile);
      } else if (removePicture) {
        data.append('remove_profile_picture', 'true');
      }

      await onSave(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold">{user ? 'Edit User' : 'Create User'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
          
          <div className="flex flex-col items-center space-y-4 py-2">
            <div className="relative group">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 border-4 border-dashed border-gray-200 dark:border-gray-600">
                  <Icons.User className="w-10 h-10" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                <Icons.Plus className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
              {(previewUrl || selectedFile) && (
                <button 
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                  title="Remove Image"
                >
                  <Icons.Close className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center">
              Max size 2MB. JPG, PNG, or WEBP.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input 
              type="text" 
              required 
              value={formData.name || ''} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              required 
              value={formData.email || ''} 
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password {user && '(Leave blank to keep same)'}</label>
            <input 
              type="password" 
              required={!user}
              value={formData.password || ''} 
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="active"
              checked={formData.is_active} 
              onChange={e => setFormData({...formData, is_active: e.target.checked})}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="active" className="text-sm font-medium">Active</label>
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="superuser"
              checked={formData.is_superuser} 
              onChange={e => setFormData({...formData, is_superuser: e.target.checked})}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="superuser" className="text-sm font-medium">Super Admin</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-primary hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
