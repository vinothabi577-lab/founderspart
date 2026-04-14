"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, User, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions] = useLocalStorage<any[]>('focusos-finance', []);
  const [user] = useLocalStorage('focusos-user', { name: 'Alex Rivera' });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalEarnings = useMemo(() => {
    return transactions
      .filter(t => t.type === 'Income')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/tasks': return 'Task Tracker';
      case '/analytics': return 'Analytics';
      case '/business': return 'Business CRM';
      case '/finance': return 'Finance Tracker';
      case '/profile': return 'Profile';
      default: return 'FocusOS';
    }
  };

  const handleClearData = () => {
    const confirmed = window.confirm("Are you sure you want to clear all data? This will delete all tasks, transactions, and client records permanently.");
    if (confirmed) {
      localStorage.removeItem('focusos-tasks');
      localStorage.removeItem('focusos-finance');
      localStorage.removeItem('focusos-clients-v2');
      toast.success("System reset successful. Reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
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
        <form onSubmit={(e) => { e.preventDefault(); toast.info(`Searching for: ${searchQuery}`); setSearchQuery(""); }} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input 
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anything..." 
            className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 w-64 transition-all"
          />
        </form>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleClearData}
            className="p-2 text-white/40 hover:text-rose-500 transition-colors group relative"
            title="Clear All Data"
          >
            <Trash2 size={20} />
          </button>

          <button onClick={() => toast.success("You're all caught up!")} className="relative p-2 text-white/60 hover:text-white transition-colors group">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-black" />
          </button>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10 cursor-pointer group" onClick={() => navigate('/profile')}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold group-hover:text-blue-400 transition-colors">{user.name}</p>
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Total: ${totalEarnings.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] group-hover:scale-110 transition-transform">
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