const { useState, useEffect, useRef } = React;

const PERSONAS = {
  bolt: { name: "Bolt", role: "Chief of Staff", color: "blue", icon: "⚡", instruction: "Assistant role." },
  mintaka: { name: "Mintaka", role: "Code Director", color: "purple", icon: "💻", instruction: "Coding role." },
  scribe: { name: "Scribe", role: "Documentation", color: "orange", icon: "✍️", instruction: "Docs role." },
  justus: { name: "Justus", role: "Legal Counsel", color: "emerald", icon: "⚖️", instruction: "Legal role." }
};

const App = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [activePersona, setActivePersona] = useState('bolt');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [theme, setTheme] = useState('dark');
  
  const [keys, setKeys] = useState({
    gemini: localStorage.getItem('orion_gemini_key') || '',
    github: localStorage.getItem('orion_github_key') || '',
    drive: localStorage.getItem('orion_drive_id') || ''
  });

  const messagesEndRef = useRef(null);

  // FIX: Smooth Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom(); }, [messages, isGenerating]);

  const saveKey = (name, val) => {
    localStorage.setItem(`orion_${name === 'drive' ? 'drive_id' : name + '_key'}`, val);
    setKeys(prev => ({ ...prev, [name]: val }));
  };

  // --- VOICE ENGINE ---
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice not supported on this browser.");
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInputText(text);
    };
    recognition.start();
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
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText, persona: activePersona }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', text: "Check API Key in Vault." }]);
    } finally { setIsGenerating(false); }
  };

  return (
    <div className={`min-h-screen max-w-md mx-auto flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <header className="p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-50 bg-inherit/90 backdrop-blur-md">
        <h1 className="font-black text-xs uppercase tracking-widest italic">Orion Architect</h1>
        <div className="flex gap-2">
            <button onClick={() => window.location.href='https://oriondevcore.github.io/orion-hq/'} className="p-2 bg-blue-600 rounded-full text-[10px] font-bold">HQ</button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-slate-800 rounded-full">{theme === 'dark' ? '☀️' : '🌙'}</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-40 hide-scrollbar">
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 sticky top-0 py-2 bg-inherit z-40">
              {Object.keys(PERSONAS).map(id => (
                <button key={id} onClick={() => setActivePersona(id)} className={`flex flex-col items-center p-2 rounded-xl border transition-all ${activePersona === id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  <span className="text-sm">{PERSONAS[id].icon}</span>
                  <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">{PERSONAS[id].name}</span>
                </button>
              ))}
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl max-w-[85%] text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isGenerating && <div className="text-[10px] font-bold text-blue-500 animate-pulse uppercase">Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-blue-500">Vault</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Gemini API Key</label>
                <input type="password" value={keys.gemini} onChange={e => saveKey('gemini', e.target.value)} className="w-full p-4 mt-1 bg-slate-900 rounded-2xl border border-slate-800 outline-none" placeholder="Paste Key..." />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">GitHub Token</label>
                <input type="password" value={keys.github} onChange={e => saveKey('github', e.target.value)} className="w-full p-4 mt-1 bg-slate-900 rounded-2xl border border-slate-800 outline-none" placeholder="Paste Token..." />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 text-emerald-500">Google Drive Client ID</label>
                <input type="text" value={keys.drive} onChange={e => saveKey('drive', e.target.value)} className="w-full p-4 mt-1 bg-slate-900 rounded-2xl border border-slate-800 outline-none text-emerald-500" placeholder="Paste Client ID..." />
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-20 left-0 right-0 p-4 max-w-md mx-auto z-50">
        <div className="flex gap-2">
            <button onClick={startListening} className={`p-4 rounded-2xl shadow-xl border-2 ${isListening ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-blue-500'}`}>🎤</button>
            <div className="relative flex-1">
                <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="w-full p-4 bg-slate-900 border border-slate-800 rounded-full outline-none pr-12" placeholder={`Brief ${PERSONAS[activePersona].name}...`} />
                <button onClick={handleSend} className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-full">➤</button>
            </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 h-20 border-t border-slate-800 bg-slate-950/90 flex justify-around items-center max-w-md mx-auto">
        <button onClick={() => setActiveTab('chat')} className={activeTab === 'chat' ? 'text-blue-500' : 'text-slate-600'}>💬</button>
        <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-blue-500' : 'text-slate-600'}>⚙️</button>
      </nav>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
