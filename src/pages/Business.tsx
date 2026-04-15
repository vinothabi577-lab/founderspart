"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ClientCard from '@/components/business/ClientCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  Plus, 
  Video, 
  Globe,
  Camera,
  Mic,
  Palette,
  Code,
  Smartphone,
  Monitor,
  Headphones,
  PenTool,
  FileText,
  Zap,
  Users,
  Briefcase,
  Tag,
  X
} from 'lucide-react';
import { toast } from 'sonner';

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
  type: string; 
  works: Work[];
}

interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: string;
  date: string;
  note: string;
}

interface Category {
  id: string;
  name: string;
  iconName: string;
  color: string;
}

const iconMap: Record<string, any> = {
  Video, Globe, Camera, Mic, Palette, Code, Smartphone, Monitor, Headphones, PenTool, Briefcase, Users, Zap, FileText, Tag
};

const Business = () => {
  const [clients, setClients] = useLocalStorage<Client[]>('focusos-clients-v2', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('focusos-finance', []);
  const [customCategories, setCustomCategories] = useLocalStorage<Category[]>('focusos-custom-categories', []);
  
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  
  const [newClient, setNewClient] = useState({ name: '', type: '' });
  const [newCategoryName, setNewCategoryName] = useState('');

  const allCategories = useMemo(() => customCategories, [customCategories]);

  const addCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    const category: Category = {
      id: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
      name: newCategoryName,
      iconName: 'Tag',
      color: 'blue'
    };

    if (allCategories.find(c => c.id === category.id)) {
      toast.error("Category already exists");
      return;
    }

    setCustomCategories([...customCategories, category]);
    setNewCategoryName('');
    setIsAddingCategory(false);
    
    if (!newClient.type) {
      setNewClient(prev => ({ ...prev, type: category.id }));
    }
    
    toast.success(`Category "${category.name}" added`);
  };

  const addClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;
    if (!newClient.type) {
      toast.error("Please create and select a category first");
      return;
    }
    
    const client: Client = {
      id: crypto.randomUUID(),
      name: newClient.name,
      type: newClient.type,
      works: []
    };
    setClients(prev => [client, ...prev]);
    setNewClient({ name: '', type: allCategories[0]?.id || '' });
    setIsAddingClient(false);
    toast.success(`Account created for ${client.name}`);
  };

  const deleteClient = (clientId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this client and all their records?");
    if (confirmed) {
      setClients(prev => prev.filter(c => c.id !== clientId));
      toast.error("Client deleted");
    }
  };

  const addWork = (clientId: string, description: string, amount: number) => {
    const work: Work = {
      id: crypto.randomUUID(),
      description,
      amount,
      status: 'Pending',
      paymentStatus: 'Unpaid',
      date: new Date().toISOString().split('T')[0]
    };
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, works: [work, ...c.works] } : c));
    toast.success("Work added to client account");
  };

  const handlePayment = (clientId: string, workId: string) => {
    const client = clients.find(c => c.id === clientId);
    const work = client?.works.find(w => w.id === workId);
    
    if (!client || !work || work.paymentStatus === 'Paid') return;

    const category = allCategories.find(cat => cat.id === client.type);
    const categoryName = category ? category.name : client.type;

    const tx: Transaction = {
      id: crypto.randomUUID(),
      type: 'Income',
      amount: work.amount,
      category: categoryName,
      date: new Date().toISOString().split('T')[0],
      note: `Business Payment: ${client.name} - ${work.description}`
    };

    setTransactions(prev => [tx, ...prev]);
    setClients(prev => prev.map(c => c.id === clientId ? {
      ...c,
      works: c.works.map(w => w.id === workId ? { ...w, paymentStatus: 'Paid', status: 'Completed' } : w)
    } : c));
    toast.success(`Payment of $${work.amount} recorded`);
  };

  const markAllAsPaid = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    const unpaidWorks = client.works.filter(w => w.paymentStatus === 'Unpaid');
    if (unpaidWorks.length === 0) {
      toast.info("All works are already paid");
      return;
    }

    const category = allCategories.find(cat => cat.id === client.type);
    const categoryName = category ? category.name : client.type;

    const newTransactions: Transaction[] = unpaidWorks.map(w => ({
      id: crypto.randomUUID(),
      type: 'Income',
      amount: w.amount,
      category: categoryName,
      date: new Date().toISOString().split('T')[0],
      note: `Business Payment: ${client.name} - ${w.description}`
    }));

    setTransactions(prev => [...newTransactions, ...prev]);
    setClients(prev => prev.map(c => c.id === clientId ? {
      ...c,
      works: c.works.map(w => ({ ...w, paymentStatus: 'Paid', status: 'Completed' }))
    } : c));
    toast.success(`All ${unpaidWorks.length} projects marked as paid`);
  };

  const deleteWork = (clientId: string, workId: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, works: c.works.filter(w => w.id !== workId) } : c));
    toast.error("Work entry deleted");
  };

  const groupedClients = allCategories.map(category => ({
    ...category,
    clients: clients.filter(c => c.type === category.id)
  })).filter(group => group.clients.length > 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Header />
        <div className="p-8 space-y-12">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gradient">Business CRM</h2>
              <p className="text-sm text-white/40">Track recurring clients and revenue across all services</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsAddingCategory(true)} 
                className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-white/10 transition-all"
              >
                <Tag size={20} /> New Category
              </button>
              <button 
                onClick={() => setIsAddingClient(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 glow-blue transition-all"
              >
                <Plus size={20} /> New Client
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isAddingCategory && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }} 
                className="glass-card p-6 overflow-hidden"
              >
                <form onSubmit={addCategory} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">Category Name</label>
                    <input 
                      required 
                      type="text" 
                      value={newCategoryName} 
                      onChange={e => setNewCategoryName(e.target.value)} 
                      placeholder="e.g. SEO Services, App Maintenance..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" 
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsAddingCategory(false)} className="px-6 py-3 text-white/40 font-bold">Cancel</button>
                    <button type="submit" className="bg-blue-600 px-8 py-3 rounded-xl font-bold glow-blue transition-all">Add Category</button>
                  </div>
                </form>
              </motion.div>
            )}

            {isAddingClient && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }} 
                className="glass-card p-6 overflow-hidden"
              >
                <form onSubmit={addClient} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">Client Name</label>
                    <input 
                      required 
                      type="text" 
                      value={newClient.name} 
                      onChange={e => setNewClient({...newClient, name: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" 
                    />
                  </div>
                  <div className="w-full md:w-64 space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">Service Type</label>
                    <select 
                      value={newClient.type} 
                      onChange={e => setNewClient({...newClient, type: e.target.value})} 
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-[#0a0a0a]">Select Category</option>
                      {allCategories.map(category => (
                        <option key={category.id} value={category.id} className="bg-[#0a0a0a] text-white">
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsAddingClient(false)} className="px-6 py-3 text-white/40 font-bold">Cancel</button>
                    <button type="submit" className="bg-blue-600 px-8 py-3 rounded-xl font-bold glow-blue transition-all">Create Client</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-12">
            {groupedClients.map(group => {
              const Icon = iconMap[group.iconName] || Tag;
              return (
                <div key={group.id} className="space-y-4">
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2 px-2">
                    <Icon size={16} className="text-blue-500" /> {group.name}
                  </h3>
                  <div className="space-y-4">
                    {group.clients.map(client => (
                      <ClientCard 
                        key={client.id}
                        client={client}
                        isExpanded={expandedClientId === client.id}
                        onToggle={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}
                        onAddWork={addWork}
                        onHandlePayment={handlePayment}
                        onMarkAllAsPaid={markAllAsPaid}
                        onDeleteWork={deleteWork}
                        onDeleteClient={deleteClient}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {groupedClients.length === 0 && (
              <div className="text-center py-20 glass-card">
                <Users size={48} className="mx-auto text-white/10 mb-4" />
                <p className="text-white/40 font-medium">No clients or categories yet.</p>
                <p className="text-xs text-white/20 mt-1">Start by adding a new category or client above.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Business;