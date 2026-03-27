import React from 'react';
import { Icons, APP_NAME } from '../../constants';
import { ViewState } from '../../types';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: { name?: string; email?: string } | null;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  user,
  currentView,
  onNavigate,
  onLogout,
  isDarkMode,
  onToggleDarkMode
}) => {
  const sidebarItems = [
    { view: ViewState.ADMIN_DASHBOARD, label: 'Overview', icon: <Icons.Chart /> },
    { view: ViewState.ADMIN_USER_REPORTS, label: 'User Reports', icon: <Icons.Check /> },
    { view: ViewState.ADMIN_REVIEWS, label: 'Customer Reviews', icon: <Icons.Bookmark /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-teal-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            D
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            {APP_NAME} <span className="text-xs font-normal text-primary">Admin</span>
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                currentView === item.view
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-accent shadow-sm font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
            <button
               onClick={() => onNavigate(ViewState.HOME)}
               className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
            >
                <span className="text-xl"><Icons.Logout /></span>
                <span className="font-medium">Exit Admin</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@diamenu.online'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-8 z-10">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {sidebarItems.find(i => i.view === currentView)?.label || 'Dashboard'}
          </h2>
          
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleDarkMode}
              className="p-2.5 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-accent bg-gray-100 dark:bg-gray-700 rounded-xl transition-all"
            >
              {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-none">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
