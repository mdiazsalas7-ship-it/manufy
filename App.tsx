import React, { useState, useEffect, useRef } from 'react';
import { Home, Search, Play, Pause, Music, Loader2, Heart, SkipForward } from 'lucide-react';

// --- CONFIGURACIÓN OFICIAL MANUFY ---
const BACKEND_URL = 'https://manufyvezla.xyz';
const TUNNEL_HEADERS = {};

export default function App() {
  const [view, setView] = useState('home');
  const [current, setCurrent] = useState({ 
    title: 'Manufy Music', 
    artist: 'Listo para el salto entre dos', 
    foto: 'https://i.postimg.cc/05wxzk5G/unnamed.jpg' 
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  
  const audioRef = useRef(null);

  // --- 🏀 LA JUGADA MAESTRA (REPRODUCCIÓN) ---
  const playSong = (song) => {
    if (!song.audioUrl) return;
    
    // Limpiamos la URL para asegurar HTTPS y eliminar espacios que rompen el link
    const secureUrl = song.audioUrl.replace('http://', 'https://').replace(/ /g, '%20');
    
    setCurrent(song);
    
    if (audioRef.current) {
      audioRef.current.src = secureUrl;
      audioRef.current.load();
      
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          setIsPlaying(false);
          console.log("Interacción requerida o error de carga:", err);
        });
    }
  };

  // --- 🔍 ESTRATEGIA DE BÚSQUEDA ---
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/buscar?q=${encodeURIComponent(query)}`, { 
        headers: TUNNEL_HEADERS 
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Error en la conexión:", err);
      alert("No pudimos conectar con el servidor en Alemania. Verifica que 'server.py' esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-black text-white font-sans overflow-hidden flex flex-col">
      {/* MOTOR DE AUDIO OCULTO */}
      <audio 
        ref={audioRef} 
        crossOrigin="anonymous" 
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)} 
        onEnded={() => setIsPlaying(false)}
      />

      {/* ÁREA DE JUEGO (CONTENIDO) */}
      <div className="flex-1 overflow-y-auto p-6 pb-44">
        {view === 'home' ? (
          <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-7xl font-black italic mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
              MANUFY
            </h1>
            <p className="text-zinc-500 italic text-lg ml-1">Streaming desde Alemania para el mundo.</p>
            
            <div className="mt-16 grid grid-cols-1 gap-4">
              <div className="p-6 bg-zinc-900/60 rounded-3xl border border-white/5 backdrop-blur-md">
                <h2 className="font-bold text-xl mb-1">¡Qué onda, Manuel! 🏀</h2>
                <p className="text-sm text-zinc-400">Tu servidor en Contabo está listo. Toca buscar para empezar la lista.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <form onSubmit={handleSearch} className="mb-8 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-50">
              <input 
                autoFocus
                value={query} 
                onChange={e => setQuery(e.target.value)} 
                className="w-full bg-zinc-900 p-5 rounded-2xl outline-none border-2 border-transparent focus:border-purple-500 transition-all text-lg shadow-2xl" 
                placeholder="Busca artistas, temas o álbumes..." 
              />
            </form>
            
            {loading ? (
              <div className="flex flex-col items-center mt-20">
                <Loader2 className="animate-spin text-purple-500 w-12 h-12 mb-4" />
                <p className="text-zinc-500 font-medium">Conectando con el servidor...</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {results.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => playSong(s)} 
                    className="flex items-center gap-4 bg-zinc-900/40 hover:bg-zinc-800 p-3 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/10 group"
                  >
                    <div className="relative">
                      <img src={s.foto} className="w-16 h-16 rounded-xl object-cover shadow-lg group-hover:opacity-80 transition-opacity" alt={s.title} />
                      <Play size={20} className="absolute inset-0 m-auto text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold truncate text-base leading-tight">{s.title}</p>
                      <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{s.artist}</p>
                    </div>
                    <button className="p-2 text-zinc-600 hover:text-red-500 transition-colors">
                      <Heart size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* REPRODUCTOR FLOTANTE (EL MVP) */}
      <div className="fixed bottom-28 left-4 right-4 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex items-center gap-4 overflow-hidden flex-1">
          <img 
            src={current.foto} 
            className={`w-14 h-14 rounded-2xl object-cover shadow-xl transition-transform duration-500 ${isPlaying ? 'scale-105 shadow-purple-500/20' : 'scale-95'}`} 
            alt="Album Art"
          />
          <div className="truncate pr-4">
            <p className="text-sm font-bold truncate leading-none mb-1">{current.title}</p>
            <p className="text-[11px] text-zinc-500 uppercase font-black tracking-tighter">{current.artist}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (!audioRef.current) return;
              isPlaying ? audioRef.current.pause() : audioRef.current.play();
            }} 
            className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-transform shadow-xl"
          >
            {isPlaying ? <Pause fill="black" size={28} /> : <Play fill="black" size={28} className="ml-1" />}
          </button>
        </div>
      </div>

      {/* NAVEGACIÓN TIPO APP MÓVIL */}
      <nav className="fixed bottom-0 w-full bg-black/80 backdrop-blur-md border-t border-white/5 p-7 flex justify-around items-center z-[101]">
        <button 
          onClick={() => setView('home')} 
          className={`flex flex-col items-center gap-1.5 transition-all ${view === 'home' ? 'text-purple-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          <Home size={26} />
          <span className="text-[9px] font-black tracking-widest">HOME</span>
        </button>
        <button 
          onClick={() => setView('search')} 
          className={`flex flex-col items-center gap-1.5 transition-all ${view === 'search' ? 'text-purple-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          <Search size={26} />
          <span className="text-[9px] font-black tracking-widest">EXPLORE</span>
        </button>
      </nav>
    </div>
  );
}