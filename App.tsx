
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

  const startApp = () => {
    setIsInitializing(true);
    setTimeout(() => {
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
    }, 1500);
  };

  const handleNotesDone = async (text: string) => {
    setState(AppState.PROCESSING);
    // In the new flow, the notes are just misdirection.
    // But we still "process" to maintain the illusion.
    setTimeout(() => {
      setState(AppState.WAITING_FOR_FLIP);
    }, 2000);
  };

  const renderContent = () => {
    switch (state) {
      case AppState.LOGIN:
        return <Login onLogin={handleLogin} />;

      case AppState.ADMIN_DASHBOARD:
        return <AdminDashboard onLogout={handleLogout} />;

      case AppState.WELCOME:
        return (
          <div className="flex flex-col items-center justify-between h-screen px-8 py-16 text-center animate-in fade-in duration-1000">
            <div className="flex flex-col items-center gap-2 mt-12">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.15)] mb-4">
                <Youtube className="text-[#FF0000] w-9 h-9 fill-current" />
              </div>
              <h1 className="text-[10px] font-bold tracking-[0.5em] uppercase text-white/40">
                Sync Master Portal
              </h1>
            </div>

            <div className="flex flex-col items-center">
              <h2 className="text-3xl font-serif italic mb-3">Sync Stream</h2>
              <p className="text-white/30 text-xs max-w-[260px] leading-relaxed font-light">
                Initializing encrypted handshake for remote audio visualization.
              </p>
            </div>

            <div className="w-full max-w-[280px] space-y-4">
              <button 
                onClick={startApp}
                disabled={isInitializing}
                className="w-full py-4 rounded-xl bg-white text-black font-bold text-xs tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 relative overflow-hidden shadow-xl"
              >
                {isInitializing ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>CONNECTING...</span>
                  </div>
                ) : (
                  "ESTABLISH LINK"
                )}
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full py-2 text-[9px] font-bold tracking-[0.4em] text-white/10 hover:text-white/30 transition-colors uppercase"
              >
                Terminate Session
              </button>
            </div>
          </div>
        );

      case AppState.MUTE_CHECK:
        return (
          <div className="flex flex-col items-center justify-center h-screen px-8 text-center bg-black animate-in zoom-in-95 duration-500">
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-150" />
              <VolumeX className="text-white w-14 h-14 relative z-10 animate-pulse" />
            </div>
            <h2 className="text-xl font-light mb-4 uppercase tracking-[0.3em] text-white/90">Acoustic Check</h2>
            <p className="text-white/40 mb-12 text-sm leading-relaxed max-w-xs italic">
              "For the synchronization to remain covert, please toggle your hardware mute switch and lower volume to zero."
            </p>
            <button 
              onClick={() => setState(AppState.NOTES)}
              className="px-12 py-4 rounded-full border border-white/10 bg-white/5 text-white font-medium text-[10px] tracking-[0.3em] uppercase hover:bg-white/10 transition-all active:scale-95 shadow-inner"
            >
              System Muted
            </button>
          </div>
        );

      case AppState.NOTES:
        return <NotesInterface onDone={handleNotesDone} os={os} />;

      case AppState.PROCESSING:
        return (
          <div className="flex flex-col items-center justify-center h-screen bg-black">
            <div className="relative">
              <div className="absolute inset-0 bg-white/5 blur-2xl animate-pulse" />
              <Loader2 className="w-10 h-10 animate-spin text-white/40 relative z-10" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mt-8">Analyzing Spectrum</p>
          </div>
        );

      case AppState.WAITING_FOR_FLIP:
        return (
          <div className="flex flex-col items-center justify-center h-screen px-8 text-center animate-in fade-in duration-1000">
            <div className={`p-10 rounded-full border border-white/5 transition-all duration-1000 ${isFaceDown ? 'scale-110 border-white/20 bg-white/5' : 'scale-100'}`}>
              <Smartphone className={`w-12 h-12 transition-all duration-1000 ${isFaceDown ? 'text-white' : 'text-white/10'}`} />
            </div>
            <h2 className="text-2xl font-serif italic mt-8 mb-4">Frequency Set</h2>
            <p className="text-white/30 text-sm leading-relaxed max-w-xs mb-10">
              Turn your device face-down. Visualize the artist in your mind.
            </p>
            {isFaceDown && (
              <div className="px-6 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400/70 text-[10px] tracking-[0.3em] uppercase animate-pulse">
                Synchronized
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
