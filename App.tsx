import React, { useState, useEffect } from 'react';
import { User, AudioBlock, VoiceOption, ProjectState, ToneOption } from './types';
import { CHARS_PER_BLOCK, VOICE_OPTIONS, TONE_OPTIONS } from './constants';
import { getSessionUser, logout, validateUser } from './services/authService';
import { generateAudio, playPreview } from './services/voiceService';
import { slugify } from './utils/crypto';

const Icons = {
  Play: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>,
  Download: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  LogOut: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>,
  Keys: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>,
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({
    g1: '', g2: '', g3: '', d1: '', d2: '', d3: '', l1: '', l2: '', l3: '', u1: ''
  });
  const [apiKeysEnabled, setApiKeysEnabled] = useState<{ [key: string]: boolean }>({
    g1: true, g2: true, g3: true, d1: true, d2: true, d3: true, l1: true, l2: true, l3: true, u1: true
  });

  const [project, setProject] = useState<ProjectState>({
    title: '', script: '', voice: 'kore', tone: 'Neutral', isAutoDownload: false, blocks: [], isProcessing: false
  });

  useEffect(() => {
    const savedKeys = localStorage.getItem('VOZPRO_KEYS_V3');
    if (savedKeys) setApiKeys(JSON.parse(savedKeys));
    const savedEnabled = localStorage.getItem('VOZPRO_ENABLED_V3');
    if (savedEnabled) setApiKeysEnabled(JSON.parse(savedEnabled));

    const sessionUser = getSessionUser();
    if (sessionUser) setUser(sessionUser);
  }, []);

  const getActiveKeysSequence = (): string[] => {
    const order = ['g1', 'g2', 'g3', 'd1', 'd2', 'd3', 'l1', 'l2', 'l3', 'u1'];
    return order
      .filter(id => apiKeysEnabled[id] && apiKeys[id]?.trim())
      .map(id => apiKeys[id].trim());
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    const res = await validateUser(loginEmail);
    if (res.success && res.user) setUser(res.user);
    else setAuthError(res.message);
    setIsAuthLoading(false);
  };

  const handleGenerateMaster = async () => {
    const keys = getActiveKeysSequence();
    if (project.blocks.length === 0) return alert("Segmenta el guion primero.");
    if (keys.length === 0) return alert("Debes configurar al menos una API Key activa.");

    setProject(p => ({ ...p, isProcessing: true }));

    for (const block of project.blocks.filter(b => b.status !== 'completed')) {
      let success = false;
      let lastError = "";

      for (const key of keys) {
        setProject(p => ({
          ...p, blocks: p.blocks.map(b => b.id === block.id ? { ...b, status: 'processing', error: 'USANDO NODO DE RESPALDO...' } : b)
        }));

        try {
          const blob = await generateAudio(block.text, project.voice, key, project.tone);
          setProject(p => ({
            ...p, blocks: p.blocks.map(b => b.id === block.id ? { ...b, status: 'completed', audioUrl: URL.createObjectURL(blob), error: undefined } : b)
          }));
          success = true;
          break;
        } catch (err: any) {
          lastError = err.message || "Error desconocido";
          console.warn("Fallo en nodo, rotando...", lastError);
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      if (!success) {
        setProject(p => ({
          ...p, blocks: p.blocks.map(b => b.id === block.id ? { ...b, status: 'failed', error: 'LLAVES AGOTADAS: ' + lastError } : b)
        }));
      }
      await new Promise(r => setTimeout(r, 1500));
    }

    setProject(p => ({ ...p, isProcessing: false }));
  };

  const saveKeys = () => {
    localStorage.setItem('VOZPRO_KEYS_V3', JSON.stringify(apiKeys));
    localStorage.setItem('VOZPRO_ENABLED_V3', JSON.stringify(apiKeysEnabled));
    setIsApiModalOpen(false);
    alert("Nodos sincronizados correctamente.");
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] px-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 relative">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-slate-900 italic">VozPro</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2">Planta de Audio Industrial</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <input type="email" required placeholder="tu@email.com" className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-500 font-semibold" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          {authError && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border-l-4 border-red-500">{authError}</div>}
          <button type="submit" disabled={isAuthLoading} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black uppercase tracking-widest text-xs">
            {isAuthLoading ? 'Autenticando...' : 'Iniciar Producción'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 h-20 flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white italic">V</div>
          <span className="text-2xl font-black italic tracking-tighter">VozPro <span className="text-blue-600">Ultra</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsApiModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"><Icons.Keys /> Nodos API (10)</button>
          <button onClick={() => { logout(); setUser(null); }} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Icons.LogOut /></button>
        </div>
      </header>

      {/* MODAL APIs (10 NODOS) */}
      {isApiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="p-8 border-b bg-slate-50 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-black italic">Matriz de Respaldo Industrial</h2>
              <button onClick={() => setIsApiModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><Icons.LogOut /></button>
            </div>
            <div className="p-8 grid md:grid-cols-4 gap-8">
              {/* GEMINI */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-b pb-2">Gemini Pro</h3>
                {['g1', 'g2', 'g3'].map(id => (
                  <div key={id} className="space-y-1">
                    <input type="password" value={apiKeys[id]} onChange={e => setApiKeys({...apiKeys, [id]: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-[10px]" placeholder={`API ${id.toUpperCase()}`} />
                    <button onClick={() => setApiKeysEnabled({...apiKeysEnabled, [id]: !apiKeysEnabled[id]})} className={`w-full py-1.5 rounded-lg text-[8px] font-black uppercase ${apiKeysEnabled[id] ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>{apiKeysEnabled[id] ? 'Activo' : 'Off'}</button>
                  </div>
                ))}
              </div>
              {/* DEEPSEEK */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest border-b pb-2">DeepSeek</h3>
                {['d1', 'd2', 'd3'].map(id => (
                  <div key={id} className="space-y-1">
                    <input type="password" value={apiKeys[id]} onChange={e => setApiKeys({...apiKeys, [id]: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-[10px]" placeholder={`API ${id.toUpperCase()}`} />
                    <button onClick={() => setApiKeysEnabled({...apiKeysEnabled, [id]: !apiKeysEnabled[id]})} className={`w-full py-1.5 rounded-lg text-[8px] font-black uppercase ${apiKeysEnabled[id] ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>{apiKeysEnabled[id] ? 'Activo' : 'Off'}</button>
                  </div>
                ))}
              </div>
              {/* LONGCAT */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-purple-600 tracking-widest border-b pb-2">LongCat</h3>
                {['l1', 'l2', 'l3'].map(id => (
                  <div key={id} className="space-y-1">
                    <input type="password" value={apiKeys[id]} onChange={e => setApiKeys({...apiKeys, [id]: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-[10px]" placeholder={`API ${id.toUpperCase()}`} />
                    <button onClick={() => setApiKeysEnabled({...apiKeysEnabled, [id]: !apiKeysEnabled[id]})} className={`w-full py-1.5 rounded-lg text-[8px] font-black uppercase ${apiKeysEnabled[id] ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400'}`}>{apiKeysEnabled[id] ? 'Activo' : 'Off'}</button>
                  </div>
                ))}
              </div>
              {/* UNIVERSAL */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-orange-600 tracking-widest border-b pb-2">Universal</h3>
                <div className="space-y-1">
                  <input type="password" value={apiKeys.u1} onChange={e => setApiKeys({...apiKeys, u1: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-[10px]" placeholder="API U1" />
                  <button onClick={() => setApiKeysEnabled({...apiKeysEnabled, u1: !apiKeysEnabled.u1})} className={`w-full py-1.5 rounded-lg text-[8px] font-black uppercase ${apiKeysEnabled.u1 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}>{apiKeysEnabled.u1 ? 'Activo' : 'Off'}</button>
                </div>
              </div>
            </div>
            <div className="p-8 border-t">
              <button onClick={saveKeys} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase shadow-xl hover:bg-black transition-all">Sincronizar Panel</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1440px] mx-auto px-10 py-12 grid lg:grid-cols-12 gap-10">
        {/* PANEL IZQUIERDO: GUION */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-black italic mb-8 border-l-4 border-blue-600 pl-4">Panel de Producción</h2>
            <div className="space-y-6">
              <input type="text" value={project.title} onChange={e => setProject({...project, title: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl text-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" placeholder="Título del proyecto..." />
              <textarea value={project.script} onChange={e => setProject({...project, script: e.target.value})} className="w-full h-[35rem] p-8 bg-slate-50 rounded-[2.5rem] text-lg outline-none resize-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all leading-relaxed custom-scrollbar shadow-inner" placeholder="Pega tu guion maestro aquí..." />
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: CONFIGURACIÓN */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm sticky top-28">
            <h3 className="font-black text-lg italic mb-6">Configuración Vocal</h3>
            
            {/* ESTILOS DE NARRACIÓN (RESTAURADOS) */}
            <div className="mb-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Estilo de Narración</p>
              <div className="grid grid-cols-4 gap-2 h-44 overflow-y-auto custom-scrollbar p-1">
                {TONE_OPTIONS.map(t => (
                  <button key={t.name} onClick={() => setProject({...project, tone: t.name})} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${project.tone === t.name ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-50 hover:bg-slate-100'}`}>
                    <span className="text-xl mb-1">{t.icon}</span>
                    <span className="text-[7px] font-black uppercase text-center leading-tight">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CATÁLOGO DE VOCES */}
            <div className="mb-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Voces IA</p>
              <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {VOICE_OPTIONS.map(v => (
                  <div key={v.name} className={`flex items-center justify-between p-3 border-2 rounded-xl transition-all ${project.voice === v.name ? 'border-blue-500 bg-blue-50' : 'border-slate-50'}`}>
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input type="radio" checked={project.voice === v.name} onChange={() => setProject({...project, voice: v.name})} className="hidden" />
                      <div className={`w-2.5 h-2.5 rounded-full ${v.gender === 'M' ? 'bg-blue-400' : 'bg-pink-400'}`}></div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black leading-none">{v.label}</span>
                        <span className="text-[8px] text-slate-400 uppercase mt-1 italic">{v.description}</span>
                      </div>
                    </label>
                    <button onClick={async () => {
                      const keys = getActiveKeysSequence();
                      if(keys.length > 0) await playPreview(v.name, keys[0], project.tone);
                    }} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><Icons.Play /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={() => {
                if(!project.script || !project.title) return alert("Completa el guion y título.");
                const blocks = [];
                let i = 0;
                while(i < project.script.length) {
                  const end = i + CHARS_PER_BLOCK;
                  blocks.push({ id: `b-${blocks.length}`, text: project.script.substring(i, end), filename: `${slugify(project.title)}-${blocks.length+1}.mp3`, status: 'pending' });
                  i = end;
                }
                setProject({...project, blocks});
              }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-black transition-all">Segmentar Guion Masivo</button>
              
              <button onClick={handleGenerateMaster} disabled={project.isProcessing} className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs shadow-2xl hover:bg-blue-700 transition-all disabled:bg-slate-200">
                {project.isProcessing ? '⚙️ PROCESANDO NODOS...' : '🚀 GENERAR AUDIO MASTER'}
              </button>
            </div>
          </div>
        </div>

        {/* LISTA DE BLOQUES DE AUDIO (OUTPUT) */}
        {project.blocks.length > 0 && (
          <div className="col-span-12 mt-10">
            <h3 className="text-3xl font-black italic text-slate-800 mb-10 flex items-center gap-4">
              <span className="bg-slate-800 text-white px-4 py-2 rounded-2xl text-sm not-italic">{project.blocks.length}</span>
              Línea de Tiempo de Audio
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {project.blocks.map(b => (
                <div key={b.id} className={`p-8 bg-white border-2 rounded-[3rem] shadow-sm flex flex-col justify-between transition-all hover:shadow-xl ${b.status === 'completed' ? 'border-green-100' : 'border-slate-100'}`}>
                  <div className="mb-6">
                    <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full ${b.status === 'completed' ? 'bg-green-100 text-green-700' : b.status === 'failed' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
                      {b.status === 'completed' ? 'LISTO PARA MP3' : b.status === 'processing' ? 'NODO EN CURSO' : b.status === 'failed' ? 'REINTENTO REQUERIDO' : 'EN ESPERA'}
                    </span>
                    <h4 className="font-black text-slate-800 mt-5 truncate">{b.filename}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase italic font-bold">{b.text.length} caracteres</p>
                  </div>

                  <div className="flex gap-2">
                    {b.audioUrl ? (
                      <>
                        <button onClick={() => new Audio(b.audioUrl).play()} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><Icons.Play /> Oír</button>
                        <a href={b.audioUrl} download={b.filename} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md">
                          <Icons.Download /> MP3
                        </a>
                      </>
                    ) : (
                      <div className={`w-full py-4 rounded-2xl text-[10px] font-black text-center italic ${b.error ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-300'}`}>
                        {b.status === 'processing' ? <span className="animate-spin text-lg">◌</span> : null}
                        {b.error || 'ESPERANDO TURNO...'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}