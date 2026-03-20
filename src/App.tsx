/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Menu, 
  MessageSquare, 
  ShieldCheck, 
  Star, 
  Users, 
  X, 
  ChevronDown,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Search,
  ArrowRight,
  PlayCircle,
  Settings,
  CreditCard,
  LogIn,
  LogOut,
  UserPlus,
  Edit,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Zap,
  TrendingUp,
  Award,
  Wallet,
  Bitcoin,
  ShoppingCart,
  ListOrdered,
  LayoutGrid,
  Code,
  Layers,
  Gift,
  Monitor,
  Bell,
  HelpCircle,
  Music2,
  Send,
  Music,
  Tv,
  Linkedin,
  MessageCircle,
  Edit2,
  Check,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import { supabase, isSupabaseConfigured } from './supabase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  getDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  where,
  getDocFromServer
} from 'firebase/firestore';

// --- Constants ---
const SMM_LOGO = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTswM_Abecy8c0cF_Y4j60aV6fuNYBMRPFH6g&s";

// --- Types ---
interface Service {
  id: string;
  platform: string;
  name: string;
  price: number;
  min: string;
  max: string;
  description?: string;
  imageUrl?: string;
  averageTime?: string;
}

interface UserProfile {
  uid: string;
  email: string;
  role: 'user' | 'admin';
  balance: number;
}

interface Order {
  id: string;
  uid: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'completed' | 'cancelled';
  link: string;
  createdAt: string;
}

interface TicketReply {
  uid: string;
  role: 'user' | 'admin';
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  uid: string;
  email: string;
  subject: string;
  message: string;
  screenshot?: string;
  status: 'open' | 'replied' | 'closed';
  createdAt: string;
  replies?: TicketReply[];
}

interface PaymentRequest {
  id: string;
  uid: string;
  email: string;
  amount: number;
  method: 'paypal' | 'crypto';
  screenshot: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: any[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          role: user.email === 'smubasshir532@gmail.com' ? 'admin' : 'user',
          balance: 100 // Welcome bonus
        });
      }
      onClose();
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert("Domain not authorized. If you are using Netlify, please add your Netlify domain to Firebase Console -> Authentication -> Settings -> Authorized domains.");
      } else {
        alert("Login failed: " + error.message);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#2D2B55] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/5"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">Sign In to Lombardi</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X /></button>
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  className="w-full bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-medium text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-medium text-white"
                />
              </div>
              <button 
                onClick={() => alert("Email login is currently disabled. Please use Google login.")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20"
              >
                Sign In
              </button>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#2D2B55] px-4 text-slate-400 font-bold tracking-widest">Or continue with</span>
              </div>
            </div>
            
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-sm"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
            
            <p className="mt-8 text-center text-xs text-slate-400">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const SupportView = ({ 
  user, 
  profile, 
  tickets 
}: { 
  user: User | null; 
  profile: UserProfile | null; 
  tickets: Ticket[] 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', screenshot: '' });
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTicket = async () => {
    if (!user || !newTicket.subject || !newTicket.message || isSubmitting) return;
    setIsSubmitting(true);
    const ticketId = Math.random().toString(36).substring(2, 9);
    const path = `tickets/${ticketId}`;
    try {
      await setDoc(doc(db, 'tickets', ticketId), {
        id: ticketId,
        uid: user.uid,
        email: user.email || '',
        subject: newTicket.subject,
        message: newTicket.message,
        screenshot: newTicket.screenshot || null,
        status: 'open',
        createdAt: new Date().toISOString(),
        replies: []
      });
      setIsCreating(false);
      setNewTicket({ subject: '', message: '', screenshot: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (ticket: Ticket) => {
    if (!user || !replyMessage || isSubmitting) return;
    setIsSubmitting(true);
    const path = `tickets/${ticket.id}`;
    try {
      const newReply: TicketReply = {
        uid: user.uid,
        role: 'user',
        message: replyMessage,
        createdAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'tickets', ticket.id), {
        replies: [...(ticket.replies || []), newReply],
        status: 'open'
      });
      setReplyMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTicket(prev => ({ ...prev, screenshot: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (selectedTicket) {
    const ticket = tickets.find(t => t.id === selectedTicket.id) || selectedTicket;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button 
          onClick={() => setSelectedTicket(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Tickets
        </button>

        <div className="bg-[#2D2B55] rounded-3xl p-8 border border-white/5 shadow-2xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                  ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  ticket.status === 'replied' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-slate-500/10 text-slate-400 border-white/10'
                }`}>
                  {ticket.status}
                </span>
                <span className="text-slate-500 text-xs">{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{ticket.subject}</h2>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#1E1C39] p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {ticket.email[0].toUpperCase()}
                </div>
                <span className="text-white font-bold">{ticket.email}</span>
                <span className="text-slate-500 text-xs ml-auto">Original Message</span>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap">{ticket.message}</p>
              {ticket.screenshot && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">Attachment:</p>
                  <img 
                    src={ticket.screenshot} 
                    alt="Screenshot" 
                    className="max-w-md rounded-xl border border-white/10 shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            {ticket.replies?.map((reply, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${
                reply.role === 'admin' 
                  ? 'bg-blue-600/10 border-blue-500/20 ml-8' 
                  : 'bg-[#1E1C39] border-white/5'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    reply.role === 'admin' ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}>
                    {reply.role === 'admin' ? 'A' : ticket.email[0].toUpperCase()}
                  </div>
                  <span className="text-white font-bold">{reply.role === 'admin' ? 'Support Agent' : 'You'}</span>
                  <span className="text-slate-500 text-xs ml-auto">{new Date(reply.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-300 whitespace-pre-wrap">{reply.message}</p>
              </div>
            ))}

            {ticket.status !== 'closed' && (
              <div className="pt-6 border-t border-white/5">
                <textarea
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full bg-[#1E1C39] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 min-h-[120px] mb-4"
                />
                <button
                  onClick={() => handleReply(ticket)}
                  disabled={!replyMessage || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-white/5 disabled:text-slate-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Send Reply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Support Tickets</h1>
          <p className="text-slate-400">Need help? Create a ticket and our team will get back to you.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Create Ticket
        </button>
      </div>

      {isCreating && (
        <div className="bg-[#2D2B55] rounded-3xl p-8 border border-blue-500/30 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">New Support Ticket</h2>
            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
              <input 
                type="text"
                value={newTicket.subject}
                onChange={e => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Payment Issue, Order Not Starting"
                className="w-full bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Message</label>
              <textarea 
                value={newTicket.message}
                onChange={e => setNewTicket(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Describe your issue in detail..."
                className="w-full bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-h-[150px]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Screenshot (Optional)</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-6 py-3 text-white transition-all flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  <span>{newTicket.screenshot ? 'Change Image' : 'Upload Screenshot'}</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {newTicket.screenshot && (
                  <button 
                    onClick={() => setNewTicket(prev => ({ ...prev, screenshot: '' }))}
                    className="text-red-400 hover:text-red-300 text-sm font-bold"
                  >
                    Remove
                  </button>
                )}
              </div>
              {newTicket.screenshot && (
                <div className="mt-4">
                  <img src={newTicket.screenshot} alt="Preview" className="h-32 rounded-lg border border-white/10" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
            <button
              onClick={handleCreateTicket}
              disabled={!newTicket.subject || !newTicket.message || isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-white/5 disabled:text-slate-500 text-white py-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-600/20"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {tickets.length === 0 ? (
          <div className="text-center py-20 bg-[#2D2B55] rounded-3xl border border-white/5">
            <div className="w-16 h-16 bg-white/5 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tickets yet</h3>
            <p className="text-slate-500">When you create a support ticket, it will appear here.</p>
          </div>
        ) : (
          tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="w-full text-left bg-[#2D2B55] hover:bg-[#343166] p-6 rounded-2xl border border-white/5 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                      ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      ticket.status === 'replied' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-slate-500/10 text-slate-400 border-white/10'
                    }`}>
                      {ticket.status}
                    </span>
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">ID: {ticket.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{ticket.subject}</h3>
                  <p className="text-slate-400 text-sm line-clamp-1">{ticket.message}</p>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-sm mb-1">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                  <div className="text-slate-500 text-xs">{ticket.replies?.length || 0} replies</div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

const AdminTicketsView = ({ tickets }: { tickets: Ticket[] }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminReply = async (ticket: Ticket, newStatus: 'replied' | 'closed' = 'replied') => {
    if (!replyMessage && newStatus === 'replied') return;
    setIsSubmitting(true);
    const path = `tickets/${ticket.id}`;
    try {
      const updates: any = { status: newStatus };
      if (replyMessage) {
        const newReply: TicketReply = {
          uid: auth.currentUser?.uid || 'admin',
          role: 'admin',
          message: replyMessage,
          createdAt: new Date().toISOString()
        };
        updates.replies = [...(ticket.replies || []), newReply];
      }
      await updateDoc(doc(db, 'tickets', ticket.id), updates);
      setReplyMessage('');
      if (newStatus === 'closed') setSelectedTicket(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedTicket) {
    const ticket = tickets.find(t => t.id === selectedTicket.id) || selectedTicket;
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedTicket(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to All Tickets
        </button>

        <div className="bg-[#2D2B55] rounded-3xl p-8 border border-white/5 shadow-2xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                  ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  ticket.status === 'replied' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-slate-500/10 text-slate-400 border-white/10'
                }`}>
                  {ticket.status}
                </span>
                <span className="text-slate-500 text-xs">{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{ticket.subject}</h2>
              <p className="text-blue-400 text-sm mt-1">From: {ticket.email} (UID: {ticket.uid})</p>
            </div>
            <div className="flex gap-2">
              {ticket.status !== 'closed' && (
                <button 
                  onClick={() => handleAdminReply(ticket, 'closed')}
                  className="bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-red-500/20"
                >
                  Close Ticket
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#1E1C39] p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {ticket.email[0].toUpperCase()}
                </div>
                <span className="text-white font-bold">{ticket.email}</span>
                <span className="text-slate-500 text-xs ml-auto">User Message</span>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap">{ticket.message}</p>
              {ticket.screenshot && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">Attachment:</p>
                  <a href={ticket.screenshot} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={ticket.screenshot} 
                      alt="Screenshot" 
                      className="max-w-md rounded-xl border border-white/10 shadow-lg hover:opacity-90 transition-opacity"
                      referrerPolicy="no-referrer"
                    />
                  </a>
                </div>
              )}
            </div>

            {ticket.replies?.map((reply, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${
                reply.role === 'admin' 
                  ? 'bg-blue-600/10 border-blue-500/20' 
                  : 'bg-[#1E1C39] border-white/5 ml-8'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    reply.role === 'admin' ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}>
                    {reply.role === 'admin' ? 'A' : ticket.email[0].toUpperCase()}
                  </div>
                  <span className="text-white font-bold">{reply.role === 'admin' ? 'Support Agent (You)' : 'User'}</span>
                  <span className="text-slate-500 text-xs ml-auto">{new Date(reply.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-300 whitespace-pre-wrap">{reply.message}</p>
              </div>
            ))}

            {ticket.status !== 'closed' && (
              <div className="pt-6 border-t border-white/5">
                <textarea
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder="Type your reply to the user..."
                  className="w-full bg-[#1E1C39] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 min-h-[120px] mb-4"
                />
                <button
                  onClick={() => handleAdminReply(ticket)}
                  disabled={!replyMessage || isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-white/5 disabled:text-slate-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Send Reply & Mark as Replied
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Manage Support Tickets</h2>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-emerald-400 font-bold">{tickets.filter(t => t.status === 'open').length} Open</span>
          </div>
          <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <span className="text-blue-400 font-bold">{tickets.filter(t => t.status === 'replied').length} Replied</span>
          </div>
        </div>
      </div>

      <div className="bg-[#2D2B55] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tickets.map(ticket => (
              <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-white font-bold text-sm">{ticket.email}</div>
                  <div className="text-slate-500 text-[10px] font-mono">{ticket.uid}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-white font-medium">{ticket.subject}</div>
                  <div className="text-slate-500 text-xs line-clamp-1">{ticket.message}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                    ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    ticket.status === 'replied' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-slate-500/10 text-slate-400 border-white/10'
                  }`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 text-sm">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedTicket(ticket)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    View & Reply
                  </button>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No support tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminDashboard = ({ services, tickets }: { services: Service[], tickets: Ticket[] }) => {
  const [activeTab, setActiveTab] = useState<'services' | 'users' | 'tickets' | 'supabase'>('services');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Service | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newService, setNewService] = useState<Partial<Service>>({
    platform: 'Instagram',
    name: '',
    price: 0,
    min: '100',
    max: '10000',
    description: '',
    imageUrl: '',
    averageTime: '15 minutes'
  });

  const [userSearchEmail, setUserSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [addBalanceAmount, setAddBalanceAmount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchUser = async () => {
    if (!userSearchEmail) return;
    setIsSearching(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', userSearchEmail));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0];
        setFoundUser({ uid: docData.id, ...docData.data() } as UserProfile);
      } else {
        setFoundUser(null);
        alert("User not found");
      }
    } catch (error) {
      console.error("Search User Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpdateUserBalance = async () => {
    if (!foundUser) return;
    try {
      const newBalance = (foundUser.balance || 0) + addBalanceAmount;
      await updateDoc(doc(db, 'users', foundUser.uid), { balance: newBalance });
      setFoundUser({ ...foundUser, balance: newBalance });
      setAddBalanceAmount(0);
      alert("Balance updated successfully!");
    } catch (error) {
      console.error("Update Balance Error:", error);
    }
  };

  const stats = [
    { label: 'Total Services', value: services.length, icon: Layers, color: 'text-blue-400' },
    { label: 'Platforms', value: new Set(services.map(s => s.platform)).size, icon: LayoutGrid, color: 'text-emerald-400' },
    { label: 'Avg. Price', value: `$${(services.reduce((acc, s) => acc + s.price, 0) / (services.length || 1)).toFixed(2)}`, icon: DollarSign, color: 'text-amber-400' },
  ];

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setEditForm({ ...service });
  };

  const handleSave = async () => {
    if (editForm) {
      const path = `services/${editForm.id}`;
      try {
        await updateDoc(doc(db, 'services', editForm.id), {
          price: Number(editForm.price),
          description: editForm.description || "",
          imageUrl: editForm.imageUrl || "",
          averageTime: editForm.averageTime || "15 minutes"
        });
        setEditingId(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  };

  const handleDeleteService = async (id: string) => {
    const path = `services/${id}`;
    try {
      await deleteDoc(doc(db, 'services', id));
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleDeleteAllServices = async () => {
    if (services.length === 0) return;
    try {
      const promises = services.map(s => deleteDoc(doc(db, 'services', s.id)));
      await Promise.all(promises);
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'services/all');
    }
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.platform || !newService.price) return;
    const id = Math.random().toString(36).substring(2, 9);
    const path = `services/${id}`;
    try {
      const serviceData = { ...newService, id } as Service;
      await setDoc(doc(db, 'services', id), serviceData);
      setIsAdding(false);
      setNewService({
        platform: 'Instagram',
        name: '',
        price: 0,
        min: '100',
        max: '10000',
        description: '',
        imageUrl: '',
        averageTime: '15 minutes'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-4 border-b border-white/5 pb-4">
        <button 
          onClick={() => setActiveTab('services')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'services' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Services & Users
        </button>
        <button 
          onClick={() => setActiveTab('tickets')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'tickets' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Support Tickets ({tickets.filter(t => t.status === 'open').length})
        </button>
        <button 
          onClick={() => setActiveTab('supabase')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'supabase' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Supabase
        </button>
      </div>

      {activeTab === 'services' && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-[#2D2B55] rounded-3xl p-6 border border-white/5 shadow-xl flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#2D2B55] rounded-3xl p-8 border border-white/5 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Users className="text-blue-400 w-6 h-6" />
              <h2 className="text-2xl font-bold text-white">User Management</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Search User by Email</label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="user@example.com" 
                    value={userSearchEmail}
                    onChange={e => setUserSearchEmail(e.target.value)}
                    className="flex-1 bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                  <button 
                    onClick={handleSearchUser}
                    disabled={isSearching}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>

              {foundUser && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-bold">{foundUser.email}</div>
                      <div className="text-xs text-slate-500">UID: {foundUser.uid}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 uppercase font-bold">Current Balance</div>
                      <div className="text-xl font-bold text-emerald-400">${foundUser.balance?.toFixed(2) || "0.00"}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Add Balance ($)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Amount to add" 
                        value={addBalanceAmount}
                        onChange={e => setAddBalanceAmount(Number(e.target.value))}
                        className="flex-1 bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={handleUpdateUserBalance}
                        className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600"
                      >
                        Add Funds
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className="bg-[#2D2B55] rounded-3xl p-8 border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Settings className="text-blue-400 w-6 h-6" />
                <h2 className="text-2xl font-bold text-white">Admin Controls</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Service
                </button>
                {services.length > 0 && (
                  <button 
                    onClick={() => setConfirmDeleteId('all')}
                    className="flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-xl font-bold hover:bg-red-500/20 transition-all border border-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" /> Delete All
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {(confirmDeleteId === 'all') && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center"
                >
                  <h3 className="text-lg font-bold text-red-400 mb-2">Delete All Services?</h3>
                  <p className="text-slate-400 mb-4">This action is permanent and cannot be undone.</p>
                  <div className="flex justify-center gap-3">
                    <button onClick={handleDeleteAllServices} className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-600">Yes, Delete All</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="bg-white/10 text-white px-6 py-2 rounded-lg font-bold hover:bg-white/20">Cancel</button>
                  </div>
                </motion.div>
              )}

            {isAdding && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-8 p-6 bg-white/5 rounded-2xl border border-white/10"
              >
                <h3 className="text-lg font-bold mb-4 text-white">Add New Service</h3>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <input 
                    type="text" 
                    placeholder="Service Name" 
                    value={newService.name}
                    onChange={e => {
                      const name = e.target.value;
                      let platform = newService.platform;
                      const lowerName = name.toLowerCase();
                      if (lowerName.includes('tiktok')) platform = 'TikTok';
                      else if (lowerName.includes('instagram')) platform = 'Instagram';
                      else if (lowerName.includes('youtube')) platform = 'YouTube';
                      else if (lowerName.includes('facebook')) platform = 'Facebook';
                      else if (lowerName.includes('twitter')) platform = 'Twitter';
                      setNewService({...newService, name, platform});
                    }}
                    className="bg-[#1E1C39] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <select 
                    value={newService.platform}
                    onChange={e => setNewService({...newService, platform: e.target.value})}
                    className="bg-[#1E1C39] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Twitter">Twitter</option>
                  </select>
                  <input 
                    type="number" 
                    placeholder="Price per 1000" 
                    value={newService.price}
                    onChange={e => setNewService({...newService, price: Number(e.target.value)})}
                    className="bg-[#1E1C39] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Min" 
                    value={newService.min}
                    onChange={e => setNewService({...newService, min: e.target.value})}
                    className="bg-[#1E1C39] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Max" 
                    value={newService.max}
                    onChange={e => setNewService({...newService, max: e.target.value})}
                    className="bg-[#1E1C39] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Description" 
                    value={newService.description}
                    onChange={e => setNewService({...newService, description: e.target.value})}
                    className="bg-[#1E1C39] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Image URL" 
                    value={newService.imageUrl}
                    onChange={e => setNewService({...newService, imageUrl: e.target.value})}
                    className="bg-[#1E1C39] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddService} className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-600">Save Service</button>
                  <button onClick={() => setIsAdding(false)} className="bg-white/10 text-white px-6 py-2 rounded-lg font-bold hover:bg-white/20">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-4 text-slate-400 font-bold text-sm uppercase">Service</th>
                  <th className="py-4 text-slate-400 font-bold text-sm uppercase">Price ($)</th>
                  <th className="py-4 text-slate-400 font-bold text-sm uppercase">Description</th>
                  <th className="py-4 text-slate-400 font-bold text-sm uppercase">Image URL</th>
                  <th className="py-4 text-slate-400 font-bold text-sm uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {services.map(service => (
                  <tr key={service.id}>
                    <td className="py-4">
                      <div className="font-semibold text-white">{service.name}</div>
                      <div className="text-xs text-blue-400 font-bold uppercase">{service.platform}</div>
                    </td>
                    <td className="py-4">
                      {editingId === service.id ? (
                        <input 
                          type="number" 
                          step="0.01"
                          value={editForm?.price}
                          onChange={e => setEditForm(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                          className="w-24 bg-[#1E1C39] border border-white/10 rounded px-2 py-1 text-white"
                        />
                      ) : (
                        <span className="font-bold text-emerald-400">${service.price}</span>
                      )}
                    </td>
                    <td className="py-4">
                      {editingId === service.id ? (
                        <input 
                          type="text" 
                          value={editForm?.description || ""}
                          onChange={e => setEditForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                          className="w-full bg-[#1E1C39] border border-white/10 rounded px-2 py-1 text-xs text-white"
                          placeholder="Service description..."
                        />
                      ) : (
                        <span className="text-xs text-slate-400 truncate max-w-[150px]">{service.description || "No description"}</span>
                      )}
                    </td>
                    <td className="py-4">
                      {editingId === service.id ? (
                        <input 
                          type="text" 
                          value={editForm?.imageUrl || ""}
                          onChange={e => setEditForm(prev => prev ? { ...prev, imageUrl: e.target.value } : null)}
                          className="w-full bg-[#1E1C39] border border-white/10 rounded px-2 py-1 text-xs text-white"
                          placeholder="https://..."
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {service.imageUrl ? (
                            <img src={service.imageUrl} className="w-8 h-8 rounded object-cover" alt="Service" referrerPolicy="no-referrer" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-500" />
                          )}
                          <span className="text-xs text-slate-400 truncate max-w-[150px]">{service.imageUrl || "No image"}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === service.id ? (
                          <button onClick={handleSave} className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors">
                            <Save className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleEdit(service)} className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {confirmDeleteId === service.id ? (
                          <div className="flex items-center gap-1 bg-red-600/20 p-1 rounded-lg border border-red-500/30">
                            <button 
                              onClick={() => handleDeleteService(service.id)} 
                              className="bg-red-600 text-white px-3 py-1 rounded-md text-[10px] font-bold hover:bg-red-700 transition-all"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(null)} 
                              className="bg-white/10 text-white px-3 py-1 rounded-md text-[10px] font-bold hover:bg-white/20 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmDeleteId(service.id)} 
                            className="bg-red-600/10 text-red-400 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                            title="Delete Service"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}

    {activeTab === 'tickets' && (
        <AdminTicketsView tickets={tickets} />
      )}

      {activeTab === 'supabase' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${isSupabaseConfigured() ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSupabaseConfigured() ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Supabase Integration</h3>
                <p className={`text-sm ${isSupabaseConfigured() ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isSupabaseConfigured() ? 'Connected & Ready' : 'Configuration Required'}
                </p>
              </div>
            </div>
            
            {!isSupabaseConfigured() ? (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm leading-relaxed">
                  To complete the connection, you need to add your Supabase project details to the application secrets.
                </p>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Required Secrets:</p>
                  <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                    <li><code>VITE_SUPABASE_URL</code></li>
                    <li><code>VITE_SUPABASE_ANON_KEY</code></li>
                  </ul>
                </div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold bg-amber-400/5 p-3 rounded-lg border border-amber-400/10">
                  <HelpCircle className="w-4 h-4" />
                  <span>Go to Settings (⚙️) &rarr; Secrets to add these values.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">
                  Supabase is now connected. You can use the <code>supabase</code> client in your code to interact with your database, authentication, and storage.
                </p>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Connection Details:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Project URL</p>
                      <p className="text-sm text-white truncate">{(import.meta as any).env.VITE_SUPABASE_URL}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Status</p>
                      <p className="text-sm text-emerald-400 font-bold">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#1E1C39] p-6 rounded-2xl border border-white/5">
            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-400" />
              Quick Usage Guide
            </h4>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs text-blue-300 overflow-x-auto border border-white/5">
{`// 1. Import the client
import { supabase } from './supabase';

// 2. Fetch data
const { data, error } = await supabase
  .from('your_table')
  .select('*');

// 3. Insert data
await supabase
  .from('your_table')
  .insert([{ name: 'New Item' }]);`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

const AddFundsModal = ({ 
  isOpen, 
  onClose, 
  user, 
  profile 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: User | null;
  profile: UserProfile | null;
}) => {
  const [amount, setAmount] = useState(500);
  const [method, setMethod] = useState<'paypal' | 'crypto'>('paypal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddFunds = async () => {
    if (!user || !profile || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await updateDoc(doc(db, 'users', user.uid), {
        balance: (profile.balance || 0) + amount
      });

      onClose();
    } catch (error) {
      console.error("Add Funds Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#2D2B55] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/5"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Add Funds</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X /></button>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-5 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Direct PayPal</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Fastest manual payment</p>
                  </div>
                </div>
                <a 
                  href="https://www.paypal.me/mubasshir875" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  Pay via PayPal.me <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-3">Select Amount ($)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 500, 1000, 2000, 5000, 10000].map(val => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-2 rounded-lg font-bold border transition-all ${
                        amount === val 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-blue-400'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
                <input 
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full mt-3 bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                  placeholder="Custom Amount"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-3">Payment Method</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setMethod('paypal')}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      method === 'paypal' 
                        ? 'bg-blue-600/10 border-blue-600' 
                        : 'bg-white/5 border-white/10 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white">PayPal / Cards</div>
                        <div className="text-xs text-slate-400">Instant delivery</div>
                      </div>
                    </div>
                    {method === 'paypal' && <div className="w-4 h-4 bg-blue-600 rounded-full" />}
                  </button>

                  <button
                    onClick={() => setMethod('crypto')}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      method === 'crypto' 
                        ? 'bg-orange-500/10 border-orange-500' 
                        : 'bg-white/5 border-white/10 hover:border-orange-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400">
                        <Bitcoin className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white">Crypto (BTC/ETH/USDT)</div>
                        <div className="text-xs text-slate-400">Manual verification (5-15 min)</div>
                      </div>
                    </div>
                    {method === 'crypto' && <div className="w-4 h-4 bg-orange-500 rounded-full" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button 
                  onClick={handleAddFunds}
                  disabled={isSubmitting || amount <= 0}
                  className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                    !isSubmitting && amount > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20' 
                      : 'bg-white/5 text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                  {isSubmitting ? "Processing..." : `Pay $${amount.toLocaleString()}`}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const OrderModal = ({ 
  isOpen, 
  onClose, 
  service, 
  user, 
  profile 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  service: Service | null; 
  user: User | null;
  profile: UserProfile | null;
}) => {
  const [quantity, setQuantity] = useState(1000);
  const [link, setLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (service) {
      setQuantity(Number(service.min) || 1000);
    }
  }, [service]);

  if (!service) return null;

  const totalPrice = (service.price * quantity) / 1000;
  const canAfford = (profile?.balance || 0) >= totalPrice;

  const handleOrder = async () => {
    if (!user || !profile || !canAfford || isSubmitting) return;
    
    setIsSubmitting(true);
    const orderId = Math.random().toString(36).substring(2, 15);
    const path = `orders/${orderId}`;
    try {
      const orderData: Order = {
        id: orderId,
        uid: user.uid,
        serviceId: service.id,
        serviceName: service.name,
        quantity: quantity,
        totalPrice: totalPrice,
        status: 'pending',
        link: link,
        createdAt: new Date().toISOString()
      };

      // Create order
      await setDoc(doc(db, 'orders', orderId), orderData);
      
      // Deduct balance
      await updateDoc(doc(db, 'users', user.uid), {
        balance: profile.balance - totalPrice
      });

      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#2D2B55] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/5"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Place Order</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X /></button>
            </div>

            <div className="bg-blue-600/10 p-4 rounded-xl mb-6">
              <div className="text-xs text-blue-400 font-bold uppercase mb-1">{service.platform}</div>
              <div className="text-white font-bold">{service.name}</div>
              <div className="text-emerald-400 font-bold mt-1">${service.price.toFixed(2)} per 1000</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Quantity</label>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                  min={Number(service.min)}
                  max={Number(service.max)}
                />
                <p className="text-xs text-slate-400 mt-1">Min: {service.min} / Max: {service.max}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Link</label>
                <input 
                  type="text" 
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  placeholder="https://social-media.com/p/..."
                  className="w-full bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400 font-semibold">Total Price:</span>
                  <span className="text-2xl font-bold text-blue-400">${totalPrice.toFixed(2)}</span>
                </div>
                
                {!canAfford && (
                  <p className="text-red-500 text-sm font-bold mb-4 text-center">Insufficient balance. Please add funds.</p>
                )}

                <button 
                  onClick={handleOrder}
                  disabled={!canAfford || !link || isSubmitting}
                  className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${
                    canAfford && link && !isSubmitting
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20' 
                      : 'bg-white/5 text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isSubmitting ? "Processing..." : "Confirm Order"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const OrderHistory = ({ orders }: { orders: Order[] }) => {
  if (orders.length === 0) return null;

  return (
    <div className="bg-[#2D2B55] rounded-3xl p-8 border border-white/5 shadow-2xl mb-12">
      <div className="flex items-center gap-3 mb-8">
        <Clock className="text-blue-400 w-6 h-6" />
        <h2 className="text-2xl font-bold text-white">Your Orders</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5">
              <th className="py-4 text-slate-400 font-bold text-sm uppercase">Service</th>
              <th className="py-4 text-slate-400 font-bold text-sm uppercase">Quantity</th>
              <th className="py-4 text-slate-400 font-bold text-sm uppercase">Price</th>
              <th className="py-4 text-slate-400 font-bold text-sm uppercase">Status</th>
              <th className="py-4 text-slate-400 font-bold text-sm uppercase text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map(order => (
              <tr key={order.id}>
                <td className="py-4">
                  <div className="font-semibold text-white">{order.serviceName}</div>
                  <div className="text-xs text-slate-500">ID: {order.id}</div>
                </td>
                <td className="py-4 font-bold text-slate-300">{order.quantity.toLocaleString()}</td>
                <td className="py-4 font-bold text-emerald-400">${order.totalPrice.toFixed(2)}</td>
                <td className="py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    order.status === 'pending' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-4 text-right text-slate-500 text-sm">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const NewOrder = ({ 
  services, 
  onOrder,
  profile,
  onAddFundsClick
}: { 
  services: Service[]; 
  onOrder: (service: Service, quantity: number, link: string) => void;
  profile: UserProfile | null;
  onAddFundsClick: () => void;
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Instagram');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const categories = Array.from(new Set(services.map(s => s.platform)));
  const filteredServices = services.filter(s => s.platform === selectedCategory && s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedService = services.find(s => s.id === selectedServiceId);
  const totalPrice = selectedService ? (selectedService.price * quantity) / 1000 : 0;

  useEffect(() => {
    if (filteredServices.length > 0 && !selectedServiceId) {
      setSelectedServiceId(filteredServices[0].id);
    }
  }, [selectedCategory, filteredServices, selectedServiceId]);

  const handlePlaceOrder = () => {
    if (selectedService && link && quantity >= Number(selectedService.min) && quantity <= Number(selectedService.max)) {
      onOrder(selectedService, quantity, link);
      setLink('');
      setQuantity(100);
    }
  };

  const platformIcons: Record<string, any> = {
    'Instagram': Instagram,
    'TikTok': Music2,
    'YouTube': Youtube,
    'Facebook': Facebook,
    'Twitter': Twitter,
    'Telegram': Send,
    'Spotify': Music,
    'Twitch': Tv,
    'LinkedIn': Linkedin,
  };

  return (
    <div className="space-y-8">
      {/* Top Header Message */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          🤝 OUR BELIEVE - QUALITY OVER QUANTITY 🤝
        </h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#2D2B55] rounded-2xl p-6 flex items-center gap-4 shadow-2xl border border-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white truncate max-w-[150px]">
              {profile?.email?.split('@')[0] || 'User'}
            </div>
            <div className="text-slate-400 text-sm">Welcome to panel!</div>
          </div>
        </div>

        <div className="bg-[#2D2B55] rounded-2xl p-6 flex items-center gap-4 shadow-2xl border border-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">$0</div>
            <div className="text-slate-400 text-sm">Spent balance</div>
          </div>
        </div>

        <div className="bg-[#2D2B55] rounded-2xl p-6 flex items-center gap-4 shadow-2xl border border-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">${profile?.balance?.toFixed(2) || '0.00'}</div>
            <div className="text-slate-400 text-sm">To Add more Fund <span onClick={onAddFundsClick} className="text-blue-400 font-bold cursor-pointer hover:underline">CLICK HERE</span></div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Accordion */}
          <div className="bg-[#2D2B55] rounded-2xl overflow-hidden shadow-2xl border border-white/5">
            <button 
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="w-full p-4 flex items-center justify-between text-red-400 font-bold text-sm uppercase tracking-wider"
            >
              THINGS TO BE KNOWN BEFORE PLACING ORDER
              <Plus className={`w-5 h-5 transition-transform ${isAccordionOpen ? 'rotate-45' : ''}`} />
            </button>
            <AnimatePresence>
              {isAccordionOpen && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden bg-white/5"
                >
                  <div className="p-4 text-slate-300 text-sm leading-relaxed">
                    1. Make sure your account is public.<br/>
                    2. Don't place multiple orders for the same link at the same time.<br/>
                    3. Read the service description carefully before ordering.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Form Card */}
          <div className="bg-[#2D2B55] rounded-3xl p-8 shadow-2xl border border-white/5">
            {/* Platform Icons */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-8">
              {categories.map(cat => {
                const Icon = platformIcons[cat] || LayoutGrid;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-3 rounded-xl flex items-center justify-center transition-all border ${
                      selectedCategory === cat 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-blue-400/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>

            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search services..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1E1C39] border border-white/10 rounded-xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
                <div className="relative">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedServiceId('');
                    }}
                    className="w-full bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-4 appearance-none focus:outline-none focus:border-blue-500 font-medium text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Service</label>
                <div className="relative">
                  <select 
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-4 appearance-none focus:outline-none focus:border-blue-500 font-medium text-white"
                  >
                    {filteredServices.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - ${s.price.toFixed(2)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {selectedService?.description && (
                <div className="bg-blue-600/5 border border-blue-500/10 rounded-xl p-4">
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Service Description</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedService.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Link</label>
                  <input 
                    type="text" 
                    placeholder="https://..." 
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-blue-500 font-medium text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quantity</label>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-blue-500 font-medium text-white"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Charge</div>
                  <div className="text-2xl font-bold text-blue-400">${totalPrice.toFixed(2)}</div>
                </div>
                <button 
                  onClick={handlePlaceOrder}
                  disabled={!link || quantity < Number(selectedService?.min || 0) || (profile?.balance || 0) < totalPrice}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-white/5 disabled:text-slate-500 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-[#2D2B55] rounded-3xl p-8 shadow-2xl border border-white/5">
            <h3 className="text-xl font-bold text-white mb-4">What is SMM Panel?</h3>
            <div className="text-slate-300 text-sm leading-relaxed space-y-4">
              <p>
                <strong>SMM Panel</strong> is used to access Social Networks, and making use of it for profits. You can use the <strong>SMM Panel</strong> to get your marketing move on to the next stage of developing plans for your product or services.
              </p>
              <p>
                The social media used includes Facebook, twitter, Instagram, YouTube, LinkedIn and more. With this cheapest SMM panel you can grow your business rapidly. Buy Best SMM Panel Services from SMMPanel and grow your business. Cheapestsmmpanels is the best and cheapest smm panel in the market.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Button */}
      <a 
        href="https://wa.me/yournumber" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-50"
      >
        <MessageCircle className="w-8 h-8" />
      </a>
    </div>
  );
};

const PlaceholderView = ({ title, icon: Icon, description }: { title: string; icon: any; description?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-12 bg-[#2D2B55] rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
    <div className="absolute top-4 right-4 bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">
      Coming Soon
    </div>
    <div className="w-20 h-20 bg-white/5 text-blue-400 rounded-3xl flex items-center justify-center mb-6">
      <Icon className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
    <p className="text-slate-400 max-w-md">{description || "This feature is currently under development. Stay tuned for updates!"}</p>
    <button className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
      Notify Me
    </button>
  </div>
);

const AccountView = ({ profile }: { profile: UserProfile | null }) => (
  <div className="max-w-2xl mx-auto">
    <div className="bg-[#2D2B55] rounded-3xl p-8 border border-white/5 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-8">Account Details</h2>
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-[#1E1C39] rounded-2xl border border-white/5">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
            {profile?.email?.[0].toUpperCase()}
          </div>
          <div>
            <div className="text-white font-bold text-lg">{profile?.email}</div>
            <div className="text-slate-500 text-sm font-medium">UID: {profile?.uid}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <div className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] mb-1">Current Balance</div>
            <div className="text-2xl font-bold text-white">${profile?.balance?.toFixed(2)}</div>
          </div>
          <div className="p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <div className="text-blue-400 font-bold uppercase tracking-widest text-[10px] mb-1">Account Role</div>
            <div className="text-2xl font-bold text-white capitalize">{profile?.role}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  profile,
  onLogout
}: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void; 
  profile: UserProfile | null;
  onLogout: () => void;
}) => {
  const menuItems = [
    { id: 'new-order', label: 'New order', icon: ShoppingCart },
    { id: 'orders', label: 'Orders', icon: ListOrdered },
    { id: 'services', label: 'Services', icon: LayoutGrid },
    { id: 'mass-order', label: 'Mass order', icon: Layers },
    { id: 'updates', label: 'Updates', icon: Bell },
    { id: 'add-funds', label: 'Add funds', icon: Wallet },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  if (profile?.role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: Settings });
  }

  return (
    <div className="w-64 bg-[#2D2B55] text-slate-300 h-screen fixed left-0 top-0 flex flex-col border-r border-white/5 z-40">
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <img src={SMM_LOGO} className="w-8 h-8 rounded-lg object-cover" alt="Logo" referrerPolicy="no-referrer" />
        <span className="text-xl font-bold text-white tracking-tight">Lombardi</span>
      </div>

      <div className="p-6">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id 
                  ? 'bg-white text-[#2D2B55] shadow-xl' 
                  : 'hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-white/5 space-y-2">
        <button 
          onClick={() => setActiveTab('account')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'account' 
              ? 'bg-white text-[#2D2B55] shadow-xl' 
              : 'hover:bg-white/10 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          Account
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

const MassOrderView = ({ 
  user, 
  profile,
  services
}: { 
  user: User | null;
  profile: UserProfile | null;
  services: Service[];
}) => {
  const [massOrderText, setMassOrderText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{line: string, status: 'success' | 'error', message: string}[]>([]);

  const handleSubmit = async () => {
    if (!user || !profile || isSubmitting) return;
    setIsSubmitting(true);
    setResults([]);
    
    const lines = massOrderText.split('\n').filter(line => line.trim() !== "");
    const newResults: {line: string, status: 'success' | 'error', message: string}[] = [];
    
    let currentBalance = profile.balance || 0;

    for (const line of lines) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length !== 3) {
        newResults.push({ line, status: 'error', message: 'Invalid format. Use service_id | link | quantity' });
        continue;
      }

      const [serviceId, link, quantityStr] = parts;
      const quantity = parseInt(quantityStr);
      const service = services.find(s => s.id === serviceId);

      if (!service) {
        newResults.push({ line, status: 'error', message: `Service ID ${serviceId} not found` });
        continue;
      }

      if (isNaN(quantity) || quantity < (Number(service.min) || 0)) {
        newResults.push({ line, status: 'error', message: `Minimum quantity is ${service.min}` });
        continue;
      }

      const totalPrice = (service.price * quantity) / 1000;
      if (currentBalance < totalPrice) {
        newResults.push({ line, status: 'error', message: 'Insufficient balance' });
        continue;
      }

      // Process order
      const orderId = Math.random().toString(36).substring(2, 15);
      try {
        const orderData: Order = {
          id: orderId,
          uid: user.uid,
          serviceId: service.id,
          serviceName: service.name,
          quantity: quantity,
          totalPrice: totalPrice,
          status: 'pending',
          link: link,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'orders', orderId), orderData);
        currentBalance -= totalPrice;
        await updateDoc(doc(db, 'users', user.uid), { balance: currentBalance });
        
        newResults.push({ line, status: 'success', message: `Order #${orderId} placed successfully` });
      } catch (error) {
        console.error("Mass Order Error:", error);
        newResults.push({ line, status: 'error', message: 'Failed to place order' });
      }
    }

    setResults(newResults);
    setIsSubmitting(false);
    setMassOrderText("");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-[#2D2B55] rounded-3xl p-8 border border-white/5 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Mass Order</h2>
        <div className="space-y-6">
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6">
            <label className="block text-sm font-bold text-white mb-3 uppercase tracking-wider">One order per line in format</label>
            <textarea
              value={massOrderText}
              onChange={(e) => setMassOrderText(e.target.value)}
              placeholder="service_id | link | quantity"
              className="w-full h-64 bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !massOrderText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Submit"}
          </button>

          {results.length > 0 && (
            <div className="mt-8 space-y-2">
              <h3 className="text-lg font-bold text-white mb-4">Results</h3>
              {results.map((res, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${res.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs truncate max-w-[60%]">{res.line}</span>
                    <span className="text-sm font-bold">{res.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AddFundsView = ({ 
  user, 
  profile 
}: { 
  user: User | null;
  profile: UserProfile | null;
}) => {
  const [amount, setAmount] = useState(500);
  const [method, setMethod] = useState<'paypal' | 'crypto'>('paypal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddFunds = async () => {
    if (!user || !profile || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await updateDoc(doc(db, 'users', user.uid), {
        balance: (profile.balance || 0) + amount
      });
      alert(`Successfully added $${amount} to your balance!`);
    } catch (error) {
      console.error("Add Funds Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!user || !profile || !screenshot || isSubmitting) return;
    
    setIsSubmitting(true);
    const requestId = Math.random().toString(36).substring(2, 15);
    const path = `payment_requests/${requestId}`;
    
    try {
      const requestData: PaymentRequest = {
        id: requestId,
        uid: user.uid,
        email: user.email || '',
        amount: amount,
        method: method,
        screenshot: screenshot,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'payment_requests', requestId), requestData);
      alert("Payment proof submitted successfully! Our admin will review it shortly.");
      setScreenshot(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#2D2B55] rounded-3xl p-8 border border-white/5 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8">Add Funds</h2>
        <div className="space-y-6">
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                    <DollarSign className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Direct PayPal Payment</h3>
                    <p className="text-xs text-slate-400">Fastest way to add funds manually</p>
                  </div>
                </div>
                <a 
                  href="https://www.paypal.me/mubasshir875" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Pay via PayPal.me <ArrowRight className="w-4 h-4" />
                </a>
                <p className="mt-4 text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
                  After payment, please upload the screenshot below
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-3 uppercase tracking-wider">Select Amount ($)</label>
            <div className="grid grid-cols-3 gap-2">
              {[100, 500, 1000, 2000, 5000, 10000].map(val => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-3 rounded-xl font-bold border transition-all ${
                    amount === val 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-blue-400'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>
            <input 
              type="number" 
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full mt-3 bg-[#1E1C39] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-blue-500 font-medium text-white"
              placeholder="Custom Amount"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-3 uppercase tracking-wider">Payment Method</label>
            <div className="space-y-3">
              <button
                onClick={() => setMethod('paypal')}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                  method === 'paypal' 
                    ? 'bg-blue-600/10 border-blue-600' 
                    : 'bg-white/5 border-white/10 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                    <DollarSign className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">PayPal / Cards</div>
                    <div className="text-xs text-slate-400 font-medium">Instant delivery</div>
                  </div>
                </div>
                {method === 'paypal' && <div className="w-5 h-5 bg-blue-600 rounded-full border-4 border-[#2D2B55] shadow-sm" />}
              </button>

              <button
                onClick={() => setMethod('crypto')}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                  method === 'crypto' 
                    ? 'bg-orange-500/10 border-orange-500' 
                    : 'bg-white/5 border-white/10 hover:border-orange-400'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400">
                    <Bitcoin className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">Crypto (BTC/ETH/USDT)</div>
                    <div className="text-xs text-slate-400 font-medium">Manual verification (5-15 min)</div>
                  </div>
                </div>
                {method === 'crypto' && <div className="w-5 h-5 bg-orange-500 rounded-full border-4 border-[#2D2B55] shadow-sm" />}
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Upload Payment Screenshot</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-6 py-4 text-white transition-all flex items-center justify-center gap-3">
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                  <span className="font-bold">{screenshot ? 'Change Screenshot' : 'Upload Proof'}</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {screenshot && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                    <img src={screenshot} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </div>

            {profile?.role === 'admin' ? (
              <button 
                onClick={handleAddFunds}
                disabled={isSubmitting || amount <= 0}
                className={`w-full py-5 rounded-2xl font-bold transition-all shadow-xl flex items-center justify-center gap-3 text-lg ${
                  !isSubmitting && amount > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20' 
                    : 'bg-white/5 text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                <Wallet className="w-6 h-6" />
                {isSubmitting ? "Processing Payment..." : `Pay $${amount.toLocaleString()}`}
              </button>
            ) : (
              <button 
                onClick={handleSubmitProof}
                disabled={isSubmitting || !screenshot || amount <= 0}
                className={`w-full py-5 rounded-2xl font-bold transition-all shadow-xl flex items-center justify-center gap-3 text-lg ${
                  !isSubmitting && screenshot && amount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                    : 'bg-white/5 text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                <Send className="w-6 h-6" />
                {isSubmitting ? "Submitting..." : "Submit Payment Proof"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ onOpenAuth, onOpenAddFunds, user, profile }: { onOpenAuth: () => void; onOpenAddFunds: () => void; user: User | null; profile: UserProfile | null }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1E1C39] border-b border-white/5 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-2">
            <img src={SMM_LOGO} className="w-8 h-8 rounded-lg object-cover" alt="Logo" referrerPolicy="no-referrer" />
            <span className="text-2xl font-bold text-white tracking-tight">Lombardi</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-slate-300 hover:text-blue-400 transition-colors text-sm font-semibold">Home</button>
            <button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-300 hover:text-blue-400 transition-colors text-sm font-semibold">Services</button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-300 hover:text-blue-400 transition-colors text-sm font-semibold">How it Works</button>
            
            {user && profile?.role === 'admin' ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Balance</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">${profile?.balance?.toFixed(2) || "0.00"}</span>
                    <button 
                      onClick={onOpenAddFunds}
                      className="flex items-center gap-1 text-[10px] bg-blue-600/10 text-blue-400 px-2 py-1 rounded font-bold hover:bg-blue-600/20 transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5" /> ADD FUNDS
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="flex items-center gap-2 text-slate-300 hover:text-red-400 transition-colors text-sm font-semibold"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Balance</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">${profile?.balance?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="flex items-center gap-2 text-slate-300 hover:text-red-400 transition-colors text-sm font-semibold"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button 
                  onClick={onOpenAuth}
                  className="text-slate-300 hover:text-blue-400 transition-colors text-sm font-semibold flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Login
                </button>
                <button 
                  onClick={onOpenAuth}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Sign Up
                </button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-b border-slate-200 px-4 py-6 space-y-4"
          >
            <a href="#" className="block text-slate-600 hover:text-blue-600 text-lg font-semibold">Home</a>
            <a href="#services" className="block text-slate-600 hover:text-blue-600 text-lg font-semibold">Services</a>
            <div className="pt-4 flex flex-col gap-4">
              {user ? (
                <button onClick={() => signOut(auth)} className="text-slate-600 hover:text-red-600 font-semibold text-left">Logout</button>
              ) : (
                <>
                  <button onClick={onOpenAuth} className="text-slate-600 hover:text-blue-600 font-semibold text-left">Login</button>
                  <button onClick={onOpenAuth} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-center">Sign Up</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ onOpenAuth, user }: { onOpenAuth: () => void; user: User | null }) => (
  <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-[#1E1C39] overflow-hidden">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#4285F4_1px,transparent_1px)] [background-size:20px_20px]" />
    </div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-left"
        >
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">#1 SMM Panel in the World</span>
          </div>
          <h1 className="text-4xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
            Boost Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Social Presence</span>
          </h1>
          <p className="text-slate-400 text-lg lg:text-xl mb-10 leading-relaxed max-w-xl">
            Get high-quality followers, likes, views, and more for all social media platforms at the most affordable prices.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={() => !user && onOpenAuth()}
              className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 px-10 py-4 rounded-xl text-lg font-bold transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {user ? "Explore Services" : "Get Started Now"} <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto bg-white/5 text-white border border-white/10 hover:bg-white/10 px-10 py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" /> How it Works
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="hidden lg:block relative"
        >
          <div className="bg-white p-4 rounded-2xl shadow-2xl border border-white/20">
            <img 
              src="https://images.unsplash.com/photo-1598550476439-6847785fce66?q=80&w=1000&auto=format&fit=crop" 
              alt="TikTok Growth" 
              className="rounded-xl shadow-inner object-cover h-[400px] w-full"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 bg-[#1E1C39]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-20">
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">How It Works</h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">Follow these 3 simple steps to start growing your social media presence.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-12 relative">
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 z-0" />
        
        {[
          { step: "01", title: "Register & Login", desc: "Create an account on our platform and log in to your dashboard.", icon: Users },
          { step: "02", title: "Add Funds", desc: "Deposit money into your account using our secure payment methods.", icon: CreditCard },
          { step: "03", title: "Place Order", desc: "Select the service you want and place your order. Watch the magic happen!", icon: ArrowRight },
        ].map((item, i) => (
          <div key={i} className="relative z-10 text-center bg-[#2D2B55] p-8 rounded-3xl shadow-xl border border-white/5">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg shadow-blue-500/20">
              <item.icon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
            <p className="text-slate-400 leading-relaxed">{item.desc}</p>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#1E1C39] rounded-full flex items-center justify-center text-slate-500 font-bold border-4 border-[#2D2B55]">
              {item.step}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Features = () => (
  <section className="py-24 bg-[#1E1C39]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-8 tracking-tight leading-tight">
            The Best SMM Services <br />
            <span className="text-blue-400 underline decoration-blue-400/20 underline-offset-8">At Your Fingertips</span>
          </h2>
          <div className="space-y-6">
            {[
              { title: "High Quality Services", desc: "We provide real and high-quality engagement to ensure your growth looks natural.", icon: Star },
              { title: "Instant Delivery", desc: "Most of our services start instantly after you place an order.", icon: Clock },
              { title: "24/7 Support", desc: "Our dedicated support team is always available to help you.", icon: MessageSquare },
              { title: "API Support", desc: "We provide API support for resellers to integrate our services into their own panels.", icon: Settings },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/5 text-blue-400 rounded-xl flex items-center justify-center">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">{feature.title}</h4>
                  <p className="text-slate-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-blue-600/10 rounded-3xl blur-2xl" />
          <img 
            src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=800&auto=format&fit=crop" 
            alt="YouTube Features" 
            className="relative rounded-3xl shadow-2xl border border-white/5"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  </section>
);

const ServicesTable = ({ 
  services, 
  onOrder, 
  onEdit, 
  onDelete, 
  isAdmin = false, 
  dark = false 
}: { 
  services: Service[]; 
  onOrder: (s: Service) => void; 
  onEdit?: (s: Service) => void; 
  onDelete?: (id: string) => void; 
  isAdmin?: boolean; 
  dark?: boolean; 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("All");

  const platforms = ["All", ...Array.from(new Set(services.map(s => s.platform)))];

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.platform.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = selectedPlatform === "All" || s.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  return (
    <section id="services" className={`py-24 ${dark ? 'bg-transparent' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
            <div>
              <h2 className={`text-3xl lg:text-4xl font-bold mb-4 tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>Our Services</h2>
              <p className={`${dark ? 'text-slate-400' : 'text-slate-600'} text-lg`}>Browse our most popular services and start growing today.</p>
            </div>
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search services..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`w-full border rounded-lg py-3 pl-12 pr-6 transition-colors focus:outline-none focus:border-blue-500 ${
                  dark ? 'bg-[#1E1C39] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {platforms.map(platform => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${
                  selectedPlatform === platform
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : dark 
                      ? 'bg-white/5 border-white/10 text-slate-400 hover:border-blue-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        <div className={`overflow-x-auto rounded-xl border shadow-sm ${dark ? 'bg-[#2D2B55] border-white/5' : 'bg-white border-slate-200'}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={dark ? 'bg-white/5' : 'bg-slate-50'}>
                <th className={`px-6 py-4 font-bold text-sm uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-600'}`}>ID</th>
                <th className={`px-6 py-4 font-bold text-sm uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Service</th>
                <th className={`px-6 py-4 font-bold text-sm uppercase tracking-wider text-right ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Rate per 1000</th>
                <th className={`px-6 py-4 font-bold text-sm uppercase tracking-wider text-right ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Min/Max</th>
                <th className={`px-6 py-4 font-bold text-sm uppercase tracking-wider text-center ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? 'divide-white/5' : 'divide-slate-100'}`}>
              {filteredServices.map((service) => (
                <tr key={service.id} className={`transition-colors ${dark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                  <td className={`px-6 py-5 font-mono text-sm ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{service.id}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      {service.imageUrl ? (
                        <img src={service.imageUrl} alt={service.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${dark ? 'bg-white/5 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                          <Zap className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-blue-400 text-xs font-bold uppercase mb-1">{service.platform}</span>
                        <span className={`font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{service.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right text-blue-400 font-bold">${service.price.toFixed(2)}</td>
                  <td className={`px-6 py-5 text-right text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {service.min} / {service.max}
                  </td>
                  <td className="px-6 py-5 text-center">
                    {isAdmin ? (
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => onEdit?.(service)}
                          className="p-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                          title="Edit Service"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDelete?.(service.id)}
                          className="p-2 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                          title="Delete Service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => onOrder(service)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                      >
                        Order
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

const FAQ = ({ dark = false }: { dark?: boolean }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is an SMM Panel?",
      a: "An SMM (Social Media Marketing) panel is an online store that sells social media services like followers, likes, views, and more to help individuals and businesses grow their online presence."
    },
    {
      q: "Is it safe to use Lombardi?",
      a: "Yes, absolutely. We use safe methods that comply with social media platform guidelines. We never ask for your passwords, and our services are designed to look natural."
    },
    {
      q: "How long does delivery take?",
      a: "Most orders begin processing within minutes. The completion time depends on the service and quantity ordered, but we pride ourselves on having the fastest delivery in the market."
    },
    {
      q: "Can I get a refund?",
      a: "We offer refunds to your panel balance if an order cannot be completed. Please refer to our terms of service for detailed information on our refund policy."
    }
  ];

  return (
    <section id="faq" className={`py-24 ${dark ? 'bg-[#1E1C39]' : 'bg-slate-50'}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className={`text-3xl lg:text-4xl font-bold mb-4 tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>Frequently Asked Questions</h2>
          <p className={`${dark ? 'text-slate-400' : 'text-slate-600'} text-lg`}>Everything you need to know about our services.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className={`rounded-xl border overflow-hidden shadow-sm ${dark ? 'bg-[#2D2B55] border-white/5' : 'bg-white border-slate-200'}`}>
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className={`w-full px-8 py-6 text-left flex justify-between items-center transition-colors ${dark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
              >
                <span className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`px-8 pb-6 leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-600'}`}
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = ({ dark = false }: { dark?: boolean }) => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
  <footer className={`pt-24 pb-12 border-t ${dark ? 'bg-[#1E1C39] border-white/5' : 'bg-white border-slate-200'}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <img src={SMM_LOGO} className="w-6 h-6 rounded object-cover" alt="Logo" referrerPolicy="no-referrer" />
            <span className={`text-xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>Lombardi</span>
          </div>
          <p className={`${dark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed mb-6`}>
            The world's leading social media marketing panel. We help you grow your brand with high-quality engagement at the best prices.
          </p>
          <div className="flex gap-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-white/5 text-slate-400 hover:bg-blue-600 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'}`}>
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-white/5 text-slate-400 hover:bg-blue-600 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'}`}>
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-white/5 text-slate-400 hover:bg-blue-600 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'}`}>
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${dark ? 'bg-white/5 text-slate-400 hover:bg-blue-600 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'}`}>
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className={`font-bold mb-6 ${dark ? 'text-white' : 'text-slate-900'}`}>Quick Links</h4>
          <ul className="space-y-4">
            <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`${dark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'} transition-colors`}>Home</button></li>
            <li><button onClick={() => scrollTo('services')} className={`${dark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'} transition-colors`}>Services</button></li>
            <li><button onClick={() => scrollTo('how-it-works')} className={`${dark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'} transition-colors`}>How it Works</button></li>
            <li><button onClick={() => scrollTo('faq')} className={`${dark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'} transition-colors`}>FAQ</button></li>
          </ul>
        </div>

        <div>
          <h4 className={`font-bold mb-6 ${dark ? 'text-white' : 'text-slate-900'}`}>Legal</h4>
          <ul className="space-y-4">
            <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Terms of Service coming soon!"); }} className={`${dark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'} transition-colors`}>Terms of Service</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Privacy Policy coming soon!"); }} className={`${dark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'} transition-colors`}>Privacy Policy</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Refund Policy coming soon!"); }} className={`${dark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'} transition-colors`}>Refund Policy</a></li>
          </ul>
        </div>

        <div>
          <h4 className={`font-bold mb-6 ${dark ? 'text-white' : 'text-slate-900'}`}>Newsletter</h4>
          <p className={`${dark ? 'text-slate-400' : 'text-slate-500'} mb-6`}>Subscribe to get updates on new services and special offers.</p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input 
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600 flex-grow ${dark ? 'bg-[#2D2B55] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            />
            <button 
              type="submit"
              className={`px-4 py-2 rounded-lg font-bold transition-all ${subscribed ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {subscribed ? <Check className="w-5 h-5" /> : 'Join'}
            </button>
          </form>
        </div>
      </div>

      <div className={`pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 ${dark ? 'border-white/5' : 'border-slate-200'}`}>
        <p className={`${dark ? 'text-slate-500' : 'text-slate-500'} text-sm`}>
          © 2026 Lombardi SMM. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className={`${dark ? 'text-slate-500' : 'text-slate-500'} text-xs font-bold uppercase tracking-widest`}>Secure Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <span className={`${dark ? 'text-slate-500' : 'text-slate-500'} text-xs font-bold uppercase tracking-widest`}>Verified Panel</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('new-order');

  // Test connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        // Real-time profile listener
        const unsubscribeProfile = onSnapshot(doc(db, 'users', u.uid), (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        }, (error) => handleFirestoreError(error, OperationType.GET, `users/${u.uid}`));

        // Real-time orders listener
        const ordersQuery = query(
          collection(db, 'orders'), 
          where('uid', '==', u.uid),
          orderBy('createdAt', 'desc')
        );
        const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
          const ordersData = snapshot.docs.map(docSnap => docSnap.data() as Order);
          setOrders(ordersData);
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

        // Real-time tickets listener
        const ticketsQuery = profile?.role === 'admin' 
          ? query(collection(db, 'tickets'), orderBy('createdAt', 'desc'))
          : query(collection(db, 'tickets'), where('uid', '==', u.uid), orderBy('createdAt', 'desc'));
        
        const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
          const ticketsData = snapshot.docs.map(docSnap => docSnap.data() as Ticket);
          setTickets(ticketsData);
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'tickets'));

        return () => {
          unsubscribeProfile();
          unsubscribeOrders();
          unsubscribeTickets();
        };
      } else {
        setProfile(null);
        setOrders([]);
        setTickets([]);
      }
    });

    // Fetch services
    const qServices = query(collection(db, 'services'), orderBy('id'));
    const unsubscribeServices = onSnapshot(qServices, (snapshot) => {
      const servicesData = snapshot.docs.map(docSnap => docSnap.data() as Service);
      
      // Initial bootstrap if empty
      if (servicesData.length === 0) {
        const initialServices: Service[] = [
          { id: "4680", platform: "Instagram", name: "Instagram Followers [Refill - 30Days ♻️]", price: 47.76, min: "10", max: "50000", averageTime: "13 minutes", imageUrl: "https://images.unsplash.com/photo-1611262588024-d12430b98920?q=80&w=200&auto=format&fit=crop" },
          { id: "3066", platform: "TikTok", name: "TikTok Views [Instant/Viral]", price: 0.83, min: "500", max: "100M", averageTime: "33 minutes", imageUrl: "https://images.unsplash.com/photo-1598550476439-6847785fce66?q=80&w=200&auto=format&fit=crop" },
          { id: "6208", platform: "YouTube", name: "YouTube Watchtime [5 Minute Video]", price: 1194.20, min: "100", max: "100k", averageTime: "125 hours", imageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=200&auto=format&fit=crop" },
          { id: "276", platform: "Facebook", name: "Facebook Classic Page Likes + Followers", price: 98.22, min: "10", max: "250k", averageTime: "2 hours", imageUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=200&auto=format&fit=crop" },
          { id: "2839", platform: "Vimeo", name: "Vimeo Views [Fast]", price: 70.77, min: "100", max: "10M", averageTime: "Instant", imageUrl: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=200&auto=format&fit=crop" },
          { id: "9901", platform: "Instagram", name: "Instagram Likes [Real - Fast]", price: 12.50, min: "50", max: "100k", averageTime: "5 minutes", imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=200&auto=format&fit=crop" },
          { id: "9902", platform: "TikTok", name: "TikTok Followers [HQ - Non Drop]", price: 85.00, min: "100", max: "500k", averageTime: "1 hour", imageUrl: "https://images.unsplash.com/photo-1611605698335-8b1569810432?q=80&w=200&auto=format&fit=crop" },
          { id: "9903", platform: "YouTube", name: "YouTube Subscribers [Stable]", price: 2450.00, min: "50", max: "10k", averageTime: "24 hours", imageUrl: "https://images.unsplash.com/photo-1527430253228-e903248845d5?q=80&w=200&auto=format&fit=crop" },
          { id: "9904", platform: "Twitter", name: "Twitter Retweets [Real]", price: 145.00, min: "20", max: "50k", averageTime: "30 minutes", imageUrl: "https://images.unsplash.com/photo-1611606063065-ee7946f0787a?q=80&w=200&auto=format&fit=crop" },
          { id: "9905", platform: "Facebook", name: "Facebook Post Shares", price: 45.00, min: "100", max: "100k", averageTime: "1 hour", imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=200&auto=format&fit=crop" },
        ];
        initialServices.forEach(s => setDoc(doc(db, 'services', s.id), s));
      }
      
      setServices(servicesData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'services'));

    return () => {
      unsubscribe();
      unsubscribeServices();
    };
  }, []);

  // Auto-completion logic for orders
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(async () => {
      const now = Date.now();
      const pendingOrders = orders.filter(o => o.status === 'pending');
      
      for (const order of pendingOrders) {
        const createdTime = new Date(order.createdAt).getTime();
        if (now - createdTime > 30 * 60 * 1000) {
          try {
            await updateDoc(doc(db, 'orders', order.id), { status: 'completed' });
          } catch (error) {
            console.error("Auto-complete error:", error);
          }
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [user, orders]);

  const handleOrderClick = (service: Service) => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setSelectedService(service);
      setIsOrderModalOpen(true);
    }
  };

  const handleNewOrderSubmit = async (service: Service, quantity: number, link: string) => {
    if (!user || !profile) return;
    
    const totalPrice = (service.price * quantity) / 1000;
    if (profile.balance < totalPrice) return;

    const orderId = Math.random().toString(36).substring(2, 9);
    const path = `orders/${orderId}`;
    
    try {
      await setDoc(doc(db, 'orders', orderId), {
        id: orderId,
        uid: user.uid,
        serviceId: service.id,
        serviceName: service.name,
        quantity,
        totalPrice,
        status: 'pending',
        link,
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'users', user.uid), {
        balance: profile.balance - totalPrice
      });

      setActiveTab('orders');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E1C39]">
      {user ? (
        <div className="flex">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            profile={profile}
            onLogout={() => signOut(auth)}
          />
          <main className="flex-1 ml-64 min-h-screen">
            <div className="p-8 max-w-[1400px] mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'new-order' && (
                    <NewOrder 
                      services={services} 
                      profile={profile} 
                      onOrder={handleNewOrderSubmit}
                      onAddFundsClick={() => setActiveTab('add-funds')}
                    />
                  )}
                  {activeTab === 'orders' && (
                    <div className="space-y-8">
                      <h1 className="text-3xl font-bold text-white">Order History</h1>
                      <OrderHistory orders={orders} />
                    </div>
                  )}
                  {activeTab === 'services' && (
                    <div className="space-y-8">
                      <h1 className="text-3xl font-bold text-white">Service List</h1>
                      <ServicesTable services={services} onOrder={handleOrderClick} dark />
                    </div>
                  )}
                  {activeTab === 'add-funds' && <AddFundsView user={user} profile={profile} />}
                  {activeTab === 'mass-order' && <MassOrderView user={user} profile={profile} services={services} />}
                  {activeTab === 'updates' && <PlaceholderView title="Updates & News" icon={Bell} />}
                  {activeTab === 'support' && <SupportView user={user} profile={profile} tickets={tickets} />}
                  {activeTab === 'admin' && profile?.role === 'admin' && (
                    <div className="space-y-8">
                      <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                      <AdminDashboard services={services} tickets={tickets} />
                    </div>
                  )}
                  {activeTab === 'account' && <AccountView profile={profile} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      ) : (
        <>
          <Navbar 
            onOpenAuth={() => setIsAuthModalOpen(true)} 
            onOpenAddFunds={() => setIsAddFundsModalOpen(true)}
            user={user} 
            profile={profile} 
          />
          <main>
            <Hero onOpenAuth={() => setIsAuthModalOpen(true)} user={user} />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {profile?.role === 'admin' && (
                <AdminDashboard services={services} tickets={tickets} />
              )}
              
              <ServicesTable services={services} onOrder={handleOrderClick} dark />
            </div>

            <HowItWorks />
            <Features />
            
            <section className="py-24 bg-blue-600 text-white overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                <h2 className="text-3xl lg:text-5xl font-bold mb-8">Ready to grow your social media?</h2>
                <p className="text-blue-100 text-lg mb-12 max-w-2xl mx-auto">Join thousands of satisfied customers and start your journey to social media success today.</p>
                <button 
                  onClick={() => !user && setIsAuthModalOpen(true)}
                  className="bg-white text-blue-600 hover:bg-blue-50 px-12 py-5 rounded-xl text-xl font-bold transition-all shadow-2xl"
                >
                  {user ? "Order Now" : "Create Account"}
                </button>
              </div>
            </section>

            <FAQ dark />
          </main>
          <Footer dark />
        </>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <AddFundsModal 
        isOpen={isAddFundsModalOpen} 
        onClose={() => setIsAddFundsModalOpen(false)} 
        user={user}
        profile={profile}
      />
      <OrderModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
        service={selectedService}
        user={user}
        profile={profile}
      />
    </div>
  );
}
