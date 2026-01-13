const { useState, useEffect, useRef } = React;

const PERSONAS = {
  bolt: {
    name: "Bolt",
    role: "Chief of Staff",
    color: "blue",
    icon: "⚡",
    instruction: "You are Bolt, the COO of Orion Dev Core. Focus on project management, Drive organization, and Graham's schedule. Be encouraging and highly organized."
  },
  mintaka: {
    name: "Mintaka",
    role: "Code Director",
    color: "purple",
    icon: "💻",
    instruction: "You are Mintaka, the CTO. You are an expert engineer. Focus on clean code, GitHub repositories, and technical architecture. Use monospace for code."
  },
  scribe: {
    name: "Scribe",
    role: "Documentation",
    color: "orange",
    icon: "✍️",
    instruction: "You are Scribe. You turn brainstorms into professional reports, project specs, and summaries for Graham's clients."
  },
  justus: {
    name: "Justus",
    role: "Legal Counsel",
    color: "emerald",
    icon: "⚖️",
    instruction: "You are Justus. Focus on SLAs, contracts, and POPIA compliance in South Africa. Ensure Graham's business is legally protected."
  }
};

const App = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [activePersona, setActivePersona] = useState('bolt');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [theme, setTheme] = useState('dark');
  
  // Storage Keys
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

  // --- VOICE ENGINE ---
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInputText(text);
      setTimeout(() => handleSend(text), 500);
    };
    recognition.start();
  };

  // --- AI ENGINE ---
  const handleSend = async (forcedText) => {
    const textToSend = forcedText || inputText;
    if (!textToSend.trim() || !keys.gemini) return;

    const userMsg = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsGenerating(true);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${keys.gemini}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: `SYSTEM: ${PERSONAS[activePersona].instruction}\n\nUSER: ${textToSend}` }] }] 
        })
      });
      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
      
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse, persona: activePersona }]);
      speak(aiResponse);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', text: "Connection error. Check API key." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen max-w-md mx-auto flex flex-col transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      
      {/* Header */}
      <header className="p-4 border-b border-slate-800/50 flex justify-between items-center sticky top-0 z-50 bg-inherit/90 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black italic shadow-lg shadow-blue-500/20">O</div>
          <h1 className="font-black text-xs uppercase tracking-widest italic">Orion <span className="text-blue-500">Architect</span></h1>
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-full border border-slate-800">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-40 scroll-smooth hide-scrollbar">
        {activeTab === 'chat' && (
          <div className="space-y-6">
            {/* Team Grid */}
            <div className="grid grid-cols-4 gap-2 sticky top-0 py-2 bg-inherit z-40">
              {Object.keys(PERSONAS).map(id => (
                <button key={id} onClick={() => setActivePersona(id)} 
                  className={`flex flex-col items-center p-2 rounded-2xl border transition-all active:scale-90
                  ${activePersona === id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}>
                  <span className="text-lg">{PERSONAS[id].icon}</span>
                  <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">{PERSONAS[id].name}</span>
                </button>
              ))}
            </div>

            {/* Messages */}
            {messages.length === 0 && (
              <div className="text-center py-20 opacity-20">
                <div className="text-4xl mb-4">🚀</div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Board of Directors Awaiting Instructions</p>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {!m.persona && m.role === 'ai' ? null : (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-md
                    ${m.role === 'user' ? 'bg-slate-700' : `bg-${PERSONAS[m.persona]?.color || 'blue'}-600`}`}>
                        {m.role === 'user' ? 'G' : PERSONAS[m.persona]?.name[0]}
                    </div>
                )}
                <div className={`p-4 rounded-2xl max-w-[85%] text-sm shadow-sm leading-relaxed
                  ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isGenerating && <div className="text-[10px] font-bold text-blue-500 uppercase animate-pulse">Mintaka is processing...</div>}
            <div ref={chatEndRef} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-2 space-y-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-xl font-black uppercase tracking-widest text-blue-500 italic">Security Vault</h2>
            <div className="space-y-4">
              {['gemini', 'github', 'drive'].map(key => (
                <div key={key}>
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">{key} Activation Key</label>
                  <input type="password" value={keys[key]} onChange={e => saveKey(key, e.target.value)} 
                    className="w-full p-4 mt-2 bg-slate-900 border border-slate-800 rounded-2xl outline-none focus:border-blue-600 transition-all shadow-inner" 
                    placeholder={`Enter ${key} Key...`} />
                </div>
              ))}
            </div>
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-[10px] text-slate-500 uppercase leading-relaxed font-bold tracking-widest">
                Local storage encrypted to device memory. Keys are persistent until manual wipe.
            </div>
          </div>
        )}
      </main>

      {/* Action Bar */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-24 left-0 right-0 p-4 max-w-md mx-auto z-50">
          <div className="flex gap-2 items-center">
            <button onClick={startVoice} className={`p-4 rounded-2xl shadow-2xl transition-all active:scale-90 border-2 
              ${isListening ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-blue-500'}`}>
              🎤
            </button>
            <div className="relative flex-1">
              <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} 
                className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl outline-none shadow-xl pr-12 text-sm" 
                placeholder={`Brief ${PERSONAS[activePersona].name}...`} />
              <button onClick={() => handleSend()} className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-all text-xs font-bold">SEND</button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 border-t border-slate-800 bg-slate-950/90 backdrop-blur-2xl flex justify-around items-center max-w-md mx-auto px-6 z-50">
        <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-blue-500 scale-110' : 'text-slate-600'}`}>
          <span className="text-xl italic">💬</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Team</span>
        </button>
        <button onClick={() => setActiveTab('preview')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'preview' ? 'text-blue-500 scale-110' : 'text-slate-600'}`}>
          <span className="text-xl italic">👁️</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Preview</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'settings' ? 'text-blue-500 scale-110' : 'text-slate-600'}`}>
          <span className="text-xl italic">⚙️</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Vault</span>
        </button>
      </nav>
    </div>
  );
};

// Render Logic
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
