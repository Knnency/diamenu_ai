import React, { useState } from 'react';
import Home from './pages/Home';
import Auditor from './pages/Auditor';
import MealPlan from './pages/MealPlan';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import { ViewState } from './types';
import { APP_NAME, Icons } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentView(ViewState.HOME);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView(ViewState.HOME);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME: return <Home changeView={setCurrentView} />;
      case ViewState.AUDITOR: return isAuthenticated ? <Auditor /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
      case ViewState.MEAL_PLAN: return isAuthenticated ? <MealPlan /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
      case ViewState.LOGIN: return <Login changeView={setCurrentView} onLogin={handleLogin} />;
      case ViewState.REGISTER: return <Register changeView={setCurrentView} onRegister={handleLogin} />;
      case ViewState.FORGOT_PASSWORD: return <ForgotPassword changeView={setCurrentView} />;
      case ViewState.SETTINGS: return isAuthenticated ? <Settings /> : <Login changeView={setCurrentView} onLogin={handleLogin} />;
      default: return <Home changeView={setCurrentView} />;
    }
  };

  const NavItem = ({ view, label, icon }: { view: ViewState, label: string, icon: any }) => (
    <button 
        onClick={() => { setCurrentView(view); setIsMobileMenuOpen(false); }}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${currentView === view ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <div className="flex items-center cursor-pointer" onClick={() => setCurrentView(ViewState.HOME)}>
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-teal-600 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-sm">
                        D
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        {APP_NAME}
                    </span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex space-x-2">
                    <NavItem view={ViewState.HOME} label="Home" icon={<Icons.Leaf />} />
                    
                    {isAuthenticated && (
                        <>
                            <NavItem view={ViewState.AUDITOR} label="Recipe Auditor" icon={<Icons.Check />} />
                            <NavItem view={ViewState.MEAL_PLAN} label="Meal Plan" icon={<Icons.Calendar />} />
                            <NavItem view={ViewState.SETTINGS} label="Settings" icon={<Icons.User />} />
                        </>
                    )}
                    
                    <div className="w-px h-6 bg-gray-200 mx-2 self-center"></div>
                    
                    {!isAuthenticated ? (
                        <>
                            <button 
                                onClick={() => setCurrentView(ViewState.LOGIN)}
                                className={`px-4 py-2 rounded-lg text-gray-600 hover:text-primary font-medium transition-colors ${currentView === ViewState.LOGIN ? 'text-primary' : ''}`}
                            >
                                Log in
                            </button>
                            <button 
                                onClick={() => setCurrentView(ViewState.REGISTER)}
                                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-teal-700 font-medium transition-colors shadow-sm hover:shadow-md"
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={handleLogout}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:text-red-600 font-medium transition-colors"
                        >
                            Log out
                        </button>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-500 hover:text-gray-900">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-2 shadow-lg">
                <NavItem view={ViewState.HOME} label="Home" icon={<Icons.Leaf />} />
                
                {isAuthenticated && (
                    <>
                        <NavItem view={ViewState.AUDITOR} label="Recipe Auditor" icon={<Icons.Check />} />
                        <NavItem view={ViewState.MEAL_PLAN} label="Meal Plan" icon={<Icons.Calendar />} />
                        <NavItem view={ViewState.SETTINGS} label="Settings" icon={<Icons.User />} />
                    </>
                )}

                <div className="border-t border-gray-100 pt-2 mt-2">
                    {!isAuthenticated ? (
                        <div className="flex flex-col space-y-2">
                            <button 
                                onClick={() => { setCurrentView(ViewState.LOGIN); setIsMobileMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
                            >
                                Log in
                            </button>
                            <button 
                                onClick={() => { setCurrentView(ViewState.REGISTER); setIsMobileMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 rounded-lg bg-primary text-white hover:bg-teal-700 font-medium"
                            >
                                Sign up
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} {APP_NAME}. Designed for Impact. <br/>
                <span className="text-xs text-gray-400">Not a substitute for professional medical advice. Always consult your doctor.</span>
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;