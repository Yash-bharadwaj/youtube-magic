import { 
  doc, 
  updateDoc, 
  onSnapshot, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { RoomState, PerformerUser } from '../types';

const ROOMS_COLLECTION = 'rooms';
const PERFORMERS_COLLECTION = 'performers';

// Room Operations
export const subscribeToRoom = (roomId: string, callback: (state: RoomState) => void) => {
  return onSnapshot(doc(db, ROOMS_COLLECTION, roomId), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as RoomState);
    }
  });
};

export const updateRoomStatus = async (roomId: string, status: RoomState['status']) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, { 
    status,
    updatedAt: serverTimestamp()
  });
};

export const setRoomVideo = async (roomId: string, videoId: string, startAt: number = 12) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, {
    videoId,
    startAt,
    status: 'armed',
    updatedAt: serverTimestamp()
  });
};

export const revealVideo = async (roomId: string) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, {
    status: 'revealed',
    updatedAt: serverTimestamp()
  });
};

export const resetRoom = async (roomId: string) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, {
    status: 'idle',
    videoId: null,
    updatedAt: serverTimestamp()
  });
};

// Performer Operations
export const getAllPerformers = async (): Promise<PerformerUser[]> => {
  const querySnapshot = await getDocs(collection(db, PERFORMERS_COLLECTION));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PerformerUser));
};

export const createPerformer = async (performer: PerformerUser) => {
  // Create performer
  await setDoc(doc(db, PERFORMERS_COLLECTION, performer.id), performer);
  
  // Also initialize their room
  const initialRoom: RoomState = {
    status: 'idle',
    videoId: null,
    startAt: 12,
    updatedAt: serverTimestamp()
  };
  await setDoc(doc(db, ROOMS_COLLECTION, performer.slug), initialRoom);
};

export const deletePerformer = async (id: string, slug: string) => {
  await deleteDoc(doc(db, PERFORMERS_COLLECTION, id));
  await deleteDoc(doc(db, ROOMS_COLLECTION, slug));
};
