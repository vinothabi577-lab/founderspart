"use client";

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, User } from 'lucide-react';
import { format } from 'date-fns';

const Header = () => {
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/tasks': return 'Task Tracker';
      case '/analytics': return 'Analytics';
      case '/business': return 'Business CRM';
      case '/finance': return 'Finance Tracker';
      default: return 'FocusOS';
    }
  };

  return (
    <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gradient">{getTitle()}</h2>
        <p className="text-xs text-white/40 font-medium">
          {format(time, 'EEEE, MMMM do')} • {format(time, 'HH:mm:ss')}
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 w-64 transition-all"
          />
        </div>
        
        <button className="relative p-2 text-white/60 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-black" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">Alex Rivera</p>
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Pro Member</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
              <User size={20} className="text-white/80" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;