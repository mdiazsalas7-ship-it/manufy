
import { Song, GenreCard } from './types';

export const GENRES: GenreCard[] = [
  { name: 'Pop Global', color: 'bg-pink-600', imageUrl: 'https://picsum.photos/seed/popc/150' },
  { name: 'Hip-Hop 2025', color: 'bg-orange-600', imageUrl: 'https://picsum.photos/seed/hiphopc/150' },
  { name: 'Reggaetón Hits', color: 'bg-blue-600', imageUrl: 'https://picsum.photos/seed/podc/150' },
  { name: 'Indie Rock', color: 'bg-emerald-600', imageUrl: 'https://picsum.photos/seed/newc/150' },
  { name: 'Top Latino', color: 'bg-indigo-600', imageUrl: 'https://picsum.photos/seed/foryc/150' },
  { name: 'Relax & Chill', color: 'bg-sky-600', imageUrl: 'https://picsum.photos/seed/relaxc/150' },
];

export const INITIAL_SONG: Song = {
  id: 'current',
  title: '¿Qué vas a escuchar?',
  artist: 'Selecciona una pista',
  coverUrl: 'https://picsum.photos/seed/manufy/600',
  duration: 0,
  audioUrl: undefined
};
