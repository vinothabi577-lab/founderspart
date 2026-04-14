"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import FocusScore from '@/components/dashboard/FocusScore';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Flame, DollarSign, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const Index = () => {
  const [tasks] = useLocalStorage<any[]>('focusos-tasks', []);
  const [transactions] = useLocalStorage<any[]>('focusos-finance', []);
  const [chartType, setChartType] = useState<'hours' | 'tasks'>('hours');

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayIncome = transactions
      .filter(t => t.type === 'Income' && t.date === today)
      .reduce((acc, t) => acc + t.amount, 0);

    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    // Simple Streak Calculation
    const dates = [...new Set(completedTasks.map(t => t.createdAt.split('T')[0]))].sort().reverse();
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < dates.length; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (dates.includes(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (i === 0) {
        // Check if streak was broken today but existed yesterday
        currentDate.setDate(currentDate.getDate() - 1);
        const yesterdayStr = currentDate.toISOString().split('T')[0];
        if (!dates.includes(yesterdayStr)) break;
      } else {
        break;
      }
    }

    const focusScore = Math.min(100, Math.max(0, (completedTasks.length * 10) + (streak * 5)));

    return { todayIncome, streak, focusScore, completedTasks };
  }, [tasks, transactions]);

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => {
      const dayTasks = stats.completedTasks.filter(t => {
        const d = new Date(t.createdAt);
        return days[d.getDay()] === day;
      });
      return {
        name: day,
        value: chartType === 'tasks' ? dayTasks.length : dayTasks.reduce((acc, t) => acc + (t.duration / 60), 0)
      };
    });
  }, [stats.completedTasks, chartType]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 blur-2xl bg-orange-500" />
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500"><Flame size={24} /></div>
                  </div>
                  <h3 className="text-white/40 text-sm font-medium">Current Streak</h3>
                  <p className="text-3xl font-bold mt-1">{stats.streak} Days</p>
                </div>
                <div className="glass-card p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 blur-2xl bg-blue-500" />
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500"><DollarSign size={24} /></div>
                  </div>
                  <h3 className="text-white/40 text-sm font-medium">Today's Income</h3>
                  <p className="text-3xl font-bold mt-1">${stats.todayIncome.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="glass-card p-8 h-[350px]">
                <div className="flex justify-between items-center mb-8">
                  <div><h3 className="text-lg font-bold">Productivity Trend</h3><p className="text-sm text-white/40">Weekly {chartType} analysis</p></div>
                  <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                    {['hours', 'tasks'].map(type => (
                      <button key={type} onClick={() => setChartType(type as any)} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", chartType === type ? "bg-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white")}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 12 }} dy={10} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#3b82f6' }} />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <FocusScore score={stats.focusScore} />
              <div className="glass-card p-6">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Clock size={16} className="text-blue-500" /> Active Tasks</h3>
                <div className="space-y-4">
                  {tasks.filter(t => t.status !== 'completed').slice(0, 3).map((task, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-sm font-medium">{task.title}</span>
                      <span className="text-xs text-white/40 font-mono">{Math.floor(task.timeLeft / 60)}m</span>
                    </div>
                  ))}
                  {tasks.filter(t => t.status !== 'completed').length === 0 && <p className="text-xs text-white/20 text-center py-4">No active tasks</p>}
                </div>
                <Link to="/tasks"><button className="w-full mt-6 py-3 rounded-xl bg-white/5 text-xs font-bold hover:bg-white/10 transition-all border border-white/5">Manage Tasks</button></Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;