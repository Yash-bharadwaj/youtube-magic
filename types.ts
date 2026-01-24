
export enum AppState {
  LOGIN = 'LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  WELCOME = 'WELCOME',
  CALIBRATING = 'CALIBRATING',
  MUTE_CHECK = 'MUTE_CHECK',
  NOTES = 'NOTES',
  PROCESSING = 'PROCESSING',
  WAITING_FOR_FLIP = 'WAITING_FOR_FLIP',
  REVEAL = 'REVEAL'
}

export type DeviceOS = 'ios' | 'android' | 'desktop';
export type UserRole = 'PERFORMER' | 'ADMIN';

export interface PerformerUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  slug: string;
  role?: UserRole;
  lastLogin?: any;
}

export interface RoomState {
  status: 'idle' | 'armed' | 'revealed';
  videoId: string | null;
  startAt: number;
  updatedAt: any;
}

export interface SongData {
  title: string;
  youtubeId: string;
}
