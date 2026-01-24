import React, { useState, useEffect } from 'react';
import { Search, Youtube, Play, RotateCcw, X, Music } from 'lucide-react';
import { setRoomVideo, revealVideo, resetRoom } from '../services/firestoreService';
import { DeviceOS } from '@/types';
import NotesInterface from './NotesInterface';

interface MagicianPanelProps {
  roomId: string;
  currentOs: DeviceOS;
  onOsChange: (os: DeviceOS) => void;
  onClose: () => void;
}

const MagicianPanel: React.FC<MagicianPanelProps> = ({ roomId, currentOs, onOsChange, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [showFakeNotes, setShowFakeNotes] = useState(false);
  const [notesType, setNotesType] = useState<DeviceOS>('ios');

  const searchAndSelect = async (query: string) => {
    setIsSearching(true);
    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query
        )}&type=video&maxResults=1&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.items && data.items[0]) {
        const videoId = data.items[0].id.videoId;
        // Start from 15s and reveal immediately
        await setRoomVideo(roomId, videoId, 15);
        await revealVideo(roomId);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNotesDone = async (text: string) => {
    setShowFakeNotes(false);
    if (text.trim()) {
      await searchAndSelect(text);
    }
  };

  const searchYouTube = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          searchQuery
        )}&type=video&maxResults=5&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.items) {
        const results = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.default.url,
        }));
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectVideo = async (video: any) => {
    setSelectedVideo(video);
    await setRoomVideo(roomId, video.id, 15);
    // After selecting manually, magician can still hit reveal
  };

  const handleReveal = async () => {
    await revealVideo(roomId);
  };

  const handleReset = async () => {
    await resetRoom(roomId);
    setSelectedVideo(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 text-white flex flex-col p-6 animate-in slide-in-from-bottom duration-500">
      {showFakeNotes ? (
        <NotesInterface os={notesType} onDone={handleNotesDone} />
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tighter uppercase">Controller</h2>
              <p className="text-[10px] text-white/40 tracking-[0.2em]">ACTIVE LINK: /{roomId}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <button 
              onClick={() => { setNotesType('ios'); setShowFakeNotes(true); }}
              className="py-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 hover:bg-white/10 transition-all"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-sm" />
              </div>
              <span className="text-[9px] font-bold tracking-widest uppercase">Apple Notes</span>
            </button>
            <button 
              onClick={() => { setNotesType('android'); setShowFakeNotes(true); }}
              className="py-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 hover:bg-white/10 transition-all"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-600 rounded-full" />
              </div>
              <span className="text-[9px] font-bold tracking-widest uppercase">Google Keep</span>
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchYouTube()}
                placeholder="Search for a song..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-white/30"
              />
            </div>
            <button 
              onClick={searchYouTube}
              disabled={isSearching}
              className="bg-white text-black px-6 rounded-xl font-bold text-xs"
            >
              {isSearching ? '...' : 'FIND'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mb-6">
            {searchResults.map((video) => (
              <button
                key={video.id}
                onClick={() => handleSelectVideo(video)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all ${
                  selectedVideo?.id === video.id ? 'bg-white/10 border-white/40' : 'bg-white/5 border-white/5'
                }`}
              >
                <img src={video.thumbnail} alt="" className="w-16 h-10 object-cover rounded" />
                <div className="text-left">
                  <p className="text-sm font-medium line-clamp-1">{video.title}</p>
                </div>
              </button>
            ))}
            {searchResults.length === 0 && !isSearching && (
              <div className="flex flex-col items-center justify-center h-40 text-white/20">
                <Music size={40} className="mb-2" />
                <p className="text-xs uppercase tracking-widest text-center">Search for a song to begin</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleReveal}
              disabled={!selectedVideo}
              className="flex items-center justify-center gap-2 py-4 rounded-xl bg-green-600 text-white font-bold text-xs tracking-widest disabled:opacity-30 transition-all active:scale-95"
            >
              <Play size={16} fill="currentColor" />
              START MUSIC
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 py-4 rounded-xl bg-white/10 text-white font-bold text-xs tracking-widest transition-all active:scale-95"
            >
              <RotateCcw size={16} />
              RESET TRICK
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MagicianPanel;
