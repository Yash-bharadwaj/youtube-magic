
import React, { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoId: string | null;
  isVisible: boolean;
  isUnmuted: boolean;
  onReady?: () => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, isVisible, isUnmuted, onReady }) => {
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
          mute: 1,
          start: 15,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            setIsInitialized(true);
            if (onReady) onReady();
          },
          onError: (event: any) => {
            console.error("YouTube Player Error:", event.data);
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
        startSeconds: 15,
        suggestedQuality: 'hd720'
      });
      playerRef.current.mute();
      playerRef.current.playVideo();
    }
  }, [isInitialized, videoId]);

  useEffect(() => {
    if (isInitialized && isUnmuted && playerRef.current) {
      playerRef.current.unMute();
      playerRef.current.setVolume(100);
      playerRef.current.playVideo();
    } else if (isInitialized && !isUnmuted && playerRef.current) {
      playerRef.current.mute();
    }
  }, [isInitialized, isUnmuted]);

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
