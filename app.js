const { useState, useEffect, useRef } = React;
const { 
  Mic, MessageSquare, Layout, Github, HardDrive, 
  Settings, Shield, Code, Play, Eye, Save, 
  User, CheckCircle, AlertCircle, Volume2, Search,
  Send, Trash2, Copy, Moon, Sun, Cpu, Feather, TrendingUp
} = lucide;

const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

const PERSONAS = {
  bolt: {
    name: "Bolt",
    role: "Chief of Staff",
    color: "blue",
    icon: <CheckCircle size={18} />,
    instruction: "You are Bolt, the COO/Assistant of Orion Dev Core. You are friendly, organized, and focused on project management."
  },
  mintaka: {
    name: "Mintaka",
    role: "Code Director",
    color: "purple",
    icon: <Cpu size={18} />,
    instruction: "You are Mintaka, the CTO of Orion Dev Core. You are an expert Full-Stack Engineer. You focus on clean code and GitHub."
  },
  scribe: {
    name: "Scribe",
    role: "Documentation",
    color: "orange",
    icon: <Feather size={18} />,
    instruction: "You are Scribe, the Documentation specialist. You turn brainstorms into professional specs."
  },
  justus: {
    name: "Justus",
    role: "Legal Counsel",
    color: "emerald",
    icon: <Shield size={18} />,
    instruction: "You are Justus, the Legal Counsel. You focus on SLAs, contracts, and POPIA compliance."
  }
};

const App = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [activePersona, setActivePersona] = useState('bolt');
  const [theme, setTheme] = useState('dark');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [keys, setKeys] = useState({
    gemini: localStorage.getItem('orion_gemini_key') || '',
    github: localStorage.getItem('orion_github_key') || '',
    drive: localStorage.getItem('orion_drive_key') || ''
  });

  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const saveKey = (name, val) => {
    localStorage.setItem(`orion_${name}_key`, val);
    setKeys(prev => ({ ...prev, [name]: val }));
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const msg = inputText;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInputText('');
    setIsGenerating(true);

    try {
      const persona = PERSONAS[activePersona];
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${keys.gemini}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `SYSTEM: ${persona.instruction}\n\nUSER: ${msg}` }] }] })
      });
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText, persona: activePersona }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', text: "Error connecting to AI. Check your Key." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen max-w-md mx-auto flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <header className="p-4 border-b flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">O</div>
           <span className="font-bold text-sm tracking-tight uppercase">Orion Architect</span>
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2">
           {theme === 'dark' ? <Sun className="text-yellow-400" /> : <Moon />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-32">
        {activeTab === 'chat' && (
          <div className="space-y-4">
             <div className="grid grid-cols-4 gap-2 mb-4">
                {Object.keys(PERSONAS).map(id => (
                  <button key={id} onClick={() => setActivePersona(id)} className={`p-2 rounded-xl border text-center ${activePersona === id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                    <div className="flex justify-center">{PERSONAS[id].icon}</div>
                    <div className="text-[8px] font-bold uppercase mt-1">{PERSONAS[id].name}</div>
                  </button>
                ))}
             </div>
             {messages.map((m, i) => (
               <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600' : 'bg-slate-900 border border-slate-800'}`}>
                    {m.text}
                  </div>
               </div>
             ))}
             {isGenerating && <div className="text-xs text-blue-500 animate-pulse">Thinking...</div>}
             <div ref={chatEndRef} />
          </div>
        )}
        {activeTab === 'settings' && (
            <div className="p-4 space-y-4">
               <h2 className="font-bold">Settings</h2>
               <input value={keys.gemini} onChange={e => saveKey('gemini', e.target.value)} placeholder="Gemini Key" className="w-full p-3 bg-slate-900 rounded-xl border border-slate-800" />
               <input value={keys.github} onChange={e => saveKey('github', e.target.value)} placeholder="GitHub Token" className="w-full p-3 bg-slate-900 rounded-xl border border-slate-800" />
            </div>
        )}
      </main>

      <div className="fixed bottom-20 left-0 right-0 p-4 max-w-md mx-auto">
        <div className="relative">
          <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="w-full p-4 bg-slate-900 rounded-full border border-slate-800" placeholder="Ask the team..." />
          <button onClick={handleSend} className="absolute right-2 top-2 p-2 bg-blue-600 rounded-full"><Send size={20}/></button>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 p-3 border-t bg-slate-950 flex justify-around max-w-md mx-auto">
        <button onClick={() => setActiveTab('chat')} className={activeTab === 'chat' ? 'text-blue-500' : 'text-slate-500'}><MessageSquare /></button>
        <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-blue-500' : 'text-slate-500'}><Settings /></button>
      </nav>
    </div>
  );
};

// CRITICAL: NO EXPORT NEEDED. RENDER DIRECTLY.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

