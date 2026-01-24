
import React, { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoId: string | null;
  isVisible: boolean;
  onReady?: () => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, isVisible, onReady }) => {
  const playerRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initPlayer = () => {
      if (!window.YT) return;
      
      playerRef.current = new window.YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId: videoId || '',
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          mute: 1, // Start muted for the "silent reveal" pre-load
          start: 12,
          playsinline: 1
        },
        events: {
          onReady: (event: any) => {
            setIsInitialized(true);
            if (onReady) onReady();
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (isInitialized && videoId) {
      playerRef.current.loadVideoById({
        videoId: videoId,
        startSeconds: 12,
        suggestedQuality: 'hd720'
      });
      // Keep it muted until it's actually visible/revealed
      playerRef.current.mute();
    }
  }, [isInitialized, videoId]);

  useEffect(() => {
    if (isInitialized && isVisible && playerRef.current) {
      playerRef.current.unMute();
      playerRef.current.setVolume(100);
      playerRef.current.playVideo();
    }
  }, [isInitialized, isVisible]);

  return (
    <div 
      className={`fixed inset-0 transition-opacity duration-1000 bg-black ${isVisible ? 'opacity-100 z-50' : 'opacity-0 -z-10'}`}
    >
      <div id="yt-player" className="w-full h-full"></div>
      <div className="absolute inset-0 z-10 bg-transparent" />
    </div>
  );
};

export default YouTubePlayer;
