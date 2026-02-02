import React, { useState } from 'react';
// CORRECCIÓN 1: Importación general para evitar errores rojos
import ReactPlayer from 'react-player';
import { Home, Search, Play, Pause, Loader2 } from 'lucide-react';

const BACKEND_URL = 'https://manufyvezla.xyz';

export default function App() {
  const [view, setView] = useState('home');
  const [current, setCurrent] = useState({ 
    id: '',
    title: 'Manufy Music', 
    artist: 'Selecciona una canción', 
    foto: 'https://i.imgur.com/Q61eP9C.png',
    url: '' // Aquí irá el link de YouTube
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  
  // --- LÓGICA DE JUEGO ---
  const playSong = (song) => {
    console.log("Jugada iniciada:", song.title);
    setCurrent({
      ...song,
      url: `https://www.youtube.com/watch?v=${song.id}`
    });
    setIsPlaying(true);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      // Pedimos la lista al servidor
      const res = await fetch(`${BACKEND_URL}/buscar?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      alert("Error conectando con el servidor. Revisa que server.py esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-black text-white font-sans overflow-hidden flex flex-col">
      
      {/* --- EL REPRODUCTOR TÁCTICO --- */}
      {/* Lo ponemos de 1 pixel para que el navegador NO lo bloquee */}
      <div className="fixed top-0 left-0 opacity-0 pointer-events-none">
        <ReactPlayer 
          url={current.url}
          playing={isPlaying}
          volume={1.0} // Volumen al máximo
          width="1px"
          height="1px"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={(e) => console.log("Error de reproducción:", e)}
          config={{
            youtube: {
              playerVars: { showinfo: 0, autoplay: 1 }
            }
          }}
        />
      </div>

      {/* --- PANTALLA PRINCIPAL --- */}
      <div className="flex-1 overflow-y-auto p-6 pb-48">
        {view === 'home' ? (
          <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-7xl font-black italic mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
              MANUFY
            </h1>
            <p className="text-zinc-500 italic text-lg ml-1">Edición: Embed Player (Indetectable).</p>
            
            <div className="mt-16">
              <div className="p-6 bg-zinc-900/60 rounded-3xl border border-white/5">
                <h2 className="font-bold text-xl mb-1">Sistema Listo 🏀</h2>
                <p className="text-zinc-400 text-sm mb-4">El reproductor oficial está activo.</p>
                <button onClick={() => setView('search')} className="bg-white text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform">
                  Buscar Música
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <form onSubmit={handleSearch} className="mb-8 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-50">
              <div className="relative">
                <input 
                  autoFocus
                  value={query} 
                  onChange={e => setQuery(e.target.value)} 
                  className="w-full bg-zinc-900 p-4 pl-12 rounded-2xl outline-none border border-zinc-800 focus:border-purple-500 text-lg text-white" 
                  placeholder="Busca artistas o canciones..." 
                />
                <Search className="absolute left-4 top-5 text-zinc-500" size={20} />
              </div>
            </form>
            
            {loading && <div className="text-center mt-10"><Loader2 className="animate-spin inline text-purple-500"/></div>}

            <div className="grid gap-3">
              {results.map((s) => (
                <div key={s.id} onClick={() => playSong(s)} className="flex items-center gap-4 bg-zinc-900/40 p-3 rounded-2xl cursor-pointer hover:bg-zinc-800 transition-all active:scale-95">
                  <img src={s.foto} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${current.id === s.id ? 'text-purple-400' : 'text-white'}`}>{s.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{s.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- CONTROL REMOTO (Barra inferior) --- */}
      <div className="fixed bottom-24 left-4 right-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex items-center justify-between shadow-2xl z-[100]">
        <div className="flex items-center gap-3 overflow-hidden flex-1 mr-4">
          <img src={current.foto} className={`w-12 h-12 rounded-lg object-cover ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
          <div className="min-w-0">
            <p className="text-sm font-bold truncate text-white">{current.title}</p>
            <p className="text-[10px] text-zinc-400 uppercase font-bold truncate">{current.artist}</p>
          </div>
        </div>
        <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg">
          {isPlaying ? <Pause fill="black" size={20} /> : <Play fill="black" size={20} className="ml-0.5" />}
        </button>
      </div>

      <nav className="fixed bottom-0 w-full bg-black border-t border-white/10 p-4 pb-6 flex justify-around items-center z-[101]">
        <button onClick={() => setView('home')} className={view === 'home' ? 'text-white' : 'text-zinc-600'}><Home/></button>
        <button onClick={() => setView('search')} className={view === 'search' ? 'text-white' : 'text-zinc-600'}><Search/></button>
      </nav>
    </div>
  );
}