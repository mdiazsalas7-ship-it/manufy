
import { get, set, del, createStore } from 'idb-keyval';

const customStore = createStore('ManufyOfflineDB', 'audio_files');

export const saveAudioBlob = async (id: string, blob: Blob): Promise<void> => {
  return set(id, blob, customStore);
};

export const getAudioBlob = async (id: string): Promise<Blob | null> => {
  const data = await get(id, customStore);
  return (data as Blob) || null;
};

export const deleteAudioBlob = async (id: string): Promise<void> => {
  return del(id, customStore);
};
