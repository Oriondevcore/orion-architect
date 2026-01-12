import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MessageSquare, Layout, Github, HardDrive, 
  Settings, Shield, Code, Play, Eye, Save, 
  User, CheckCircle, AlertCircle, Volume2, Search,
  Send, Trash2, Copy, Moon, Sun, Cpu, Feather, TrendingUp
} from 'lucide-react';

// --- CONFIG & CONSTANTS ---
const API_KEY = ""; // Environment will provide this if empty, but we allow user override in settings
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

const PERSONAS = {
  bolt: {
    name: "Bolt",
    role: "Chief of Staff",
    color: "blue",
    icon: <CheckCircle size={18} />,
    instruction: "You are Bolt, the COO/Assistant of Orion Dev Core. You are friendly, organized, and focused on project management, daily tasks, and Google Drive organization. Your goal is to keep the project moving and organize Graham's thoughts into clear plans."
  },
  mintaka: {
    name: "Mintaka",
    role: "Code Director",
    color: "purple",
    icon: <Cpu size={18} />,
    instruction: "You are Mintaka, the CTO of Orion Dev Core. You are an expert Full-Stack Engineer and GitHub Specialist. You focus on clean, high-performance code, mobile optimization for Honor X6b, and complex technical architecture. You use monospace formatting for code snippets."
  },
  scribe: {
    name: "Scribe",
    role: "Documentation",
    color: "orange",
    icon: <Feather size={18} />,
    instruction: "You are Scribe, the Documentation specialist. You take the messy brainstorms from Graham and the team and turn them into professional technical specifications, reports, and summaries."
  },
  justus: {
    name: "Justus",
    role: "Legal Counsel",
    color: "emerald",
    icon: <Shield size={18} />,
    instruction: "You are Justus, the Legal Counsel of Orion Dev Core. You focus on SLAs, contracts, and POPIA compliance (South Africa). You ensure that every app built is legally sound and protects both Graham and his clients."
  }
};

const App = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('chat');
  const [activePersona, setActivePersona] = useState('bolt');
  const [theme, setTheme] = useState('dark');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [blueprint, setBlueprint] = useState({ name: 'Untitled Project', type: 'PWA', features: [] });
  const [showModal, setShowModal] = useState(false);
  
  // Keys (Stored in LocalStorage)
  const [keys, setKeys] = useState({
    gemini: localStorage.getItem('orion_gemini_key') || '',
    github: localStorage.getItem('orion_github_key') || '',
    drive: localStorage.getItem('orion_drive_key') || ''
  });

  const chatEndRef = useRef(null);

  // --- HELPERS ---
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const saveKey = (name, val) => {
    localStorage.setItem(`orion_${name}_key`, val);
    setKeys(prev => ({ ...prev, [name]: val }));
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  // --- API LOGIC (GEMINI) ---
  const callGemini = async (userMsg) => {
    const keyToUse = keys.gemini || API_KEY;
    if (!keyToUse) {
      addSystemMessage("Error: Gemini API Key missing. Please add it in Settings.");
      return;
    }

    setIsGenerating(true);
    const persona = PERSONAS[activePersona];
    
    const payload = {
      contents: [{
        parts: [{ text: `SYSTEM: ${persona.instruction}\n\nUSER: ${userMsg}` }]
      }]
    };

    let attempt = 0;
    const maxRetries = 5;

    const execute = async () => {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${keyToUse}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('API Error');
        
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
        
        setMessages(prev => [...prev, { role: 'ai', text: aiText, persona: activePersona }]);
        if (isListening) speakText(aiText);
      } catch (error) {
        if (attempt < maxRetries) {
          attempt++;
          const delay = Math.pow(2, attempt) * 500;
          setTimeout(execute, delay);
        } else {
          addSystemMessage("Failed to connect after multiple retries. Check connection.");
        }
      } finally {
        setIsGenerating(false);
      }
    };

    execute();
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const msg = inputText;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInputText('');
    callGemini(msg);
  };

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, { role: 'system', text }]);
  };

  // --- VOICE (Web Speech API) ---
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      addSystemMessage("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      // Optional: auto-send after voice
      setTimeout(() => handleSend(), 500);
    };
    recognition.start();
  };

  // --- UI COMPONENTS ---

  const Message = ({ msg }) => {
    const isUser = msg.role === 'user';
    const isSystem = msg.role === 'system';
    const persona = PERSONAS[msg.persona] || PERSONAS.bolt;

    if (isSystem) return (
      <div className="flex justify-center my-4">
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full text-[10px] font-bold text-red-400 uppercase tracking-widest">
          {msg.text}
        </div>
      </div>
    );

    return (
      <div className={`flex gap-3 mb-6 ${isUser ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-lg
          ${isUser ? 'bg-slate-700' : `bg-${persona.color}-600`}`}>
          {isUser ? <User size={20} /> : persona.icon}
        </div>
        <div className={`max-w-[80%] p-4 rounded-2xl relative
          ${isUser ? 'bg-blue-600 text-white rounded-tr-none' : 
            theme === 'dark' ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none' : 
            'bg-white border border-gray-100 shadow-sm text-slate-800 rounded-tl-none'}`}>
          {!isUser && (
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-50`}>
              {persona.name} • {persona.role}
            </div>
          )}
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {msg.text}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen max-w-md mx-auto flex flex-col transition-all duration-500 font-sans
      ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      
      {/* HEADER */}
      <header className={`p-4 border-b flex justify-between items-center sticky top-0 z-50 glass-panel
        ${theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-gray-100 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Layout className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none uppercase italic">Orion Architect</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${keys.gemini ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">
                {keys.gemini ? 'System Ready' : 'Awaiting Activation'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-slate-800 transition">
            {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>
          <button onClick={() => setActiveTab('settings')} className="p-2 rounded-full hover:bg-slate-800 transition">
            <Settings size={20} className="text-slate-400" />
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto p-4 hide-scrollbar">
        
        {activeTab === 'chat' && (
          <div className="pb-24">
            {/* Team Picker */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {Object.keys(PERSONAS).map(id => (
                <button 
                  key={id} 
                  onClick={() => setActivePersona(id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-95
                  ${activePersona === id 
                    ? `bg-${PERSONAS[id].color}-600 border-${PERSONAS[id].color}-600 text-white shadow-lg scale-105` 
                    : theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-gray-200 text-gray-400'}`}
                >
                  {PERSONAS[id].icon}
                  <span className="text-[9px] font-bold mt-1 uppercase tracking-tighter">{PERSONAS[id].name}</span>
                </button>
              ))}
            </div>

            {/* Conversation */}
            {messages.length === 0 ? (
              <div className="text-center py-20 opacity-30 select-none">
                <MessageSquare size={64} className="mx-auto mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Start a Brainstorm</p>
                <p className="text-xs mt-2 px-10">"Justus, draft an SLA for a hotel booking suite."</p>
              </div>
            ) : (
              messages.map((msg, i) => <Message key={i} msg={msg} />)
            )}
            
            {isGenerating && (
              <div className="flex gap-3 mb-6 animate-pulse">
                <div className={`w-10 h-10 rounded-xl bg-${PERSONAS[activePersona].color}-600/50 flex items-center justify-center text-white`}>
                   {PERSONAS[activePersona].icon}
                </div>
                <div className="h-12 flex-1 bg-slate-900 rounded-2xl rounded-tl-none border border-slate-800 flex items-center px-4">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-6 pb-24">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Live Workspace</h2>
              <button className="text-[10px] bg-slate-800 px-3 py-1 rounded-full font-bold text-slate-400 uppercase">Interactive</button>
            </div>
            
            <div className={`w-full aspect-[9/16] rounded-[2.5rem] border-8 shadow-2xl overflow-hidden relative
              ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
              <div className="p-8 space-y-6 text-center">
                 <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto shadow-xl shadow-blue-500/20 flex items-center justify-center">
                    <Layout size={32} className="text-white" />
                 </div>
                 <div className="h-4 bg-slate-800 rounded-full w-3/4 mx-auto"></div>
                 <div className="h-4 bg-slate-800 rounded-full w-1/2 mx-auto"></div>
                 
                 <div className="grid grid-cols-2 gap-4 mt-12">
                    <div className="h-24 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>
                    <div className="h-24 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>
                    <div className="h-24 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>
                    <div className="h-24 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>
                 </div>
              </div>
              <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
              <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                 Mockup Mode Active
              </div>
            </div>
            
            <p className="text-[10px] text-center text-slate-500 uppercase font-bold tracking-widest">
              Mintaka uses these components to draft your UIs.
            </p>
          </div>
        )}

        {activeTab === 'deploy' && (
          <div className="space-y-6">
             <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-gray-800 rounded-2xl text-white">
                      <Github size={24} />
                   </div>
                   <div>
                      <h3 className="font-bold">GitHub Pipeline</h3>
                      <p className="text-xs text-slate-500">Auto-deploy to GitHub Pages</p>
                   </div>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">Target Repository</span>
                    <span className="text-xs font-mono text-blue-400">orion-new-app</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800 text-yellow-500">
                    <span className="text-xs">Security Check</span>
                    <AlertCircle size={16} />
                  </div>
                </div>

                <button 
                  disabled={!keys.github}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all
                  ${keys.github ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-slate-800 text-slate-600 grayscale'}`}
                >
                  <Play size={20} fill="currentColor" /> Initialize Push
                </button>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest">Orion Vault</h2>
            <div className="space-y-4">
              {[
                { label: 'Gemini 2.0 API Key', id: 'gemini', icon: Cpu, type: 'password' },
                { label: 'GitHub Access Token', id: 'github', icon: Github, type: 'password' },
                { label: 'Google Drive Access', id: 'drive', icon: HardDrive, type: 'text' }
              ].map(field => (
                <div key={field.id} className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 flex items-center gap-2">
                    <field.icon size={12} /> {field.label}
                  </label>
                  <input 
                    type={field.type}
                    value={keys[field.id]}
                    onChange={(e) => saveKey(field.id, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-blue-500 transition-colors"
                    placeholder={`Paste ${field.id} key here...`}
                  />
                </div>
              ))}
            </div>
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs leading-relaxed flex gap-3">
              <AlertCircle className="flex-shrink-0" size={18} />
              <p>All keys are stored locally on your device in <code>localStorage</code>. They never leave this app except when calling the APIs.</p>
            </div>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-2 p-2"
            >
              <Trash2 size={12} /> Wipe Device Storage
            </button>
          </div>
        )}
      </main>

      {/* INPUT AREA */}
      {activeTab === 'chat' && (
        <div className={`p-4 fixed bottom-20 left-0 right-0 max-w-md mx-auto z-40
          ${theme === 'dark' ? 'bg-slate-950/80' : 'bg-gray-50/80'} backdrop-blur-md`}>
          <div className="relative flex items-center gap-2">
            <button 
              onClick={startListening}
              className={`p-4 rounded-2xl transition-all shadow-lg active:scale-90
              ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-800 text-slate-400'}`}
            >
              <Mic size={24} />
            </button>
            <div className="relative flex-1">
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                type="text" 
                placeholder={`Talk to ${PERSONAS[activePersona].name}...`}
                className={`w-full p-4 pr-12 rounded-2xl border outline-none shadow-sm transition-all
                ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-gray-200 text-slate-800'}`}
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 top-2 p-2 text-blue-500 hover:text-blue-400 transition"
              >
                <Send size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t p-3 flex justify-around backdrop-blur-xl z-50
        ${theme === 'dark' ? 'bg-slate-950/90 border-slate-800 text-slate-500' : 'bg-white/95 border-gray-200 text-gray-400'}`}>
        {[
          { id: 'chat', icon: MessageSquare, label: 'Team' },
          { id: 'preview', icon: Eye, label: 'Preview' },
          { id: 'deploy', icon: Github, label: 'Deploy' },
          { id: 'drive', icon: HardDrive, label: 'Memory' }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90
            ${activeTab === item.id ? 'text-blue-500' : 'hover:text-slate-300'}`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
};

export default App;
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

