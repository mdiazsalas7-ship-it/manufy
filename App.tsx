import React, { useState, useEffect, useRef } from 'react';
import { Home, Search, Play, Pause, Music, Loader2, Heart, SkipForward, AlertCircle } from 'lucide-react';

// --- CONFIGURACIÓN OFICIAL MANUFY ---
const BACKEND_URL = 'https://manufyvezla.xyz';
// Dejamos esto vacío porque ya configuramos el servidor para aceptar todo
const TUNNEL_HEADERS = {};

export default function App() {
  const [view, setView] = useState('home');
  const [current, setCurrent] = useState({ 
    title: 'Manufy Music', 
    artist: 'Selecciona una canción', 
    foto: 'https://i.imgur.com/Q61eP9C.png' 
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  
  const audioRef = useRef(null);

  // --- 🏀 LÓGICA DE REPRODUCCIÓN (CORREGIDA) ---
  const playSong = (song) => {
    if (!song.audioUrl) return;
    
    // Aseguramos que el link sea seguro (HTTPS) y sin espacios rotos
    const secureUrl = song.audioUrl.replace('http://', 'https://').trim();
    
    setCurrent(song);
    setIsPlaying(false); // Pausa momentánea mientras carga
    
    if (audioRef.current) {
      audioRef.current.src = secureUrl;
      audioRef.current.load();
      
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Error al reproducir:", error);
            setIsPlaying(false);
          });
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // --- 🔍 BÚSQUEDA ---
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResults([]); // Limpiar resultados anteriores
    
    try {
      const res = await fetch(`${BACKEND_URL}/buscar?q=${encodeURIComponent(query)}`, { 
        headers: TUNNEL_HEADERS 
      });
      
      if (!res.ok) throw new Error("Error conectando al servidor");
      
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Error:", err);
      alert("Error de conexión. Asegúrate de que tu servidor en Alemania esté corriendo (python3 server.py).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-black text-white font-sans overflow-hidden flex flex-col">
      
      {/* --- MOTOR DE AUDIO (CORREGIDO: SIN crossOrigin) --- */}
      <audio 
        ref={audioRef}
        preload="auto"
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)} 
        onEnded={() => setIsPlaying(false)}
        onError={(e) => console.log("Error de audio:", e)}
      />

      {/* --- ÁREA DE CONTENIDO --- */}
      <div className="flex-1 overflow-y-auto p-6 pb-48">
        {view === 'home' ? (
          <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-7xl font-black italic mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
              MANUFY
            </h1>
            <p className="text-zinc-500 italic text-lg ml-1">Streaming directo desde Alemania.</p>
            
            <div className="mt-16 grid grid-cols-1 gap-4">
              <div className="p-6 bg-zinc-900/60 rounded-3xl border border-white/5 backdrop-blur-md">
                <h2 className="font-bold text-xl mb-1">¡Bienvenido, Coach! 🏀</h2>
                <p className="text-sm text-zinc-400 mb-4">El servidor está conectado y listo para la música.</p>
                <button 
                  onClick={() => setView('search')}
                  className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform"
                >
                  Buscar Música
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <form onSubmit={handleSearch} className="mb-8 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-50">
              <div className="relative">
                <input 
                  autoFocus
                  value={query} 
                  onChange={e => setQuery(e.target.value)} 
                  className="w-full bg-zinc-900 p-4 pl-12 rounded-2xl outline-none border border-zinc-800 focus:border-purple-500 transition-all text-lg shadow-2xl text-white placeholder:text-zinc-600" 
                  placeholder="¿Qué quieres escuchar hoy?" 
                />
                <Search className="absolute left-4 top-5 text-zinc-500" size={20} />
              </div>
            </form>
            
            {loading ? (
              <div className="flex flex-col items-center mt-20">
                <Loader2 className="animate-spin text-purple-500 w-10 h-10 mb-4" />
                <p className="text-zinc-500 font-medium text-sm">Buscando en YouTube...</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {results.length === 0 && query && !loading && (
                   <p className="text-zinc-600 text-center mt-10">No encontramos resultados o el servidor está descansando.</p>
                )}
                
                {results.map((s) => (
                  <div 
                    key={s.id} 
                    onClick={() => playSong(s)} 
                    className="flex items-center gap-4 bg-zinc-900/40 hover:bg-zinc-800 p-3 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/10 group active:scale-95"
                  >
                    <div className="relative shrink-0">
                      <img src={s.foto} className="w-14 h-14 rounded-lg object-cover shadow-lg group-hover:opacity-60 transition-opacity bg-zinc-800" alt={s.title} />
                      <Play size={18} className="absolute inset-0 m-auto text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate text-base ${current.id === s.id ? 'text-purple-400' : 'text-white'}`}>
                        {s.title}
                      </p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{s.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- REPRODUCTOR FLOTANTE --- */}
      <div className="fixed bottom-24 left-4 right-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex items-center justify-between shadow-2xl z-[100] animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex items-center gap-3 overflow-hidden flex-1 mr-4">
          <img 
            src={current.foto} 
            className={`w-12 h-12 rounded-lg object-cover shadow-md transition-transform duration-700 ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`} 
            style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
            alt="Cover"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold truncate leading-tight text-white">{current.title}</p>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider truncate">{current.artist}</p>
          </div>
        </div>
        
        <button 
          onClick={togglePlay} 
          className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shrink-0"
        >
          {isPlaying ? <Pause fill="black" size={20} /> : <Play fill="black" size={20} className="ml-0.5" />}
        </button>
      </div>

      {/* --- BARRA DE NAVEGACIÓN --- */}
      <nav className="fixed bottom-0 w-full bg-black border-t border-white/10 p-4 pb-6 flex justify-around items-center z-[101]">
        <button 
          onClick={() => setView('home')} 
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'home' ? 'text-white' : 'text-zinc-600'}`}
        >
          <Home size={24} strokeWidth={view === 'home' ? 3 : 2} />
          <span className="text-[10px] font-bold tracking-widest">INICIO</span>
        </button>
        <button 
          onClick={() => setView('search')} 
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'search' ? 'text-white' : 'text-zinc-600'}`}
        >
          <Search size={24} strokeWidth={view === 'search' ? 3 : 2} />
          <span className="text-[10px] font-bold tracking-widest">BUSCAR</span>
        </button>
      </nav>
    </div>
  );
}