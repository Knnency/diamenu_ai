import React, { useEffect, useState } from 'react';

interface FoodLoaderProps {
  status: string;
}

const FoodLoader: React.FC<FoodLoaderProps> = ({ status }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="relative w-24 h-24">
        {/* Shadow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-2 bg-gray-200 rounded-[100%] animate-pulse blur-sm"></div>
        
        {/* Bouncing Apple (Simple SVG composition) */}
        <div className="absolute inset-0 animate-bounce-slow flex items-center justify-center">
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-20 h-20 text-red-500 drop-shadow-md">
                <path d="M20.5 9.5c-.6-2.5-2.8-4.3-5.5-4.3-1.8 0-3.5.9-4.5 2.3-.6-.8-1.5-1.5-2.5-1.9L9 2.5l-.4-.2-1.3 2.6C4.4 6.1 2.5 8.5 2.5 11.5c0 4.1 3.4 7.5 7.5 7.5.5 0 1-.1 1.5-.2 1.6 1.1 3.5 1.7 5.5 1.7 5 0 9-4 9-9 0-.7-.1-1.3-.3-2zM12 4.2c0-.2.2-.4.4-.4.2 0 .4.2.4.4v2.5c0 .2-.2.4-.4.4-.2 0-.4-.2-.4-.4V4.2zM8 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm9 4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
             </svg>
             {/* Leaf */}
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-green-500 absolute top-0 right-4 -rotate-12">
                 <path d="M12 2C7.58 2 4 5.58 4 10c0 2.67 1.33 5.04 3.37 6.55.57.42 1.25.13 1.25-.59 0-.25-.13-.48-.34-.63C6.73 14.28 5.6 12.26 5.6 10c0-3.53 2.87-6.4 6.4-6.4 3.53 0 6.4 2.87 6.4 6.4 0 2.26-1.13 4.28-2.88 5.33-.21.15-.34.38-.34.63 0 .72.68 1.01 1.25.59C18.67 15.04 20 12.67 20 10c0-4.42-3.58-8-8-8z" />
             </svg>
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-xl font-semibold text-primary">{status}</h3>
        <p className="text-gray-500 text-sm mt-1">Simulating Agents{dots}</p>
      </div>
      
      {/* Agent Indicators */}
      <div className="flex space-x-4 mt-4">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${status.includes('Doctor') ? 'bg-blue-50 border-blue-200 animate-pulse' : 'bg-gray-50 border-gray-100 opacity-50'}`}>
            <span className="text-xs font-bold text-blue-600">DR. AGENT</span>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${status.includes('Chef') ? 'bg-orange-50 border-orange-200 animate-pulse' : 'bg-gray-50 border-gray-100 opacity-50'}`}>
            <span className="text-xs font-bold text-orange-600">CHEF AGENT</span>
        </div>
      </div>
    </div>
  );
};

export default FoodLoader;