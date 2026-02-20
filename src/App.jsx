import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float, MeshDistortMaterial } from '@react-three/drei';
import * as random from 'maath/random';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut 
} from 'firebase/auth';
import { 
  getFirestore, doc, collection, onSnapshot, 
  addDoc, deleteDoc, updateDoc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Send, History, Settings, X, Pin, Trash2, Share2, 
  Crown, Mail, Globe, ShieldCheck, Cpu, Terminal, 
  ChevronRight, AlertOctagon, Zap, Menu, User, 
  CheckCircle2, Laptop, Smartphone, Tablet,
  FlaskConical, Scale, Factory, Microscope, Activity, Binary, 
  RefreshCw, Power, ShieldAlert, MicroscopeIcon, Gavel, Truck, Search, Briefcase
} from 'lucide-react';

// --- FIREBASE PRODUCTION CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyB0as5wtNMh_D472nJPFxa_eBdEgDacI60",
  authDomain: "scropio-89341.firebaseapp.com",
  projectId: "scropio-89341",
  storageBucket: "scropio-89341.firebasestorage.app",
  messagingSenderId: "344477970541",
  appId: "1:344477970541:web:98a853d3ae4ea4070d0f64"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "scorpio-singularity-final";

// --- NODE INTELLIGENCE DEFINITIONS (From Excel) ---
const NODES = [
  { id: 1, name: "Science Audit", icon: <MicroscopeIcon size={18}/>, prompt: "Bio-Regulatory Auditor: Analyze lab notes for errors, extract chemical variables, and give a Reproducibility Score (0-100%)." },
  { id: 2, name: "Legal Log", icon: <Gavel size={18}/>, prompt: "Patent Lawyer: Document every action into a Human-Guided Invention Log for 2026 patent laws." },
  { id: 3, name: "NAMs Report", icon: <ShieldAlert size={18}/>, prompt: "FDA Specialist: Reformat data into Animal-Free regulatory reports (NAMs)." },
  { id: 4, name: "Supply Chain", icon: <Truck size={18}/>, prompt: "Logistics Expert: Scan chemicals and identify 3 global backup suppliers for 2026." },
  { id: 5, name: "IP Hunter", icon: <Search size={18}/>, prompt: "IP Strategist: Identify 'whitespace' in molecular structures not yet patented." },
  { id: 6, name: "Patent Cliff", icon: <Briefcase size={18}/>, prompt: "Biotech Consultant: Identify 6-month patent extensions via Rare Disease or Pediatric use cases." }
];

// --- 3D ENGINE (SAFE MODE - NO ASSETS) ---
const NeuralVFX = () => {
  const ref = useRef();
  const sphere = useMemo(() => random.inSphere(new Float32Array(5000), { radius: 6 }), []);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 20;
      ref.current.rotation.y -= delta / 25;
    }
  });
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#8B1116" size={0.02} sizeAttenuation depthWrite={false} opacity={0.4} />
      </Points>
    </group>
  );
};

const ScorpioCore = () => {
  const mesh = useRef();
  useFrame((state) => {
    if (mesh.current) mesh.current.rotation.y = state.clock.getElapsedTime() * 0.3;
  });
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={mesh}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <MeshDistortMaterial color="#050506" distort={0.4} speed={2} roughness={0} metalness={1} emissive="#8B1116" emissiveIntensity={0.5} />
      </mesh>
    </Float>
  );
};

// --- MAIN APPLICATION ---
export default function App() {
  const [view, setView] = useState('loading'); 
  const [user, setUser] = useState(null);
  const [command, setCommand] = useState("");
  const [activeNode, setActiveNode] = useState(NODES[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Authentication Handshake
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setView(u ? 'dash' : 'auth');
    });
    return () => unsubscribe();
  }, []);

  // History Sync
  useEffect(() => {
    if (!user || view !== 'dash') return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(data.sort((a, b) => b.timestamp - a.timestamp));
    });
  }, [user, view]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      setError("ERR_AUTH: Handshake rejected. Check Authorized Domains.");
    }
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    setTimeout(async () => {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
          text: command,
          node: activeNode.name,
          timestamp: Date.now(),
          systemPrompt: activeNode.prompt
        });
        setCommand("");
      } catch (e) { setError("ERR_NET: Transmission desync."); }
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-[#050506] text-silver font-sans selection:bg-crimson/40 overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;500;700&display=swap');
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .glass-panel { background: rgba(13, 13, 18, 0.9); backdrop-filter: blur(40px); border: 1px solid rgba(139, 17, 22, 0.2); }
        .glass-card { background: rgba(20, 20, 25, 0.9); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.04); }
        .crimson-glow { box-shadow: 0 0 50px rgba(139, 17, 22, 0.35); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #8B1116; border-radius: 10px; }
      `}</style>

      {/* 3D CORE (IMMORTAL) */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#8B1116" />
          <Suspense fallback={null}><ScorpioCore /><NeuralVFX /></Suspense>
        </Canvas>
      </div>

      <AnimatePresence mode="wait">
        {view === 'loading' && (
           <motion.div key="l" exit={{ opacity: 0 }} className="absolute inset-0 z-[200] bg-[#050506] flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 border-t-2 border-crimson rounded-full animate-spin mb-8" />
              <p className="font-orbitron text-[10px] font-black tracking-[10px] text-crimson animate-pulse uppercase">Syncing Scorpio...</p>
           </motion.div>
        )}

        {view === 'auth' && (
          <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-50 h-full flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-xl glass-panel p-12 md:p-20 rounded-[5rem] text-center crimson-glow border-white/5 font-orbitron">
              <div className="text-4xl font-black tracking-[15px] text-white uppercase italic mb-6">Scorpio</div>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-gray-600 mb-14 tracking-widest">Neural Gateway Access</p>
              <button onClick={handleGoogleLogin} className="w-full py-6 glass-card border-white/5 hover:bg-white/10 text-silver font-black uppercase tracking-widest text-[11px] rounded-3xl transition-all flex items-center justify-center gap-5 mb-12 shadow-xl">
                <Globe size={18} className="text-crimson" /> Google Identity Node
              </button>
            </div>
          </motion.div>
        )}

        {view === 'dash' && (
          <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex h-full p-4 md:p-8 gap-8 overflow-hidden">
            {/* Nav Rail */}
            <aside className="hidden lg:flex w-28 glass-panel rounded-[4rem] flex-col items-center py-16 gap-14 border-white/5 shadow-2xl">
               <div className="font-orbitron text-[11px] font-black text-white italic -rotate-90 py-12 tracking-[15px] select-none uppercase">Scorpio</div>
               <div className="flex flex-col gap-14 text-gray-600 mt-8">
                  {NODES.slice(0, 4).map(node => (
                    <div key={node.id} onClick={() => setActiveNode(node)} className={`p-3 rounded-xl cursor-pointer transition-all ${activeNode.id === node.id ? 'text-crimson bg-crimson/10' : 'hover:text-white'}`}>
                      {node.icon}
                    </div>
                  ))}
                  <Settings size={26} className="hover:text-white cursor-pointer mt-4" onClick={() => setIsSidebarOpen(true)} />
               </div>
               <button onClick={() => signOut(auth)} className="mt-auto p-4 text-crimson opacity-30 hover:opacity-100 transition-all hover:scale-110"><Power size={36} /></button>
            </aside>

            <main className="flex-1 flex flex-col gap-8 overflow-hidden">
              <header className="h-24 glass-panel rounded-[3rem] flex items-center justify-between px-12 border-white/5 shadow-2xl font-orbitron">
                <div className="flex items-center gap-12">
                  <Menu size={28} className="lg:hidden text-white cursor-pointer" onClick={() => setIsSidebarOpen(true)} />
                  <div className="text-2xl font-black tracking-[10px] text-white uppercase italic select-none">Scorpio</div>
                </div>
                <div className="hidden md:flex items-center gap-4 px-6 py-2 glass-card rounded-2xl border-white/5">
                   <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Active Node:</p>
                   <p className="text-[11px] font-bold text-crimson uppercase">{activeNode.name}</p>
                </div>
              </header>

              <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
                <section className="col-span-12 lg:col-span-8 flex flex-col gap-8 overflow-hidden">
                  <div className="flex-1 glass-panel rounded-[5rem] p-12 md:p-16 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-20 text-[20rem] font-black text-white/[0.02] italic select-none pointer-events-none font-orbitron uppercase">Scorpio</div>
                    <div className="relative z-10 h-full flex flex-col">
                      <textarea placeholder={`Hey, input context for ${activeNode.name}...`} value={command} onChange={e => setCommand(e.target.value)}
                        className="w-full h-full bg-transparent border-none outline-none text-4xl md:text-6xl font-light text-white placeholder:text-gray-900 resize-none scrollbar-hide"
                      />
                      <div className="mt-auto pt-10 border-t border-white/5 flex items-center justify-between">
                        {/* SKETCH ACCURATE INPUT BAR */}
                        <div className="flex items-center gap-8 bg-black/50 border border-white/5 p-4 rounded-[4rem] w-full max-w-2xl relative shadow-2xl focus-within:border-crimson/40 transition-all">
                           <button type="button" className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 transition-colors" onClick={() => setIsSubscriptionOpen(true)}><Plus size={32} /></button>
                           <div className="flex-1 text-[12px] font-black text-gray-800 uppercase tracking-widest pl-4 hidden sm:block select-none italic">Awaiting Protocol Instruction...</div>
                           <button onClick={handleCommand} disabled={isProcessing} className={`p-8 bg-[#8B1116] text-white rounded-full shadow-2xl transition-all ${isProcessing ? 'animate-pulse' : 'hover:scale-110 active:scale-90'}`}>
                              {isProcessing ? <RefreshCw className="animate-spin" size={32} /> : <Send size={32} />}
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="col-span-12 lg:col-span-4 flex flex-col gap-8 overflow-hidden font-orbitron">
                  <div className="flex-1 glass-panel rounded-[4.5rem] p-10 overflow-hidden flex flex-col shadow-2xl">
                    <h3 className="text-[11px] font-black uppercase tracking-[8px] text-gray-600 mb-10 flex items-center gap-5"><History size={20} /> Telemetry</h3>
                    <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6 font-sans">
                       {history.length > 0 ? history.map(item => (
                         <div key={item.id} className="p-6 glass-card rounded-3xl group border border-white/5 hover:border-crimson/30 transition-all">
                            <p className="text-[12px] text-silver/70 italic leading-relaxed mb-4 line-clamp-2">"{item.text}"</p>
                            <div className="flex justify-between items-center opacity-30 group-hover:opacity-100">
                               <span className="text-[8px] font-black uppercase tracking-tighter text-crimson">{item.node}</span>
                               <Trash2 size={14} className="cursor-pointer hover:text-red-500" onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', item.id))} />
                            </div>
                         </div>
                       )) : (
                         <div className="text-center py-20 opacity-10 flex flex-col items-center">
                            <History size={60} className="mb-6" />
                            <p className="text-[10px] uppercase font-black tracking-widest italic">Awaiting Data Capture...</p>
                         </div>
                       )}
                    </div>
                  </div>
                </section>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAYS */}
      <AnimatePresence>
        {isSidebarOpen && (
           <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-black/85 z-[60] backdrop-blur-xl" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 35 }} className="absolute top-0 right-0 h-full w-full max-w-sm glass-panel z-[70] p-14 flex flex-col border-l border-white/5 font-orbitron shadow-2xl">
                <div className="flex justify-between items-center mb-16">
                    <h2 className="text-sm font-black tracking-[8px] uppercase text-white italic underline decoration-crimson decoration-4">Archives</h2>
                    <X size={28} className="cursor-pointer hover:text-crimson transition-colors" onClick={() => setIsSidebarOpen(false)} />
                </div>
                <div className="space-y-10 flex-1">
                   <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Node Intelligence Models</p>
                   <div className="grid grid-cols-1 gap-4">
                      {NODES.map(node => (
                        <div key={node.id} onClick={() => { setActiveNode(node); setIsSidebarOpen(false); }} className={`p-6 glass-card rounded-2xl cursor-pointer border border-white/5 transition-all flex items-center gap-6 ${activeNode.id === node.id ? 'border-crimson bg-crimson/5' : 'hover:border-crimson/20'}`}>
                           <div className="text-crimson">{node.icon}</div>
                           <div className="flex-1">
                              <p className="text-[11px] font-black text-white uppercase">{node.name}</p>
                              <p className="text-[9px] text-gray-600 line-clamp-1 italic">{node.prompt}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
                <button onClick={() => { setIsSubscriptionOpen(true); setIsSidebarOpen(false); }} className="w-full bg-gradient-to-r from-crimson to-red-900 p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl mb-8 active:scale-95 transition-all">
                    <Crown size={24} className="text-white" />
                    <span className="text-[12px] font-black uppercase tracking-[4px] text-white">Engage All Tools</span>
                </button>
            </motion.aside>
           </>
        )}

        {error && (
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="absolute bottom-12 right-12 z-[400] glass-card border-l-4 border-crimson p-10 flex items-center gap-8 shadow-2xl">
            <AlertOctagon className="text-crimson animate-pulse" size={36} />
            <div>
               <p className="text-[11px] font-black uppercase tracking-[4px] text-white font-orbitron">Neural Exception</p>
               <p className="text-[11px] font-bold text-gray-600 uppercase mt-2 leading-relaxed">{error}</p>
            </div>
            <X size={20} className="ml-10 cursor-pointer opacity-30 hover:opacity-100" onClick={() => setError(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="absolute bottom-0 left-0 right-0 py-10 px-[10%] border-t border-white/5 flex flex-col md:flex-row justify-between items-center bg-black/40 backdrop-blur-md italic font-black text-[10px] uppercase tracking-[5px] font-orbitron z-50">
         <span className="text-gray-800 text-center leading-relaxed">© {new Date().getFullYear()} SCORPIO. ALL NEURAL PROTOCOLS RESERVED.</span>
         <div className="flex gap-10 text-gray-900 opacity-40"><span className="hover:text-crimson cursor-pointer">Neural Sovereignty</span><span className="hover:text-crimson cursor-pointer">Legal Encrypt</span></div>
      </footer>
    </div>
  );
}