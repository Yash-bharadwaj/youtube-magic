import React from 'react';
import { Search, Menu, Share2, Plus, ThumbsUp, ThumbsDown, MoreVertical } from 'lucide-react';

interface MockYouTubePageProps {
  isLoading?: boolean;
}

const MockYouTubePage: React.FC<MockYouTubePageProps> = ({ isLoading = true }) => {
  return (
    <div className="flex flex-col h-screen bg-white text-black font-sans overflow-hidden select-none">
      {/* YouTube Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Menu size={20} />
          <div className="flex items-center gap-1">
            <div className="w-6 h-4 bg-red-600 rounded-sm flex items-center justify-center">
              <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[5px] border-l-white border-b-[3px] border-b-transparent" />
            </div>
            <span className="font-bold tracking-tighter text-lg">YouTube</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <Search size={20} />
          <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">Y</div>
        </div>
      </div>

      {/* Video Area (Black Placeholder) */}
      <div className="w-full aspect-video bg-black flex items-center justify-center relative">
        {isLoading && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-lg font-normal leading-snug mb-1">Loading song...</h1>
        <p className="text-[12px] text-gray-600">Vevo • 235,65,897 views</p>
        
        <div className="flex justify-between mt-6 px-2">
          <div className="flex flex-col items-center gap-1">
            <ThumbsUp size={20} className="text-gray-700" />
            <span className="text-[10px] font-medium text-gray-600">40K</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ThumbsDown size={20} className="text-gray-700" />
            <span className="text-[10px] font-medium text-gray-600">2K</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Share2 size={20} className="text-gray-700" />
            <span className="text-[10px] font-medium text-gray-600">Share</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Plus size={20} className="text-gray-700" />
            <span className="text-[10px] font-medium text-gray-600">Save</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <MoreVertical size={20} className="text-gray-700" />
            <span className="text-[10px] font-medium text-gray-600">More</span>
          </div>
        </div>
      </div>

      {/* Suggested Videos */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-40 aspect-video bg-gray-300 rounded-lg relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-400" />
              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">0:58</div>
            </div>
            <div className="flex flex-col py-1">
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MockYouTubePage;
