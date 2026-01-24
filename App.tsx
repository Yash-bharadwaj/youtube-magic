
import React, { useState, useEffect } from 'react';
import { AppState, DeviceOS, UserRole, RoomState } from './types';
import NotesInterface from './components/NotesInterface';
import YouTubePlayer from './components/YouTubePlayer';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import MagicianPanel from './components/MagicianPanel';
import { findSongIdentity } from './services/geminiService';
import { subscribeToRoom } from './services/firestoreService';
import { VolumeX, Smartphone, Loader2, Youtube, Wifi, Lock, Activity } from 'lucide-react';

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

  const renderContent = () => {
    switch (state) {
      case AppState.LOGIN:
        return <Login onLogin={handleLogin} />;

      case AppState.ADMIN_DASHBOARD:
        return <AdminDashboard onLogout={handleLogout} />;

      case AppState.WELCOME:
        if (userRole === 'PERFORMER') {
          return (
            <div className="flex flex-col items-center justify-center h-screen px-8 py-16 text-center animate-in fade-in duration-1000">
              <h2 className="text-xl font-bold tracking-tighter uppercase mb-12">Capture Tool</h2>
              <div className="grid grid-cols-2 gap-6 w-full max-w-[320px]">
                <button 
                  onClick={() => { setOs('ios'); setState(AppState.NOTES); }}
                  className="flex flex-col items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl active:scale-95 transition-all"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">iOS Notes</span>
                </button>
                <button 
                  onClick={() => { setOs('android'); setState(AppState.NOTES); }}
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
          <div className="flex flex-col items-center justify-center h-screen px-8 py-16 text-center animate-in fade-in duration-1000">
            <button 
              onClick={startApp}
              className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] active:scale-90 transition-all duration-500"
            >
              <Youtube className="text-[#FF0000] w-12 h-12 fill-current" />
            </button>
            <p className="mt-8 text-[10px] font-bold tracking-[0.5em] uppercase text-white/20">
              Media Sync
            </p>
          </div>
        );

      case AppState.MUTE_CHECK:
        return (
          <div 
            onClick={() => setState(AppState.NOTES)}
            className="flex flex-col items-center justify-center h-screen bg-black cursor-none"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full animate-pulse scale-150" />
              <div className="w-4 h-4 bg-white rounded-full relative z-10 shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
            </div>
            <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 mt-12 animate-pulse">
              Link Active. Tap to initialize.
            </p>
          </div>
        );

      case AppState.NOTES:
        return <NotesInterface onDone={handleNotesDone} os={os} />;

      case AppState.WAITING_FOR_FLIP:
        return (
          <div className="flex flex-col items-center justify-center h-screen bg-black">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full transition-all duration-1000 ${isFaceDown ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'bg-white/10'}`} />
            </div>
            {!isFaceDown && (
              <p className="text-[8px] uppercase tracking-[0.5em] text-white/10 mt-12">
                Place device face-down to begin
              </p>
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
