import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut 
} from 'firebase/auth';
import { 
  getFirestore, doc, collection, onSnapshot, addDoc, getDoc, setDoc, query, orderBy, limit 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
// REFINEMENT: Removed unused imports to reduce bundle size
import { 
  Send, Binary, RefreshCw, Power, Microscope, Gavel, ShieldCheck, 
  Truck, Search, Briefcase, UserCircle, CreditCard, Paperclip, 
  FileText, Menu, Bell, AlertTriangle, MessageSquare, Plus, X 
} from 'lucide-react';

// ============================================================
// 🔐 MODULE 1: FIREBASE SERVICES
// ============================================================
// UPDATED: Forced strict environment mapping for local production
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'scorpio-enterprise-v15';

// ============================================================
// 🧠 MODULE 2: SYSTEM CONSTANTS
// ============================================================
const STATIC_NODES = [
  { id: 'n1', name: "Science Audit", icon: <Microscope size={14}/>, desc: "Analyze lab notes for errors and chemical variables.", prompt: "Bio-Regulatory Auditor mode." },
  { id: 'n2', name: "Legal Log", icon: <Gavel size={14}/>, desc: "Generate Human-Guided Invention Logs for patent compliance.", prompt: "Patent Lawyer mode." },
  { id: 'n3', name: "NAMs Report", icon: <ShieldCheck size={14}/>, desc: "Reformat data into animal-free regulatory reports.", prompt: "FDA Specialist mode." },
  { id: 'n4', name: "Supply Chain", icon: <Truck size={14}/>, desc: "Identify 3 global backup suppliers to prevent disruption.", prompt: "Logistics Expert mode." },
  { id: 'n5', name: "IP Hunter", icon: <Search size={14}/>, desc: "Analyze molecular structures for unclaimed patent gaps.", prompt: "IP Strategist mode." },
  { id: 'n6', name: "Patent Cliff", icon: <Briefcase size={14}/>, desc: "Identify paths to 6-month extensions via Rare Disease.", prompt: "Consultant mode." }
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

// ============================================================
// 🎨 MODULE 3: VISUAL COMPONENTS
// ============================================================
const ScorpioLogo = ({ size = "sm", collapsed = false }) => {
  const [imgError, setImgError] = useState(false);
  const dim = size === "sm" ? "h-8 w-8" : "h-14 w-14";
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`${dim} flex items-center justify-center bg-crimson/5 rounded-xl border border-crimson/20 overflow-hidden`}>
        {imgError ? <Binary className="text-crimson" size={size === "sm" ? 18 : 32} /> : 
          <img 
            src="/scorpio-logo.png" 
            alt="Scorpio Logo" 
            loading="lazy"
            className="w-full h-full object-contain p-1.5" 
            onError={() => setImgError(true)} 
          />
        }
      </div>
      {!collapsed && <span className="font-deltha font-black tracking-widest text-white uppercase italic text-lg">Scorpio</span>}
    </div>
  );
};

const NeuralVFX = () => {
  const ref = useRef();
  const particleCount = useMemo(() => {
    if (typeof window === "undefined") return 1200;
    return window.innerWidth < 768 ? 800 : 1500;
  }, []);

  const sphere = useMemo(() => random.inSphere(new Float32Array(particleCount), { radius: 5.5 }), [particleCount]);
  
  useFrame((state, delta) => { if (ref.current) { ref.current.rotation.x -= delta/70; ref.current.rotation.y -= delta/75; } });
  
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#8B1116" size={0.01} sizeAttenuation depthWrite={false} opacity={0.08} />
      </Points>
    </group>
  );
};

// ============================================================
// 🚀 MODULE 4: CORE APPLICATION ENGINE
// ============================================================
export default function App() {
  const [view, setView] = useState('loading'); 
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ tier: 'GHOST', usageCount: 0 });
  const [command, setCommand] = useState("");
  // REFINEMENT: Node memoization to prevent unnecessary re-renders
  const nodes = useMemo(() => STATIC_NODES, []);
  // REFINEMENT: Stale reference prevention via state initializer
  const [activeNode, setActiveNode] = useState(() => nodes[0]);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]); 
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const isPro = userData.tier === 'SPECTRE' || userData.tier === 'SINGULARITY';

  // REFINEMENT: Enhanced generateId randomness (Entropy fix)
  const generateId = () => 
    crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // REFINEMENT: Scroll performance optimization for large history
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: messages.length < 10 ? "smooth" : "auto"
      });
    }
  }, [messages, isProcessing]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    const handleInitialAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) { console.error("Identity token validation failed:", e); }
      }
    };
    handleInitialAuth();

    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setUserData(snap.data());
          } else {
            const initial = { tier: 'GHOST', usageCount: 0 };
            await setDoc(userRef, initial);
            setUserData(initial);
          }
        } catch (e) { console.error("Identity load fault:", e); }
        setView('dash');
      } else {
        try { await signInAnonymously(auth); } catch (e) { setView('auth'); }
      }
    });
  }, []);

  useEffect(() => {
    if (!user || view !== 'dash') return;
    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'history'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Archive link unstable:", err));

    return () => unsubscribe();
  }, [user, view]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const maxFiles = isPro ? 10 : 1; 
    const allowedTypes = ["text/plain", "application/pdf", "application/json"];

    // REFINEMENT: setStagedFiles early return for performance
    setStagedFiles(prev => {
      if (!files.length) return prev;
      const names = new Set(prev.map(f => f.name));
      const filtered = files.filter(f => !names.has(f.name));

      for (const file of filtered) {
        if (!allowedTypes.includes(file.type)) {
          setError(`Unsupported file type: ${file.name}`);
          return prev;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`Payload Blocked: ${file.name} exceeds 5MB limit.`);
          return prev;
        }
      }

      if (prev.length + filtered.length > maxFiles) {
        setError(`Node restriction. ${userData.tier} allows a maximum of ${maxFiles} packets.`);
        return prev;
      }

      return [...prev, ...filtered];
    });
  };

  const handleCommand = async (e) => {
    if (e) e.preventDefault();
    if (isProcessing) return;

    if (!isPro && userData.usageCount >= 5) {
      setError("Cycle limit reached. Upgrade node access.");
      return;
    }

    if (command.length > 8000) {
      setError("Input exceeds maximum protocol size.");
      return;
    }

    if ((!command.trim() && stagedFiles.length === 0)) return;

    const currentText = command;
    const currentFiles = [...stagedFiles];
    
    const msgId = generateId();
    setMessages(prev => [...prev, { 
      id: msgId, 
      role: 'user', 
      text: currentText, 
      files: currentFiles.map(f => f.name),
      timestamp: Date.now()
    }]);
    
    setIsProcessing(true);
    setCommand("");
    setStagedFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    const controller = new AbortController();
    let timeoutId;

    try {
      if (!auth.currentUser) throw new Error("Re-authenticating terminal...");
      const token = await auth.currentUser.getIdToken(true);

      const formData = new FormData();
      formData.append("message", currentText);
      formData.append("nodePrompt", activeNode.prompt);
      
      // REFINEMENT: Safety FormData checks
      currentFiles?.forEach(file => {
        if (file) formData.append("files", file);
      });

      timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal,
        body: formData
      });

      clearTimeout(timeoutId);

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = { error: "Neural output unparseable." };
      }

      if (!response.ok) {
        const msg = data?.error || `Server error (${response.status})`;
        throw new Error(msg);
      }

      // REFINEMENT: AI Response Whitespace Trimming
      const aiText = data.result?.trim();
      if (!aiText) {
        throw new Error("AI returned empty response.");
      }
      
      setMessages(prev => [...prev, { 
        id: generateId(), 
        role: 'ai', 
        text: aiText, 
        timestamp: Date.now() 
      }]);
      
      setUserData(prev => ({ ...prev, usageCount: prev.usageCount + 1 }));
      
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
        text: currentText,
        aiResponse: aiText,
        node: activeNode.name,
        timestamp: Date.now()
      });
    } catch (err) {
      // REFINEMENT: Simplified timeout cleanup
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') setError("Protocol Timeout: Neural link desynchronized.");
      else setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F10] text-gray-200 flex overflow-hidden font-sans selection:bg-crimson/20">
      <style>{`
        @font-face { font-family: 'Deltha'; src: url('/fonts/Deltha.ttf') format('truetype'); font-display: swap; }
        @font-face { font-family: 'Segoe UI'; src: local('Segoe UI'); font-display: swap; }
        .font-deltha { font-family: 'Deltha', sans-serif; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #8B1116; border-radius: 10px; }
      `}</style>

      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}><Suspense fallback={null}><NeuralVFX /></Suspense></Canvas>
      </div>

      <AnimatePresence mode="wait">
        {view === 'loading' && (
           <motion.div key="l" exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-[#0F0F10] flex flex-col items-center justify-center">
              <RefreshCw className="animate-spin text-crimson" size={32} />
           </motion.div>
        )}

        {view === 'dash' && (
          <div className="flex relative z-10 w-full max-w-screen-2xl mx-auto h-screen overflow-hidden border-x border-white/5 bg-[#0F0F10]">
            
            <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} min-w-[80px] bg-[#0F0F10] border-r border-white/5 transition-all duration-300 flex flex-col z-[100]`}>
               <div className="h-20 flex items-center px-4 border-b border-white/5"><ScorpioLogo collapsed={isSidebarCollapsed} /></div>
               <div className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-hide">
                  <button type="button" onClick={() => setMessages([])} className="w-full flex items-center gap-4 p-3 bg-crimson/10 border border-crimson/20 rounded-xl text-white hover:bg-crimson/20 transition-all active:scale-95 group">
                    <Plus size={20} className="text-crimson" /> 
                    {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">New Chat</span>}
                  </button>
                  <div className="pt-8 space-y-1">
                    <p className={`text-[9px] font-black text-gray-700 uppercase tracking-widest px-3 mb-4 ${isSidebarCollapsed && 'hidden'}`}>Archives</p>
                    {/* REFINEMENT: Safety Rendering Guard + Performance cap (20 entries) */}
                    {(history || []).slice(0, 20).map(item => (
                      <div key={item.id} className="group flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer">
                        <MessageSquare size={16} className="text-gray-600 group-hover:text-crimson" />
                        {!isSidebarCollapsed && <span className="text-[11px] text-gray-400 truncate flex-1">{item.text}</span>}
                      </div>
                    ))}
                  </div>
               </div>
               <div className="p-4 border-t border-white/5 space-y-3">
                  <div className="flex items-center gap-4 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer">
                     <div className="w-8 h-8 rounded-lg bg-gray-900 border border-crimson/30 flex items-center justify-center font-bold text-xs text-crimson">{user?.email?.[0]?.toUpperCase() || 'A'}</div>
                     {!isSidebarCollapsed && <div className="flex-1 overflow-hidden"><p className="text-xs font-black truncate">{user?.displayName || 'Auditor'}</p><p className="text-[8px] text-crimson font-black uppercase">{userData.tier}</p></div>}
                  </div>
                  <button type="button" onClick={() => signOut(auth)} className="w-full flex items-center gap-4 px-3 py-3 text-gray-600 hover:text-red-500 transition-colors"><Power size={18}/> {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase">Logout</span>}</button>
               </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#111827]/40 backdrop-blur-md relative z-40">
                 <div className="flex items-center gap-6">
                    <button type="button" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 text-gray-500 hover:text-white transition-all active:scale-90"><Menu size={20} /></button>
                    <h2 className="text-[10px] font-black uppercase tracking-[3px] text-white/30">{activeNode.name} Active</h2>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 text-green-500">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Stable Link</span>
                    </div>
                    <Bell size={20} className="text-gray-600 hover:text-white cursor-pointer" />
                 </div>
              </header>

              <main className="flex-1 overflow-hidden flex flex-col relative">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-16 space-y-12 scrollbar-hide">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-50 text-gray-500">
                         <ScorpioLogo size="lg" />
                         <p className="mt-8 font-deltha text-[10px] tracking-[10px] uppercase italic">Scorpio</p>
                      </div>
                    ) : (
                      messages.map((m) => (
                        <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                           <div className={`max-w-[75%] p-6 rounded-2xl border ${m.role === 'ai' ? 'bg-[#121218] border-white/5 text-gray-300 shadow-xl' : 'bg-crimson/5 border-crimson/30 text-white'}`}>
                              {m.files && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {/* REFINEMENT: Key stability fix for file chips */}
                                  {m.files.map((f, i) => <div key={`${f}-${i}`} className="flex items-center gap-2 p-1.5 bg-black/40 rounded-lg border border-white/5 text-[8px] font-bold text-crimson uppercase"><FileText size={10}/> {f}</div>)}
                                </div>
                              )}
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                           </div>
                        </motion.div>
                      ))
                    )}
                    {isProcessing && <div className="flex justify-start animate-pulse"><div className="bg-[#121218] p-5 rounded-2xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-600 italic">Synthesizing Agency Protocol...</div></div>}
                </div>

                <div className="p-8 relative z-50">
                    <div className="max-w-4xl mx-auto relative">
                        <AnimatePresence>
                          {stagedFiles.length > 0 && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute bottom-full mb-4 left-0 flex flex-col gap-2 w-full">
                               <div className="flex justify-between px-2 text-[9px] font-black uppercase tracking-widest">
                                  <span className="text-gray-600">{stagedFiles.length} Packets Staged</span>
                                  <button type="button" onClick={() => setStagedFiles([])} className="text-crimson hover:underline">Flush All</button>
                               </div>
                               <div className="flex flex-wrap gap-3">
                                  {stagedFiles.map((f, i) => (
                                    <div key={`${f.name}-${i}`} className="p-3 bg-graphite border border-crimson/30 rounded-xl shadow-2xl flex items-center gap-4">
                                       <div className="p-1 bg-crimson/10 rounded-lg text-crimson"><Paperclip size={14}/></div>
                                       <span className="text-[10px] font-black text-white uppercase truncate max-w-[120px]">{f.name}</span>
                                       <button type="button" onClick={() => setStagedFiles(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-white transition-colors"><X size={14}/></button>
                                    </div>
                                  ))}
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {showTools && (
                            <motion.div 
                              onMouseEnter={() => setShowTools(true)} 
                              onMouseLeave={() => setShowTools(false)}
                              initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 15, opacity: 0 }} 
                              className="absolute bottom-full mb-4 left-0 w-64 bg-[#0C0C10] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 overflow-visible"
                            >
                               {nodes.map(node => (
                                 <div 
                                    key={node.id} onMouseEnter={() => setHoveredNodeId(node.id)} onMouseLeave={() => setHoveredNodeId(null)}
                                    onClick={() => { setActiveNode(node); setShowTools(false); }} 
                                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${activeNode.id === node.id ? 'bg-crimson/10 text-white' : 'hover:bg-white/5 text-gray-500'}`}
                                 >
                                    <div className={activeNode.id === node.id ? 'text-crimson' : ''}>{node.icon}</div>
                                    <span className="text-[11px] font-black uppercase tracking-widest">{node.name}</span>
                                    <AnimatePresence>
                                       {hoveredNodeId === node.id && (
                                          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-48 bg-[#1F2937] border border-white/10 p-3 rounded-xl shadow-2xl z-[110]">
                                             <p className="text-[9px] font-medium leading-tight text-gray-400 italic">"{node.desc}"</p>
                                          </motion.div>
                                       )}
                                    </AnimatePresence>
                                 </div>
                               ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="bg-[#111827] border border-white/10 rounded-3xl shadow-2xl p-4 transition-all focus-within:border-crimson/40">
                            <textarea 
                               className={`w-full bg-transparent border-none outline-none resize-none text-sm text-white placeholder:text-gray-800 min-h-[60px] max-h-[200px] overflow-y-auto ${isProcessing ? "cursor-not-allowed opacity-70" : ""}`}
                               placeholder="Ask Scorpio..." value={command}
                               onChange={(e) => setCommand(e.target.value)}
                               onKeyDown={(e) => { 
                                 if(e.key === "Enter" && !e.shiftKey){
                                   e.preventDefault(); 
                                   handleCommand();
                                 } 
                               }}
                            />
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                               <div className="flex items-center gap-2">
                                  <input type="file" ref={fileInputRef} className="hidden" multiple={isPro} onChange={handleFileUpload} />
                                  <button 
                                    type="button"
                                    onMouseEnter={() => setShowTools(true)} 
                                    onMouseLeave={() => setShowTools(false)}
                                    className="p-2.5 bg-obsidian border border-white/5 rounded-xl hover:border-crimson/50 transition-all text-gray-500 hover:text-white shadow-inner"
                                  >
                                    <Binary size={16} />
                                  </button>
                                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-600 hover:text-crimson transition-colors hover:scale-110 active:scale-90"><Paperclip size={20} /></button>
                               </div>
                               <div className="flex items-center gap-6">
                                  <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">{userData.usageCount}/{isPro ? '∞' : '5'} CYCLES</span>
                                  <button type="button" onClick={handleCommand} disabled={isProcessing} className="bg-crimson hover:bg-red-800 px-6 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-[3px] transition-all flex items-center gap-3 shadow-lg active:scale-95 disabled:opacity-20 hover:scale-[1.02]">EXECUTE <Send size={14}/></button>
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

      <AnimatePresence>
        {error && (
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="fixed bottom-10 right-10 z-[500] bg-obsidian border-l-4 border-crimson p-6 rounded-r-xl shadow-2xl flex items-center gap-6 max-w-sm">
            <AlertTriangle className="text-crimson shrink-0" size={24} />
            <div className="flex-1 text-[10px] font-bold text-gray-400 uppercase leading-relaxed">{error}</div>
            <button type="button" onClick={() => setError(null)}><X size={16} className="text-gray-700 hover:text-white" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}