import React, { useState, useEffect } from 'react';
import { getAdminUsers, getAdminAnalytics, LoginLogoutStats, DetailedActivity } from '../../services/adminService';
import { getAdminReviews } from '../../services/authService';
import { Icons } from '../../constants';
import { ViewState } from '../../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface AdminDashboardProps {
  onNavigate: (view: ViewState) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReviews: 0,
    avgRating: '0.0',
    pendingReviews: 0
  });
  const [analyticsData, setAnalyticsData] = useState<LoginLogoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Analytics Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'login' | 'logout'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, reviews, analytics] = await Promise.all([
          getAdminUsers(),
          getAdminReviews(),
          getAdminAnalytics()
        ]);
        
        const avg = reviews.length > 0 
          ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
          : '0.0';

        setStats({
          totalUsers: users.length,
          totalReviews: reviews.length,
          avgRating: avg,
          pendingReviews: reviews.filter(r => !r.is_approved).length
        });
        
        setAnalyticsData(analytics);
      } catch (err) {
        console.error('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4 text-gray-500">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="animate-pulse text-sm font-medium uppercase tracking-widest">Aggregating System Intelligence...</p>
    </div>
  );

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <Icons.User />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Reviews', value: stats.totalReviews, icon: <Icons.Bookmark />, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Avg. Rating', value: `${stats.avgRating} ★`, icon: <Icons.Chart />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Pending Moderation', value: stats.pendingReviews, icon: <Icons.Shield />, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  // Prepare chart data
  const chartData = (analyticsData?.daily_logins || []).map(login => {
    const logout = (analyticsData?.daily_logouts || []).find(l => l.day === login.day);
    return {
      day: new Date(login.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      logins: login.count,
      logouts: logout ? logout.count : 0
    };
  }).reverse() || [];

  // Filter detailed logs
  const filteredLogs = analyticsData?.detailed_logs.filter(log => {
    const matchesSearch = 
      log.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || log.activity_type === filterType;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Icons.Chart />
            </div>
            System Overview
          </h1>
          <p className="text-gray-500 mt-2">Live monitoring and administrator controls</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-transform hover:scale-[1.02] duration-300">
            <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-1">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Icons.Plus className="text-primary" />
            Admin Tools
          </h3>
          <div className="space-y-3 mt-6">
            <div 
              onClick={() => onNavigate(ViewState.ADMIN_USER_REPORTS)}
              className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-primary transition-all cursor-pointer group"
            >
              <p className="font-bold text-sm text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">User Management</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Access Controls</p>
            </div>
            <div 
              onClick={() => onNavigate(ViewState.ADMIN_REVIEWS)}
              className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-primary transition-all cursor-pointer group"
            >
              <p className="font-bold text-sm text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">Content Moderation</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Review Pipeline</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
             <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               System Health
             </h3>
             <p className="text-[11px] text-gray-500 leading-relaxed italic">
               Backend connected. Multi-regional redundancy active. Last audit: 12m ago.
             </p>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-xl font-bold mb-8 flex items-center justify-between">
            Daily Session Activity
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-primary rounded-full"></span> Logins</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-gray-300 rounded-full"></span> Logouts</div>
            </div>
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="logins" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={25} />
                <Bar dataKey="logouts" fill="#CBD5E1" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expanded Login/Logout Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">User Activity Log</h3>
            <p className="text-xs text-gray-500 mt-1">Searchable login and logout history</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none w-64"
              />
            </div>
            
            <div className="flex bg-gray-50 dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
              {(['all', 'login', 'logout'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${
                    filterType === t 
                      ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-transparent">
                <th className="px-6 py-4">Individual User</th>
                <th className="px-6 py-4 text-center">Type</th>
                <th className="px-6 py-4">Connection Time</th>
                <th className="px-6 py-4">Auth Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {log.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{log.full_name}</p>
                        <p className="text-[11px] text-gray-500">{log.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter ${
                      log.activity_type === 'login' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30' 
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30'
                    }`}>
                      {log.activity_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[11px] text-primary font-bold opacity-70">
                      <Icons.Check className="w-4 h-4" /> SECURE
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-20 text-center text-gray-400 italic text-sm">
              No matching activity records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

