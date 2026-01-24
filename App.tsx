
import React, { useState, useEffect } from 'react';
import { AppState, DeviceOS, UserRole, RoomState } from './types';
import NotesInterface from './components/NotesInterface';
import YouTubePlayer from './components/YouTubePlayer';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import MagicianPanel from './components/MagicianPanel';
import MockYouTubePage from './components/MockYouTubePage';
import { findSongIdentity } from './services/geminiService';
import { subscribeToRoom } from './services/firestoreService';
import { VolumeX, Smartphone, Loader2, Youtube, Wifi, Lock, Activity, Speaker } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.LOGIN);
  const [os, setOs] = useState<DeviceOS>('ios');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [songQuery, setSongQuery] = useState('');
  const [isFaceDown, setIsFaceDown] = useState(false);
  const [isReadyForReveal, setIsReadyForReveal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // New States
  const [roomId, setRoomId] = useState<string>('');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [showMagicianPanel, setShowMagicianPanel] = useState(false);

  // Initialize Room ID from URL
  useEffect(() => {
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    const id = path || 'default';
    setRoomId(id);
    
    // If we are on a room URL, skip login and act as spectator
    if (path && path !== 'login' && path !== 'admin') {
      setState(AppState.WELCOME);
    }
  }, []);

  // Room Listener
  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = subscribeToRoom(roomId, (newState) => {
      setRoomState(newState);
      
      // Sync state with Firestore
      if (newState.status === 'revealed') {
        setState(AppState.REVEAL);
      } else if (newState.status === 'armed') {
        // When magician arms the room (by opening notes), spectator goes to loading screen
        if (userRole !== 'PERFORMER' && state === AppState.WELCOME) {
          setState(AppState.MUTE_CHECK);
        }
      } else if (newState.status === 'idle') {
        // Only reset if we were in a reveal/waiting state
        if (state === AppState.REVEAL || state === AppState.WAITING_FOR_FLIP) {
          window.location.reload();
        }
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  // Gesture Detection (3-finger tap)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 3) {
        setShowMagicianPanel(prev => !prev);
      }
    };
    window.addEventListener('touchstart', handleTouchStart);
    return () => window.removeEventListener('touchstart', handleTouchStart);
  }, []);

  // Device Detection
  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/i.test(ua);
    
    if (isAndroid) {
      setOs('android');
    } else if (isIOS) {
      setOs('ios');
    } else {
      setOs('desktop');
    }
  }, []);

  // Sensor Logic
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const beta = event.beta; 
      if (beta && (beta > 160 || beta < -160)) {
        setIsFaceDown(true);
      } else {
        setIsFaceDown(false);
      }
    };

    if (state === AppState.WAITING_FOR_FLIP) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [state]);

  // Flip detection for reveal (If magician armed the room)
  useEffect(() => {
    if (state === AppState.WAITING_FOR_FLIP && isReadyForReveal && !isFaceDown && roomState?.status === 'revealed') {
      setState(AppState.REVEAL);
    }
  }, [isFaceDown, isReadyForReveal, state, roomState]);

  const handleLogin = (username: string, role: UserRole) => {
    console.log("App handleLogin called with role:", role);
    setUserRole(role);
    if (role === 'ADMIN') {
      console.log("Switching to Admin Dashboard state");
      setState(AppState.ADMIN_DASHBOARD);
    } else {
      setState(AppState.WELCOME);
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setState(AppState.LOGIN);
  };

  const handleNotesDone = async (text: string) => {
    if (userRole === 'PERFORMER' && text.trim()) {
      // Magician flow: Search and send to room
      try {
        const apiKey = process.env.VITE_YOUTUBE_API_KEY;
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(text)}&type=video&maxResults=1&key=${apiKey}`
        );
        const data = await response.json();
        if (data.items && data.items[0]) {
          const videoId = data.items[0].id.videoId;
          const { setRoomVideo } = await import('./services/firestoreService');
          await setRoomVideo(roomId, videoId);
          setState(AppState.WELCOME); // Return to notes selection
        }
      } catch (error) {
        console.error("Search error:", error);
        setState(AppState.WELCOME);
      }
    } else {
      // Spectator flow (if notes were used)
      setState(AppState.WAITING_FOR_FLIP);
    }
  };

  const startApp = () => {
    setIsInitializing(true);
    // Request permission for orientation if needed (iOS)
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            setState(AppState.MUTE_CHECK);
          }
        })
        .catch(() => setState(AppState.MUTE_CHECK));
    } else {
      setState(AppState.MUTE_CHECK);
    }
  };

  const handlePerformerNotesSelect = async (selectedOs: DeviceOS) => {
    setOs(selectedOs);
    setState(AppState.NOTES);
    // Arm the room so the spectator sees the YouTube Loading screen
    try {
      const { updateRoomStatus } = await import('./services/firestoreService');
      await updateRoomStatus(roomId, 'armed');
    } catch (e) {
      console.error("Error arming room:", e);
    }
  };

  const renderContent = () => {
    switch (state) {
      case AppState.LOGIN:
        return <Login onLogin={handleLogin} />;

      case AppState.ADMIN_DASHBOARD:
        return <AdminDashboard onLogout={handleLogout} />;

      case AppState.WELCOME:
        if (userRole === 'PERFORMER') {
          return (
            <div className="flex flex-col items-center justify-center h-screen px-8 py-16 text-center animate-in fade-in duration-1000 bg-[#050505]">
              <h2 className="text-xl font-bold tracking-tighter uppercase mb-12">Capture Tool</h2>
              <div className="grid grid-cols-2 gap-6 w-full max-w-[320px]">
                <button 
                  onClick={() => handlePerformerNotesSelect('ios')}
                  className="flex flex-col items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl active:scale-95 transition-all"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">iOS Notes</span>
                </button>
                <button 
                  onClick={() => handlePerformerNotesSelect('android')}
                  className="flex flex-col items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl active:scale-95 transition-all"
                >
                  <div className="w-16 h-16 bg-[#202124] rounded-2xl flex items-center justify-center shadow-xl border border-white/5">
                    <div className="w-8 h-8 bg-yellow-600 rounded-full" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Keep</span>
                </button>
              </div>
              <button 
                onClick={handleLogout}
                className="mt-16 text-[9px] font-bold tracking-[0.4em] text-white/10 hover:text-white/30 transition-colors uppercase"
              >
                Logout Performer
              </button>
            </div>
          );
        }
        return (
          <div className="flex flex-col h-screen bg-black overflow-hidden animate-in fade-in duration-700">
            {/* Red Header */}
            <div className="bg-[#e53935] flex items-center gap-3 px-6 py-4 shadow-lg">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Speaker className="text-[#e53935] w-6 h-6 fill-current" />
              </div>
              <span className="text-2xl font-normal text-white tracking-tight">YoutubeMagic</span>
            </div>

            <div className="flex-1 px-6 pt-12">
              <h3 className="text-white text-center text-sm font-bold tracking-widest mb-10 uppercase">Basic Services</h3>
              
              <div className="space-y-6 max-w-[320px] mx-auto">
                <button 
                  onClick={startApp}
                  className="w-full bg-[#2a2a2a] py-6 px-8 rounded-2xl flex items-center gap-6 active:scale-[0.98] transition-all border border-white/5 group"
                >
                  <div className="w-14 h-10 bg-[#e5e5e5] rounded-lg flex items-center justify-center shrink-0">
                    <div className="w-6 h-4 bg-red-600 rounded-sm flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[5px] border-l-white border-b-[3px] border-b-transparent" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-[#e5e5e5] tracking-tight">YouTube</span>
                </button>

                <button className="w-full bg-[#2a2a2a] py-6 px-8 rounded-2xl flex items-center gap-6 active:scale-[0.98] transition-all border border-white/5 opacity-80">
                  <div className="w-14 h-14 bg-[#e5e5e5] rounded-lg flex items-center justify-center shrink-0">
                    <div className="text-black font-serif text-xl font-bold">W</div>
                  </div>
                  <span className="text-2xl font-bold text-[#e5e5e5] tracking-tight">Wikipedia</span>
                </button>
              </div>

              <div className="mt-20 text-center">
                <h3 className="text-white text-sm font-bold tracking-widest mb-6 uppercase">WikiTest Services</h3>
                <p className="text-white/40 text-xs leading-relaxed max-w-[280px] mx-auto">
                  You haven't opened the YoutubeMagic app for a while.
                </p>
                <p className="text-white/40 text-xs leading-relaxed max-w-[280px] mx-auto mt-4 italic">
                  To use the WikiTest options, open YoutubeMagic on your phone first.
                </p>
              </div>
            </div>
          </div>
        );

      case AppState.MUTE_CHECK:
        return (
          <div className="relative h-screen w-full overflow-hidden">
            <MockYouTubePage />
            <div 
              onClick={() => setState(AppState.WAITING_FOR_FLIP)}
              className="absolute inset-0 z-50 bg-black/60 flex flex-col items-center justify-center p-8 text-center"
            >
              <h2 className="text-white text-3xl font-bold leading-tight mb-16 px-4">
                Tap here once to stop the display from sleeping.
              </h2>
              <div className="w-32 h-32 bg-white rounded-full shadow-[0_0_50px_rgba(255,255,255,0.3)] animate-pulse active:scale-95 transition-all" />
            </div>
          </div>
        );

      case AppState.NOTES:
        return <NotesInterface onDone={handleNotesDone} os={os} />;

      case AppState.WAITING_FOR_FLIP:
        return (
          <div className="relative h-screen w-full overflow-hidden">
            <MockYouTubePage />
            <div className="absolute inset-0 z-40 bg-black/10 pointer-events-none" />
            {isFaceDown && (
              <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
              </div>
            )}
          </div>
        );

      case AppState.REVEAL:
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-hidden">
      {renderContent()}
      
      {showMagicianPanel && (
        <MagicianPanel 
          roomId={roomId} 
          currentOs={os}
          onOsChange={setOs}
          onClose={() => setShowMagicianPanel(false)} 
        />
      )}

      {(state === AppState.WAITING_FOR_FLIP || state === AppState.REVEAL) && (
        <YouTubePlayer 
          videoId={roomState?.videoId || null} 
          isVisible={state === AppState.REVEAL} 
          onReady={() => setIsReadyForReveal(true)}
        />
      )}
      
      {state === AppState.REVEAL && (
        <button 
          onClick={() => window.location.reload()}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.5em] text-white/5 z-[100] hover:text-white/20 transition-colors"
        >
          Reset Session
        </button>
      )}
    </div>
  );
};

export default App;
