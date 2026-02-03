
import React, { useState, useEffect } from 'react';
import { AppState, DeviceOS, UserRole, RoomState } from './types';
import NotesInterface from './components/NotesInterface';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import MagicianPanel from './components/MagicianPanel';
import MockYouTubePage from './components/MockYouTubePage';
import InstallPWA from './components/InstallPWA';
import { findSongIdentity } from './services/geminiService';
import { subscribeToRoom } from './services/firestoreService';
import { VolumeX, Smartphone, Loader2, Youtube, Wifi, Lock, Activity, Speaker } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.LOGIN);
  const [os, setOs] = useState<DeviceOS>('ios');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [songQuery, setSongQuery] = useState('');
  const [isFaceDown, setIsFaceDown] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const wakeLockRef = React.useRef<any>(null);
  
  // New States
  const [roomId, setRoomId] = useState<string>('');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [showMagicianPanel, setShowMagicianPanel] = useState(false);

  // Initialize Room ID from URL
  useEffect(() => {
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    
    // Explicit routing logic
    if (!path || path === 'login') {
      // Root URL or /login should show login page
      setRoomId('default');
      setState(AppState.LOGIN);
    } else if (path === 'admin') {
      // Admin URL should check for admin role (handled in login)
      setRoomId('admin-room');
      setState(AppState.LOGIN);
    } else {
      // Any other path is treated as a spectator room slug — go straight to YouTube loading page
      setRoomId(path);
      setState(AppState.MUTE_CHECK);
      
      // Auto-reset the room when spectator lands
      // This ensures a fresh start for each performance
      const resetRoomOnLoad = async () => {
        try {
          const { resetRoom } = await import('./services/firestoreService');
          await resetRoom(path);
        } catch (error) {
          console.error("Failed to reset room on load:", error);
        }
      };
      resetRoomOnLoad();
    }
  }, []);

  // Auto-login if credentials are saved
  useEffect(() => {
    if (state === AppState.LOGIN && !userRole) {
      const savedCredentials = localStorage.getItem('rememberedCredentials');
      if (savedCredentials) {
        // The Login component will handle auto-login
        // This just ensures we're on the login page
      }
    }
  }, [state, userRole]);

  // Performer on WELCOME (e.g. after finishing a trick): auto-go to notes with detected OS
  useEffect(() => {
    if (state !== AppState.WELCOME || userRole !== 'PERFORMER' || !roomId) return;
    let cancelled = false;
    (async () => {
      try {
        const { updateRoomStatus } = await import('./services/firestoreService');
        await updateRoomStatus(roomId, 'armed');
      } catch (e) {
        console.error('Error arming room:', e);
      }
      if (!cancelled) setState(AppState.NOTES);
    })();
    return () => { cancelled = true; };
  }, [state, userRole, roomId]);

  // Room Listener
  useEffect(() => {
    if (!roomId) return;
    
    // Don't subscribe if we're still on login or admin screens
    if (state === AppState.LOGIN || state === AppState.ADMIN_DASHBOARD) return;
    
    const unsubscribe = subscribeToRoom(roomId, (newState) => {
      setRoomState(newState);
      
      // Sync state with Firestore - BUT ONLY FOR SPECTATORS
      // If we are a performer, we don't want our own phone to trigger the reveal UI
      if (userRole === 'PERFORMER') {
        return;
      }

      if (newState.status === 'revealed') {
        setState(AppState.REVEAL);
      } else if (newState.status === 'armed') {
        // When magician arms the room (by opening notes), spectator goes to loading screen
        if (userRole !== 'PERFORMER' && state === AppState.WELCOME) {
          setState(AppState.MUTE_CHECK);
        }
      } else if (newState.status === 'idle') {
        // Only reload if we just finished a reveal
        // Don't reload if we're waiting for the magician to start
        if (state === AppState.REVEAL) {
          window.location.reload();
        }
      }
    });
    return () => unsubscribe();
  }, [roomId, userRole, state]);

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
    if (state === AppState.WAITING_FOR_FLIP && !isFaceDown && roomState?.status === 'revealed') {
      setState(AppState.REVEAL);
    }
  }, [isFaceDown, state, roomState]);

  // When revealed, open video on m.youtube.com in same tab
  useEffect(() => {
    if (state !== AppState.REVEAL || !roomState?.videoId) return;
    const startAt = roomState.startAt ?? 15;
    const url = startAt > 0
      ? `https://m.youtube.com/watch?v=${roomState.videoId}&t=${startAt}`
      : `https://m.youtube.com/watch?v=${roomState.videoId}`;
    window.location.href = url;
  }, [state, roomState?.videoId, roomState?.startAt]);

  // When spectator is on REVEAL (video), back button should go to Google (or referrer), not login/performer
  useEffect(() => {
    if (state !== AppState.REVEAL || userRole) return; // only for spectators
    history.pushState({ reveal: true }, '', window.location.pathname + window.location.search);
    const onPopState = () => {
      const ref = document.referrer;
      const isExternal = ref && !ref.includes(window.location.host);
      window.location.href = isExternal ? ref : 'https://www.google.com';
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [state, userRole]);

  const handleLogin = (user: any) => {
    const role = (user.role || 'PERFORMER') as UserRole;
    setUserRole(role);

    if (role === 'ADMIN') {
      setState(AppState.ADMIN_DASHBOARD);
      return;
    }
    if (role === 'PERFORMER' && user.slug) {
      setRoomId(user.slug);
      setState(AppState.NOTES); // OS already detected; go straight to notes
      (async () => {
        try {
          const { updateRoomStatus } = await import('./services/firestoreService');
          await updateRoomStatus(user.slug, 'armed');
        } catch (e) {
          console.error('Error arming room:', e);
        }
      })();
      return;
    }
    setState(AppState.WELCOME);
  };

  const handleLogout = () => {
    localStorage.removeItem('rememberedCredentials');
    setUserRole(null);
    setState(AppState.LOGIN);
  };

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock is active');
      }
    } catch (err: any) {
      console.error(`${err.name}, ${err.message}`);
    }
  };

  // Re-acquire wake lock on visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // On loading screen (MUTE_CHECK), keep display on and go straight to waiting — no tap needed
  useEffect(() => {
    if (state !== AppState.MUTE_CHECK) return;
    requestWakeLock();
    setState(AppState.WAITING_FOR_FLIP);
  }, [state]);

  const handleNotesDone = async (text: string) => {
    if (userRole === 'PERFORMER' && text.trim()) {
      // Magician flow: Search and send to room
      try {
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(text)}&type=video&videoEmbeddable=true&videoDuration=medium&maxResults=1&key=${apiKey}`
        );
        const data = await response.json();
        
        if (data.items && data.items[0]) {
          const videoId = data.items[0].id.videoId;
          const { setRoomVideo, revealVideo } = await import('./services/firestoreService');
          
          await setRoomVideo(roomId, videoId, 15);
          await revealVideo(roomId);
          // Stay in NOTES so performer stays on note screen (no WELCOME → NOTES glitch)
        }
      } catch (error) {
        console.error("YouTube search error:", error);
        // Stay in NOTES on error too
      }
    } else {
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
          // Performer: auto-redirect to notes (OS already detected). Brief placeholder while effect runs.
          return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#050505]">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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
        return (
          <div className="relative h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white/60 text-sm">Opening YouTube…</p>
          </div>
        );

      default:
        return null;
    }
  };

  const isSpectatorPage = roomId !== '' && roomId !== 'default' && roomId !== 'admin-room';

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-hidden">
      <InstallPWA hideOnSpectatorPage={isSpectatorPage} />
      {renderContent()}
      
      {showMagicianPanel && (
        <MagicianPanel 
          roomId={roomId} 
          currentOs={os}
          onOsChange={setOs}
          onClose={() => setShowMagicianPanel(false)} 
        />
      )}
    </div>
  );
};

export default App;
