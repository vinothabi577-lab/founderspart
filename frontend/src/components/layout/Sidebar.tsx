"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  Briefcase, 
  Wallet, 
  Settings,
  Zap,
  User,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',      path: '/' },
  { icon: CheckSquare,     label: 'Tasks',           path: '/tasks' },
  { icon: MessageSquare,   label: 'Daily Updates',   path: '/daily-updates' },
  { icon: BarChart3,       label: 'Analytics',       path: '/analytics' },
  { icon: Briefcase,       label: 'Business',        path: '/business' },
  { icon: Wallet,          label: 'Finance',          path: '/finance' },
  { icon: User,            label: 'Profile',         path: '/profile' },
];

import { useAuth } from '@/contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
  };

  const handleSettings = () => {
    toast.info("Settings module is being optimized for your Pro account.");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl z-50 hidden lg:flex flex-col p-6">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center glow-blue">
          <Zap className="text-white fill-white" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">FocusOS</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-blue-500 font-semibold">Dominate</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-blue-600/10 text-blue-500 border border-blue-500/20" 
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon size={20} className={cn(isActive ? "text-blue-500" : "group-hover:text-white")} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
        <button 
          onClick={handleSettings}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all group"
        >
          <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          <span className="font-medium">Settings</span>
        </button>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white/50 hover:text-rose-500 hover:bg-rose-500/5 transition-all group"
        >
          <Zap size={20} className="group-hover:text-rose-500" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};


export default Sidebar;