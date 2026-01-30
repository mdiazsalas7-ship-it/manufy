import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Home as HomeIcon, 
  Search as SearchIcon, 
  Library as LibraryIcon, 
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
  ExternalLink,
  Mic,
  Share2,
  TrendingUp,
  X,
  Plus,       
  ListPlus,   
  Trash2,
  FolderPlus,
  Smartphone,
  HardDrive
} from 'lucide-react';
import { View, Song, Playlist } from './types';
import { GENRES, INITIAL_SONG } from './constants';
import { saveAudioBlob, getAudioBlob, deleteAudioBlob } from './db';

// --- 🚀 CONEXIÓN CON TU SERVIDOR (LINK NUEVO) ---
const BACKEND_URL = 'https://aluminum-directories-ultram-molecular.trycloudflare.com'.replace(/\/$/, '');
const TUNNEL_HEADERS = { 'Cloudflare-Skip-Browser-Warning': 'true' };
const LOGO_URL = 'https://i.postimg.cc/05wxzk5G/unnamed.jpg';
const BACKGROUND_IMAGE = 'https://i.postimg.cc/P5k7rD2R/unnamed.jpg';

// --- PORTADAS DE RESPALDO ---
const ALBUM_COVERS = [
  'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80',
  'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300&q=80',
  'https://images.unsplash.com/photo-1621621667797-e06afc210af0?w=300&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
  'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=300&q=80',
];

// --- FOTOS DE INICIO (Home) ---
const STATIC_TRENDS: Playlist[] = [
  { id: 'st-1', name: 'Global Top 50', description: 'Lo más sonado', imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80', type: 'playlist' },
  { id: 'st-2', name: 'Reggaetón Viejito', description: 'Clásicos', imageUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80', type: 'playlist' },
  { id: 'st-3', name: 'Viral TikTok', description: 'Tendencias', imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&q=80', type: 'playlist' },
  { id: 'st-4', name: 'Gym Motivation', description: 'Energía pura', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', type: 'playlist' },
];

const GENRES_DATA = [
  { name: 'Urbano Latino', color: 'bg-purple-600', imageUrl: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&q=80' },
  { name: 'Pop Internacional', color: 'bg-pink-600', imageUrl: 'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?w=800&q=80' },
  { name: 'Rock & Metal', color: 'bg-red-600', imageUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&q=80' },
  { name: 'Salsa & Tropical', color: 'bg-orange-600', imageUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&q=80' },
  { name: 'Hip-Hop / Rap', color: 'bg-zinc-600', imageUrl: 'https://images.unsplash.com/photo-1508973379184-7517410fb0bc?w=800&q=80' },
  { name: 'Electrónica', color: 'bg-blue-600', imageUrl: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&q=80' },
];

const POPULAR_ARTISTS = [
  "Bad Bunny", "Taylor Swift", "The Weeknd", "Drake", "Peso Pluma", 
  "Karol G", "Feid", "Kendrick Lamar", "Ariana Grande", "Harry Styles",
  "Shakira", "Rosalía", "Rauw Alejandro", "Myke Towers", "Eladio Carrión",
  "Duki", "Quevedo", "Anuel AA", "J Balvin", "Maluma", "Ozuna", "Mora"
];

const ENV_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const AI_MODEL = "openai/gpt-4o-mini";

// --- IA MEJORADA ---
async function callAI(messages: any[]) {
  if (!ENV_KEY) return null;
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${ENV_KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://stackblitz.com", "X-Title": "Manufy" },
      body: JSON.stringify({ model: AI_MODEL, messages: messages, temperature: 0.9 }) 
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "[]";
  } catch (e) { return null; }
}

async function fetchAlbumCover(songTitle: string, artistName: string): Promise<string> {
  try {
    const query = encodeURIComponent(`${songTitle} ${artistName}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
    }
  } catch (e) {}
  return '';
}

const cleanAiResponse = (text: string) => { try { return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim()); } catch (e) { return []; } };
const getCachedData = (key: string) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > 3600000) return null; 
  return data;
};
const setCachedData = (key: string, data: any) => { localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() })); };
const urlCache = new Map<string, string>();

async function resilientFetch(url: string, options: RequestInit = {}, timeout = 20000) { 
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const headers: Record<string, string> = { ...TUNNEL_HEADERS, ...(options.headers as Record<string, string> || {}) };
  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) { clearTimeout(id); throw err; }
}

const FALLBACK_SONGS: Record<string, {title: string, artist: string}[]> = {
  'Global Top 50': [{ title: 'Monaco', artist: 'Bad Bunny' }, { title: 'Greedy', artist: 'Tate McRae' }],
  'Reggaetón Viejito': [{ title: 'Gasolina', artist: 'Daddy Yankee' }, { title: 'Dile', artist: 'Don Omar' }],
  'Viral TikTok': [{ title: 'Beautiful Things', artist: 'Benson Boone' }]
};

const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300 max-w-[90vw]">
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
  onSelectSong: (s: Song, context?: Song[]) => void;
  currentSong: Song;
  isPlaying: boolean;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  userSongs?: Song[]; 
  onDelete?: () => void; 
}> = ({ playlist, onBack, onSelectSong, currentSong, isPlaying, showToast, userSongs, onDelete }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const headerImage = userSongs && userSongs.length > 0 && userSongs[0].coverUrl ? userSongs[0].coverUrl : playlist.imageUrl;

  useEffect(() => {
    if (userSongs) { setSongs(userSongs); setLoading(false); return; }

    const fetchSongs = async () => {
      setLoading(true);
      const cacheKey = `playlist_meta_v18_${playlist.name}`;
      const cached = getCachedData(cacheKey);
      let metaSongs: any[] = [];
      if (cached) { setSongs(cached); setLoading(false); return; }

      metaSongs = FALLBACK_SONGS[playlist.name] || FALLBACK_SONGS['Global Top 50'] || [];
      
      if (ENV_KEY) {
        const randomArtist = POPULAR_ARTISTS[Math.floor(Math.random() * POPULAR_ARTISTS.length)];
        const aiResponse = await callAI([
          { role: "system", content: "Eres un DJ experto y variado. Responde SOLO un JSON array válido." },
          { role: "user", content: `Genera 12 canciones para la playlist "${playlist.name}". 
            IMPORTANTE: Que sean tendencias actuales pero INCLUYE AL MENOS 2 CANCIONES estilo "${randomArtist}".
            NO REPITAS siempre las mismas canciones top 10. Mezcla hits masivos con virales nuevos.
            Formato JSON: [{"title": "Nombre", "artist": "Artista"}].` }
        ]);
        if (aiResponse) {
          const aiData = cleanAiResponse(aiResponse);
          if (aiData.length > 0) metaSongs = aiData;
        }
      }

      const displaySongs = await Promise.all(metaSongs.map(async (s, i) => {
        let cover = '';
        if (s.title && s.artist) cover = await fetchAlbumCover(s.title, s.artist);
        if (!cover) cover = ALBUM_COVERS[i % ALBUM_COVERS.length];
        return { id: `pl-${playlist.id}-${i}-${s.title}`, title: s.title, artist: s.artist, coverUrl: cover, audioUrl: undefined, duration: 0 };
      }));
      setSongs(displaySongs);
      setCachedData(cacheKey, displaySongs);
      setLoading(false);
    };
    fetchSongs();
  }, [playlist.name, userSongs]);

  return (
    <div className="absolute inset-0 bg-black/90 z-[70] flex flex-col animate-in slide-in-from-right duration-500 overflow-y-auto hide-scrollbar">
      <div className="relative h-80 flex-shrink-0">
        <img src={headerImage} className="w-full h-full object-cover blur-sm opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <button onClick={onBack} className="absolute top-12 left-6 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10"><ArrowLeft size={24} /></button>
        {onDelete && <button onClick={onDelete} className="absolute top-12 right-6 w-10 h-10 bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-red-500/50 text-red-500"><Trash2 size={20} /></button>}
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-4xl font-black tracking-tighter mb-2">{playlist.name}</h1>
          <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">{userSongs ? "Mi Playlist" : "Powered by AI"}</p>
        </div>
      </div>
      <div className="p-6 flex-1 bg-black/80 backdrop-blur-xl rounded-t-[40px] -mt-10 relative z-10 border-t border-white/5">
        <div className="flex justify-between items-center mb-8">
           <button onClick={() => songs.length > 0 && onSelectSong(songs[0], songs)} className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"><Play fill="white" size={28} className="ml-1" /></button>
           <div className="flex gap-4 text-zinc-500 items-center"><Shuffle size={20} /><Download size={20} /></div>
        </div>
        {loading ? <div className="space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="flex gap-4 items-center animate-pulse"><div className="w-12 h-12 bg-zinc-900 rounded-lg" /><div className="flex-1 space-y-2"><div className="h-4 bg-zinc-900 rounded w-3/4" /><div className="h-3 bg-zinc-900 rounded w-1/2" /></div></div>)}</div> : (
          <div className="flex flex-col gap-4 pb-32">
            {songs.length === 0 ? <div className="text-center text-zinc-500 py-10 opacity-50">Lista vacía.<br/>Agrega canciones desde el reproductor.</div> : 
            songs.map((song, i) => (
              <div key={song.id} onClick={() => onSelectSong(song, songs)} className={`flex items-center gap-4 group cursor-pointer p-2 rounded-xl transition-all ${currentSong.id === song.id ? 'bg-purple-600/10' : 'hover:bg-white/5'}`}>
                <span className="text-zinc-700 font-black text-xs w-4">{i + 1}</span>
                <img src={song.coverUrl || ALBUM_COVERS[0]} className="w-12 h-12 rounded-lg object-cover shadow-md" />
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
  const [queue, setQueue] = useState<Song[]>([]);
  const [songLoading, setSongLoading] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [playlistSongs, setPlaylistSongs] = useState<Record<string, Song[]>>({});
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [aiPlaylists, setAiPlaylists] = useState<Playlist[]>(STATIC_TRENDS);
  const [playbackUrl, setPlaybackUrl] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [librarySubView, setLibrarySubView] = useState<'main' | 'likes' | 'playlist'>('main');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  
  // --- AJUSTES ---
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuality, setSearchQuality] = useState<'low' | 'high'>('low');

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedQuality = localStorage.getItem('manufy_quality') as 'low' | 'high';
    if (savedQuality) setSearchQuality(savedQuality);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallButton(false);
    setDeferredPrompt(null);
  };

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  }, []);

  const handleCloseToast = useCallback(() => { setToast(null); }, []);

  const toggleQuality = () => {
    const newQuality = searchQuality === 'low' ? 'high' : 'low';
    setSearchQuality(newQuality);
    localStorage.setItem('manufy_quality', newQuality);
    showToast(`Calidad: ${newQuality === 'high' ? 'Alta (Audio Oficial)' : 'Rápida (Ahorro Datos)'}`, 'info');
  };

  const clearHistory = () => {
    setHistory([]);
    showToast('Historial borrado', 'success');
  };

  const clearDownloads = async () => {
    showToast('Liberando espacio...', 'info');
    try {
      for (const song of favorites) { await deleteAudioBlob(song.id); }
      showToast('Espacio liberado', 'success');
    } catch (e) { showToast('Error al liberar espacio', 'error'); }
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const newPl: Playlist = {
      id: `user-pl-${Date.now()}`,
      name: newPlaylistName,
      description: 'Mi lista',
      imageUrl: ALBUM_COVERS[Math.floor(Math.random() * ALBUM_COVERS.length)],
      type: 'playlist'
    };
    setUserPlaylists(prev => [...prev, newPl]);
    setPlaylistSongs(prev => ({ ...prev, [newPl.id]: [] }));
    setNewPlaylistName('');
    setShowCreatePlaylist(false);
    showToast('Playlist creada', 'success');
  };

  const deletePlaylist = (id: string) => {
    setUserPlaylists(prev => prev.filter(p => p.id !== id));
    const newSongs = { ...playlistSongs };
    delete newSongs[id];
    setPlaylistSongs(newSongs);
    setSelectedPlaylist(null);
    setLibrarySubView('main');
    showToast('Playlist eliminada', 'info');
  };

  const resolveSongAudio = async (song: Song): Promise<string | undefined> => {
    try {
      const offlineBlob = await getAudioBlob(song.id);
      if (offlineBlob) return URL.createObjectURL(offlineBlob);
    } catch (e) {}

    if (urlCache.has(song.id)) return urlCache.get(song.id);
    if (song.audioUrl && song.audioUrl.startsWith('http')) return song.audioUrl; 

    try {
      // --- BÚSQUEDA DINÁMICA ---
      const qualityTerm = searchQuality === 'high' ? 'official audio' : 'lyric video';
      const query = encodeURIComponent(`${song.title} ${song.artist} ${qualityTerm}`);
      
      const res = await resilientFetch(`${BACKEND_URL}/buscar?q=${query}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const finalUrl = item.audioUrl || item.audio ? ((item.audioUrl || item.audio).startsWith('http') ? (item.audioUrl || item.audio) : `${BACKEND_URL}/${(item.audioUrl || item.audio).replace(/^\//, '')}`) : undefined;
          if (finalUrl) { urlCache.set(song.id, finalUrl); return finalUrl; }
        }
      }
    } catch (e) {}
    return undefined;
  };

  const addToPlaylist = async (playlistId: string) => {
    if (!currentSong) return;
    const targetPlaylist = userPlaylists.find(p => p.id === playlistId);
    setPlaylistSongs(prev => {
      const current = prev[playlistId] || [];
      if (current.some(s => s.id === currentSong.id)) return prev;
      return { ...prev, [playlistId]: [...current, currentSong] };
    });
    setShowAddToPlaylist(false);
    showToast(`Descargando para "${targetPlaylist?.name}"...`, 'info');
    const url = await resolveSongAudio(currentSong);
    if (url) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          await saveAudioBlob(currentSong.id, blob);
          showToast(`¡Guardada en "${targetPlaylist?.name}"! 💾`, 'success');
        } else { showToast("Error de red al descargar", 'error'); }
      } catch (e) { showToast("Error guardando audio", 'error'); }
    }
  };

  const preloadNextSong = async (currentId: string, currentQueue: Song[]) => {
    const idx = currentQueue.findIndex(s => s.id === currentId);
    if (idx !== -1 && idx < currentQueue.length - 1) {
      const nextSong = currentQueue[idx + 1];
      await resolveSongAudio(nextSong);
    }
  };

  const onSelectSong = async (song: Song, contextQueue?: Song[]) => {
    setCurrentSong(song);
    setIsPlaying(false);
    setSongLoading(true);
    if (contextQueue) setQueue(contextQueue);
    const activeQueue = contextQueue || queue;
    const url = await resolveSongAudio(song);
    if (url) {
      setPlaybackUrl(url);
      setCurrentSong(prev => ({ ...prev, audioUrl: url }));
      setIsPlaying(true);
      setHistory(prev => [song, ...prev.filter(s => s.id !== song.id)].slice(0, 15));
      setSongLoading(false);
      preloadNextSong(song.id, activeQueue);
    } else {
      showToast("Error de conexión.", 'error');
      setSongLoading(false);
    }
  };

  useEffect(() => {
    if (!audioRef.current || !playbackUrl) return;
    if (isPlaying) { audioRef.current.play().catch(() => setIsPlaying(false)); } else { audioRef.current.pause(); }
  }, [isPlaying, playbackUrl]);

  const playNext = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) { onSelectSong(queue[currentIndex + 1]); }
    else if (queue.length > 0) { onSelectSong(queue[0]); }
  }, [queue, currentSong.id]);

  const playPrevious = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentTime > 3) { if (audioRef.current) audioRef.current.currentTime = 0; return; }
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    if (currentIndex > 0) { onSelectSong(queue[currentIndex - 1]); }
  }, [queue, currentSong.id, currentTime]);

  const handleSongEnd = () => { playNext(); };

  useEffect(() => {
    const savedFavs = localStorage.getItem('manufy_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    const savedPlaylists = localStorage.getItem('manufy_user_playlists');
    if (savedPlaylists) setUserPlaylists(JSON.parse(savedPlaylists));
    const savedSongs = localStorage.getItem('manufy_playlist_songs');
    if (savedSongs) setPlaylistSongs(JSON.parse(savedSongs));
    loadBackgroundData();
  }, []);

  const loadBackgroundData = async () => {
    if (!ENV_KEY) return;
    const cachedTrends = getCachedData('trends_home_v12');
    if (!cachedTrends) { setAiPlaylists(STATIC_TRENDS); setCachedData('trends_home_v12', STATIC_TRENDS); } else { setAiPlaylists(cachedTrends); }
  };

  useEffect(() => { localStorage.setItem('manufy_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('manufy_user_playlists', JSON.stringify(userPlaylists)); }, [userPlaylists]);
  useEffect(() => { localStorage.setItem('manufy_playlist_songs', JSON.stringify(playlistSongs)); }, [playlistSongs]);

  const togglePlay = () => { if (currentSong.id !== 'current') setIsPlaying(!isPlaying); };
  
  const shuffleFavorites = () => {
    if (favorites.length === 0) { showToast("Agrega favoritos primero", "info"); return; }
    const shuffled = [...favorites].sort(() => Math.random() - 0.5);
    onSelectSong(shuffled[0], shuffled);
  };

  const toggleFavorite = async (song: Song) => {
    const isFav = favorites.some(f => f.id === song.id);
    if (isFav) {
      setFavorites(prev => prev.filter(f => f.id !== song.id));
      await deleteAudioBlob(song.id);
      showToast("Eliminada de favoritos", 'success');
    } else {
      setFavorites(prev => [...prev, song]);
      showToast("Descargando...", "info");
      resolveSongAudio(song).then(async (url) => {
        if (url) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              const blob = await response.blob();
              await saveAudioBlob(song.id, blob);
              showToast("¡Descargada! 💾", "success");
            } else { showToast("Error de red", "error"); }
          } catch (e) { showToast("Guardada solo lista", "info"); }
        } else { showToast("Error audio", "error"); }
      });
    }
  };

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden select-none font-sans">
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }} />
      <div className="fixed inset-0 z-0 bg-black/75 backdrop-blur-[2px]" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={handleCloseToast} />}

      <audio ref={audioRef} src={playbackUrl} onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)} onLoadedMetadata={() => audioRef.current && setCurrentSong(s => ({ ...s, duration: audioRef.current?.duration || 0 }))} onEnded={handleSongEnd} />

      {selectedPlaylist && <PlaylistDetail playlist={selectedPlaylist} onBack={() => { setSelectedPlaylist(null); setLibrarySubView('main'); }} onSelectSong={onSelectSong} currentSong={currentSong} isPlaying={isPlaying} showToast={showToast} userSongs={selectedPlaylist.id.startsWith('user-pl') ? playlistSongs[selectedPlaylist.id] : undefined} onDelete={selectedPlaylist.id.startsWith('user-pl') ? () => deletePlaylist(selectedPlaylist.id) : undefined} />}

      {/* MODAL AJUSTES (NUEVO) */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Ajustes</h3>
              <button onClick={() => setShowSettings(false)}><X size={24} className="text-zinc-400"/></button>
            </div>
            <div className="mb-6">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-3">Calidad de Búsqueda</p>
              <button onClick={toggleQuality} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  {searchQuality === 'high' ? <Wifi size={20} className="text-purple-500"/> : <WifiOff size={20} className="text-green-500"/>}
                  <div className="text-left"><p className="font-bold text-sm">{searchQuality === 'high' ? 'Alta Calidad' : 'Modo Rápido'}</p><p className="text-[10px] text-zinc-400">{searchQuality === 'high' ? 'Audio Oficial' : 'Lyric Video (Ahorro)'}</p></div>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${searchQuality === 'high' ? 'bg-purple-600' : 'bg-zinc-600'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${searchQuality === 'high' ? 'left-6' : 'left-1'}`}/></div>
              </button>
            </div>
            <div className="mb-6"><p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-3">Almacenamiento</p><button onClick={clearDownloads} className="w-full flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 text-red-400 hover:bg-white/10"><Trash2 size={20} /><span className="font-bold text-sm">Eliminar descargas</span></button></div>
            <div><p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-3">Privacidad</p><button onClick={clearHistory} className="w-full flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10"><SearchX size={20} /><span className="font-bold text-sm">Borrar Historial</span></button></div>
          </div>
        </div>
      )}

      {showAddToPlaylist && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm border border-white/10 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Agregar a...</h3><button onClick={() => setShowAddToPlaylist(false)}><X size={24} className="text-zinc-400"/></button></div>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setShowAddToPlaylist(false); setShowCreatePlaylist(true); }} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10"><div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center"><Plus size={20}/></div><span className="font-bold">Nueva Playlist</span></button>
              <div className="h-px bg-white/10 my-1"/>
              {userPlaylists.map(p => { const songsInThisPlaylist = playlistSongs[p.id] || []; const playlistImage = songsInThisPlaylist.length > 0 && songsInThisPlaylist[0].coverUrl ? songsInThisPlaylist[0].coverUrl : p.imageUrl; return (<button key={p.id} onClick={() => addToPlaylist(p.id)} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl"><img src={playlistImage} className="w-10 h-10 rounded-lg object-cover" /><span className="font-bold truncate">{p.name}</span></button>)})}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 h-full flex flex-col">
        {activeView === 'home' && (
          <div className="p-6 pt-16 flex-1 overflow-y-auto hide-scrollbar">
            <header className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <img src={LOGO_URL} className="w-12 h-12 rounded-full border border-white/20 shadow-2xl" alt="Logo" />
                <div><h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Manufy</h1><span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Music Hub</span></div>
              </div>
              <div className="flex gap-4 text-zinc-400">
                {showInstallButton && <button onClick={handleInstallClick} className="animate-pulse text-purple-400"><Smartphone size={24}/></button>}
                <Bell size={20}/><Settings size={20} onClick={() => setShowSettings(true)} className="cursor-pointer hover:text-white transition-colors"/>
              </div>
            </header>
            <div className="grid grid-cols-2 gap-3 mb-12">
              {aiPlaylists.slice(0, 4).map(p => (<div key={p.id} onClick={() => setSelectedPlaylist(p)} className="bg-white/5 backdrop-blur-md rounded-xl flex items-center gap-3 h-16 overflow-hidden border border-white/5 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"><img src={p.imageUrl} className="h-full aspect-square object-cover" /><span className="text-[10px] font-black uppercase tracking-tighter leading-tight pr-2">{p.name}</span></div>))}
            </div>
            <h2 className="text-2xl font-black mb-6 px-1 tracking-tighter">Tu actividad reciente</h2>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-8 px-1">{history.length > 0 ? history.map(s => (<div key={s.id} onClick={() => onSelectSong(s, history)} className="min-w-[160px] group cursor-pointer"><div className="relative aspect-square mb-3 overflow-hidden rounded-[24px] shadow-2xl"><img src={s.coverUrl} className="w-full h-full object-cover" /></div><h3 className="text-sm font-black truncate">{s.title}</h3></div>)) : <div className="text-zinc-600 text-xs font-bold uppercase tracking-widest py-10 px-4 border-2 border-dashed border-white/5 rounded-3xl w-full text-center">Sin actividad reciente</div>}</div>
          </div>
        )}

        {activeView === 'search' && <SearchView onSelectSong={onSelectSong} currentSong={currentSong} isPlaying={isPlaying} showToast={showToast} onSelectGenre={setSelectedPlaylist} />}

        {activeView === 'library' && (
          <div className="p-6 pt-16 flex-1 overflow-y-auto hide-scrollbar">
            {librarySubView === 'main' ? (
              <>
                <h1 className="text-4xl font-black mb-10 tracking-tighter">Tu Biblioteca</h1>
                <button onClick={() => setShowCreatePlaylist(true)} className="w-full bg-white/10 border border-white/5 p-4 rounded-2xl flex items-center gap-4 mb-8 hover:bg-white/20 active:scale-95 transition-all"><div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black"><Plus size={24}/></div><span className="font-bold text-lg">Crear Playlist</span></button>
                <div className="flex flex-col gap-4 pb-32">
                  <div onClick={() => setLibrarySubView('likes')} className="bg-gradient-to-br from-purple-900 to-black p-4 rounded-[24px] border border-white/10 flex items-center gap-4 cursor-pointer active:scale-95 transition-all"><div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg"><Heart fill="white" size={24} /></div><div><h3 className="text-lg font-bold">Tus Me Gusta</h3><p className="text-xs text-zinc-400 font-bold uppercase">{favorites.length} Canciones</p></div></div>
                  {userPlaylists.map(pl => { const songsInThisPlaylist = playlistSongs[pl.id] || []; const playlistImage = songsInThisPlaylist.length > 0 && songsInThisPlaylist[0].coverUrl ? songsInThisPlaylist[0].coverUrl : pl.imageUrl; return (<div key={pl.id} onClick={() => setSelectedPlaylist(pl)} className="bg-white/5 p-4 rounded-[24px] border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/10 active:scale-95 transition-all"><img src={playlistImage} className="w-14 h-14 rounded-xl object-cover" /><div><h3 className="text-lg font-bold">{pl.name}</h3><p className="text-xs text-zinc-400 font-bold uppercase">{songsInThisPlaylist.length || 0} Canciones</p></div></div>)})}
                </div>
              </>
            ) : librarySubView === 'likes' ? (
              <div className="animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between mb-8"><button onClick={() => setLibrarySubView('main')} className="flex items-center gap-2 text-zinc-400"><ArrowLeft size={20}/> Volver</button><button onClick={shuffleFavorites} className="bg-purple-600/20 text-purple-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-purple-500/20 hover:bg-purple-600 hover:text-white transition-all"><Shuffle size={14} /> Aleatorio</button></div>
                <h1 className="text-4xl font-black mb-8 tracking-tighter">Me gusta</h1>
                <div className="flex flex-col gap-4 pb-32">{favorites.length === 0 ? <div className="text-zinc-500 text-center py-20">Aún no tienes canciones favoritas</div> : favorites.map(f => (<div key={f.id} onClick={() => onSelectSong(f, favorites)} className={`flex items-center gap-4 p-2 rounded-2xl ${currentSong.id === f.id ? 'bg-purple-600/10' : 'hover:bg-white/5'} cursor-pointer`}><img src={f.coverUrl} className="w-14 h-14 rounded-xl object-cover" /><div className="flex-1 overflow-hidden"><h3 className="font-bold truncate text-sm">{f.title}</h3><p className="text-[10px] text-zinc-500 font-bold uppercase">{f.artist}</p></div>{currentSong.id === f.id && isPlaying && <MusicEqualizer />}<Heart size={18} fill="#a855f7" className="text-purple-500" /></div>))}</div>
              </div>
            ) : null}
          </div>
        )}

        {!isFullPlayerOpen && currentSong.id !== 'current' && (
          <div onClick={() => setIsFullPlayerOpen(true)} className="fixed bottom-24 left-2 right-2 z-50 bg-zinc-900/95 backdrop-blur-2xl rounded-2xl p-2.5 flex items-center justify-between border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-slide-up cursor-pointer">
            <div className="flex items-center gap-3 overflow-hidden pl-1"><img src={currentSong.coverUrl} className="w-11 h-11 rounded-xl object-cover shadow-lg" /><div className="truncate"><p className="text-xs font-black truncate">{currentSong.title}</p><p className="text-[10px] text-zinc-500 font-bold uppercase truncate">{currentSong.artist}</p></div></div>
            <div className="flex items-center gap-2 px-1"><button onClick={(e) => { e.stopPropagation(); toggleFavorite(currentSong); }} className={favorites.some(f => f.id === currentSong.id) ? 'text-purple-500' : 'text-zinc-500'}><Heart size={20} fill={favorites.some(f => f.id === currentSong.id) ? "currentColor" : "none"} /></button>{songLoading ? <Loader2 className="animate-spin text-white" size={24}/> : <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-9 h-9 bg-white text-black rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all">{isPlaying ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor" className="ml-1"/>}</button>}<button onClick={playNext} className="text-zinc-300 hover:text-white active:scale-90 transition-all"><SkipForward size={24} fill="currentColor" /></button></div>
          </div>
        )}

        <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-3xl border-t border-white/5 pb-8 pt-4 px-8 flex justify-between items-center z-[80]">
          {[{ id: 'home', icon: HomeIcon, label: 'Inicio' }, { id: 'search', icon: SearchIcon, label: 'Buscar' }, { id: 'library', icon: LibraryIcon, label: 'Biblioteca' }].map(item => (<button key={item.id} onClick={() => { setActiveView(item.id as View); setSelectedPlaylist(null); }} className={`flex flex-col items-center gap-1 transition-all ${activeView === item.id ? 'text-white scale-110' : 'text-zinc-600'}`}><item.icon size={22} strokeWidth={activeView === item.id ? 3 : 2} /><span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span></button>))}
        </nav>
      </div>

      {isFullPlayerOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in slide-in-from-bottom duration-500">
          <div className="fixed inset-0 z-0"><img src={currentSong.coverUrl} className="w-full h-full object-cover blur-[100px] opacity-30 scale-150" /></div>
          <div className="relative z-10 flex flex-col h-full">
            <header className="p-6 flex justify-between items-center"><button onClick={() => setIsFullPlayerOpen(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center"><ChevronDown size={28}/></button><div className="text-center"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Reproduciendo</p></div><button className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center"><MoreVertical size={20}/></button></header>
            <div className="flex-1 flex flex-col items-center justify-center px-10">
              <img src={currentSong.coverUrl} className="w-full aspect-square rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/5 mb-16" />
              <div className="w-full mb-10 flex items-center justify-between">
                <div className="overflow-hidden"><h1 className="text-3xl font-black truncate mb-1">{currentSong.title}</h1><p className="text-lg text-zinc-500 font-bold truncate uppercase">{currentSong.artist}</p></div>
                <div className="flex gap-4"><button onClick={() => setShowAddToPlaylist(true)} className="text-zinc-400 hover:text-white transition-colors"><FolderPlus size={28}/></button><button onClick={() => toggleFavorite(currentSong)} className={favorites.some(f => f.id === currentSong.id) ? "text-purple-500" : "text-zinc-700"}><Heart fill={favorites.some(f => f.id === currentSong.id) ? "currentColor" : "none"} size={32}/></button></div>
              </div>
              <div className="w-full mb-12"><div className="h-1 bg-white/10 rounded-full w-full mb-4 overflow-hidden"><div className="h-full bg-white transition-all duration-300" style={{ width: `${(currentTime/(currentSong.duration || 1))*100}%` }} /></div><div className="flex justify-between text-[10px] text-zinc-500 font-black"><span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span><span>{Math.floor(currentSong.duration / 60)}:{Math.floor(currentSong.duration % 60).toString().padStart(2, '0')}</span></div></div>
              <div className="w-full flex justify-between items-center mb-10"><Shuffle className="text-zinc-700" size={24} /><SkipBack onClick={playPrevious} fill="white" size={40} className="cursor-pointer active:scale-90 transition-transform" />{songLoading ? <Loader2 className="animate-spin text-white" size={48}/> : <button onClick={togglePlay} className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all">{isPlaying ? <Pause fill="currentColor" size={36} /> : <Play fill="currentColor" className="ml-1" size={36} />}</button>}<SkipForward onClick={playNext} fill="white" size={40} className="cursor-pointer active:scale-90 transition-transform" /><Repeat className="text-zinc-700" size={24} /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SearchView: React.FC<{ onSelectSong: (s: Song, context?: Song[]) => void; currentSong: Song; isPlaying: boolean; showToast: (msg: string, type: 'success' | 'error' | 'info') => void; onSelectGenre: (p: Playlist) => void; }> = ({ onSelectSong, currentSong, isPlaying, showToast, onSelectGenre }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (query.trim().length > 1) {
      const matches = POPULAR_ARTISTS.filter(artist => artist.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
      setSuggestions(matches);
    } else { setSuggestions([]); }
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
        audioUrl: item.audioUrl || item.audio ? ((item.audioUrl || item.audio).startsWith('http') ? (item.audioUrl || item.audio) : `${BACKEND_URL}/${(item.audioUrl || item.audio).replace(/^\//, '')}`) : undefined,
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
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Artistas o canciones" className="w-full bg-white/10 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all placeholder:text-zinc-600" />
        {suggestions.length > 0 && <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">{suggestions.map((s, i) => <div key={i} onClick={() => executeSearch(s)} className="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center gap-3"><SearchIcon size={14} className="text-zinc-500" /><span className="text-sm font-bold text-white">{s}</span></div>)}</div>}
      </form>
      {loading ? <div className="flex flex-col gap-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />)}</div> : results.length > 0 ? (
          <div className="flex flex-col gap-3">
            {results.map(s => (
              <div key={s.id} onClick={() => onSelectSong(s, results)} className={`flex items-center gap-4 p-2 rounded-2xl ${currentSong.id === s.id ? 'bg-purple-600/10' : 'hover:bg-white/5'}`}>
                <img src={s.coverUrl} className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 overflow-hidden"><p className="font-bold truncate text-sm">{s.title}</p><p className="text-[10px] text-zinc-500 font-bold uppercase">{s.artist}</p></div>
              </div>
            ))}
          </div>
        ) : <div className="grid grid-cols-2 gap-4">{GENRES_DATA.map(g => <div key={g.name} onClick={() => onSelectGenre({ id: g.name, name: g.name, imageUrl: g.imageUrl, type: 'playlist' })} className={`${g.color} aspect-video rounded-3xl p-4 relative overflow-hidden group cursor-pointer active:scale-95 transition-all shadow-xl`}><span className="text-sm font-black relative z-10">{g.name}</span><img src={g.imageUrl} className="absolute w-full h-full object-cover top-0 left-0 opacity-50 transition-transform group-hover:scale-110" /></div>)}</div>
      }
    </div>
  );
};