"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, DollarSign, ChevronDown, Info, Calendar } from 'lucide-react';
import { 
  format, 
  subDays, 
  subMonths,
  subYears,
  startOfWeek, 
  getYear, 
  eachDayOfInterval, 
  startOfYear, 
  endOfYear,
  endOfWeek,
  isWithinInterval,
  startOfDay
} from 'date-fns';

type TimeRange = 'yesterday' | '7days' | '1month' | '6months' | '1year';

const Analytics = () => {
  const [tasks] = useLocalStorage<any[]>('focusos-tasks', []);
  const [transactions] = useLocalStorage<any[]>('focusos-finance', []);
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  
  const currentYear = getYear(new Date());
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    tasks.forEach(t => years.add(getYear(new Date(t.createdAt))));
    transactions.forEach(t => years.add(getYear(new Date(t.date))));
    return Array.from(years).sort((a, b) => b - a);
  }, [tasks, transactions, currentYear]);

  const analyticsData = useMemo(() => {
    let startDate: Date;
    let endDate = startOfDay(new Date());
    let daysCount: number;

    switch (timeRange) {
      case 'yesterday':
        startDate = subDays(endDate, 1);
        daysCount = 1;
        break;
      case '7days':
        startDate = subDays(endDate, 6);
        daysCount = 7;
        break;
      case '1month':
        startDate = subMonths(endDate, 1);
        daysCount = 30;
        break;
      case '6months':
        startDate = subMonths(endDate, 6);
        daysCount = 180;
        break;
      case '1year':
        startDate = subYears(endDate, 1);
        daysCount = 365;
        break;
      default:
        startDate = subDays(endDate, 6);
        daysCount = 7;
    }

    const interval = eachDayOfInterval({ start: startDate, end: endDate });
    
    const data = interval.map(d => {
      const dateStr = format(d, 'yyyy-MM-dd');
      return {
        date: dateStr,
        label: daysCount <= 7 ? format(d, 'EEE') : daysCount <= 31 ? format(d, 'MMM d') : format(d, 'MMM yy'),
        hours: 0,
        income: 0,
        tasks: 0
      };
    });

    tasks.forEach(task => {
      if (task.status === 'completed') {
        const taskDate = startOfDay(new Date(task.createdAt));
        if (isWithinInterval(taskDate, { start: startDate, end: endDate })) {
          const dateStr = format(taskDate, 'yyyy-MM-dd');
          const day = data.find(d => d.date === dateStr);
          if (day) {
            day.hours += (task.duration || 0) / 60;
            day.tasks += 1;
          }
        }
      }
    });

    transactions.forEach(tx => {
      if (tx.type === 'Income') {
        const txDate = startOfDay(new Date(tx.date));
        if (isWithinInterval(txDate, { start: startDate, end: endDate })) {
          const day = data.find(d => d.date === tx.date);
          if (day) day.income += (tx.amount || 0);
        }
      }
    });

    return data;
  }, [tasks, transactions, timeRange]);

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

    const start = startOfWeek(startOfYear(new Date(selectedYear, 0, 1)));
    const end = endOfWeek(endOfYear(new Date(selectedYear, 11, 31)));
    
    const days = eachDayOfInterval({ start, end }).map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date: dateStr,
        displayDate: format(date, 'EEEE, MMM do, yyyy'),
        count: activityMap[dateStr] || 0,
        month: format(date, 'MMM'),
        dayOfWeek: date.getDay()
      };
    });

    const monthLabels: { label: string; colIndex: number }[] = [];
    let currentMonth = -1;
    
    days.forEach((day, index) => {
      const date = new Date(day.date);
      const month = date.getMonth();
      const colIndex = Math.floor(index / 7);
      
      if (month !== currentMonth) {
        const lastLabel = monthLabels[monthLabels.length - 1];
        if (!lastLabel || colIndex - lastLabel.colIndex > 2) {
          monthLabels.push({ label: day.month, colIndex });
          currentMonth = month;
        }
      }
    });

    const totalContributions = Object.entries(activityMap)
      .filter(([date]) => getYear(new Date(date)) === selectedYear)
      .reduce((acc, [_, count]) => acc + count, 0);

    return { days, monthLabels, totalContributions };
  }, [tasks, transactions, selectedYear]);

  const totalFocusHours = analyticsData.reduce((acc, d) => acc + d.hours, 0);
  const totalCompletedTasks = analyticsData.reduce((acc, d) => acc + d.tasks, 0);
  const totalRevenue = analyticsData.reduce((acc, d) => acc + d.income, 0);

  const rangeOptions: { label: string; value: TimeRange }[] = [
    { label: 'Yesterday', value: 'yesterday' },
    { label: '7 Days', value: '7days' },
    { label: '1 Month', value: '1month' },
    { label: '6 Months', value: '6months' },
    { label: '1 Year', value: '1year' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        
        <div className="p-8 space-y-10">
          {/* Time Range Selector */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gradient">Performance Overview</h2>
              <p className="text-sm text-white/40">Analyze your productivity and growth trends</p>
            </div>
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
              {rangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    timeRange === option.value 
                      ? "bg-blue-600 text-white shadow-lg" 
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 group hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform"><Clock size={24} /></div>
                <div><p className="text-white/40 text-xs font-bold uppercase tracking-wider">Focus Time</p><p className="text-2xl font-bold">{totalFocusHours.toFixed(1)}h</p></div>
              </div>
            </div>
            <div className="glass-card p-6 group hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform"><CheckCircle2 size={24} /></div>
                <div><p className="text-white/40 text-xs font-bold uppercase tracking-wider">Tasks Done</p><p className="text-2xl font-bold">{totalCompletedTasks}</p></div>
              </div>
            </div>
            <div className="glass-card p-6 group hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform"><DollarSign size={24} /></div>
                <div><p className="text-white/40 text-xs font-bold uppercase tracking-wider">Revenue</p><p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p></div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-8 h-[400px] flex flex-col">
              <h3 className="text-lg font-bold mb-6">Focus Hours</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData} margin={{ bottom: 20, left: -20 }}>
                    <defs><linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 10 }} dy={10} interval={timeRange === '1year' ? 30 : timeRange === '6months' ? 15 : 0} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '4px' }}
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
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 10 }} dy={10} interval={timeRange === '1year' ? 30 : timeRange === '6months' ? 15 : 0} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#8b5cf6', fontWeight: 'bold', marginBottom: '4px' }}
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                    />
                    <Bar dataKey="income" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={timeRange === '7days' ? 40 : undefined} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Heatmap Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium">
                {heatmapData.totalContributions} contributions in {selectedYear}
              </h3>
              <div className="flex items-center gap-2 text-xs text-white/40 cursor-pointer hover:text-white transition-colors">
                <span>Contribution settings</span>
                <ChevronDown size={14} />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 glass-card p-6 border-white/5">
                <div className="flex gap-2">
                  <div className="flex flex-col justify-between py-8 text-[10px] text-white/30 font-medium h-[110px] w-8">
                    <span className="h-3 flex items-center">Mon</span>
                    <span className="h-3 flex items-center">Wed</span>
                    <span className="h-3 flex items-center">Fri</span>
                  </div>

                  <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                    <div className="relative h-6 mb-1 min-w-max">
                      {heatmapData.monthLabels.map((ml, i) => (
                        <span 
                          key={i} 
                          className="absolute text-[10px] text-white/30 font-medium"
                          style={{ left: `${ml.colIndex * 13}px` }}
                        >
                          {ml.label}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-flow-col grid-rows-7 gap-[3px] min-w-max">
                      {heatmapData.days.map((day, i) => {
                        const intensity = day.count === 0 ? 0 : Math.min(4, Math.ceil(day.count / 2));
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.0002 }}
                            className={cn(
                              "w-[10px] h-[10px] rounded-[2px] transition-all duration-300 cursor-help",
                              intensity === 0 && "bg-white/[0.05] hover:bg-white/10",
                              intensity === 1 && "bg-emerald-900/40 hover:bg-emerald-900/60",
                              intensity === 2 && "bg-emerald-700/60 hover:bg-emerald-700/80",
                              intensity === 3 && "bg-emerald-500/80 hover:bg-emerald-500",
                              intensity === 4 && "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)] hover:brightness-110"
                            )}
                            title={`${day.displayDate}: ${day.count} contributions`}
                          />
                        );
                      })}
                    </div>

                    <div className="mt-6 flex items-center justify-between text-[10px] text-white/30">
                      <div className="flex items-center gap-1 hover:text-blue-400 transition-colors cursor-pointer">
                        <Info size={12} />
                        <span>Learn how we count contributions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Less</span>
                        <div className="flex gap-[3px]">
                          <div className="w-[10px] h-[10px] rounded-[2px] bg-white/[0.05]" />
                          <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-900/40" />
                          <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-700/60" />
                          <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/80" />
                          <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-400" />
                        </div>
                        <span>More</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-32 flex flex-col gap-1">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all text-left",
                      selectedYear === year 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                        : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;