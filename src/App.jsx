import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut 
} from 'firebase/auth';
import { 
  getFirestore, doc, collection, onSnapshot, addDoc, getDoc, setDoc, query, orderBy, limit, deleteDoc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Binary, RefreshCw, Power, Microscope, Gavel, ShieldCheck, 
  Truck, Search, Briefcase, UserCircle, CreditCard, Paperclip, 
  FileText, Menu, Bell, AlertTriangle, MessageSquare, Plus, X, 
  Mic, Settings as SettingsIcon, Users, Clock, Sun, Moon, 
  Search as SearchIcon, Globe, Shield, Trash2, Pin, ChevronRight, MessageCircle, HelpCircle, Info, Camera
} from 'lucide-react';

// ============================================================
// 🔐 MODULE 1: INFRASTRUCTURE (Firebase & Palette)
// ============================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'scorpio-enterprise-v24';

// EXCEL COLORS: Exact mapping from user CSV files
const PALETTE = {
  dark: {
    bg: "#0B0B0B",       // Rich Black
    sidebar: "#0F0F10",  // Obsidian
    card: "#1B1B1B",     // Eerie Black
    border: "#1F2937",   // Gray 800
    text: "#FFFFFF",
    subtext: "#6B7280"   // Gray 500
  },
  light: {
    bg: "#FFFAFA",       // Snow
    sidebar: "#F5F5F5",  // White Smoke
    card: "#FFFFFF",
    border: "#E5E7EB",   // Gray 200
    text: "#0A0A0A",     // Jet Black
    subtext: "#4B5563"   // Gray 600
  }
};

const STATIC_NODES = [
  { id: 'n1', name: "Science Audit", icon: <Microscope size={18}/>, prompt: "Bio-Regulatory Auditor" },
  { id: 'n2', name: "Legal Log", icon: <Gavel size={18}/>, prompt: "Patent Lawyer" },
  { id: 'n3', name: "NAMs Report", icon: <ShieldCheck size={18}/>, prompt: "FDA Specialist" },
  { id: 'n4', name: "Supply Chain", icon: <Truck size={18}/>, prompt: "Logistics Expert" },
  { id: 'n5', name: "IP Hunter", icon: <Search size={18}/>, prompt: "IP Strategist" },
  { id: 'n6', name: "Patent Cliff", icon: <Briefcase size={18}/>, prompt: "Consultant" }
];

// ============================================================
// 🌌 MODULE 2: VISUALS (Typography & VFX)
// ============================================================
const NeuralVFX = ({ theme }) => {
  const ref = useRef();
  const particleCount = useMemo(() => (window.innerWidth < 768 ? 250 : 600), []);
  const sphere = useMemo(() => random.inSphere(new Float32Array(particleCount), { radius: 5.5 }), [particleCount]);
  const color = theme === 'dark' ? "#FFFFFF" : "#000000";
  useFrame((state, delta) => { if (ref.current) { ref.current.rotation.x -= delta/180; ref.current.rotation.y -= delta/190; } });
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color={color} size={0.015} sizeAttenuation depthWrite={false} opacity={0.02} />
      </Points>
    </group>
  );
};

// ============================================================
// 🚀 MODULE 3: CORE WORKSTATION ENGINE
// ============================================================
export default function App() {
  // UI & THEME PERSISTENCE
  const [theme, setTheme] = useState(() => localStorage.getItem("scorpio-theme") || 'dark');
  const [view, setView] = useState('loading'); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('recent'); // PDF: Recent, Groups, Temp
  const [activeModal, setActiveModal] = useState(null); // Settings, Help, Feedback, etc.
  
  // IDENTITY & DATA
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ tier: 'GHOST', usageCount: 0 });
  const [chatId, setChatId] = useState(() => `ch-${Date.now()}`);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [stagedFiles, setStagedFiles] = useState([]);
  
  // AI INTERFACE CONTROLS
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [command, setCommand] = useState("");
  const [activeNode, setActiveNode] = useState(() => STATIC_NODES[0]);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [actionMenuId, setActionMenuId] = useState(null);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const currentColors = theme === 'dark' ? PALETTE.dark : PALETTE.light;

  const generateId = () => crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // EFFECT: Textarea Resizing logic (PPT requirement)
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 250) + "px";
    });
  }, []);

  // EFFECT: Theme Switch & Persistent Save
  useEffect(() => {
    localStorage.setItem("scorpio-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // EFFECT: History Filtering (PDF Page 2 Logic)
  const displayedHistory = useMemo(() => {
    let base = history || [];
    if (activeTab === 'groups') base = base.filter(h => h.isGroup);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(h => (h.text || "").toLowerCase().includes(q) || (h.aiResponse || "").toLowerCase().includes(q));
    }
    return base.slice(0, 50);
  }, [history, activeTab, searchQuery]);

  // VOICE ASSISTANT (Globe Icon Implementation)
  const speakAI = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // DICTATION (Mic Icon Implementation)
  const startDictation = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    const rec = new SpeechRec();
    rec.onstart = () => setIsDictating(true);
    rec.onend = () => setIsDictating(false);
    rec.onresult = (e) => {
      setCommand(e.results[0][0].transcript);
      resizeTextarea();
    };
    rec.start();
  };

  // LOGIC: Scroll Stability (Fixes Black Screen/Crashes)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  // AUTH HANDSHAKE
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
        const snap = await getDoc(userRef);
        if (snap.exists()) setUserData(snap.data());
        else await setDoc(userRef, { tier: 'GHOST', usageCount: 0 });
        setView('dash');
      } else {
        try { await signInAnonymously(auth); } catch { setView('auth'); }
      }
    });
  }, []);

  // HISTORY SYNC
  useEffect(() => {
    if (!user || view !== 'dash') return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snap) => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user, view]);

  // EXECUTION PROTOCOL
  const executeResearch = async () => {
    const text = command.trim();
    if (!text || isProcessing) return;
    if (userData.tier === 'GHOST' && userData.usageCount >= 5) return setActiveModal('upgrade');

    setMessages(prev => [...prev, { id: generateId(), role: 'user', text }]);
    setIsProcessing(true);
    setCommand("");
    if (textareaRef.current) textareaRef.current.style.height = "60px";

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, node: activeNode.name, userId: user.uid })
      });
      const data = await response.json();
      const aiResponse = data.result || "Research node failed to respond.";
      setMessages(prev => [...prev, { id: generateId(), role: 'ai', text: aiResponse }]);
      speakAI(aiResponse);
      setUserData(p => ({ ...p, usageCount: p.usageCount + 1 }));

      if (activeTab !== 'temp') {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
          text, aiResponse, chatId, timestamp: serverTimestamp(), isGroup: activeTab === 'groups'
        });
      }
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  // --- MODAL SYSTEM (Fidelity to PDF Link List) ---
  const PopUp = ({ title, children, onClose }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-5xl h-[80vh] rounded-[3.5rem] border overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)]" style={{ backgroundColor: currentColors.bg, borderColor: currentColors.border }}>
        <header className="px-12 py-10 border-b flex justify-between items-center" style={{ borderColor: currentColors.border }}>
          <h3 className="font-deltha text-2xl tracking-[6px] uppercase italic">{title}</h3>
          <button onClick={onClose} className="p-3 rounded-full hover:bg-white/10 transition-colors"><X size={28}/></button>
        </header>
        <div className="flex-1 overflow-y-auto p-16 scrollbar-hide">{children}</div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex overflow-hidden font-segoe select-none transition-colors duration-700" style={{ backgroundColor: currentColors.bg, color: currentColors.text }}>
      <style>{`
        @font-face { font-family: 'Deltha'; src: url('/fonts/Deltha.ttf') format('truetype'); font-display: swap; }
        @font-face { font-family: 'Segoe UI'; src: local('Segoe UI'); font-display: swap; }
        .font-deltha { font-family: 'Deltha', 'Impact', 'Arial Black', sans-serif; }
        .font-segoe { font-family: 'Segoe UI', system-ui, sans-serif; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${currentColors.border}; border-radius: 10px; }
      `}</style>

      {/* NEURAL BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}><Suspense fallback={null}><NeuralVFX theme={theme} /></Suspense></Canvas>
      </div>

      <AnimatePresence mode="wait">
        {view === 'loading' ? (
          <motion.div key="l" exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center" style={{ backgroundColor: currentColors.bg }}>
            <RefreshCw className="animate-spin opacity-30" size={60} />
          </motion.div>
        ) : (
          <div className="flex relative z-10 w-full h-screen overflow-hidden">
            
            {/* SIDEBAR (PAGE 2 & 36 FIDELITY) */}
            <aside 
              className={`transition-all duration-500 flex flex-col border-r shadow-2xl z-[100] ${isSidebarCollapsed ? 'w-20' : 'w-80'}`}
              style={{ backgroundColor: currentColors.sidebar, borderColor: currentColors.border }}
            >
              {/* TOP (New Chat & Search) */}
              <div className="p-8 border-b" style={{ borderColor: currentColors.border }}>
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-black border border-white/10 shadow-2xl"><Binary size={26} className="text-white" /></div>
                  {!isSidebarCollapsed && <h1 className="font-deltha font-black tracking-widest uppercase italic text-2xl">Scorpio</h1>}
                </div>
                
                <button onClick={() => { setMessages([]); setChatId(`ch-${Date.now()}`); }} className="w-full flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-95 mb-6 shadow-xl" style={{ borderColor: currentColors.border, backgroundColor: currentColors.bg }}>
                   {!isSidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest opacity-60">New Chat</span>}
                   <Plus size={22} />
                </button>

                {!isSidebarCollapsed && (
                  <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                    <input 
                      type="text" placeholder="Search Chats" 
                      className="w-full pl-14 pr-4 py-4 rounded-xl text-[12px] bg-transparent border outline-none focus:ring-1 focus:ring-white/20 transition-all font-segoe"
                      style={{ borderColor: currentColors.border }}
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* RECENT / GROUP / TEMP TABS (PDF PAGE 2) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-hide">
                {!isSidebarCollapsed && (
                  <div className="flex gap-2 p-1.5 rounded-xl border text-[10px] font-black uppercase" style={{ borderColor: currentColors.border }}>
                    <button onClick={() => setActiveTab('recent')} className={`flex-1 py-2.5 rounded-lg transition-all ${activeTab === 'recent' ? (theme === 'dark' ? 'bg-white text-black shadow-xl' : 'bg-black text-white shadow-xl') : 'opacity-40'}`}>Recent</button>
                    <button onClick={() => setActiveTab('groups')} className={`flex-1 py-2.5 rounded-lg transition-all ${activeTab === 'groups' ? (theme === 'dark' ? 'bg-white text-black shadow-xl' : 'bg-black text-white shadow-xl') : 'opacity-40'}`}>Groups</button>
                    <button onClick={() => setActiveTab('temp')} className={`flex-1 py-2.5 rounded-lg transition-all ${activeTab === 'temp' ? (theme === 'dark' ? 'bg-white text-black shadow-xl' : 'bg-black text-white shadow-xl') : 'opacity-40'}`}>Temp</button>
                  </div>
                )}

                <div className="space-y-2">
                  <p className={`text-[10px] font-bold opacity-20 uppercase tracking-widest px-2 mb-4 ${isSidebarCollapsed && 'hidden'}`}>Archives</p>
                  {displayedHistory.map(item => (
                    <div key={item.id} onClick={() => setActionMenuId(actionMenuId === item.id ? null : item.id)} className="group relative flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-white/5 cursor-pointer transition-all">
                      <MessageSquare size={16} className="opacity-30 group-hover:opacity-100" />
                      {!isSidebarCollapsed && <span className="text-[12px] truncate flex-1 opacity-50 group-hover:opacity-100 font-segoe">{item.text}</span>}
                    </div>
                  ))}
                </div>

                {/* BOTTOM SIDEBAR LINKS (STRICT PDF PAGE 36) */}
                {!isSidebarCollapsed && (
                  <div className="pt-10 space-y-2 border-t" style={{ borderColor: currentColors.border }}>
                    {[
                      { icon: <Shield size={16}/>, label: "Terms & Conditions", m: 'terms' },
                      { icon: <ShieldCheck size={16}/>, label: "Privacy & Policy", m: 'privacy' },
                      { icon: <MessageCircle size={16}/>, label: "Feedback", m: 'feedback' },
                      { icon: <Clock size={16}/>, label: "History", m: 'history_full' },
                      { icon: <HelpCircle size={16}/>, label: "Help", m: 'help' }
                    ].map(link => (
                      <button key={link.label} onClick={() => setActiveModal(link.m)} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl opacity-40 hover:opacity-100 hover:bg-white/5 transition-all">
                        {link.icon} <span className="text-[11px] font-black uppercase tracking-widest">{link.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* USER PROFILE (PAGE 36) */}
              <div className="p-6 border-t space-y-6" style={{ borderColor: currentColors.border }}>
                {!isSidebarCollapsed && (
                  <div className="flex items-center gap-4 px-2">
                    <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center font-bold text-xl bg-black text-white shadow-2xl font-deltha italic">A</div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-black truncate uppercase tracking-widest font-segoe">{user?.displayName || 'Auditor'}</p>
                      <p className="text-[10px] opacity-30 uppercase font-black tracking-widest">{userData.tier} PLAN</p>
                    </div>
                    <button onClick={() => setActiveModal('settings')} className="p-2.5 opacity-30 hover:opacity-100 transition-all"><SettingsIcon size={20}/></button>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={toggleTheme} className="flex items-center justify-center p-4 rounded-2xl border hover:bg-white/5 transition-all shadow-inner" style={{ borderColor: currentColors.border }}>
                    {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                  </button>
                  <button onClick={() => signOut(auth)} className="flex items-center justify-center p-4 rounded-2xl border hover:bg-red-500 hover:text-white transition-all shadow-inner" style={{ borderColor: currentColors.border }}>
                    <Power size={20}/>
                  </button>
                </div>

                {!isSidebarCollapsed && (
                  <button onClick={() => setActiveModal('upgrade')} className="w-full flex items-center justify-center gap-4 p-5 bg-white text-black rounded-[1.5rem] font-black text-[11px] uppercase tracking-[4px] shadow-3xl hover:bg-gray-200 transition-all active:scale-95">
                    <CreditCard size={18} /> Upgrade Plan
                  </button>
                )}
              </div>
            </aside>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-20 border-b flex items-center justify-between px-10 relative z-40 backdrop-blur-3xl" style={{ borderColor: currentColors.border, backgroundColor: currentColors.bg + 'CC' }}>
                 <div className="flex items-center gap-8">
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-3 opacity-30 hover:opacity-100 transition-all active:scale-90"><Menu size={26} /></button>
                    <h2 className="font-deltha text-[12px] font-black uppercase tracking-[10px] opacity-30 italic">{activeNode.name} OPERATIONAL</h2>
                 </div>
                 <div className="flex items-center gap-4 border px-6 py-3 rounded-2xl text-xs shadow-inner" style={{ borderColor: currentColors.border }}>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-[3px]">Secure Relay Stable</span>
                 </div>
              </header>

              <main className="flex-1 overflow-hidden flex flex-col relative">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 md:p-32 space-y-16 scrollbar-hide">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-10">
                         <Globe size={140} />
                         <p className="mt-14 font-deltha text-[22px] tracking-[45px] uppercase ml-[45px]">Nexus</p>
                         <div className="mt-16 flex flex-col items-center gap-6 animate-in fade-in duration-1000">
                           {['Draft Research Command', 'Upload Lab Protocols', 'Select Neural Node'].map(txt => (
                             <p key={txt} className="text-[13px] font-black uppercase tracking-[8px] opacity-40 italic">{txt}</p>
                           ))}
                         </div>
                      </div>
                    ) : (
                      messages.map((m) => (
                        <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                           <div className={`max-w-[80%] p-10 rounded-[3.5rem] border transition-all ${m.role === 'ai' ? 'shadow-2xl' : 'shadow-3xl'}`} 
                                style={{ borderColor: currentColors.border, backgroundColor: m.role === 'ai' ? currentColors.card : (theme === 'dark' ? "#121212" : '#F8FAFC') }}>
                              <p className="text-md leading-relaxed whitespace-pre-wrap font-segoe">{m.text}</p>
                           </div>
                        </motion.div>
                      ))
                    )}
                    {isProcessing && <div className="flex justify-start animate-pulse"><div className="p-10 rounded-[3rem] border border-dashed text-[12px] font-black uppercase tracking-[5px] opacity-20" style={{ borderColor: currentColors.border }}>Synthesizing Swarm Stream...</div></div>}
                </div>

                {/* CONSOLE AREA (STRICT PPT SYMBOLS MAPPING) */}
                <div className="p-12 relative z-50">
                    <div className="max-w-5xl mx-auto">
                        <div className="rounded-[4rem] border shadow-[0_0_100px_rgba(0,0,0,0.4)] p-10 transition-all focus-within:ring-2 ring-white/10" style={{ borderColor: currentColors.border, backgroundColor: currentColors.card }}>
                            
                            <textarea 
                               ref={textareaRef}
                               className={`w-full bg-transparent border-none outline-none resize-none text-lg placeholder:opacity-20 min-h-[60px] max-h-[300px] overflow-y-auto font-segoe leading-relaxed ${isProcessing ? "cursor-not-allowed opacity-70" : ""}`}
                               placeholder="Draft Neural Command..." value={command}
                               onChange={(e) => { setCommand(e.target.value); resizeTextarea(); }}
                               onKeyDown={(e) => { if(e.key === "Enter" && !e.shiftKey && !isProcessing) { e.preventDefault(); executeResearch(); } }}
                            />

                            <div className="flex justify-between items-center mt-10 pt-8 border-t" style={{ borderColor: currentColors.border }}>
                               <div className="flex items-center gap-5">
                                  {/* Symbols strictly as mapped in PPT info slide */}
                                  <div className="relative">
                                    <button onClick={() => setShowNodeMenu(!showNodeMenu)} title="Models" className={`p-4 rounded-[1.5rem] transition-all ${showNodeMenu ? 'bg-white text-black shadow-3xl' : 'opacity-30 hover:opacity-100'}`}><Binary size={26}/></button>
                                    <AnimatePresence>
                                      {showNodeMenu && (
                                        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: -10, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className="absolute bottom-full left-0 mb-10 w-72 p-4 rounded-[2.5rem] border shadow-[0_0_120px_rgba(0,0,0,0.6)] z-[300]" style={{ backgroundColor: currentColors.sidebar, borderColor: currentColors.border }}>
                                          {STATIC_NODES.map(n => (
                                            <button key={n.id} onClick={() => { setActiveNode(n); setShowNodeMenu(false); }} className={`w-full flex items-center gap-5 p-5 rounded-2xl transition-all ${activeNode.id === n.id ? 'bg-white/10 border border-white/10 shadow-inner' : 'hover:bg-white/5'}`}>
                                              <div className={activeNode.id === n.id ? 'text-blue-500' : 'opacity-20'}>{n.icon}</div>
                                              <span className="text-[12px] font-black uppercase tracking-widest">{n.name}</span>
                                            </button>
                                          ))}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  
                                  <button onClick={startDictation} title="Dictate" className={`p-4 rounded-[1.5rem] opacity-30 hover:opacity-100 transition-all ${isDictating && 'bg-red-500/20 text-red-500 opacity-100 animate-pulse shadow-3xl'}`}><Mic size={26}/></button>
                                  
                                  <button onClick={() => speakAI(messages[messages.length-1]?.text)} title="Voice Assistant" className="p-4 rounded-[1.5rem] opacity-30 hover:opacity-100 transition-all"><Globe size={26}/></button>
                                  
                                  <button onClick={() => fileInputRef.current?.click()} title="Add File" className="p-4 rounded-[1.5rem] opacity-30 hover:opacity-100 transition-all"><Paperclip size={26}/></button>
                                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
                               </div>

                               <div className="flex items-center gap-12">
                                  <span className="text-[12px] font-black opacity-30 uppercase tracking-[6px] font-segoe">{userData.usageCount}/5 CYCLES</span>
                                  <button onClick={executeResearch} disabled={isProcessing} className={`px-20 py-6 rounded-[2rem] text-[13px] font-black uppercase tracking-[10px] transition-all flex items-center gap-5 active:scale-95 disabled:opacity-20 shadow-3xl ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                    ENTER <Send size={22} />
                                  </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </main>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUPS (SETTINGS, UPGRADE, HELP, FEEDBACK) */}
      <AnimatePresence>
        {activeModal && (
          <PopUp title={activeModal.toUpperCase().replace('_', ' ')} onClose={() => setActiveModal(null)}>
            {activeModal === 'settings' && (
              <div className="space-y-16">
                 <div className="flex items-center justify-between p-12 rounded-[4rem] border bg-black/5" style={{ borderColor: currentColors.border }}>
                    <div>
                      <h4 className="font-deltha text-3xl uppercase mb-4 italic tracking-[5px]">Interface Engine</h4>
                      <p className="text-sm opacity-40 font-segoe uppercase tracking-[2px]">Toggle between Obsidian Protocol and Snow Surface.</p>
                    </div>
                    <button onClick={toggleTheme} className="p-8 rounded-[2.5rem] bg-white text-black shadow-3xl hover:scale-110 active:scale-90 transition-all">{theme === 'dark' ? <Sun size={40}/> : <Moon size={40}/>}</button>
                 </div>
                 <div className="grid grid-cols-2 gap-10">
                    <button className="p-12 rounded-[3.5rem] border bg-white text-black font-black uppercase tracking-[5px] shadow-3xl active:scale-95 transition-all">Clear All History</button>
                    <button className="p-12 rounded-[3.5rem] border font-black uppercase tracking-[5px] opacity-40 hover:opacity-100 transition-all" style={{ borderColor: currentColors.border }}>Export User Data</button>
                 </div>
              </div>
            )}
            {activeModal === 'upgrade' && (
              <div className="flex flex-col items-center text-center space-y-16 py-10">
                 <h2 className="font-deltha text-6xl tracking-[20px] uppercase italic">Elevate Access</h2>
                 <div className="p-20 rounded-[5rem] border w-full max-w-xl bg-white/5 shadow-2xl relative overflow-hidden" style={{ borderColor: currentColors.border }}>
                    <div className="absolute top-0 right-0 p-10 opacity-10"><Shield size={120}/></div>
                    <p className="text-[14px] font-black uppercase opacity-30 mb-6 tracking-[8px]">Spectre Access Node</p>
                    <h3 className="text-8xl font-deltha uppercase mb-20 tracking-[15px]">$2,500<span className="text-sm opacity-20 ml-2">/mo</span></h3>
                    <ul className="space-y-4 mb-20 text-left max-w-xs mx-auto">
                       {['Infinite Cycles', 'Molecular Gap Scanning', 'FDA NAMs Reporting'].map(feat => (
                         <li key={feat} className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[3px] opacity-60"><FileCheck className="text-green-500" size={16}/> {feat}</li>
                       ))}
                    </ul>
                    <button className="w-full py-8 rounded-[2.5rem] bg-white text-black font-black uppercase tracking-[8px] shadow-3xl hover:scale-105 transition-all">Acquire Node</button>
                 </div>
              </div>
            )}
            {activeModal === 'feedback' && (
              <div className="space-y-16">
                <textarea className="w-full h-80 bg-black/5 border rounded-[4rem] p-16 outline-none focus:ring-4 ring-white/5 font-segoe text-xl shadow-inner leading-relaxed" placeholder="Draft packet for node administrators..." style={{ borderColor: currentColors.border }}></textarea>
                <div className="flex justify-between gap-12">
                   <button className="flex-1 flex items-center justify-center gap-5 p-10 border rounded-[3rem] text-[14px] font-black uppercase tracking-[8px] opacity-40 hover:opacity-100 transition-all shadow-xl" style={{ borderColor: currentColors.border }}><Camera size={24}/> Add Screenshot</button>
                   <button className="flex-1 p-10 bg-white text-black rounded-[3rem] text-[14px] font-black uppercase tracking-[8px] shadow-3xl hover:scale-[1.02] transition-all">Dispatch Feedback</button>
                </div>
              </div>
            )}
          </PopUp>
        )}
      </AnimatePresence>

      {/* ERROR DISMISSAL */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ x: 550 }} animate={{ x: 0 }} exit={{ x: 550 }} className="fixed bottom-14 right-14 z-[700] border-l-8 p-12 rounded-r-[3rem] shadow-[0_0_120px_rgba(0,0,0,0.6)] flex items-center gap-14 max-lg bg-white text-black border-red-500">
            <AlertTriangle className="text-red-500 shrink-0" size={50} />
            <div className="flex-1 text-[14px] font-black uppercase leading-relaxed font-segoe tracking-[4px]">{error}</div>
            <button onClick={() => setError(null)} className="p-4 hover:bg-black/5 rounded-full transition-all active:scale-90"><X size={32} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}