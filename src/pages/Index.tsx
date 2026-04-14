"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import FocusScore from '@/components/dashboard/FocusScore';
import { 
  Flame, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Mon', value: 40 },
  { name: 'Tue', value: 30 },
  { name: 'Wed', value: 65 },
  { name: 'Thu', value: 45 },
  { name: 'Fri', value: 90 },
  { name: 'Sat', value: 70 },
  { name: 'Sun', value: 85 },
];

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card p-6 relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 blur-2xl bg-${color}-500`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(trend)}%
      </div>
    </div>
    <h3 className="text-white/40 text-sm font-medium">{title}</h3>
    <p className="text-3xl font-bold mt-1">{value}</p>
  </motion.div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        
        <div className="p-8 space-y-8">
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard 
                  title="Current Streak" 
                  value="12 Days" 
                  icon={Flame} 
                  trend={20} 
                  color="orange" 
                />
                <StatCard 
                  title="Today's Income" 
                  value="$1,240.00" 
                  icon={DollarSign} 
                  trend={12} 
                  color="blue" 
                />
              </div>
              
              <div className="glass-card p-8 h-[350px]">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-bold">Productivity Trend</h3>
                    <p className="text-sm text-white/40">Weekly focus hours analysis</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded-lg bg-blue-600 text-xs font-bold">Hours</button>
                    <button className="px-3 py-1 rounded-lg bg-white/5 text-xs font-bold hover:bg-white/10 transition-colors">Tasks</button>
                  </div>
                </div>
                
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#ffffff40', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#111', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                        itemStyle={{ color: '#3b82f6' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <FocusScore score={84} />
              
              <div className="glass-card p-6">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-blue-500" />
                  Upcoming Deadlines
                </h3>
                <div className="space-y-4">
                  {[
                    { title: 'Website Redesign', time: '2h 15m', color: 'blue' },
                    { title: 'Video Edit #42', time: '4h 30m', color: 'purple' },
                    { title: 'Client Meeting', time: '6h 00m', color: 'emerald' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full bg-${item.color}-500 shadow-[0_0_8px_rgba(var(--${item.color}-500),0.5)]`} />
                        <span className="text-sm font-medium group-hover:text-blue-400 transition-colors">{item.title}</span>
                      </div>
                      <span className="text-xs text-white/40 font-mono">{item.time}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-3 rounded-xl bg-white/5 text-xs font-bold hover:bg-white/10 transition-all border border-white/5">
                  View All Tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;