// --- ASSETS & PERSONAS ---
const { useState, useEffect, useRef } = React;
const LucideIcons = lucide;

const PERSONAS = {
  bolt: {
    name: "Bolt",
    role: "Chief of Staff",
    color: "blue",
    instruction: "You are Bolt, the COO/Assistant. You are friendly and organized."
  },
  mintaka: {
    name: "Mintaka",
    role: "Code Director",
    color: "purple",
    instruction: "You are Mintaka, the CTO. You are an expert engineer focused on clean code."
  },
  scribe: {
    name: "Scribe",
    role: "Documentation",
    color: "orange",
    instruction: "You are Scribe, the Documentation specialist. You summarize brainstorms."
  },
  justus: {
    name: "Justus",
    role: "Legal Counsel",
    color: "emerald",
    instruction: "You are Justus, the Legal Counsel. You focus on SLAs and POPIA compliance."
  }
};

// --- MAIN APPLICATION ---
const App = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [activePersona, setActivePersona] = useState('bolt');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [keys, setKeys] = useState({
    gemini: localStorage.getItem('orion_gemini_key') || '',
    github: localStorage.getItem('orion_github_key') || ''
  });

  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const saveKey = (name, val) => {
    localStorage.setItem(`orion_${name}_key`, val);
    setKeys(prev => ({ ...prev, [name]: val }));
  };

  const handleSend = async () => {
    if (!inputText.trim() || !keys.gemini) return;
    const msg = inputText;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInputText('');
    setIsGenerating(true);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${keys.gemini}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `SYSTEM: ${PERSONAS[activePersona].instruction}\n\nUSER: ${msg}` }] }] })
      });
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText, persona: activePersona }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', text: "Connection error. Please check your Gemini Key." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen max-w-md mx-auto flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      {/* Header */}
      <header className="p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-50 bg-inherit/80 backdrop-blur-md">
        <h1 className="font-black text-sm uppercase tracking-widest italic">Orion Architect</h1>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-slate-800 rounded-full">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-32">
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Object.keys(PERSONAS).map(id => (
                <button key={id} onClick={() => setActivePersona(id)} className={`p-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${activePersona === id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  {PERSONAS[id].name}
                </button>
              ))}
            </div>
            {messages.length === 0 && <div className="text-center py-20 opacity-20 text-xs font-bold uppercase tracking-widest">Awaiting Brainstorm...</div>}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isGenerating && <div className="text-[10px] text-blue-500 animate-pulse uppercase font-bold">The Team is thinking...</div>}
            <div ref={chatEndRef} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 p-2">
            <h2 className="font-black uppercase tracking-widest text-blue-500">Vault</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Gemini API Key</label>
                <input type="password" value={keys.gemini} onChange={e => saveKey('gemini', e.target.value)} className="w-full p-4 mt-1 bg-slate-900 rounded-2xl border border-slate-800 outline-none focus:border-blue-600" placeholder="Paste Key Here..." />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">GitHub Token</label>
                <input type="password" value={keys.github} onChange={e => saveKey('github', e.target.value)} className="w-full p-4 mt-1 bg-slate-900 rounded-2xl border border-slate-800 outline-none focus:border-blue-600" placeholder="Paste Token Here..." />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Input Area */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-20 left-0 right-0 p-4 max-w-md mx-auto">
          <div className="relative">
            <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="w-full p-4 bg-slate-900 rounded-full border border-slate-800 outline-none pr-12" placeholder={`Message ${PERSONAS[activePersona].name}...`} />
            <button onClick={handleSend} className="absolute right-2 top-2 p-2 bg-blue-600 rounded-full text-white">➤</button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 border-t border-slate-800 bg-slate-950/90 backdrop-blur-xl flex justify-around items-center max-w-md mx-auto px-10">
        <button onClick={() => setActiveTab('chat')} className={`p-2 ${activeTab === 'chat' ? 'text-blue-500 scale-125' : 'text-slate-600'} transition-all`}>💬</button>
        <button onClick={() => setActiveTab('settings')} className={`p-2 ${activeTab === 'settings' ? 'text-blue-500 scale-125' : 'text-slate-600'} transition-all`}>⚙️</button>
      </nav>
    </div>
  );
};

// --- RENDER ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
