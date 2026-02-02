import React, { useState, useRef, useEffect } from "react";
import { Home, Search, Play, Pause, Loader2, Music, Send } from "lucide-react";

// URL de tu servidor en Alemania
const BACKEND_URL = "https://manufyvezla.xyz";

export default function App() {
  const [view, setView] = useState("home");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false); // Para la búsqueda
  const [buffering, setBuffering] = useState(false); // Para la descarga de audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState({
    id: "",
    title: "Manufy Music",
    artist: "Selecciona una canción",
    foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/2048px-Telegram_logo.svg.png",
    audioUrl: ""
  });

  const audioRef = useRef(null);

  // Función para buscar música
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const response = await fetch(`${BACKEND_URL}/buscar?q=${encodeURIComponent(query)}&t=${Date.now()}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("No se pudo conectar con el servidor. Verifica que server.py esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  // Función para reproducir
  const playSong = (song) => {
    setCurrent(song);
    setIsPlaying(false);
    setBuffering(true); // Telegram tarda unos segundos en procesar

    if (audioRef.current) {
      // Forzamos la carga del nuevo stream
      audioRef.current.src = song.audioUrl;
      audioRef.current.load();
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setBuffering(false);
        })
        .catch((err) => {
          console.error("Error al reproducir:", err);
          setBuffering(false);
        });
    }
  };

  // Control manual de Play/Pausa
  const togglePlay = () => {
    if (!audioRef.current || !current.id) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="h-screen bg-black text-white font-sans overflow-hidden flex flex-col">
      {/* --- REPRODUCTOR OCULTO --- */}
      <audio 
        ref={audioRef}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => { setBuffering(false); setIsPlaying(true); }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => { setBuffering(false); alert("Error al cargar el audio de Telegram."); }}
      />

      {/* --- CUERPO DE LA APP --- */}
      <div className="flex-1 overflow-y-auto p-6 pb-44">
        {view === "home" ? (
          <div className="mt-20 text-center animate-in fade-in zoom-in duration-700">
            <h1 className="text-7xl font-black text-blue-500 italic tracking-tighter mb-2">MANUFY</h1>
            <p className="text-zinc-500 text-lg mb-10">Powered by Telegram Engine</p>
            <div className="bg-zinc-900/40 p-8 rounded-3xl border border-white/5 inline-block w-full max-w-sm">
              <p className="text-zinc-400 mb-6">Busca cualquier canción del mundo.</p>
              <button 
                onClick={() => setView("search")}
                className="bg-blue-600 text-white w-full py-4 rounded-full font-bold text-lg hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
              >
                EMPEZAR A BUSCAR
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleSearch} className="mb-8 sticky top-0 bg-black/90 backdrop-blur-xl py-4 z-50">
              <div className="relative">
                <input 
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-14 rounded-2xl outline-none focus:border-blue-500 text-lg transition-all"
                  placeholder="Artista o canción..."
                />
                <Search className="absolute left-5 top-6 text-zinc-500" size={24} />
              </div>
            </form>

            {loading && (
              <div className="flex flex-col items-center mt-20 text-zinc-500">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                <p>Explorando en la nube de Telegram...</p>
              </div>
            )}

            <div className="grid gap-3">
              {results.map((song) => (
                <div 
                  key={song.id} 
                  onClick={() => playSong(song)}
                  className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all active:scale-95 ${
                    current.id === song.id ? "bg-blue-600/20 border border-blue-500/30" : "bg-zinc-900/40 hover:bg-zinc-800"
                  }`}
                >
                  <div className="w-14 h-14 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    <Music className="text-blue-500" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${current.id === song.id ? "text-blue-400" : "text-white"}`}>{song.title}</p>
                    <p className="text-xs text-zinc-500 truncate uppercase tracking-widest">{song.artist}</p>
                  </div>
                  {current.id === song.id && isPlaying && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping mr-2" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- BARRA DE CONTROL --- */}
      <div className="fixed bottom-0 w-full bg-zinc-900/95 backdrop-blur-2xl border-t border-white/5 p-5 pb-10 flex items-center justify-between shadow-2xl z-50">
        <div className="flex items-center gap-4 overflow-hidden flex-1 mr-4">
          <img 
            src={current.foto} 
            className={`w-14 h-14 rounded-xl object-cover bg-black shadow-lg ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`} 
          />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate text-white">{current.title}</p>
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">{current.artist}</p>
          </div>
        </div>

        <button 
          onClick={togglePlay}
          disabled={!current.id}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-90 ${
            !current.id ? "bg-zinc-800 text-zinc-600" : "bg-white text-black hover:scale-105"
          }`}
        >
          {buffering ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            isPlaying ? <Pause fill="black" size={24} /> : <Play fill="black" size={24} className="ml-1" />
          )}
        </button>
      </div>

      {/* --- NAVEGACIÓN --- */}
      <nav className="fixed top-6 right-6 flex gap-2">
        <button onClick={() => setView('home')} className={`p-3 rounded-full ${view === 'home' ? 'bg-blue-600' : 'bg-zinc-900'}`}><Home size={20}/></button>
        <button onClick={() => setView('search')} className={`p-3 rounded-full ${view === 'search' ? 'bg-blue-600' : 'bg-zinc-900'}`}><Search size={20}/></button>
      </nav>
    </div>
  );
}