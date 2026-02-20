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
  ChevronRight, ExternalLink, AlertOctagon, Zap, 
  Menu, User, CheckCircle2, Laptop, Smartphone, Tablet,
  FlaskConical, Scale, Factory, Microscope, Lock, Activity, Binary, 
  MapPin, Download, RefreshCw
} from 'lucide-react';

// --- SYSTEM INITIALIZATION ---
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
const appId = "scorpio-main-node";

// --- 3D NEURAL VISUALS ---

const Particles = () => {
  const ref = useRef();
  const sphere = useMemo(() => random.inSphere(new Float32Array(5000), { radius: 6 }), []);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 25;
      ref.current.rotation.y -= delta / 30;
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

const NeuralCore = () => {
  const mesh = useRef();
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={mesh}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <MeshDistortMaterial color="#050506" distort={0.4} speed={2} metalness={1} emissive="#8B1116" emissiveIntensity={0.5} />
      </mesh>
    </Float>
  );
};

// --- MAIN APPLICATION ---

export default function App() {
  const [view, setView] = useState('loading'); 
  const [user, setUser] = useState(null);
  const [command, setCommand] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemLogs, setSystemLogs] = useState(["SYSTEM_READY", "AWAITING_UPLINK"]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setView(u ? 'dash' : 'auth');
    });
    return () => unsubscribe();
  }, []);

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
      setError("ERR_AUTH: Handshake failed. Ensure domain is whitelisted.");
    }
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    if (command.toLowerCase().includes("pdf") || command.toLowerCase().includes("word")) {
       setError("ERR_TIER: Spectre Access Required.");
       return;
    }

    setIsProcessing(true);
    setSystemLogs(prev => ["INIT_SCORPIO_SCAN...", ...prev]);

    setTimeout(async () => {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
          text: command,
          timestamp: Date.now(),
          node: `NODE_${Math.floor(Math.random()*999)}`,
        });
        setCommand("");
        setSystemLogs(prev => ["SCAN_SUCCESS", ...prev]);
      } catch (e) { setError("ERR_NET: Uplink failed."); }
      setIsProcessing(false);
    }, 1200);
  };

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', id));
  };

  return (
    <div className="min-h-screen bg-[#050506] text-silver font-sans selection:bg-red-900/40 overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;500;700&display=swap');
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .glass-panel { background: rgba(13, 13, 18, 0.9); backdrop-filter: blur(40px); border: 1px solid rgba(139, 17, 22, 0.2); }
        .glass-card { background: rgba(20, 20, 25, 0.9); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.04); }
        .crimson-glow { box-shadow: 0 0 50px rgba(139, 17, 22, 0.35); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #8B1116; border-radius: 10px; }
      `}</style>

      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none bg-[#050506]">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#8B1116" />
          <Suspense fallback={null}><NeuralCore /><Particles /></Suspense>
        </Canvas>
      </div>

      <AnimatePresence mode="wait">
        {view === 'loading' && (
           <motion.div key="l" exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#050506] flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 border-t-2 border-crimson rounded-full animate-spin mb-8" />
              <p className="font-orbitron text-[10px] font-black tracking-[10px] text-crimson animate-pulse uppercase italic">Syncing Scorpio...</p>
           </motion.div>
        )}

        {view === 'auth' && (
          <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-50 min-h-screen flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
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
          <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex h-screen p-4 md:p-8 gap-8 overflow-hidden">
            <aside className="hidden lg:flex w-28 glass-panel rounded-[4rem] flex-col items-center py-16 gap-14 border-white/5 shadow-2xl">
               <div className="font-orbitron text-[11px] font-black text-white italic -rotate-90 py-12 tracking-[15px] select-none uppercase">Scorpio</div>
               <div className="flex flex-col gap-14 text-gray-600 mt-8">
                  <Microscope size={28} className="hover:text-crimson cursor-pointer transition-colors" />
                  <Scale size={28} className="hover:text-crimson cursor-pointer transition-colors" onClick={() => setIsSubscriptionOpen(true)} />
                  <Settings size={28} className="hover:text-white cursor-pointer transition-colors" onClick={() => setIsSidebarOpen(true)} />
                  <Mail size={28} className="hover:text-crimson cursor-pointer transition-colors" onClick={() => setIsContactOpen(true)} />
               </div>
               <button onClick={() => signOut(auth)} className="mt-auto p-4 text-crimson opacity-30 hover:opacity-100 transition-all hover:scale-110"><Power size={36} /></button>
            </aside>

            <main className="flex-1 flex flex-col gap-8 overflow-hidden">
              <header className="h-28 glass-panel rounded-[3.5rem] flex items-center justify-between px-16 border-white/5 font-orbitron shadow-2xl">
                <div className="flex items-center gap-12">
                  <Menu size={28} className="lg:hidden text-white cursor-pointer" onClick={() => setIsSidebarOpen(true)} />
                  <div className="text-2xl font-black tracking-[10px] text-white uppercase italic select-none">Scorpio</div>
                </div>
                <button onClick={() => setIsSubscriptionOpen(true)} className="flex items-center gap-5 bg-gradient-to-r from-crimson to-red-900 px-10 py-4 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all text-white text-[11px] font-black uppercase tracking-[3px]">
                   <Crown size={20} /> Spectre Access
                </button>
              </header>

              <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
                <section className="col-span-12 lg:col-span-8 flex flex-col gap-8 overflow-hidden">
                  <div className="flex-1 glass-panel rounded-[5rem] p-12 md:p-20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-20 text-[20rem] font-black text-white/[0.02] italic select-none pointer-events-none font-orbitron uppercase">Scorpio</div>
                    <div className="relative z-10 h-full flex flex-col">
                      <textarea placeholder="Hey, enter your neural command here..." value={command} onChange={e => setCommand(e.target.value)}
                        className="w-full h-full bg-transparent border-none outline-none text-4xl md:text-7xl font-light text-white placeholder:text-gray-900 resize-none scrollbar-hide"
                      />
                      <div className="mt-auto pt-10 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-8 bg-black/50 border border-white/5 p-5 rounded-[4rem] w-full max-w-3xl relative shadow-2xl focus-within:border-crimson/40 transition-all">
                           <button type="button" className="p-5 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 transition-colors" onClick={() => setCommand("Initialize Agent: ")}><Plus size={32} /></button>
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
                  <div className="flex-1 glass-panel rounded-[4.5rem] p-12 overflow-hidden flex flex-col shadow-2xl">
                    <h3 className="text-[11px] font-black uppercase tracking-[8px] text-gray-600 mb-12 flex items-center gap-5"><History size={20} /> Telemetry</h3>
                    <div className="flex-1 overflow-y-auto scrollbar-hide space-y-8 font-sans">
                       {history.length > 0 ? history.map(item => (
                         <div key={item.id} className="p-6 glass-card rounded-3xl group border border-white/5 hover:border-crimson/30 transition-all">
                            <p className="text-[12px] text-silver/70 italic leading-relaxed line-clamp-2">"{item.text}"</p>
                            <div className="mt-4 flex justify-between items-center opacity-30 group-hover:opacity-100 transition-opacity">
                               <span className="text-[9px] font-black uppercase tracking-tighter">{item.node}</span>
                               <Trash2 size={14} className="cursor-pointer hover:text-red-500" onClick={() => deleteItem(item.id)} />
                            </div>
                         </div>
                       )) : (
                         <div className="text-center py-24 opacity-10 flex flex-col items-center">
                            <History size={60} className="mb-6" />
                            <p className="text-[10px] uppercase font-black tracking-widest italic">Awaiting Capture...</p>
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
        {isSubscriptionOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl font-orbitron">
             <div className="w-full max-w-6xl glass-panel p-16 rounded-[5rem] relative text-center border-white/5 shadow-2xl">
                <button onClick={() => setIsSubscriptionOpen(false)} className="absolute top-10 right-10 text-white/20 hover:text-white transition-colors"><X size={32}/></button>
                <h2 className="text-4xl font-black text-white tracking-[10px] mb-6 uppercase italic">Operational Tiers</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-16 text-left font-sans">
                   {['GHOST', 'SPECTRE', 'SINGULARITY'].map((tier, idx) => (
                     <div key={tier} className={`p-10 glass-card rounded-[3rem] border border-white/5 ${idx === 1 ? 'border-crimson shadow-[0_0_50px_rgba(139,17,22,0.3)]' : ''}`}>
                        <h3 className="font-orbitron text-xl font-black mb-6 text-white">{tier}</h3>
                        <button className="w-full py-5 bg-white/5 rounded-2xl text-[10px] font-black uppercase hover:bg-crimson transition-all">Engage</button>
                     </div>
                   ))}
                </div>
             </div>
          </motion.div>
        )}

        {isContactOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[350] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl font-orbitron">
             <div className="w-full max-w-xl glass-panel p-16 rounded-[4rem] relative text-center border-white/5 shadow-2xl">
                <button onClick={() => setIsContactOpen(false)} className="absolute top-10 right-10 text-white/20 hover:text-white transition-colors"><X size={32}/></button>
                <Mail className="text-crimson mx-auto mb-8 animate-pulse" size={64} />
                <h2 className="text-2xl font-black text-white uppercase tracking-[8px] mb-6 italic">Neural Uplink</h2>
                <div className="p-8 glass-card border-white/5 rounded-3xl mb-8 font-mono"><p className="text-white text-sm tracking-widest font-bold">scorpioai.lab@gmail.com</p></div>
                <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic font-sans">Secure Laboratory Channel</p>
             </div>
          </motion.div>
        )}
        
        {isSidebarOpen && (
           <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/85 z-[60] backdrop-blur-xl" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 35 }} className="fixed top-0 right-0 h-full w-full max-w-sm glass-panel z-[70] p-14 flex flex-col border-l border-white/5 shadow-2xl font-orbitron">
                <div className="flex justify-between items-center mb-20">
                    <h2 className="text-sm font-black tracking-[8px] uppercase text-white">Archives</h2>
                    <X size={28} className="cursor-pointer hover:text-crimson transition-colors" onClick={() => setIsSidebarOpen(false)} />
                </div>
                <div className="space-y-16 flex-1">
                   <div className="p-8 glass-card rounded-[3rem] flex items-center gap-6 border border-white/5 shadow-2xl">
                        <div className="w-14 h-14 bg-crimson/10 rounded-2xl flex items-center justify-center font-black text-sm text-crimson border border-crimson/20 uppercase shadow-2xl">{user?.email?.charAt(0) || "S"}</div>
                        <div className="flex-1 overflow-hidden font-mono"><p className="text-[12px] font-black text-white truncate">{user?.email}</p></div>
                   </div>
                </div>
            </motion.aside>
           </>
        )}

        {error && (
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="fixed bottom-12 right-12 z-[400] glass-card border-l-4 border-crimson p-10 flex items-center gap-8 shadow-2xl">
            <AlertOctagon className="text-crimson animate-pulse" size={36} />
            <div>
               <p className="text-[11px] font-black uppercase tracking-[4px] text-white font-orbitron">System Protocol Blocked</p>
               <p className="text-[11px] font-bold text-gray-600 uppercase mt-2 leading-relaxed">{error}</p>
            </div>
            <X size={20} className="ml-10 cursor-pointer opacity-30 hover:opacity-100 transition-opacity" onClick={() => setError(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="relative z-10 py-12 px-[10%] border-t border-white/5 flex flex-col md:flex-row justify-between items-center bg-black/50 backdrop-blur-md italic font-black text-[10px] uppercase tracking-[5px] font-orbitron">
         <span className="text-gray-800 text-center leading-relaxed">© {new Date().getFullYear()} SCORPIO. ALL NEURAL PROTOCOLS RESERVED.</span>
         <div className="flex gap-10 text-gray-900 opacity-40"><span className="hover:text-crimson cursor-pointer">Neural Sovereignty</span><span className="hover:text-crimson cursor-pointer">Legal Encrypt</span></div>
      </footer>
    </div>
  );
}