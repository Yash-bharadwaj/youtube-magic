
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
    console.log("DEBUG: YouTubePlayer mounting...");
    const initPlayer = () => {
      if (!window.YT) {
        console.log("DEBUG: window.YT not available yet");
        return;
      }
      console.log("DEBUG: Initializing YT.Player for videoId:", videoId);
      
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
          mute: 1, // Always start muted
          start: 15,
          playsinline: 1
        },
        events: {
          onReady: (event: any) => {
            console.log("DEBUG: YT.Player onReady event");
            setIsInitialized(true);
            if (onReady) onReady();
          },
          onStateChange: (event: any) => {
            console.log("DEBUG: YT.Player State Change:", event.data);
            // event.data: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
          },
          onError: (event: any) => {
            console.error("DEBUG: YT.Player Error:", event.data);
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      console.log("DEBUG: Waiting for YouTube IFrame API script to load...");
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      console.log("DEBUG: YouTubePlayer unmounting, destroying player");
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (isInitialized && videoId) {
      console.log("DEBUG: VideoId changed or initialized, loading video:", videoId);
      playerRef.current.loadVideoById({
        videoId: videoId,
        startSeconds: 15,
        suggestedQuality: 'hd720'
      });
      // Ensure it starts playing muted
      console.log("DEBUG: Setting muted and playing video");
      playerRef.current.mute();
      playerRef.current.playVideo();
    }
  }, [isInitialized, videoId]);

  useEffect(() => {
    console.log("DEBUG: isUnmuted change:", isUnmuted);
    if (isInitialized && isUnmuted && playerRef.current) {
      console.log("DEBUG: Unmuting and playing at 100% volume");
      playerRef.current.unMute();
      playerRef.current.setVolume(100);
      playerRef.current.playVideo();
    } else if (isInitialized && !isUnmuted && playerRef.current) {
      console.log("DEBUG: Muting player");
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
