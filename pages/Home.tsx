import React from 'react';
import { ViewState } from '../types';
import { APP_NAME, APP_TAGLINE, Icons } from '../constants';

interface HomeProps {
  changeView: (view: ViewState) => void;
}

const Home: React.FC<HomeProps> = ({ changeView }) => {
  return (
    <div className="space-y-16 animate-fade-in-up">
      {/* Hero Section */}
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent opacity-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-100 opacity-50 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
        
        <div className="relative z-10 p-8 md:p-16 text-center max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                Eat Well. Live Well. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">
                    Without the Compromise.
                </span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
                {APP_TAGLINE} <br/>
                DiaMenu audits your favorite Filipino recipes and suggests smart, affordable swaps to keep your blood sugar in check.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button 
                    onClick={() => changeView(ViewState.AUDITOR)}
                    className="px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-emerald-800 hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                    Try Recipe Auditor
                </button>
                <button 
                     onClick={() => changeView(ViewState.MEAL_PLAN)}
                    className="px-8 py-4 bg-white text-gray-700 border border-gray-200 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                    View Meal Plans
                </button>
            </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Icons.Doctor />
            </div>
            <h3 className="text-xl font-bold mb-2">The Execution Gap</h3>
            <p className="text-gray-500 text-sm">
                Doctors say "Eat healthy," but don't say how. We bridge that gap with specific, actionable advice.
            </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
                <Icons.Chef />
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Swaps</h3>
            <p className="text-gray-500 text-sm">
                Don't just cut rice. Swap it with Adlai or Cauliflower. We suggest ingredients found in your local palengke.
            </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                <Icons.Calendar />
            </div>
            <h3 className="text-xl font-bold mb-2">Interactive Planning</h3>
            <p className="text-gray-500 text-sm">
                Build a weekly calendar that adapts to your needs. No reloading, just instant, app-like planning.
            </p>
        </div>
      </div>

      {/* Social Proof / Context */}
      <div className="bg-gray-900 text-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4">
            <h2 className="text-2xl font-bold">Privacy First. Context Aware.</h2>
            <p className="text-gray-400">
                We respect your data. Your medical profile helps the AI act as your personal endocrinologist, but sensitive details are never stored permanently or shared.
            </p>
        </div>
        <div className="flex-1 w-full">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-3 font-mono text-sm">
                    <div className="text-green-400">{">"} Initiating context protocol...</div>
                    <div className="text-gray-300">{">"} Location: Metro Manila, PH</div>
                    <div className="text-gray-300">{">"} Market Prices: Updated</div>
                    <div className="text-blue-400">{">"} Ready to serve.</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Home;