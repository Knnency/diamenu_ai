import React, { useState } from 'react';
import Home from './pages/Home';
import Auditor from './pages/Auditor';
import MealPlan from './pages/MealPlan';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Settings from './pages/Settings';
import SavedRecipes from './pages/SavedRecipes';
import OnboardingModal from './components/OnboardingModal';
import { ViewState } from './types';
import { APP_NAME, Icons } from './constants';
import { logout as authLogout, getStoredUser, sendRegistrationOTP, registerWithEmail } from './services/authService';
import { Toaster } from 'sonner';

const App: React.FC = () => {
    const storedUser = getStoredUser();
    const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(!!storedUser);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [user, setUser] = useState<{ name?: string; email?: string } | null>(storedUser);
    const [resetEmail, setResetEmail] = useState('');
    const [pendingRegistration, setPendingRegistration] = useState<{ name: string; email: string; password: string } | null>(null);

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
        setUser(userData as { name?: string; email?: string });
        setIsAuthenticated(true);
        setCurrentView(ViewState.AUDITOR);
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

    const handleLogout = () => {
        authLogout();
        setUser(null);
        setIsAuthenticated(false);
        setCurrentView(ViewState.HOME);
        setIsLogoutModalOpen(false);
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
            case ViewState.HOME: return isAuthenticated ? <Auditor /> : <Home changeView={setCurrentView} />;
            case ViewState.AUDITOR: return isAuthenticated ? <Auditor /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
            case ViewState.MEAL_PLAN: return isAuthenticated ? <MealPlan changeView={setCurrentView} /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
            case ViewState.PROFILE: return isAuthenticated ? <Dashboard /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
            case ViewState.LOGIN: return <Login changeView={setCurrentView} onLogin={handleLogin} />;
            case ViewState.REGISTER: return <Register changeView={setCurrentView} onRegister={handleRegistrationStart} />;
            case ViewState.VERIFY_OTP: return <VerifyOTP 
                changeView={setCurrentView} 
                onVerify={handleRegistrationComplete} 
                email={pendingRegistration?.email || ''}
                onResendOTP={() => pendingRegistration ? sendRegistrationOTP(pendingRegistration.email) : Promise.resolve()}
            />;
            case ViewState.FORGOT_PASSWORD: return <ForgotPassword changeView={setCurrentView} onOtpSent={setResetEmail} />;
            case ViewState.RESET_PASSWORD: return <ResetPassword changeView={setCurrentView} email={resetEmail} />;
            case ViewState.SETTINGS: return isAuthenticated ? <Settings /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
            case ViewState.SAVED_RECIPES: return isAuthenticated ? <SavedRecipes /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
            default: return isAuthenticated ? <Auditor /> : <Home changeView={setCurrentView} />;
        }
    };

    const NavItem = ({ view, label, icon }: { view: ViewState, label: string, icon: any }) => (
        <button 
            onClick={() => { setCurrentView(view); setIsMobileMenuOpen(false); }}  
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${currentView === view ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-accent font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 group'}`}
        >
            {icon}
            <span className={`transition-all duration-300 ${currentView === view ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-xs'}`}>
                {label}
            </span>
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-300">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center cursor-pointer" onClick={() => setCurrentView(isAuthenticated ? ViewState.AUDITOR : ViewState.HOME)}>
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-teal-600 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-sm">
                                D
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                                {APP_NAME}
                            </span>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex space-x-2">
                            {isAuthenticated && (
                                <>
                                    <NavItem view={ViewState.PROFILE} label="Dashboard" icon={<Icons.Chart />} />
                                    <NavItem view={ViewState.AUDITOR} label="Recipe Auditor" icon={<Icons.Check />} />
                                    <NavItem view={ViewState.SAVED_RECIPES} label="Saved" icon={<Icons.Bookmark />} />
                                    <NavItem view={ViewState.MEAL_PLAN} label="Meal Plan" icon={<Icons.Calendar />} />
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
                                    className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
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
                                <NavItem view={ViewState.PROFILE} label="Dashboard" icon={<Icons.Chart />} />
                                <NavItem view={ViewState.AUDITOR} label="Recipe Auditor" icon={<Icons.Check />} />
                                <NavItem view={ViewState.SAVED_RECIPES} label="Saved" icon={<Icons.Bookmark />} />
                                <NavItem view={ViewState.MEAL_PLAN} label="Meal Plan" icon={<Icons.Calendar />} />
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

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderView()}
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        © {new Date().getFullYear()} {APP_NAME}. Designed for Impact. <br />
                        <span className="text-xs text-gray-400 dark:text-gray-500">Not a substitute for professional medical advice. Always consult your doctor.</span>
                    </p>
                </div>
            </footer>

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
            <Toaster position="top-right" richColors />
        </div>
    );
};

export default App;