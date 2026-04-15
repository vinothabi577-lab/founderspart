"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, DollarSign } from 'lucide-react';
import { format, subDays, startOfToday, addDays, startOfWeek, isSameMonth, isFirstDayOfMonth } from 'date-fns';

const Analytics = () => {
  const [tasks] = useLocalStorage<any[]>('focusos-tasks', []);
  const [transactions] = useLocalStorage<any[]>('focusos-finance', []);

  const analyticsData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      return {
        date: format(d, 'yyyy-MM-dd'),
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

  const heatmapData = useMemo(() => {
    const activityMap: Record<string, number> = {};
    
    tasks.forEach(t => {
      if (t.status === 'completed') {
        const date = t.createdAt.split('T')[0];
        activityMap[date] = (activityMap[date] || 0) + 1;
      }
    });

    transactions.forEach(tx => {
      if (tx.type === 'Income') {
        activityMap[tx.date] = (activityMap[tx.date] || 0) + 1;
      }
    });

    // GitHub style: 52 weeks, starting from the Sunday of the week 52 weeks ago
    const today = startOfToday();
    const startDate = startOfWeek(subDays(today, 364)); // 52 weeks * 7 days
    
    const days = [];
    const monthLabels = [];
    let currentMonth = -1;

    for (let i = 0; i < 371; i++) { // 53 weeks to ensure full coverage
      const date = addDays(startDate, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const month = date.getMonth();
      
      // If it's the first week of a new month, add a label
      if (month !== currentMonth && date.getDate() <= 7) {
        monthLabels.push({
          index: Math.floor(i / 7),
          label: format(date, 'MMM')
        });
        currentMonth = month;
      }

      days.push({
        date: dateStr,
        displayDate: format(date, 'EEEE, MMM do, yyyy'),
        count: activityMap[dateStr] || 0,
      });
    }

    return { days, monthLabels };
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
                <div><p className="text-white/40 text-xs font-bold uppercase">Total Revenue</p><p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-8 h-[400px] flex flex-col">
              <h3 className="text-lg font-bold mb-6">Focus Hours (Last 7 Days)</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData} margin={{ bottom: 20, left: -20 }}>
                    <defs><linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-8 h-[400px] flex flex-col">
              <h3 className="text-lg font-bold mb-6">Revenue Growth</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData} margin={{ bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="income" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-card p-8">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-lg font-bold">Activity Heatmap</h3>
                <p className="text-xs text-white/40">Tracking tasks and payments over the last year</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-white/5" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/20" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/40" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/70" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                </div>
                <span>More</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              {/* Day Labels */}
              <div className="flex flex-col justify-between py-8 text-[10px] text-white/20 font-bold uppercase h-[110px]">
                <span className="h-3 flex items-center">Mon</span>
                <span className="h-3 flex items-center">Wed</span>
                <span className="h-3 flex items-center">Fri</span>
              </div>

              <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                {/* Month Labels */}
                <div className="relative h-5 mb-1 min-w-max">
                  {heatmapData.monthLabels.map((ml, i) => (
                    <span 
                      key={i} 
                      className="absolute text-[10px] text-white/30 font-bold uppercase"
                      style={{ left: `${ml.index * 14}px` }}
                    >
                      {ml.label}
                    </span>
                  ))}
                </div>

                <div className="grid grid-flow-col grid-rows-7 gap-1 min-w-max">
                  {heatmapData.days.map((day, i) => {
                    const intensity = day.count === 0 ? 0 : Math.min(4, Math.ceil(day.count / 2));
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.0005 }}
                        className={cn(
                          "w-2.5 h-2.5 rounded-sm transition-all duration-300 cursor-help",
                          intensity === 0 && "bg-white/5 hover:bg-white/10",
                          intensity === 1 && "bg-blue-500/20 hover:bg-blue-500/30",
                          intensity === 2 && "bg-blue-500/40 hover:bg-blue-500/50",
                          intensity === 3 && "bg-blue-500/70 hover:bg-blue-500/80",
                          intensity === 4 && "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)] hover:brightness-110"
                        )}
                        title={`${day.displayDate}: ${day.count} activities`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;