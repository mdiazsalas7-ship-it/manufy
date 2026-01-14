
export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number; // in seconds
  audioUrl?: string; // URL for actual music playback
}

export interface Playlist {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  type: 'playlist' | 'artist' | 'album';
}

export interface GenreCard {
  name: string;
  color: string;
  imageUrl: string;
}

export type View = 'home' | 'search' | 'library' | 'ai';
