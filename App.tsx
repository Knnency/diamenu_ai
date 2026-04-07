import React, { useState } from 'react';
import Home from './pages/Home';
import Auditor from './pages/Auditor';
import MealPlan from './pages/MealPlan';
import HealthDashboard from './pages/HealthDashboard';
import UserDashboard from './pages/UserDashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Settings from './pages/Settings';
import SavedRecipes from './pages/SavedRecipes';
import Pantry from './pages/Pantry';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReviews from './pages/admin/AdminReviews';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import { AdminLayout } from './pages/admin/AdminLayout';
import TermsAndPolicy from './pages/TermsAndPolicy';
import { ReviewModal, FloatingReviewButton } from './components/ReviewModal';
import OnboardingModal from './components/OnboardingModal';
import { ViewState } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME, Icons } from './constants';
import { logout as authLogout, getStoredUser, sendRegistrationOTP, registerWithEmail } from './services/authService';
import { Toaster } from 'sonner';
import { MealPlanProvider } from './contexts/MealPlanContext';

const App: React.FC = () => {
    const storedUser = getStoredUser();
    const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(!!storedUser);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [user, setUser] = useState<{ name?: string; email?: string; is_superuser?: boolean } | null>(storedUser);
    const [resetEmail, setResetEmail] = useState('');
    const [pendingRegistration, setPendingRegistration] = useState<{ name: string; email: string; password: string } | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    const isAuthView = [
        ViewState.LOGIN,
        ViewState.REGISTER,
        ViewState.VERIFY_OTP,
        ViewState.FORGOT_PASSWORD,
        ViewState.RESET_PASSWORD
    ].includes(currentView);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('theme');
        return savedMode === 'dark' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    React.useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const handleLogin = (userData: object) => {
        setUser(userData as { name?: string; email?: string; is_superuser?: boolean });
        setIsAuthenticated(true);
        setCurrentView(ViewState.DASHBOARD);
    };

    const handleRegistrationStart = async (userData: { name: string; email: string; password: string }) => {
        try {
            // Send OTP for email verification
            await sendRegistrationOTP(userData.email);
            // Store pending registration data
            setPendingRegistration(userData);
            // Navigate to OTP verification
            setCurrentView(ViewState.VERIFY_OTP);
        } catch (err: any) {
            // If OTP sending fails, show error in registration
            throw new Error(err.message || 'Failed to send verification code.');
        }
    };

    const handleRegistrationComplete = async (userData: object) => {
        if (!pendingRegistration) return;

        try {
            // Clear pending registration
            setPendingRegistration(null);
            // Login the user with the returned data
            handleLogin(userData);
        } catch (err: any) {
            // If registration fails, go back to registration form
            setCurrentView(ViewState.REGISTER);
            throw new Error(err.message || 'Registration failed.');
        }
    };

    const handleLogout = async () => {
        await authLogout();
        setUser(null);
        setIsAuthenticated(false);
        setCurrentView(ViewState.HOME);
        setIsLogoutModalOpen(false);
    };

    const handleUserUpdate = () => {
        const updatedUser = getStoredUser();
        if (updatedUser) {
            setUser(updatedUser);
        }
    };

    React.useEffect(() => {
        const handleTriggerLogout = () => {
            setIsLogoutModalOpen(true);
        };
        window.addEventListener('trigger-logout', handleTriggerLogout);
        return () => window.removeEventListener('trigger-logout', handleTriggerLogout);
    }, []);

    const renderView = () => {
        switch (currentView) {
            case ViewState.HOME: return isAuthenticated ? <UserDashboard user={user} changeView={setCurrentView} /> : <Home changeView={setCurrentView} />;
            case ViewState.AUDITOR: return isAuthenticated ? <Auditor /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
            case ViewState.MEAL_PLAN: return isAuthenticated ? <MealPlan changeView={setCurrentView} /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
            case ViewState.DASHBOARD: return isAuthenticated ? <UserDashboard user={user} changeView={setCurrentView} /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
            case ViewState.HEALTH_STATS: return isAuthenticated ? <HealthDashboard /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
            case ViewState.LOGIN: return <Login changeView={setCurrentView} onLogin={handleLogin} />;
            case ViewState.REGISTER: return <Register changeView={setCurrentView} onRegister={handleRegistrationStart} onLogin={handleLogin} />;
            case ViewState.VERIFY_OTP: return <VerifyOTP
                changeView={setCurrentView}
                onVerify={handleRegistrationComplete}
                email={pendingRegistration?.email || ''}
                onResendOTP={() => pendingRegistration ? sendRegistrationOTP(pendingRegistration.email) : Promise.resolve()}
            />;
            case ViewState.FORGOT_PASSWORD: return <ForgotPassword changeView={setCurrentView} onOtpSent={setResetEmail} />;
            case ViewState.RESET_PASSWORD: return <ResetPassword changeView={setCurrentView} email={resetEmail} />;
            case ViewState.SETTINGS: return isAuthenticated ? <Settings onUserUpdate={handleUserUpdate} /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
            case ViewState.SAVED_RECIPES: return isAuthenticated ? <SavedRecipes /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
            case ViewState.PANTRY: return isAuthenticated ? <Pantry /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
            case ViewState.TERMS_POLICY: return <TermsAndPolicy changeView={setCurrentView} />;
            case ViewState.ADMIN_DASHBOARD: return (isAuthenticated && user?.is_superuser) ? <AdminDashboard onNavigate={setCurrentView} /> : <Home changeView={setCurrentView} />;
            case ViewState.ADMIN_USER_REPORTS: return (isAuthenticated && user?.is_superuser) ? <AdminUserManagement /> : <Home changeView={setCurrentView} />;
            case ViewState.ADMIN_REVIEWS: return (isAuthenticated && user?.is_superuser) ? <AdminReviews /> : <Home changeView={setCurrentView} />;
            default: return isAuthenticated ? <Auditor /> : <Home changeView={setCurrentView} />;
        }
    };

    const NavItem = ({ view, label, icon }: { view: ViewState, label: string, icon: any }) => (
        <button
            onClick={() => { setCurrentView(view); setIsMobileMenuOpen(false); }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-500 ease-in-out ${currentView === view ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-accent font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 group'}`}
        >
            {icon}
            <span className={`transition-all duration-500 ease-in-out ${currentView === view ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-xs overflow-hidden'}`}>
                {label}
            </span>
        </button>
    );

    const isAdminView = [ViewState.ADMIN_DASHBOARD, ViewState.ADMIN_USER_REPORTS, ViewState.ADMIN_REVIEWS].includes(currentView);

    return (
        <div className="min-h-screen bg-slate-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-slate-900 dark:bg-none font-sans text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-300">
            {/* Navigation */}
            {!isAuthView && !isAdminView && (
                <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center cursor-pointer" onClick={() => setCurrentView(isAuthenticated ? ViewState.AUDITOR : ViewState.HOME)}>
                                <img src="/diamernu_glass_logo.png" alt="Logo" className="w-12 h-12 mr-3 object-contain" />
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                                    {APP_NAME}
                                </span>
                            </div>

                            {/* Desktop Menu */}
                            <div className="hidden md:flex space-x-2">
                                {isAuthenticated && (
                                    <>
                                        <NavItem view={ViewState.DASHBOARD} label="Home" icon={<Icons.Home />} />
                                        <NavItem view={ViewState.AUDITOR} label="Recipe Auditor" icon={<Icons.Check />} />
                                        <NavItem view={ViewState.HEALTH_STATS} label="Health Stats" icon={<Icons.Chart />} />
                                        <NavItem view={ViewState.SAVED_RECIPES} label="Saved" icon={<Icons.Bookmark />} />
                                        <NavItem view={ViewState.MEAL_PLAN} label="Meal Plan" icon={<Icons.Calendar />} />
                                        <NavItem view={ViewState.PANTRY} label="Pantry" icon={<Icons.ShoppingBag />} />

                                        {user?.is_superuser && (
                                            <NavItem view={ViewState.ADMIN_DASHBOARD} label="Admin" icon={<Icons.Shield />} />
                                        )}
                                        <NavItem view={ViewState.SETTINGS} label="Settings" icon={<Icons.User />} />
                                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2 self-center"></div>
                                    </>
                                )}

                                <button
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className="p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-accent transition-colors focus:outline-none self-center"
                                    aria-label="Toggle Dark Mode"
                                >
                                    {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
                                </button>

                                {!isAuthenticated ? (
                                    <button
                                        onClick={() => setCurrentView(ViewState.LOGIN)}
                                        className="ml-2 px-6 py-2 rounded-lg bg-primary text-white hover:bg-teal-700 font-bold transition-colors shadow-sm hover:shadow-md uppercase text-sm tracking-wide self-center"
                                    >
                                        Get Started
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsLogoutModalOpen(true)}
                                        className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-all duration-500 ease-in-out"
                                    >
                                        Log out
                                    </button>
                                )}
                            </div>

                            {/* Mobile Menu Button & Dark Mode Toggle */}
                            <div className="md:hidden flex items-center space-x-2">
                                <button
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className="p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-accent transition-colors focus:outline-none"
                                    aria-label="Toggle Dark Mode"
                                >
                                    {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
                                </button>
                                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu Dropdown */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 space-y-2 shadow-lg">
                            {isAuthenticated && (
                                <>
                                    <NavItem view={ViewState.DASHBOARD} label="Home" icon={<Icons.Home />} />
                                    <NavItem view={ViewState.AUDITOR} label="Recipe Auditor" icon={<Icons.Check />} />
                                    <NavItem view={ViewState.HEALTH_STATS} label="Health Stats" icon={<Icons.Chart />} />
                                    <NavItem view={ViewState.SAVED_RECIPES} label="Saved" icon={<Icons.Bookmark />} />
                                    <NavItem view={ViewState.MEAL_PLAN} label="Meal Plan" icon={<Icons.Calendar />} />
                                    <NavItem view={ViewState.PANTRY} label="Pantry" icon={<Icons.ShoppingBag />} />

                                    {user?.is_superuser && (
                                        <NavItem view={ViewState.ADMIN_DASHBOARD} label="Admin" icon={<Icons.Shield />} />
                                    )}
                                    <NavItem view={ViewState.SETTINGS} label="Settings" icon={<Icons.User />} />
                                </>
                            )}

                            <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-2">
                                {!isAuthenticated ? (
                                    <button
                                        onClick={() => { setCurrentView(ViewState.LOGIN); setIsMobileMenuOpen(false); }}
                                        className="w-full text-center px-4 py-3 rounded-xl bg-primary text-white hover:bg-teal-700 font-bold uppercase tracking-wide shadow-sm"
                                    >
                                        Get Started
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { setIsLogoutModalOpen(true); setIsMobileMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium"
                                    >
                                        Log out
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </nav>
            )}

            {/* Main Content */}
            {isAdminView ? (
                <AdminLayout
                    user={user}
                    currentView={currentView}
                    onNavigate={setCurrentView}
                    onLogout={() => setIsLogoutModalOpen(true)}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                >
                    {renderView()}
                </AdminLayout>
            ) : (
            <MealPlanProvider>
                <main className={isAuthView ? "flex-1 w-full relative" : "flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
                    {isAuthView && (
                        <button
                            onClick={() => setCurrentView(ViewState.HOME)}
                            className="absolute top-6 left-6 lg:left-8 z-[60] flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            <span className="font-medium text-sm">Back</span>
                        </button>
                    )}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentView}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        >
                            {renderView()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </MealPlanProvider>
            )}

            {/* Footer */}
            {!isAuthView && !isAdminView && (
                <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
                            {/* Brand Section */}
                            <div className="col-span-1 md:col-span-1 space-y-4">
                                <div className="flex items-center cursor-pointer" onClick={() => setCurrentView(ViewState.HOME)}>
                                    <img src="/diamernu_glass_logo.png" alt="Logo" className="w-10 h-10 mr-3 object-contain" />
                                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                                        {APP_NAME}
                                    </span>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
                                    Empowering individuals to manage diabetes with AI-driven recipe auditing and smart meal planning.
                                </p>
                            </div>

                            {/* App Links */}
                            <div className="col-span-1">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-5">Features</h4>
                                <ul className="space-y-3">
                                    <li>
                                        <button onClick={() => setCurrentView(ViewState.AUDITOR)} className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors text-sm">
                                            Recipe Auditor
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={() => setCurrentView(ViewState.MEAL_PLAN)} className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors text-sm">
                                            Meal Planner
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={() => setCurrentView(ViewState.PANTRY)} className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors text-sm">
                                            Smart Pantry
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            {/* Resources */}
                            <div className="col-span-1">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-5">Support</h4>
                                <ul className="space-y-3">
                                    <li>
                                        <button onClick={() => setCurrentView(ViewState.HOME)} className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors text-sm">
                                            Help Center
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={() => setCurrentView(ViewState.SETTINGS)} className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors text-sm">
                                            Profile Settings
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            {/* Legal */}
                            <div className="col-span-1">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-5">Legal</h4>
                                <ul className="space-y-3">
                                    <li>
                                        <button
                                            onClick={() => setCurrentView(ViewState.TERMS_POLICY)}
                                            className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors text-sm font-medium"
                                        >
                                            Terms & Privacy Policy
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-center md:text-left space-y-1">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    © {new Date().getFullYear()} {APP_NAME}. Designed for Impact.
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Not a substitute for professional medical advice. Always consult your doctor.
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-primary dark:hover:bg-emerald-900/30 transition-all cursor-pointer">
                                    <Icons.Leaf />
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            )}

            {/* Logout Confirmation Modal */}
            {isLogoutModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                        <div className="p-6">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Logout</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Are you sure you want to log out? You will need to sign in again to access your saved recipes and meal plans.
                            </p>
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-3">
                            <button
                                onClick={() => setIsLogoutModalOpen(false)}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Onboarding Modal - Forces setup for unconfigured users */}
            {isAuthenticated && <OnboardingModal />}

            {/* Review Modal */}
            {isAuthenticated && !isAdminView && (
                <>
                    <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />
                    <FloatingReviewButton onClick={() => setIsReviewModalOpen(!isReviewModalOpen)} isOpen={isReviewModalOpen} />
                </>
            )}

            <Toaster position="top-right" richColors />
        </div>
    );
};

export default App;