import React, { useState, useEffect } from 'react';
import { getAdminUsers, deleteAdminUser, createAdminUser, updateAdminUser, AdminUser } from '../../services/adminService';
import { UserModal } from './UserModal';
import { Icons } from '../../constants';

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteAdminUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleSaveUser = async (userData: Partial<AdminUser>) => {
    if (editingUser) {
      await updateAdminUser(editingUser.id, userData);
    } else {
      await createAdminUser(userData);
    }
    fetchUsers();
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading user management...</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Icons.Check />
            </div>
            User Management
          </h1>
          <p className="text-gray-500 mt-2">Manage system users and access levels.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none w-64 shadow-sm"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icons.User className="w-4 h-4" />
            </div>
          </div>
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-xl shadow-sm hover:shadow-md hover:bg-teal-700 transition"
          >
            <Icons.Plus /> Create User
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-6 shadow-sm">{error}</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <tr>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">ID</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Email</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Joined</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.filter(user => 
                  user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  user.email.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                    <td className="p-4 text-gray-400">{user.id}</td>
                    <td className="p-4 font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.name}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400 font-medium">{user.email}</td>
                    <td className="p-4 text-gray-500">{new Date(user.date_joined).toLocaleDateString()}</td>
                    <td className="p-4">
                      {user.is_superuser ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Admin</span>
                      ) : user.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">Inactive</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => openEditModal(user)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors font-medium">Edit</button>
                        <button onClick={() => handleDelete(user.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">No users found. Create one.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <UserModal 
          user={editingUser} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveUser} 
        />
      )}
    </div>
  );
};

export default AdminUserManagement;
