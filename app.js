const { useState, useEffect, useRef } = React;

const PERSONAS = {
  bolt: {
    name: "Bolt",
    role: "Chief of Staff",
    color: "blue",
    icon: "⚡",
    instruction: "You are Bolt. Manage the project and Graham's schedule. Help organize the Google Drive structure."
  },
  mintaka: {
    name: "Mintaka",
    role: "Code Director",
    color: "purple",
    icon: "💻",
    instruction: "You are Mintaka. Generate code for GitHub and PWAs. Always wrap code in triple backticks. Help Graham deploy his apps."
  },
  scribe: {
    name: "Scribe",
    role: "Documentation",
    color: "orange",
    icon: "✍️",
    instruction: "You are Scribe. Summarize brainstorms and create professional PDF reports for Graham's clients."
  },
  justus: {
    name: "Justus",
    role: "Legal Counsel",
    color: "emerald",
    icon: "⚖️",
    instruction: "You are Justus. Draft SLAs, Case Reports, and Contracts. Focus on POPIA compliance in South Africa."
  }
};

const App = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [activePersona, setActivePersona] = useState('bolt');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [previewCode, setPreviewCode] = useState('<h1>No code generated yet.</h1>');
  
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

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  // --- GITHUB DEPLOYMENT LOGIC ---
  const deployToGitHub = async (repoName) => {
    if (!keys.github) return alert("Please add GitHub Token in Settings");
    
    try {
        const response = await fetch(`https://api.github.com/user/repos`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${keys.github}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({ name: repoName, auto_init: true })
        });
        const data = await response.json();
        alert(`Success! Repository ${repoName} created at: ${data.html_url}`);
    } catch (e) {
        alert("GitHub Deployment Failed. Check your token permissions.");
    }
  };

  // --- AI LOGIC ---
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
      
      // Update Preview if it looks like HTML
      if (aiText.includes('<!DOCTYPE html>') || aiText.includes('<html')) {
          setPreviewCode(aiText.split('```')[1] || aiText);
      }

      setMessages(prev => [...prev, { role: 'ai', text: aiText, persona: activePersona }]);
      speak(aiText.substring(0, 150)); // Only speak first bit for performance
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', text: "API Error. Check Key." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen max-w-md mx-auto flex flex-col transition-all duration-500 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      
      {/* Header */}
      <header className="p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-50 bg-inherit/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">O</div>
            <h1 className="font-black text-xs uppercase tracking-widest italic">Orion Architect</h1>
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-slate-900 rounded-full border border-slate-800">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 overflow-y-auto p-4 pb-40 hide-scrollbar">
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 mb-4 sticky top-0 z-40 py-2 bg-inherit">
              {Object.keys(PERSONAS).map(id => (
                <button key={id} onClick={() => setActivePersona(id)} className={`flex flex-col items-center p-2 rounded-xl border transition-all active:scale-90 ${activePersona === id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  <span className="text-sm">{PERSONAS[id].icon}</span>
                  <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">{PERSONAS[id].name}</span>
                </button>
              ))}
            </div>

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl max-w-[85%] text-sm shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'}`}>
                  {m.text}
                  {m.role === 'ai' && m.persona === 'justus' && (
                      <button className="mt-2 text-[10px] font-bold text-emerald-400 block border border-emerald-400/30 rounded p-1">Save SLA to Drive</button>
                  )}
                </div>
              </div>
            ))}
            {isGenerating && <div className="text-[10px] font-bold text-blue-500 uppercase animate-pulse">Team is processing...</div>}
            <div ref={chatEndRef} />
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Workspace Preview</h2>
                <button onClick={() => setPreviewCode('<h1>Resetting...</h1>')} className="text-[10px] bg-slate-800 px-2 py-1 rounded text-white">Clear</button>
             </div>
             <div className="w-full aspect-[9/16] rounded-3xl border-8 border-slate-800 bg-white shadow-2xl overflow-hidden relative">
                <iframe srcDoc={previewCode} className="w-full h-full border-none" />
             </div>
          </div>
        )}

        {activeTab === 'deploy' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/50">
               <h3 className="font-bold mb-4 flex items-center gap-2"><span className="text-xl">🚀</span> GitHub Pipeline</h3>
               <p className="text-xs text-slate-400 mb-6 italic">Deploy your current brainstorm as a live repository.</p>
               <input id="repoInput" placeholder="New Repo Name (e.g. hotel-suite-demo)" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl mb-4 outline-none text-sm font-mono text-blue-400" />
               <button onClick={() => deployToGitHub(document.getElementById('repoInput').value)} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                  Initialize Deployment
               </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest italic text-blue-500">Orion Vault</h2>
            <div className="space-y-4">
              {['gemini', 'github', 'drive'].map(key => (
                <div key={key}>
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">{key} Token</label>
                  <input type="password" value={keys[key]} onChange={e => saveKey(key, e.target.value)} className="w-full p-4 mt-2 bg-slate-900 border border-slate-800 rounded-2xl outline-none" placeholder={`Enter ${key} Key...`} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Input Bar */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-20 left-0 right-0 p-4 max-w-md mx-auto z-50">
          <div className="relative">
            <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="w-full p-4 bg-slate-900 border border-slate-800 rounded-full outline-none shadow-2xl pr-12" placeholder={`Brief ${PERSONAS[activePersona].name}...`} />
            <button onClick={handleSend} className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-full shadow-lg">➤</button>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 border-t border-slate-800 bg-slate-950/90 backdrop-blur-xl flex justify-around items-center max-w-md mx-auto px-6 z-50">
        <button onClick={() => setActiveTab('chat')} className={`p-2 transition-all ${activeTab === 'chat' ? 'text-blue-500 scale-125' : 'text-slate-600'}`}>💬</button>
        <button onClick={() => setActiveTab('preview')} className={`p-2 transition-all ${activeTab === 'preview' ? 'text-blue-500 scale-125' : 'text-slate-600'}`}>👁️</button>
        <button onClick={() => setActiveTab('deploy')} className={`p-2 transition-all ${activeTab === 'deploy' ? 'text-blue-500 scale-125' : 'text-slate-600'}`}>🚀</button>
        <button onClick={() => setActiveTab('settings')} className={`p-2 transition-all ${activeTab === 'settings' ? 'text-blue-500 scale-125' : 'text-slate-600'}`}>⚙️</button>
      </nav>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
