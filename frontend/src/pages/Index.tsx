"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import FocusScore from '@/components/dashboard/FocusScore';
import { useSupabaseTasks } from '@/hooks/useSupabaseTasks';
import { useSupabaseFinance } from '@/hooks/useSupabaseFinance';
import { Flame, DollarSign, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const Index = () => {
  const { tasks, loading: tasksLoading } = useSupabaseTasks();
  const { transactions, loading: financeLoading } = useSupabaseFinance();
  const [chartType, setChartType] = useState<'hours' | 'tasks'>('hours');
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayIncome = transactions
      .filter(t => t.type === 'Income' && t.date === today)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    const dates = [...new Set(completedTasks.map(t => t.created_at.split('T')[0]))].sort().reverse();
    let streak = 0;
    let checkDate = new Date();
    
    let dateStr = checkDate.toISOString().split('T')[0];
    if (!dates.includes(dateStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      dateStr = checkDate.toISOString().split('T')[0];
    }

    while (dates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      dateStr = checkDate.toISOString().split('T')[0];
    }

    const focusScore = Math.min(100, Math.max(0, (completedTasks.length * 5) + (streak * 10)));

    return { todayIncome, streak, focusScore, completedTasks };
  }, [tasks, transactions]);


  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
      
      const dayTasks = stats.completedTasks.filter(t => t.created_at.startsWith(dateStr));
      
      return {
        name: dayName,
        value: chartType === 'tasks' ? dayTasks.length : dayTasks.reduce((acc, t) => acc + (t.duration / 60), 0)
      };
    });
  }, [stats.completedTasks, chartType]);


  const getRemainingTime = (task: any) => {
    const m = Math.floor(task.time_left / 60);
    return `${m}m`;
  };


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
                  {tasksLoading ? (
                    <div className="h-9 w-24 bg-white/5 animate-pulse rounded-lg mt-1" />
                  ) : (
                    <p className="text-3xl font-bold mt-1">{stats.streak} Days</p>
                  )}
                </div>
                <div className="glass-card p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 blur-2xl bg-blue-500" />
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500"><DollarSign size={24} /></div>
                  </div>
                  <h3 className="text-white/40 text-sm font-medium">Today's Income</h3>
                  {financeLoading ? (
                    <div className="h-9 w-24 bg-white/5 animate-pulse rounded-lg mt-1" />
                  ) : (
                    <p className="text-3xl font-bold mt-1">₹{stats.todayIncome.toLocaleString()}</p>
                  )}
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
                  {tasksLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-12 w-full bg-white/5 animate-pulse rounded-xl" />
                    ))
                  ) : (
                    <>
                      {tasks.filter(t => t.status !== 'completed').slice(0, 3).map((task, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-sm font-medium">{task.title}</span>
                          <span className="text-xs text-white/40 font-mono">{getRemainingTime(task)}</span>
                        </div>
                      ))}
                      {tasks.filter(t => t.status !== 'completed').length === 0 && <p className="text-xs text-white/20 text-center py-4">No active tasks</p>}
                    </>
                  )}
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