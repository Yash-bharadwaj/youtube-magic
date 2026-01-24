
import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const InstallPWA: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(isIOSDevice);

    // Handle Android/Chrome prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show prompt for iOS after a short delay
    if (isIOSDevice) {
      const hasShownPrompt = localStorage.getItem('pwa_prompt_shown');
      if (!hasShownPrompt) {
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const closePrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_shown', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Download className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Add to Home Screen</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">YoutubeMagic App</p>
              </div>
            </div>
            <button onClick={closePrompt} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
              <X size={18} className="text-white/20" />
            </button>
          </div>

          {isIOS ? (
            <div className="space-y-3">
              <p className="text-xs text-white/70 leading-relaxed">
                Install this app on your iPhone for the best magic experience.
              </p>
              <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Share size={16} className="text-blue-400" />
                </div>
                <p className="text-[11px] text-white/60">
                  Tap <span className="text-white font-bold">Share</span> and then <span className="text-white font-bold">Add to Home Screen</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-white/70 leading-relaxed">
                Install YoutubeMagic for faster access and a full-screen immersive experience.
              </p>
              <button 
                onClick={handleInstallClick}
                className="w-full py-3 bg-white text-black rounded-xl text-xs font-bold tracking-widest active:scale-95 transition-all"
              >
                INSTALL APP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
