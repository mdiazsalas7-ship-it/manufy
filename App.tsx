import React, { useState, useRef } from 'react';
import { Search, Play, Pause, Loader2, Send } from 'lucide-react';

const BACKEND_URL = 'https://manufyvezla.xyz';

export default function App() {
  const [view, setView] = useState('home');
  const [current, setCurrent] = useState({ 
    id: '', title: 'Manufy TG', artist: 'Selecciona canción', foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/2048px-Telegram_logo.svg.png', audioUrl: '' 
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [buffering, setBuffering] = useState(false); 
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState('');
  
  const audioRef = useRef(null);

  const playSong = (song) => {
    setCurrent(song);
    setIsPlaying(false);
    setBuffering(true);
    
    if (audioRef.current) {
      audioRef.current.src = song.audioUrl;
      audioRef.current.load();
      audioRef.current.play()
        .then(() => { setIsPlaying(true); setBuffering(false); })
        .catch(e => { console.error(e); setBuffering(false); });
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults([]); 
    try {
      const res = await fetch(`${BACKEND_URL}/buscar?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) { alert("Error conectando al servidor"); } finally { setLoading(false); }
  };

  return (
    <div className="h-screen bg-black text-white font-sans overflow-hidden flex flex-col">
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)} 
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
      />

      <div className="flex-1 overflow-y-auto p-6 pb-48">
        {view === 'home' ? (
          <div className="mt-12 text-center animate-in fade-in zoom-in duration-500">
            <h1 className="text-6xl font-black text-blue-500 mb-2">MANUFY</h1>
            <p className="text-zinc-400 mb-8">Base de Datos: Telegram</p>
            <button onClick={() => setView('search')} className="bg-blue-600 px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">BUSCAR AHORA</button>
          </div>
        ) : (
          <div>
            <form onSubmit={handleSearch} className="mb-4 sticky top-0 bg-black z-50 py-2">
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-zinc-900 p-4 rounded-xl text-white outline-none border border-zinc-800 focus:border-blue-500" placeholder="Ej: Feid Luna" />
            </form>
            {loading && <div className="text-center mt-10"><Loader2 className="animate-spin inline text-blue-500"/></div>}
            
            <div className="grid gap-2">
              {results.map((s) => (
                <div key={s.id} onClick={() => playSong(s)} className="flex items-center gap-3 bg-zinc-900/60 p-3 rounded-xl cursor-pointer hover:bg-zinc-800 border border-transparent hover:border-blue-500/30 transition-all">
                  <img src={s.foto} className="w-12 h-12 rounded-md object-cover" />
                  <div className="min-w-0">
                    <p className={`font-bold truncate text-sm ${current.id === s.id ? 'text-blue-400' : 'text-white'}`}>{s.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{s.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 w-full bg-zinc-900/95 backdrop-blur-lg p-4 pb-8 flex items-center justify-between border-t border-white/10 z-50">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <img src={current.foto} className={`w-12 h-12 rounded-md bg-zinc-800 ${isPlaying ? 'animate-[spin_3s_linear_infinite]' : ''}`} />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{current.title}</p>
            <p className="text-xs text-zinc-400 truncate">{current.artist}</p>
          </div>
        </div>
        <button onClick={() => {if(audioRef.current) isPlaying ? audioRef.current.pause() : audioRef.current.play();}} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center ml-3 shadow-lg shadow-blue-500/20">
            {buffering ? <Loader2 className="animate-spin" size={20} /> : (isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-0.5" />)}
        </button>
      </div>
    </div>
  );
}