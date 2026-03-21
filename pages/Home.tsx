import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { APP_NAME, APP_TAGLINE, Icons } from '../constants';

interface HomeProps {
  changeView: (view: ViewState) => void;
}

const features = [
  {
    id: 0,
    title: "The Execution Gap",
    description: "Doctors say 'Eat healthy', but don't say how. We bridge that gap with specific, actionable advice.",
    icon: Icons.Doctor,
    btnText: "Get Started",
    view: ViewState.AUDITOR,
    gradient: "from-blue-500 to-indigo-600"
  },
  {
    id: 1,
    title: "Smart Swaps",
    description: "Don't just cut rice. Swap it with Adlai or Cauliflower. We suggest ingredients found in your local palengke.",
    icon: Icons.Chef,
    btnText: "Explore Swaps",
    view: ViewState.AUDITOR,
    gradient: "from-orange-500 to-red-500"
  },
  {
    id: 2,
    title: "Interactive Planning",
    description: "Build a weekly calendar that adapts to your needs. No reloading, just instant, app-like planning.",
    icon: Icons.Calendar,
    btnText: "Plan Meals",
    view: ViewState.MEAL_PLAN,
    gradient: "from-emerald-500 to-teal-700"
  }
];

const Home: React.FC<HomeProps> = ({ changeView }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 4500); // 4.5 seconds for snappy feel
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % features.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);

  // Helper for computing stacked card styles ensuring the stacking shows cards to the right
  const getCardStyle = (index: number) => {
    const diff = (index - currentIndex + features.length) % features.length;
    
    // Front card
    if (diff === 0) {
      return "z-30 scale-100 translate-x-0 opacity-100 shadow-[0_20px_50px_rgba(0,0,0,0.2)]";
    }
    // Middle card (behind, shifted right)
    if (diff === 1) {
      return "z-20 scale-[0.9] translate-x-12 md:translate-x-16 opacity-70 shadow-xl brightness-95";
    }
    // Back card (further behind, shifted right)
    if (diff === 2) {
      return "z-10 scale-[0.8] translate-x-24 md:translate-x-32 opacity-40 shadow-lg brightness-90";
    }
    
    return "z-0 scale-50 translate-x-0 opacity-0";
  };

  return (
    <div className="space-y-16 animate-fade-in-up pb-10">
      {/* New Top Hero Section based on minimalist image style */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-24 flex flex-col lg:flex-row items-center justify-between">
        
        {/* Left Content */}
        <div className="w-full lg:w-[45%] space-y-8 z-10">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-primary font-medium text-sm border border-emerald-100 dark:border-emerald-800">
            <Icons.Check /> Healthy. Simple. Smart.
          </div>

          {/* Heading */}
          <h1 className="text-6xl md:text-[5rem] font-extrabold text-primary dark:text-emerald-400 tracking-tight leading-[1.1]">
            Eat Well.<br/>Live Well.
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg font-light">
            The ultimate diabetes companion. Audit recipes, find smart ingredient swaps, and visualize your weekly meal plan with a premium, seamless experience.
          </p>

          {/* Action Button */}
          <button 
            onClick={() => changeView(ViewState.AUDITOR)}
            className="bg-primary hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-xl shadow-[0_10px_20px_rgba(15,118,110,0.2)] transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            Start Auditing Free
            <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>

        {/* Right Floating UI Elements */}
        <div className="w-full lg:w-[50%] relative h-[450px] lg:h-[600px] mt-16 lg:mt-0 flex justify-center lg:justify-end">
          
          {/* Smaller Overlapping White Card (Back) */}
          <div className="absolute top-[25%] right-[20%] w-[65%] max-w-[320px] bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-700 z-0 animate-float-delayed">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <Icons.Calendar className="w-6 h-6 text-orange-500" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-2.5 w-1/2 bg-gray-100 dark:bg-gray-700 rounded-full"></div>
                <div className="h-2 w-1/3 bg-gray-100 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Large White Card Element (Main) */}
          <div className="absolute top-[5%] right-0 lg:right-4 w-[75%] max-w-[400px] bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-[0_30px_60px_rgba(0,0,0,0.08)] border border-gray-50 dark:border-gray-700 z-10 animate-float">
            <div className="flex justify-between items-start mb-10">
              <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-inner">
                  <div className="text-gray-300"><Icons.Chef /></div>
              </div>
              <Icons.Chart className="w-6 h-6 text-secondary" />
            </div>
            <div className="space-y-4">
              <div className="h-3.5 w-[85%] bg-gray-100 dark:bg-gray-700 rounded-full"></div>
              <div className="h-3.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full"></div>
              <div className="h-3.5 w-[65%] bg-gray-100 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>

          {/* Primary Color Badge Card Element */}
          <div className="absolute bottom-[10%] left-4 lg:left-0 w-64 bg-primary rounded-[1.5rem] p-6 shadow-[0_20px_40px_rgba(15,118,110,0.3)] z-20 animate-float-fast">
            <div className="flex items-center gap-3 text-white mb-6">
              <Icons.Check className="w-6 h-6" />
              <span className="font-semibold text-lg">Audit Complete</span>
            </div>
            <div className="text-emerald-50 mb-1.5 opacity-90 text-sm">Pork Adobo Smart Swap</div>
            <div className="text-white text-3xl font-bold font-mono">GI: Low</div>
          </div>
        </div>
      </div>

      <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-4 w-full">
        Designed to simplify your diet with powerful tools that give you full control over your health.
      </div>
      
      {/* Main Hero Carousel Banner (Previous Design) */}
      <div className="flex flex-col items-center max-w-6xl mx-auto w-full px-4 md:px-0">
        
        {/* The Primary Card Container */}
        <div className="w-full bg-primary dark:bg-emerald-800 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden min-h-[500px] gap-12 md:gap-0">
          
          {/* Subtle Background Glows inside the box */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          {/* Left Content */}
          <div className="md:w-[45%] text-white z-20 space-y-6 md:pr-8 relative flex flex-col justify-center h-full">
            <div className="bg-white text-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-500 hover:scale-105">
                {React.createElement(features[currentIndex].icon)}
            </div>
            
            <div className="min-h-[160px] flex flex-col justify-center gap-4">
              <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight transition-all duration-500 leading-tight">
                {features[currentIndex].title}
              </h1>
              
              <p className="text-lg text-emerald-50 opacity-90 leading-relaxed font-light transition-all duration-500 max-w-sm">
                {features[currentIndex].description}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 md:gap-8 pt-4">
              <button 
                onClick={() => changeView(features[currentIndex].view)}
                className="bg-white text-primary font-bold px-8 py-3.5 rounded-full flex items-center gap-2 hover:bg-emerald-50 transition-colors shadow-sm group"
              >
                {features[currentIndex].btnText}
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
              
              <div className="flex items-center gap-4">
                <button onClick={handlePrev} className="w-11 h-11 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/10 transition-colors backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <button onClick={handleNext} className="w-11 h-11 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/10 transition-colors backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Right Stack Carousel */}
          <div className="md:w-[50%] relative h-[360px] md:h-[420px] w-full flex items-center z-10 perspective-1000 pl-4 md:pl-0 sm:pr-8 md:pr-12">
            <div className="relative w-full max-w-[320px] md:max-w-[400px] h-full mx-auto md:ml-0 md:mr-auto">
              {features.map((feature, index) => (
                 <div 
                    key={feature.id} 
                    className={`absolute top-0 bottom-0 my-auto right-12 md:right-auto md:left-0 w-[85%] sm:w-[300px] md:w-[320px] lg:w-[360px] h-[340px] md:h-[380px] bg-white rounded-3xl p-6 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] border border-gray-100 ${getCardStyle(index)}`}
                 >
                    {/* Header graphic of the card */}
                    <div className={`h-36 rounded-2xl mb-6 bg-gradient-to-br ${feature.gradient} p-6 text-white flex flex-col justify-end shadow-inner relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                      <p className="text-xs uppercase tracking-wider font-bold opacity-80 mb-1 z-10">{APP_NAME} FEATURE</p>
                      <h3 className="text-xl md:text-2xl font-bold z-10 leading-tight">{feature.title}</h3>
                    </div>
                    
                    {/* Abstract Mock UI Body */}
                    <div className="flex-1 rounded-xl bg-gray-50 p-5 space-y-5 border border-gray-100 relative overflow-hidden">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white/90`}>
                              {React.createElement(feature.icon)}
                           </div>
                           <div className="space-y-1.5">
                             <div className="h-2 w-16 bg-gray-300 rounded"></div>
                             <div className="h-2 w-24 bg-gray-200 rounded"></div>
                           </div>
                         </div>
                         <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
                       </div>
                       
                       <div className="space-y-2 mt-4">
                         <div className="h-2.5 w-full bg-gray-200 rounded"></div>
                         <div className="h-2.5 w-4/5 bg-gray-200 rounded"></div>
                       </div>
                       
                       <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end pt-4 border-t border-gray-200">
                         <div className="w-12 h-12 rounded-full border-4 border-primary/80 border-t-primary/20 rotate-45"></div>
                         <div className="space-y-2">
                           <div className="h-2 w-16 bg-gray-300 rounded"></div>
                           <div className="h-2 w-12 bg-gray-200 rounded float-right"></div>
                         </div>
                       </div>
                    </div>
                 </div>
              ))}
            </div>
          </div>

        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex gap-2.5 mt-8 z-20">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'w-8 bg-primary dark:bg-emerald-500' : 'w-2.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Social Proof / Context Container */}
      <div className="max-w-6xl mx-auto px-4 md:px-0">
        <div className="bg-gray-900 text-white rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 shadow-lg">
          <div className="flex-1 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Privacy First. Context Aware.</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                  We respect your data. Your medical profile helps the AI act as your personal endocrinologist, but sensitive details are never stored permanently or shared outside your control.
              </p>
          </div>
          <div className="flex-1 w-full">
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-inner">
                  <div className="flex items-center gap-2.5 mb-5">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-500"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-yellow-500"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500"></div>
                  </div>
                  <div className="space-y-3 font-mono text-sm leading-relaxed">
                      <div className="text-emerald-400 font-semibold">{">"} Initiating context protocol...</div>
                      <div className="text-gray-300 flex justify-between"><span>{">"} Location:</span> <span className="text-white">Metro Manila, PH</span></div>
                      <div className="text-gray-300 flex justify-between"><span>{">"} Market Prices:</span> <span className="text-white">Updated 2m ago</span></div>
                      <div className="text-blue-400 font-semibold mt-4 block">{">"} Ready to serve.</div>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;