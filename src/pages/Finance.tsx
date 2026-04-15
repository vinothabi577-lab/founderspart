"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: string;
  date: string;
  note: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

const Finance = () => {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('focusos-finance', []);
  const [isAdding, setIsAdding] = useState(false);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({ type: 'Income' });

  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const addTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const tx: Transaction = {
      id: crypto.randomUUID(),
      type: newTx.type as any,
      amount: Number(newTx.amount) || 0,
      category: newTx.category || 'General',
      date: newTx.date || new Date().toISOString().split('T')[0],
      note: newTx.note || '',
    };
    setTransactions([tx, ...transactions]);
    setIsAdding(false);
    toast.success(`${tx.type} recorded`);
  };

  const expensePieData = transactions
    .filter(t => t.type === 'Expense')
    .reduce((acc: any[], t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) existing.value += t.amount;
      else acc.push({ name: t.category, value: t.amount });
      return acc;
    }, []);

  const incomePieData = transactions
    .filter(t => t.type === 'Income')
    .reduce((acc: any[], t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) existing.value += t.amount;
      else acc.push({ name: t.category, value: t.amount });
      return acc;
    }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 border-emerald-500/20">
              <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-500 mb-4"><TrendingUp size={24} /></div>
              <p className="text-white/40 text-sm font-medium">Total Income</p>
              <p className="text-3xl font-bold mt-1 text-emerald-500">₹{totalIncome.toLocaleString()}</p>
            </div>
            <div className="glass-card p-6 border-rose-500/20">
              <div className="p-3 w-fit rounded-xl bg-rose-500/10 text-rose-500 mb-4"><TrendingDown size={24} /></div>
              <p className="text-white/40 text-sm font-medium">Total Expenses</p>
              <p className="text-3xl font-bold mt-1 text-rose-500">₹{totalExpense.toLocaleString()}</p>
            </div>
            <div className="glass-card p-6 border-blue-500/20">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500"><Wallet size={24} /></div>
                <button onClick={() => setIsAdding(true)} className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"><Plus size={16} /></button>
              </div>
              <p className="text-white/40 text-sm font-medium">Net Profit</p>
              <p className="text-3xl font-bold mt-1 text-blue-500">₹{netProfit.toLocaleString()}</p>
            </div>
          </div>

          {isAdding && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8">
              <form onSubmit={addTransaction} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2"><label className="text-xs font-bold text-white/40 uppercase">Type</label><select onChange={e => setNewTx({...newTx, type: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50"><option value="Income">Income</option><option value="Expense">Expense</option></select></div>
                <div className="space-y-2"><label className="text-xs font-bold text-white/40 uppercase">Amount</label><input required type="number" onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50" /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-white/40 uppercase">Category</label><input required type="text" onChange={e => setNewTx({...newTx, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50" /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-white/40 uppercase">Date</label><input type="date" onChange={e => setNewTx({...newTx, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50" /></div>
                <div className="md:col-span-4 flex justify-end gap-4"><button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-white/40 font-bold">Cancel</button><button type="submit" className="bg-blue-600 px-8 py-3 rounded-xl font-bold glow-blue">Save</button></div>
              </form>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-8 h-[450px] flex flex-col">
              <h3 className="text-lg font-bold mb-4 text-emerald-500">Income Breakdown</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={incomePieData.length > 0 ? incomePieData : [{ name: 'No Income', value: 1 }]} 
                      cx="50%" cy="50%" 
                      innerRadius={60} 
                      outerRadius={100} 
                      paddingAngle={5} 
                      dataKey="value"
                    >
                      {incomePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                      {incomePieData.length === 0 && <Cell fill="rgba(255,255,255,0.05)" stroke="none" />}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-8 h-[450px] flex flex-col">
              <h3 className="text-lg font-bold mb-4 text-rose-500">Expense Breakdown</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={expensePieData.length > 0 ? expensePieData : [{ name: 'No Expenses', value: 1 }]} 
                      cx="50%" cy="50%" 
                      innerRadius={60} 
                      outerRadius={100} 
                      paddingAngle={5} 
                      dataKey="value"
                    >
                      {expensePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                      {expensePieData.length === 0 && <Cell fill="rgba(255,255,255,0.05)" stroke="none" />}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 overflow-hidden">
            <h3 className="text-lg font-bold mb-8">Recent Transactions</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", tx.type === 'Income' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                      {tx.type === 'Income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{tx.category}</p>
                      <p className="text-[10px] text-white/40">{tx.date} • {tx.note || 'No note'}</p>
                    </div>
                  </div>
                  <p className={cn("font-bold", tx.type === 'Income' ? "text-emerald-500" : "text-rose-500")}>
                    {tx.type === 'Income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </p>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-center text-white/20 py-10">No transactions yet</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Finance;