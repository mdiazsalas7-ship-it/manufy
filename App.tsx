import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Home as HomeIcon, 
  Search as SearchIcon, 
  Library as LibraryIcon, 
  Sparkles, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  Shuffle, 
  Repeat, 
  MoreVertical,
  Bell,
  Settings,
  Loader2,
  Download,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  SearchX,
  ChevronDown,
  ArrowLeft,
  Music,
  Globe,
  Newspaper,
  ExternalLink,
  Mic,
  Share2,
  TrendingUp,
  X // Importado para cerrar el modal
} from 'lucide-react';
import OpenAI from 'openai';
import { View, Song, Playlist } from './types';
import { GENRES, INITIAL_SONG } from './constants';
import { saveAudioBlob, getAudioBlob, deleteAudioBlob } from './db';

// --- CONFIGURACIÓN ---
const BACKEND_URL = 'https://fibre-patricia-gif-producing.trycloudflare.com'.replace(/\/$/, '');
const TUNNEL_HEADERS = { 'Cloudflare-Skip-Browser-Warning': 'true' };
const LOGO_URL = 'https://i.postimg.cc/05wxzk5G/unnamed.jpg';
const BACKGROUND_IMAGE = 'https://i.postimg.cc/P5k7rD2R/unnamed.jpg';

// --- BASE DE DATOS LOCAL PARA PREDICTIVO (VELOCIDAD EXTREMA) ---
const POPULAR_ARTISTS = [
  "Bad Bunny", "Taylor Swift", "The Weeknd", "Drake", "Peso Pluma", 
  "Karol G", "Feid", "Kendrick Lamar", "Ariana Grande", "Harry Styles",
  "Shakira", "Rosalía", "Rauw Alejandro", "Myke Towers", "Eladio Carrión",
  "Dua Lipa", "Beyoncé", "Justin Bieber", "Post Malone", "Billie Eilish",
  "Travis Scott", "Kanye West", "Eminem", "Rihanna", "Bruno Mars",
  "Adele", "Coldplay", "Imagine Dragons", "Maroon 5", "Ed Sheeran",
  "J Balvin", "Maluma", "Daddy Yankee", "Don Omar", "Wisin y Yandel",
  "Arcángel", "Anuel AA", "Ozuna", "Sech", "Mora", "Young Miko"
];

// --- INICIALIZACIÓN SEGURA ---
const ENV_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const aiClient = (ENV_KEY && ENV_KEY.startsWith('sk-or-')) 
  ? new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: ENV_KEY, 
      dangerouslyAllowBrowser: true 
    }) 
  : null;

const AI_MODEL = "openai/gpt-4o-mini";

// --- UTILIDADES ---

const cleanAiResponse = (text: string) => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Error parseando JSON de IA:", e);
    return [];
  }
};

// CACHÉ INTELIGENTE: Guarda respuestas por 1 hora para velocidad instantánea
const getCachedData = (key: string) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > 3600000) return null; // 1 hora de validez
  return data;
};

const setCachedData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
};

async function resilientFetch(url: string, options: RequestInit = {}, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  const headers: Record<string, string> = {
    ...TUNNEL_HEADERS,
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

const FALLBACK_SONGS: Record<string, {title: string, artist: string}[]> = {
  'Global Top 10': [
    { title: 'Flowers', artist: 'Miley Cyrus' },
    { title: 'Kill Bill', artist: 'SZA' },
    { title: 'As It Was', artist: 'Harry Styles' },
    { title: 'Cruel Summer', artist: 'Taylor Swift' },
    { title: 'Blinding Lights', artist: 'The Weeknd' }
  ],
  'Nuevos Lanzamientos': [
    { title: 'Houdini', artist: 'Dua Lipa' },
    { title: 'Texas Hold Em', artist: 'Beyoncé' },
    { title: 'Yes, and?', artist: 'Ariana Grande' }
  ]
};

// --- COMPONENTES UI ---

const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-6 py-3 rounded-full bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300 max-w-[90vw]">
      {type === 'success' && <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />}
      {type === 'error' && <XCircle size={18} className="text-rose-500 flex-shrink-0" />}
      {type === 'info' && <Loader2 size={18} className="text-purple-500 animate-spin flex-shrink-0" />}
      <span className="text-xs font-bold text-white truncate">{message}</span>
    </div>
  );
};

const MusicEqualizer = () => (
  <div className="flex items-end gap-[2px] h-3 w-3 justify-center">
    <div className="w-[3px] bg-purple-500 rounded-t-sm animate-[bounce_0.8s_infinite] h-full"></div>
    <div className="w-[3px] bg-purple-500 rounded-t-sm animate-[bounce_1.2s_infinite] h-2"></div>
    <div className="w-[3px] bg-purple-500 rounded-t-sm animate-[bounce_1.0s_infinite] h-full"></div>
  </div>
);

// --- VISTA DETALLE PLAYLIST ---

const PlaylistDetail: React.FC<{ 
  playlist: Playlist; 
  onBack: () => void; 
  onSelectSong: (s: Song) => void;
  currentSong: Song;
  isPlaying: boolean;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ playlist, onBack, onSelectSong, currentSong, isPlaying, showToast }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      let songList = [];
      const cacheKey = `playlist_${playlist.name}`;
      
      // 1. Intentar cargar de caché primero
      const cached = getCachedData(cacheKey);
      if (cached) {
        setSongs(cached); // Si existe, mostramos de inmediato (Instantáneo)
        setLoading(false);
        return; 
      }

      // 2. Si no hay caché, usamos IA o Fallback
      if (!aiClient) {
        songList = FALLBACK_SONGS[playlist.name] || FALLBACK_SONGS['Global Top 10'] || [];
      } else {
        try {
          const completion = await aiClient.chat.completions.create({
            model: AI_MODEL,
            messages: [
              { role: "system", content: "Eres un experto musical. Responde SOLO con un JSON válido." },
              { role: "user", content: `Genera una lista de 10 canciones famosas para la categoría: "${playlist.name}". Formato JSON array de objetos con propiedades 'title' y 'artist'.` }
            ]
          });
          const content = completion.choices[0].message.content || "[]";
          songList = cleanAiResponse(content);
        } catch (e: any) {
          console.error("Error OpenRouter:", e);
          songList = FALLBACK_SONGS[playlist.name] || FALLBACK_SONGS['Global Top 10'] || [];
        }
      }
      
      try {
        const resolvedSongs = await Promise.all(songList.map(async (s: any, i: number): Promise<Song | null> => {
          try {
            const searchRes = await resilientFetch(`${BACKEND_URL}/buscar?q=${encodeURIComponent(s.title + ' ' + s.artist)}`);
            if (searchRes && searchRes.ok) {
              const data = await searchRes.json();
              if (data && data.length > 0) {
                const item = data[0];
                return {
                  id: item.id || `pl-${i}-${item.titulo}`,
                  title: item.titulo || item.title || s.title,
                  artist: item.artista || item.artist || s.artist,
                  coverUrl: item.foto || item.image || item.thumbnail || `https://picsum.photos/seed/${s.title}/300`,
                  audioUrl: item.audioUrl || item.audio ? ( (item.audioUrl || item.audio).startsWith('http') ? (item.audioUrl || item.audio) : `${BACKEND_URL}/${(item.audioUrl || item.audio).replace(/^\//, '')}` ) : undefined,
                  duration: 0
                };
              }
            }
          } catch (e) {}
          return null;
        }));
        
        const finalSongs = resolvedSongs.filter((s): s is Song => s !== null);
        setSongs(finalSongs);
        setCachedData(cacheKey, finalSongs); // Guardamos en caché para la próxima
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, [playlist.name, showToast]);

  return (
    <div className="absolute inset-0 bg-black/90 z-[70] flex flex-col animate-in slide-in-from-right duration-500 overflow-y-auto hide-scrollbar">
      {/* ... (Resto del componente igual) ... */}
      <div className="relative h-80 flex-shrink-0">
        <img src={playlist.imageUrl} className="w-full h-full object-cover blur-sm opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <button onClick={onBack} className="absolute top-12 left-6 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
          <ArrowLeft size={24} />
        </button>
        <div className="absolute top-12 right-6">
          <img src={LOGO_URL} className="w-10 h-10 rounded-full border border-white/20 shadow-lg" alt="Manufy Logo" />
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-4xl font-black tracking-tighter mb-2">{playlist.name}</h1>
          <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">
             {aiClient ? "Powered by OpenRouter" : "Modo Offline"}
          </p>
        </div>
      </div>

      <div className="p-6 flex-1 bg-black/80 backdrop-blur-xl rounded-t-[40px] -mt-10 relative z-10 border-t border-white/5">
        <div className="flex justify-between items-center mb-8">
           <button className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
              <Play fill="white" size={28} className="ml-1" />
           </button>
           <div className="flex gap-4 text-zinc-500 items-center">
              <Shuffle size={20} />
              <Download size={20} />
           </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center animate-pulse">
                <div className="w-12 h-12 bg-zinc-900 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-900 rounded w-3/4" />
                  <div className="h-3 bg-zinc-900 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-32">
            {songs.map((song, i) => (
              <div key={song.id} onClick={() => onSelectSong(song)} className={`flex items-center gap-4 group cursor-pointer p-2 rounded-xl transition-all ${currentSong.id === song.id ? 'bg-purple-600/10' : 'hover:bg-white/5'}`}>
                <span className="text-zinc-700 font-black text-xs w-4">{i + 1}</span>
                <img src={song.coverUrl} className="w-12 h-12 rounded-lg object-cover shadow-md" />
                <div className="flex-1 overflow-hidden">
                  <h3 className={`text-sm font-bold truncate ${currentSong.id === song.id ? 'text-purple-400' : 'text-white'}`}>{song.title}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase truncate">{song.artist}</p>
                </div>
                {currentSong.id === song.id && isPlaying && <MusicEqualizer />}
                <MoreVertical size={18} className="text-zinc-800" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

export default function App() {
  const [activeView, setActiveView] = useState<View>('home');
  const [currentSong, setCurrentSong] = useState<Song>(INITIAL_SONG);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [history, setHistory] = useState<Song[]>([]);
  const [aiPlaylists, setAiPlaylists] = useState<Playlist[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [playbackUrl, setPlaybackUrl] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [librarySubView, setLibrarySubView] = useState<'main' | 'likes'>('main');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  
  // Noticias IA Mejoradas
  const [musicNews, setMusicNews] = useState<any[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState<any | null>(null); // Nuevo estado para noticia expandida

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  }, []);

  // --- LOGICA DE CACHÉ PARA TRENDS Y NOTICIAS ---

  const fetchMusicTrends = async () => {
    setIsAiLoading(true);
    
    // 1. Revisar Caché
    const cached = getCachedData('trends_home');
    if (cached) {
      setAiPlaylists(cached);
      setIsAiLoading(false);
      return;
    }

    if (!aiClient) {
      const fallback: Playlist[] = [
        { id: '1', name: 'Global Top 10', imageUrl: 'https://picsum.photos/seed/top1/600', type: 'playlist' },
        { id: '2', name: 'Nuevos Lanzamientos', imageUrl: 'https://picsum.photos/seed/new1/600', type: 'playlist' },
        { id: '3', name: 'Latino Gang', imageUrl: 'https://picsum.photos/seed/latino1/600', type: 'playlist' },
      ];
      setAiPlaylists(fallback);
      setIsAiLoading(false);
      return;
    }

    try {
      const completion = await aiClient.chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: "system", content: "Eres un curador musical. Responde SOLO JSON válido." },
          { role: "user", content: "Dame 6 categorías musicales para una app de streaming (ej: Top Global, Novedades). Formato JSON array con: id, name, description." }
        ]
      });
      const content = completion.choices[0].message.content || "[]";
      const trendsRaw = cleanAiResponse(content);
      const trends = trendsRaw.map((t: any, i: number) => ({
        ...t, imageUrl: `https://picsum.photos/seed/trend-${i}/600`, type: 'playlist'
      }));
      
      setAiPlaylists(trends);
      setCachedData('trends_home', trends); // Guardar en caché
    } catch (e) {
      console.warn("Error Trends:", e);
      setAiPlaylists([
        { id: '1', name: 'Global Top 10', imageUrl: 'https://picsum.photos/seed/top1/600', type: 'playlist' },
        { id: '2', name: 'Nuevos Lanzamientos', imageUrl: 'https://picsum.photos/seed/new1/600', type: 'playlist' },
      ]);
    } finally { setIsAiLoading(false); }
  };

  const fetchMusicNews = async () => {
    setIsNewsLoading(true);
    
    // 1. Revisar Caché
    const cached = getCachedData('music_news');
    if (cached) {
      setMusicNews(cached);
      setIsNewsLoading(false);
      return;
    }

    if (!aiClient) {
      setMusicNews([
        { headline: "Conecta tu IA", summary: "Configura VITE_OPENROUTER_API_KEY en Vercel para ver noticias reales.", category: "Sistema", emoji: "🔌", content: "Para ver el contenido completo de las noticias, necesitas configurar la clave API en el panel de Vercel. Una vez hecho, este mensaje desaparecerá y verás noticias en tiempo real." },
        { headline: "Gira mundial confirmada", summary: "Varios artistas anuncian sus fechas.", category: "Concierto", emoji: "🌎", content: "Se espera que este año sea récord en giras mundiales con artistas como Taylor Swift y Bad Bunny liderando las listas de recaudación." }
      ]);
      setIsNewsLoading(false);
      return;
    }

    try {
      const completion = await aiClient.chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: "system", content: "Eres un periodista musical. Responde SOLO JSON válido." },
          { role: "user", content: "Genera 5 noticias musicales virales de HOY. JSON array con: headline (max 8 palabras), summary (max 20 palabras), content (artículo completo de 3 parrafos), category, emoji." }
        ]
      });
      const content = completion.choices[0].message.content || "[]";
      const newsData = cleanAiResponse(content);
      
      setMusicNews(newsData);
      setCachedData('music_news', newsData); // Guardar en caché
    } catch (e) {
      console.warn("Error News:", e);
      setMusicNews([{ headline: "Error de conexión", summary: "No se pudieron cargar las noticias.", category: "Error", emoji: "⚠️" }]);
    } finally { setIsNewsLoading(false); }
  };

  const toggleSpeakNews = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (musicNews.length === 0) return;
      
      const textToRead = "Resumen musical. " + musicNews.map(n => `${n.headline}. ${n.summary}`).join(". ");
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'es-ES';
      utterance.rate = 1.1;
      
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  useEffect(() => {
    const savedFavs = localStorage.getItem('manufy_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    fetchMusicTrends();
    return () => window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    localStorage.setItem('manufy_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    let active = true;
    let localUrl: string | undefined;
    const resolveSource = async () => {
      if (!currentSong.id || currentSong.id === 'current') return;
      const offlineBlob = await getAudioBlob(currentSong.id);
      if (offlineBlob && active) {
        localUrl = URL.createObjectURL(offlineBlob);
        setPlaybackUrl(localUrl);
        return;
      }
      if (active) setPlaybackUrl(currentSong.audioUrl);
    };
    resolveSource();
    return () => { active = false; if (localUrl) URL.revokeObjectURL(localUrl); };
  }, [currentSong.id, currentSong.audioUrl]);

  useEffect(() => {
    if (!audioRef.current || !playbackUrl) return;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    else audioRef.current.pause();
  }, [isPlaying, playbackUrl]);

  const onSelectSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setCurrentTime(0);
    setHistory(prev => [song, ...prev.filter(s => s.id !== song.id)].slice(0, 15));
  };

  const togglePlay = () => {
    if (currentSong.id === 'current') return;
    setIsPlaying(!isPlaying);
  };

  const toggleFavorite = async (song: Song) => {
    const isFav = favorites.some(f => f.id === song.id);
    if (isFav) {
      setFavorites(prev => prev.filter(f => f.id !== song.id));
      await deleteAudioBlob(song.id);
      showToast("Eliminada de favoritos", 'success');
    } else {
      setFavorites(prev => [...prev, song]);
      showToast("Descargando para modo offline...", 'info');
      try {
        let url = song.audioUrl || '';
        if (url && !url.startsWith('http')) url = `${BACKEND_URL}/${url.replace(/^\//, '')}`;
        const res = await resilientFetch(url);
        if (res.ok) {
          await saveAudioBlob(song.id, await res.blob());
          showToast("Disponible sin conexión", 'success');
        }
      } catch (e) { showToast("Error al descargar", 'error'); }
    }
  };

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden select-none font-sans">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}
      />
      <div className="fixed inset-0 z-0 bg-black/75 backdrop-blur-[2px]" />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <audio 
        ref={audioRef} 
        src={playbackUrl} 
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setCurrentSong(s => ({ ...s, duration: audioRef.current?.duration || 0 }))}
        onEnded={() => setIsPlaying(false)}
      />

      {selectedPlaylist && (
        <PlaylistDetail 
          playlist={selectedPlaylist} 
          onBack={() => setSelectedPlaylist(null)}
          onSelectSong={onSelectSong}
          currentSong={currentSong}
          isPlaying={isPlaying}
          showToast={showToast}
        />
      )}

      {/* --- MODAL DE NOTICIA EXPANDIDA (PROFUNDIDAD) --- */}
      {selectedNewsItem && (
        <div className="absolute inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 flex justify-end">
            <button onClick={() => setSelectedNewsItem(null)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-20">
            <span className="text-6xl mb-4 block">{selectedNewsItem.emoji}</span>
            <div className="flex gap-2 mb-4">
              <span className="text-[10px] font-black px-2 py-1 bg-purple-600 text-white rounded-full uppercase tracking-widest">{selectedNewsItem.category}</span>
            </div>
            <h1 className="text-3xl font-black mb-6 leading-tight">{selectedNewsItem.headline}</h1>
            <p className="text-lg text-zinc-300 leading-relaxed whitespace-pre-line">
              {selectedNewsItem.content || selectedNewsItem.summary}
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 h-full flex flex-col">
        {activeView === 'home' && (
          <div className="p-6 pt-16 flex-1 overflow-y-auto hide-scrollbar">
            <header className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <img src={LOGO_URL} className="w-12 h-12 rounded-full border border-white/20 shadow-2xl" alt="Logo" />
                <div>
                  <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Manufy</h1>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Music Hub</span>
                </div>
              </div>
              <div className="flex gap-4 text-zinc-400">
                <Bell size={20}/><Settings size={20}/>
              </div>
            </header>
            
            <div className="grid grid-cols-2 gap-3 mb-12">
              {isAiLoading ? [...Array(4)].map((_, i) => <div key={i} className="h-14 bg-white/5 animate-pulse rounded-xl" />) :
                aiPlaylists.slice(0, 4).map(p => (
                  <div key={p.id} onClick={() => setSelectedPlaylist(p)} className="bg-white/5 backdrop-blur-md rounded-xl flex items-center gap-3 h-16 overflow-hidden border border-white/5 hover:bg-white/10 active:scale-95 transition-all cursor-pointer">
                    <img src={p.imageUrl} className="h-full aspect-square object-cover" />
                    <span className="text-[10px] font-black uppercase tracking-tighter leading-tight pr-2">{p.name}</span>
                  </div>
                ))
              }
            </div>
            
            <h2 className="text-2xl font-black mb-6 px-1 tracking-tighter">Tu actividad reciente</h2>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-8 px-1">
              {history.length > 0 ? history.map(s => (
                <div key={s.id} onClick={() => onSelectSong(s)} className="min-w-[160px] group cursor-pointer">
                  <div className="relative aspect-square mb-3 overflow-hidden rounded-[24px] shadow-2xl">
                    <img src={s.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    {currentSong.id === s.id && isPlaying && <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm"><MusicEqualizer /></div>}
                  </div>
                  <h3 className="text-sm font-black truncate">{s.title}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{s.artist}</p>
                </div>
              )) : <div className="text-zinc-600 text-xs font-bold uppercase tracking-widest py-10 px-4 border-2 border-dashed border-white/5 rounded-3xl w-full text-center">Sin actividad reciente</div>}
            </div>
          </div>
        )}

        {activeView === 'search' && (
          <SearchView onSelectSong={onSelectSong} currentSong={currentSong} isPlaying={isPlaying} showToast={showToast} onSelectGenre={setSelectedPlaylist} />
        )}

        {activeView === 'library' && (
          <div className="p-6 pt-16 flex-1 overflow-y-auto hide-scrollbar">
            {librarySubView === 'main' ? (
              <>
                <h1 className="text-4xl font-black mb-10 tracking-tighter">Tu Biblioteca</h1>
                <div onClick={() => setLibrarySubView('likes')} className="bg-white/5 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 flex items-center gap-5 cursor-pointer hover:bg-white/10 active:scale-95 transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-xl">
                    <Heart fill="white" size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Tus me gusta</h3>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{favorites.length} Canciones</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="animate-in slide-in-from-right duration-300">
                <button onClick={() => setLibrarySubView('main')} className="flex items-center gap-2 text-zinc-400 mb-8"><ArrowLeft size={20}/> Volver</button>
                <h1 className="text-4xl font-black mb-8 tracking-tighter">Me gusta</h1>
                <div className="flex flex-col gap-4">
                  {favorites.map(f => (
                    <div key={f.id} onClick={() => onSelectSong(f)} className="flex items-center gap-4 p-2 rounded-2xl hover:bg-white/5 cursor-pointer">
                      <img src={f.coverUrl} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1 overflow-hidden">
                        <h3 className="font-bold truncate text-sm">{f.title}</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">{f.artist}</p>
                      </div>
                      <Heart size={18} fill="#a855f7" className="text-purple-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'ai' && (
          <div className="p-6 pt-16 flex-1 overflow-y-auto hide-scrollbar">
            <header className="flex justify-between items-center mb-10">
              <h1 className="text-4xl font-black tracking-tighter">Mix IA</h1>
              <div className="flex gap-2">
                <button 
                  onClick={fetchMusicNews} 
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 active:rotate-180 transition-transform duration-500 hover:bg-white/10"
                >
                  <Sparkles size={18} className="text-purple-400" />
                </button>
                {musicNews.length > 0 && (
                  <button 
                    onClick={toggleSpeakNews} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 transition-all ${isSpeaking ? 'bg-purple-600 animate-pulse' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    {isSpeaking ? <Wifi size={18} className="text-white" /> : <Mic size={18} className="text-zinc-400" />}
                  </button>
                )}
              </div>
            </header>

            <div className="flex flex-col gap-6 pb-32">
              {musicNews.length === 0 && !isNewsLoading && (
                 <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Newspaper size={64} className="text-zinc-800 mb-4 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Sin noticias aún</p>
                    <button onClick={fetchMusicNews} className="mt-4 px-6 py-2 bg-purple-600/20 text-purple-400 rounded-full text-xs font-bold hover:bg-purple-600/40 transition-colors">Generar ahora</button>
                 </div>
              )}
              
              {isNewsLoading ? [...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white/5 animate-pulse rounded-[32px]" />) :
                musicNews.map((news, i) => (
                  <div key={i} onClick={() => setSelectedNewsItem(news)} className="bg-black/40 border border-white/5 p-0 rounded-[32px] backdrop-blur-md hover:border-purple-500/30 transition-all group overflow-hidden relative cursor-pointer active:scale-95">
                    <div className="h-24 w-full relative overflow-hidden">
                       <img 
                         src={`https://picsum.photos/seed/${news.headline}/600/200`} 
                         className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                       <span className="absolute bottom-3 left-6 text-3xl drop-shadow-lg filter grayscale-0">{news.emoji || "🎵"}</span>
                    </div>
                    
                    <div className="p-6 pt-2">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[8px] font-black px-2 py-1 bg-white/10 text-white rounded-full uppercase tracking-widest backdrop-blur-md">{news.category}</span>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase flex items-center gap-1"><TrendingUp size={10}/> Viral</span>
                      </div>
                      <h3 className="text-xl font-black mb-2 text-white leading-tight">{news.headline}</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2">{news.summary}</p>
                      
                      <div className="flex gap-3">
                        <button className="flex-1 py-3 bg-white/5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 transition-colors">
                          Leer completo <ExternalLink size={12}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {!isFullPlayerOpen && currentSong.id !== 'current' && (
          <div onClick={() => setIsFullPlayerOpen(true)} className="mx-3 mb-24 bg-zinc-900/90 backdrop-blur-2xl rounded-2xl p-2.5 flex items-center justify-between border border-white/5 shadow-2xl animate-slide-up cursor-pointer">
            {/* ... Mini Player igual ... */}
            <div className="flex items-center gap-3 overflow-hidden pl-1">
              <img src={currentSong.coverUrl} className="w-11 h-11 rounded-xl object-cover shadow-lg" />
              <div className="truncate">
                <p className="text-xs font-black truncate">{currentSong.title}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase truncate">{currentSong.artist}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-3">
              <button onClick={(e) => { e.stopPropagation(); toggleFavorite(currentSong); }} className={favorites.some(f => f.id === currentSong.id) ? 'text-purple-500' : 'text-zinc-500'}>
                <Heart size={22} fill={favorites.some(f => f.id === currentSong.id) ? "currentColor" : "none"} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all">
                {isPlaying ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor" className="ml-1"/>}
              </button>
            </div>
          </div>
        )}

        <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-3xl border-t border-white/5 pb-8 pt-4 px-8 flex justify-between items-center z-[80]">
          {[
            { id: 'home', icon: HomeIcon, label: 'Inicio' },
            { id: 'search', icon: SearchIcon, label: 'Buscar' },
            { id: 'library', icon: LibraryIcon, label: 'Biblioteca' },
            { id: 'ai', icon: Sparkles, label: 'Mix IA' }
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveView(item.id as View); setSelectedPlaylist(null); if(item.id === 'ai') fetchMusicNews(); }} className={`flex flex-col items-center gap-1 transition-all ${activeView === item.id ? 'text-white scale-110' : 'text-zinc-600'}`}>
              <item.icon size={22} strokeWidth={activeView === item.id ? 3 : 2} />
              <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {isFullPlayerOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in slide-in-from-bottom duration-500">
          {/* ... Full Player igual ... */}
          <div className="fixed inset-0 z-0">
             <img src={currentSong.coverUrl} className="w-full h-full object-cover blur-[100px] opacity-30 scale-150" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <header className="p-6 flex justify-between items-center">
              <button onClick={() => setIsFullPlayerOpen(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center"><ChevronDown size={28}/></button>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Reproduciendo</p>
              </div>
              <button className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center"><MoreVertical size={20}/></button>
            </header>
            
            <div className="flex-1 flex flex-col items-center justify-center px-10">
              <img src={currentSong.coverUrl} className="w-full aspect-square rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/5 mb-16" />
              <div className="w-full mb-10 flex items-center justify-between">
                <div className="overflow-hidden">
                  <h1 className="text-3xl font-black truncate mb-1">{currentSong.title}</h1>
                  <p className="text-lg text-zinc-500 font-bold truncate uppercase">{currentSong.artist}</p>
                </div>
                <button onClick={() => toggleFavorite(currentSong)} className={favorites.some(f => f.id === currentSong.id) ? "text-purple-500" : "text-zinc-700"}>
                  <Heart fill={favorites.some(f => f.id === currentSong.id) ? "currentColor" : "none"} size={32}/>
                </button>
              </div>
              
              <div className="w-full mb-12">
                <div className="h-1 bg-white/10 rounded-full w-full mb-4 overflow-hidden">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${(currentTime/(currentSong.duration || 1))*100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-black">
                  <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                  <span>{Math.floor(currentSong.duration / 60)}:{Math.floor(currentSong.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
              
              <div className="w-full flex justify-between items-center mb-10">
                <Shuffle className="text-zinc-700" size={24} />
                <SkipBack fill="white" size={40} />
                <button onClick={togglePlay} className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all">
                  {isPlaying ? <Pause fill="currentColor" size={36} /> : <Play fill="currentColor" className="ml-1" size={36} />}
                </button>
                <SkipForward fill="white" size={40} />
                <Repeat className="text-zinc-700" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// BUSQUEDA PREDICTIVA (MEJORADA)
const SearchView: React.FC<{ onSelectSong: (s: Song) => void; currentSong: Song; isPlaying: boolean; showToast: (msg: string, type: 'success' | 'error' | 'info') => void; onSelectGenre: (p: Playlist) => void; }> = ({ onSelectSong, currentSong, isPlaying, showToast, onSelectGenre }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]); // Estado para sugerencias

  // Efecto para filtrar sugerencias mientras escribes
  useEffect(() => {
    if (query.trim().length > 1) {
      const matches = POPULAR_ARTISTS.filter(artist => 
        artist.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5); // Max 5 sugerencias
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const executeSearch = async (term: string) => {
    setLoading(true); setResults([]); setSuggestions([]); setQuery(term);
    try {
      const response = await resilientFetch(`${BACKEND_URL}/buscar?q=${encodeURIComponent(term)}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setResults(data.map((item: any, index: number) => ({
        id: item.id || `search-${index}`,
        title: item.titulo || item.title || 'Desconocido',
        artist: item.artista || item.artist || 'Desconocido',
        coverUrl: item.foto || item.image || item.thumbnail || 'https://picsum.photos/300',
        audioUrl: item.audioUrl || item.audio ? ( (item.audioUrl || item.audio).startsWith('http') ? (item.audioUrl || item.audio) : `${BACKEND_URL}/${(item.audioUrl || item.audio).replace(/^\//, '')}` ) : undefined,
        duration: 0
      })));
    } catch (err) { showToast("Error al buscar", 'error'); }
    finally { setLoading(false); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault(); if (!query.trim()) return;
    executeSearch(query.trim());
  };

  return (
    <div className="p-6 pt-16 flex-1 overflow-y-auto hide-scrollbar">
      <h1 className="text-4xl font-black mb-8 tracking-tighter">Buscar</h1>
      <form onSubmit={handleSearch} className="relative mb-10">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Artistas o canciones" 
          className="w-full bg-white/10 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all placeholder:text-zinc-600" 
        />
        {/* LISTA DE SUGERENCIAS PREDICTIVAS */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
            {suggestions.map((suggestion, idx) => (
              <div 
                key={idx} 
                onClick={() => executeSearch(suggestion)}
                className="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center gap-3"
              >
                <SearchIcon size={14} className="text-zinc-500" />
                <span className="text-sm font-bold text-white">{suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </form>
      
      {loading ? <div className="flex flex-col gap-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />)}</div> :
        results.length > 0 ? (
          <div className="flex flex-col gap-3">
            {results.map(s => (
              <div key={s.id} onClick={() => onSelectSong(s)} className={`flex items-center gap-4 p-2 rounded-2xl ${currentSong.id === s.id ? 'bg-purple-600/10' : 'hover:bg-white/5'}`}>
                <img src={s.coverUrl} className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold truncate text-sm">{s.title}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">{s.artist}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {GENRES.map(g => (
              <div key={g.name} onClick={() => onSelectGenre({ id: g.name, name: g.name, imageUrl: g.imageUrl, type: 'playlist' })} className={`${g.color} aspect-video rounded-3xl p-4 relative overflow-hidden group cursor-pointer active:scale-95 transition-all shadow-xl`}>
                <span className="text-sm font-black relative z-10">{g.name}</span>
                <img src={g.imageUrl} className="absolute w-20 h-20 -bottom-2 -right-2 opacity-50 rotate-12 group-hover:scale-125 transition-transform" />
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
};