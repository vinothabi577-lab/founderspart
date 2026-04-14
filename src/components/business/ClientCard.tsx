"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Globe, 
  DollarSign,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Briefcase,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Work {
  id: string;
  description: string;
  amount: number;
  status: 'Pending' | 'Completed';
  paymentStatus: 'Paid' | 'Unpaid';
  date: string;
}

interface Client {
  id: string;
  name: string;
  type: 'Video' | 'Website';
  works: Work[];
}

interface ClientCardProps {
  client: Client;
  isExpanded: boolean;
  onToggle: () => void;
  onAddWork: (clientId: string, description: string, amount: number) => void;
  onHandlePayment: (clientId: string, workId: string) => void;
  onMarkAllAsPaid: (clientId: string) => void;
  onDeleteWork: (clientId: string, workId: string) => void;
}

const ClientCard = ({ 
  client, 
  isExpanded, 
  onToggle, 
  onAddWork, 
  onHandlePayment, 
  onMarkAllAsPaid,
  onDeleteWork 
}: ClientCardProps) => {
  const [workDescription, setWorkDescription] = useState('');
  const [workAmount, setWorkAmount] = useState<number | ''>('');

  const handleAddWork = () => {
    if (!workDescription.trim() || !workAmount || Number(workAmount) <= 0) return;
    onAddWork(client.id, workDescription, Number(workAmount));
    setWorkDescription('');
    setWorkAmount('');
  };

  return (
    <div className="glass-card overflow-hidden">
      <div 
        className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center",
            client.type === 'Video' ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"
          )}>
            {client.type === 'Video' ? <Video size={24} /> : <Globe size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-bold">{client.name}</h3>
            <p className="text-xs text-white/40">{client.works.length} projects</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-xs text-white/40 uppercase font-bold">Total Value</p>
            <p className="text-lg font-bold text-emerald-500">
              ${client.works.reduce((acc, w) => acc + w.amount, 0).toLocaleString()}
            </p>
          </div>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="border-t border-white/5 bg-white/[0.01]"
          >
            <div className="p-6 space-y-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                      type="text" 
                      placeholder="Work description..."
                      value={workDescription}
                      onChange={e => setWorkDescription(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                      <input 
                        type="number" 
                        placeholder="Amount"
                        value={workAmount}
                        onChange={e => setWorkAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-8 pr-4 text-sm focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <button 
                      onClick={handleAddWork}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold py-2 transition-all glow-blue"
                    >
                      Add Entry
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => onMarkAllAsPaid(client.id)} 
                  className="lg:w-48 py-3 px-4 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Check size={14} /> Mark All Paid
                </button>
              </div>

              <div className="space-y-3">
                {client.works.map((work) => (
                  <div key={work.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40"><Briefcase size={16} /></div>
                      <div>
                        <p className="text-sm font-bold">{work.description}</p>
                        <p className="text-[10px] text-white/40">{work.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-bold text-emerald-500">${work.amount.toLocaleString()}</p>
                      {work.paymentStatus === 'Unpaid' ? (
                        <button 
                          onClick={() => onHandlePayment(client.id, work.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700 glow-blue transition-all"
                        >
                          <CreditCard size={12} /> Mark as Paid
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Paid & Completed
                        </div>
                      )}
                      <button 
                        onClick={() => onDeleteWork(client.id, work.id)} 
                        className="p-1.5 text-white/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {client.works.length === 0 && (
                  <p className="text-center text-white/20 py-4 text-sm">No projects recorded for this client yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientCard;