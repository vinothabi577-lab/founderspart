"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { TrendingUp, Clock, CheckCircle2, DollarSign } from 'lucide-react';

const Analytics = () => {
  const [tasks] = useLocalStorage<any[]>('focusos-tasks', []);
  const [transactions] = useLocalStorage<any[]>('focusos-finance', []);

  const analyticsData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toISOString().split('T')[0],
        dayName: days[d.getDay()],
        hours: 0,
        income: 0,
        tasks: 0
      };
    });

    tasks.forEach(task => {
      if (task.status === 'completed') {
        const date = task.createdAt.split('T')[0];
        const day = last7Days.find(d => d.date === date);
        if (day) {
          day.hours += task.duration / 60;
          day.tasks += 1;
        }
      }
    });

    transactions.forEach(tx => {
      if (tx.type === 'Income') {
        const day = last7Days.find(d => d.date === tx.date);
        if (day) day.income += tx.amount;
      }
    });

    return last7Days;
  }, [tasks, transactions]);

  const totalFocusHours = analyticsData.reduce((acc, d) => acc + d.hours, 0);
  const totalCompletedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalRevenue = transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500"><Clock size={24} /></div>
                <div><p className="text-white/40 text-xs font-bold uppercase">Focus Time</p><p className="text-2xl font-bold">{totalFocusHours.toFixed(1)}h</p></div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500"><CheckCircle2 size={24} /></div>
                <div><p className="text-white/40 text-xs font-bold uppercase">Tasks Done</p><p className="text-2xl font-bold">{totalCompletedTasks}</p></div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500"><DollarSign size={24} /></div>
                <div><p className="text-white/40 text-xs font-bold uppercase">Total Revenue</p><p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-8 h-[400px]">
              <h3 className="text-lg font-bold mb-8">Focus Hours (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData}>
                  <defs><linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-8 h-[400px]">
              <h3 className="text-lg font-bold mb-8">Revenue Growth</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Bar dataKey="income" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-8">
            <h3 className="text-lg font-bold mb-6">Activity Heatmap</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 52 * 7 }).map((_, i) => {
                const hasActivity = Math.random() > 0.8; // Placeholder for visual density
                return (
                  <div key={i} className={cn("w-3 h-3 rounded-sm transition-all", hasActivity ? "bg-blue-500/40" : "bg-white/5")} />
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;