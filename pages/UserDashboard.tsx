import React, { useState, useEffect } from 'react';
import { ViewState, BloodSugarLog, PantryItem } from '../types';
import { Icons, APP_NAME } from '../constants';
import { getStoredUser } from '../services/authService';
import { getBloodSugarLogs } from '../services/bloodSugarService';
import { getMealPlan } from '../services/mealPlanService';
import { getPantryItems } from '../services/pantryService';
import { getSavedRecipes } from '../services/authService';

interface UserDashboardProps {
  user: { name?: string; email?: string } | null;
  changeView: (view: ViewState) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, changeView }) => {
  const firstName = user?.name?.split(' ')[0] || 'User';

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{
    latestBloodSugar?: BloodSugarLog;
    todayMeals?: Record<string, string>;
    lowStockCount: number;
    pantryCount: number;
    recentAudit?: { name: string; score: number };
  }>({
    lowStockCount: 0,
    pantryCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [logs, mealPlan, pantry, recipes] = await Promise.allSettled([
          getBloodSugarLogs(),
          getMealPlan(),
          getPantryItems(),
          getSavedRecipes()
        ]);

        const latestLog = logs.status === 'fulfilled' ? logs.value[0] : undefined;
        
        // Find today's meals
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = dayNames[new Date().getDay()];
        const todayMeals = mealPlan.status === 'fulfilled' ? mealPlan.value[todayName] : undefined;

        // Pantry stats
        const pantryItems = pantry.status === 'fulfilled' ? pantry.value : [];
        const lowStock = pantryItems.filter(item => 
          item.quantity.toLowerCase().includes('low') || 
          item.quantity === '1' || 
          item.quantity === '0'
        ).length;

        // Recent Audit
        const savedRecipes = recipes.status === 'fulfilled' ? recipes.value : [];
        const latestRecipe = savedRecipes[0]; 

        setStats({
          latestBloodSugar: latestLog,
          todayMeals: todayMeals,
          lowStockCount: lowStock,
          pantryCount: pantryItems.length,
          recentAudit: latestRecipe ? { name: latestRecipe.title, score: 85 } : undefined // Score is not stored in DB currently, using 85 as mock but real name
        });
      } catch (error) {
        console.error("Dashboard data fetch failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getSugarStatus = (value: number) => {
    if (value < 70) return { label: 'LOW', color: 'text-red-500', bg: 'bg-red-50' };
    if (value > 180) return { label: 'HIGH', color: 'text-orange-500', bg: 'bg-orange-50' };
    return { label: 'NORMAL', color: 'text-emerald-500', bg: 'bg-emerald-50' };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in-up pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {getTimeGreeting()}, <span className="text-primary">{firstName}!</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
            Here's what's happening with your health today.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icons.User />
           </div>
           <div className="pr-4">
              <div className="text-sm font-bold text-gray-900 dark:text-white">{user?.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
           </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Health Stats Snapshot */}
        <div onClick={() => changeView(ViewState.HEALTH_STATS)} className="group cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 h-full flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center">
              <Icons.Chart />
            </div>
            {stats.latestBloodSugar && (
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getSugarStatus(stats.latestBloodSugar.value).bg} ${getSugarStatus(stats.latestBloodSugar.value).color}`}>
                {getSugarStatus(stats.latestBloodSugar.value).label}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Blood Sugar</h3>
          {isLoading ? (
            <div className="h-10 bg-gray-100 animate-pulse rounded-lg w-2/3"></div>
          ) : stats.latestBloodSugar ? (
            <div className="flex flex-col gap-1">
              <div className="text-3xl font-black text-gray-900 dark:text-white">
                {stats.latestBloodSugar.value} <span className="text-sm font-normal text-gray-400">mg/dL</span>
              </div>
              <div className="text-xs text-gray-400">{stats.latestBloodSugar.context} • {stats.latestBloodSugar.time}</div>
            </div>
          ) : (
             <div className="text-sm text-gray-400 italic">No logs found. Start tracking now.</div>
          )}
          <div className="mt-auto pt-6 flex items-center gap-1 text-xs font-bold text-blue-500 group-hover:translate-x-1 transition-transform">
            View Trends <Icons.Plus />
          </div>
        </div>

        {/* Meal Plan Snapshot */}
        <div onClick={() => changeView(ViewState.MEAL_PLAN)} className="group cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 h-full flex flex-col">
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
            <Icons.Calendar />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Today's Menu</h3>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-100 animate-pulse rounded w-full"></div>
              <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4"></div>
            </div>
          ) : stats.todayMeals ? (
            <div className="space-y-1">
              {Object.entries(stats.todayMeals).slice(0, 2).map(([time, meal]) => (
                <div key={time} className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  <span className="font-bold text-orange-500 capitalize">{time}:</span> {meal}
                </div>
              ))}
              {Object.keys(stats.todayMeals).length > 2 && (
                <div className="text-[10px] text-gray-400">+{Object.keys(stats.todayMeals).length - 2} more meals</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic">No meals planned for today.</div>
          )}
          <div className="mt-auto pt-6 flex items-center gap-1 text-xs font-bold text-orange-500 group-hover:translate-x-1 transition-transform">
            Full Planner <Icons.Plus />
          </div>
        </div>

        {/* Pantry Snapshot */}
        <div onClick={() => changeView(ViewState.PANTRY)} className="group cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 h-full flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/20 text-teal-500 rounded-2xl flex items-center justify-center">
              <Icons.Leaf />
            </div>
            {stats.lowStockCount > 0 && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-500">
                {stats.lowStockCount} LOW
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Kitchen Status</h3>
          {isLoading ? (
            <div className="h-10 bg-gray-100 animate-pulse rounded-lg w-1/2"></div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="text-3xl font-black text-gray-900 dark:text-white">
                {stats.pantryCount} <span className="text-sm font-normal text-gray-400">Items</span>
              </div>
              <div className="text-xs text-gray-400">{stats.lowStockCount ? 'Time to restock soon' : 'Pantry is well-stocked'}</div>
            </div>
          )}
          <div className="mt-auto pt-6 flex items-center gap-1 text-xs font-bold text-teal-500 group-hover:translate-x-1 transition-transform">
            Manage Pantry <Icons.Plus />
          </div>
        </div>

        {/* Recent Audit Snapshot */}
        <div onClick={() => changeView(ViewState.AUDITOR)} className="group cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 h-full flex flex-col">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
            <Icons.Check />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Recent AI Audit</h3>
          {isLoading ? (
            <div className="h-10 bg-gray-100 animate-pulse rounded-lg w-full"></div>
          ) : stats.recentAudit ? (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{stats.recentAudit.name}</div>
              <div className="flex items-center gap-2">
                 <div className="flex-grow h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${stats.recentAudit.score}%` }}></div>
                 </div>
                 <span className="text-xs font-bold text-emerald-500">{stats.recentAudit.score}%</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic">No audits performed yet.</div>
          )}
          <div className="mt-auto pt-6 flex items-center gap-1 text-xs font-bold text-emerald-500 group-hover:translate-x-1 transition-transform">
            Audit Dish <Icons.Plus />
          </div>
        </div>
      </div>

      {/* Primary Interaction Area */}
      <div className="bg-gray-900 text-white rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="md:w-3/5 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary-light text-sm font-bold">
               <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
               AI COMPANION LIVE
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Ready to verify <span className="text-primary italic">dinner?</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed font-light">
              Snap a photo or upload a recipe. Your AI assistant will analyze the glycemic impact and suggest healthy Filipino-style swaps instantly.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => changeView(ViewState.AUDITOR)}
                className="px-8 py-4 bg-primary text-white font-black rounded-2xl hover:bg-teal-700 transition-all transform hover:scale-105 shadow-xl uppercase tracking-wider text-sm"
              >
                Scan Now
              </button>
              <button 
                onClick={() => changeView(ViewState.HEALTH_STATS)}
                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl hover:bg-white/20 transition-all text-sm"
              >
                View Detailed Trends
              </button>
            </div>
          </div>
          
          <div className="md:w-1/3 w-full">
             <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 space-y-8">
                <div className="flex justify-between items-center">
                   <h4 className="font-bold text-gray-300">Daily Compliance</h4>
                   <span className="text-primary font-black text-2xl">85%</span>
                </div>
                
                <div className="space-y-4">
                   <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-tighter">
                      <span>Sugar range</span>
                      <span className="text-white">Stable</span>
                   </div>
                   <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-primary" style={{ width: '85%' }}></div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center">Calories</span>
                      <span className="text-xl font-black text-center">1,420</span>
                   </div>
                   <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center">Carbs</span>
                      <span className="text-xl font-black text-center">42g</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
