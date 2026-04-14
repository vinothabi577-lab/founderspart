"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface FocusScoreProps {
  score: number;
}

const FocusScore = ({ score }: FocusScoreProps) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card p-8 flex flex-col items-center justify-center relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <h3 className="text-white/60 text-sm font-medium mb-6">Focus Score</h3>
      
      <div className="relative flex items-center justify-center">
        <svg className="w-48 h-48 transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-white/5"
          />
          <motion.circle
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl font-bold text-gradient"
          >
            {score}
          </motion.span>
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Optimal</span>
        </div>
      </div>

      <div className="mt-6 flex gap-4 w-full">
        <div className="flex-1 text-center">
          <p className="text-xs text-white/40 mb-1">Efficiency</p>
          <p className="text-sm font-bold text-blue-400">+12%</p>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex-1 text-center">
          <p className="text-xs text-white/40 mb-1">Consistency</p>
          <p className="text-sm font-bold text-purple-400">High</p>
        </div>
      </div>
    </div>
  );
};

export default FocusScore;