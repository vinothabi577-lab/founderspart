"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Camera,
  CheckCircle2,
  Clock,
  Save,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { requestNotificationPermission } from '@/utils/notifications';
import { cn } from '@/lib/utils';

const Profile = () => {
  const [tasksData] = useLocalStorage<any[]>('focusos-tasks', []);
  const [transactionsData] = useLocalStorage<any[]>('focusos-finance', []);
  
  const tasks = Array.isArray(tasksData) ? tasksData : [];
  const transactions = Array.isArray(transactionsData) ? transactionsData : [];

  const [user, setUser] = useLocalStorage('focusos-user', {
    name: 'Alex Rivera',
    email: 'alex.rivera@focusos.io',
    role: 'Pro Member',
    avatar: ''
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      toast.success("System notifications enabled!");
    } else {
      toast.error("Notification permission denied.");
    }
  };

  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t && t.status === 'completed');
    const incomeTransactions = transactions.filter(t => t && t.type === 'Income');
    
    const totalEarnings = incomeTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const totalMinutes = completedTasks.reduce((acc, t) => acc + (Number(t.duration) || 0), 0);
    
    return {
      tasksCompleted: completedTasks.length,
      totalEarnings,
      focusHours: (totalMinutes / 60).toFixed(1)
    };
  }, [tasks, transactions]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile updated successfully");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        
        <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-80 space-y-6">
              <div className="glass-card p-8 flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 mb-4">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                      <User size={64} className="text-white/20" />
                    </div>
                  </div>
                  <button className="absolute bottom-4 right-0 p-2 bg-blue-600 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={16} />
                  </button>
                </div>
                <h2 className="text-2xl font-bold">{user?.name || 'User'}</h2>
                <p className="text-blue-500 text-sm font-bold uppercase tracking-widest mt-1">{user?.role || 'Member'}</p>
                
                <div className="w-full grid grid-cols-1 gap-4 mt-8">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-white/40 uppercase font-bold mb-1">Total Revenue</p>
                    <p className="text-xl font-bold text-emerald-500">${stats.totalEarnings.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/60">
                      <CheckCircle2 size={16} />
                      <span className="text-sm">Tasks Done</span>
                    </div>
                    <span className="font-bold">{stats.tasksCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/60">
                      <Clock size={16} />
                      <span className="text-sm">Focus Hours</span>
                    </div>
                    <span className="font-bold">{stats.focusHours}h</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="glass-card p-8">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <Shield size={24} className="text-blue-500" /> Account Settings
                </h3>
                
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input 
                          type="text" 
                          value={user?.name || ''}
                          onChange={(e) => setUser({...user, name: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input 
                          type="email" 
                          value={user?.email || ''}
                          onChange={(e) => setUser({...user, email: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <h4 className="text-sm font-bold mb-4">Preferences</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                          <Globe size={20} className="text-blue-500" />
                          <div>
                            <p className="text-sm font-bold">Browser Notifications</p>
                            <p className="text-xs text-white/40">Get alerts even when the tab is closed</p>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={handleEnableNotifications}
                          className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                            notificationsEnabled 
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                              : "bg-blue-600 text-white glow-blue"
                          )}
                        >
                          {notificationsEnabled ? "Enabled" : "Enable"}
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                          <Bell size={20} className="text-blue-500" />
                          <div>
                            <p className="text-sm font-bold">In-App Sounds</p>
                            <p className="text-xs text-white/40">Play a sound when tasks finish</p>
                          </div>
                        </div>
                        <div className="w-12 h-6 rounded-full bg-blue-600 relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all glow-blue">
                    <Save size={20} /> Save Changes
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;