"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const productivityData = [
  { day: 'Mon', hours: 6, score: 75 },
  { day: 'Tue', hours: 8, score: 82 },
  { day: 'Wed', hours: 4, score: 60 },
  { day: 'Thu', hours: 9, score: 95 },
  { day: 'Fri', hours: 7, score: 88 },
  { day: 'Sat', hours: 3, score: 45 },
  { day: 'Sun', hours: 5, score: 70 },
];

const Analytics = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-8 h-[400px]">
              <h3 className="text-lg font-bold mb-8">Focus Hours Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productivityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="hours" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-8 h-[400px]">
              <h3 className="text-lg font-bold mb-8">Focus Score Trend</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productivityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-8">
            <h3 className="text-lg font-bold mb-6">Productivity Heatmap</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 52 * 7 }).map((_, i) => {
                const intensity = Math.random();
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.001 }}
                    className={cn(
                      "w-3 h-3 rounded-sm transition-all hover:scale-150 hover:z-10 cursor-pointer",
                      intensity > 0.8 ? "bg-blue-500" : 
                      intensity > 0.5 ? "bg-blue-500/60" : 
                      intensity > 0.2 ? "bg-blue-500/30" : "bg-white/5"
                    )}
                    title={`Activity: ${Math.floor(intensity * 100)}%`}
                  />
                );
              })}
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-white/40">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-white/5" />
                <div className="w-3 h-3 rounded-sm bg-blue-500/30" />
                <div className="w-3 h-3 rounded-sm bg-blue-500/60" />
                <div className="w-3 h-3 rounded-sm bg-blue-500" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;