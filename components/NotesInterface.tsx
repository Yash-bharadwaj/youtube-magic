
import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, Share, Trash2, Edit3, MoreHorizontal, Check, 
  ArrowLeft, Pin, Bell, Archive, PlusSquare, Image as ImageIcon, CheckSquare, Mic, Palette
} from 'lucide-react';
import { DeviceOS } from '../types';

interface NotesInterfaceProps {
  onDone: (text: string) => void;
  os: DeviceOS;
}

const NotesInterface: React.FC<NotesInterfaceProps> = ({ onDone, os }) => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // In mobile, "Enter" is often what they press to finish.
      // We check if there's content before triggering.
      const finalContent = os === 'android' ? `${title} ${text}` : text;
      if (finalContent.trim()) {
        e.preventDefault();
        onDone(finalContent);
      }
    }
  };

  const handleDone = () => {
    const finalContent = os === 'android' ? `${title} ${text}` : text;
    if (finalContent.trim()) {
      onDone(finalContent);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(' at', '');

  if (os === 'android') {
    // Google Keep / Android Style
    return (
      <div className="fixed inset-0 bg-[#202124] text-[#e8eaed] flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-300 z-[300]">
        {/* Android Header */}
        <div className="flex justify-between items-center px-2 py-3">
          <button onClick={handleDone} className="p-3 text-[#9aa0a6] active:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div className="flex gap-1 items-center text-[#9aa0a6]">
            <button className="p-3 active:bg-white/10 rounded-full transition-colors"><Pin size={20} /></button>
            <button className="p-3 active:bg-white/10 rounded-full transition-colors"><Bell size={20} /></button>
            <button onClick={handleDone} className="px-4 py-2 text-sm font-medium text-[#e8eaed] active:bg-white/10 rounded-lg transition-colors">Done</button>
          </div>
        </div>

        {/* Android Content Area */}
        <div className="flex-1 px-6 overflow-y-auto">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none text-[22px] font-medium placeholder-[#5f6368] mb-4"
            autoComplete="off"
            enterKeyHint="done"
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Note"
            className="w-full bg-transparent border-none outline-none text-[16px] leading-relaxed resize-none h-full placeholder-[#5f6368]"
            spellCheck={false}
            autoComplete="off"
            enterKeyHint="done"
          />
        </div>

        {/* Android Footer Bar */}
        <div className="px-4 py-2 flex justify-between items-center border-t border-[#3c4043] bg-[#202124]">
          <div className="flex gap-2 text-[#9aa0a6]">
            <button className="p-2 active:bg-white/10 rounded-full transition-colors"><PlusSquare size={20} /></button>
            <button className="p-2 active:bg-white/10 rounded-full transition-colors"><Palette size={20} /></button>
          </div>
          <div className="text-[#9aa0a6] text-[11px] font-normal">
            Edited {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          <div className="text-[#9aa0a6]">
            <button className="p-2 active:bg-white/10 rounded-full transition-colors"><MoreHorizontal size={20} /></button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Style (Default)
  return (
    <div className="fixed inset-0 bg-[#1c1c1e] text-white flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-300 z-[300]">
      {/* iOS Header */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#1c1c1e]">
        <button onClick={handleDone} className="flex items-center text-[#e5b32a] text-[17px] active:opacity-50 transition-opacity">
          <ChevronLeft size={24} className="-ml-2" />
          <span>Notes</span>
        </button>
        <div className="flex gap-6 text-[#e5b32a]">
          <button className="active:opacity-50 transition-opacity"><Share size={22} /></button>
          <button onClick={handleDone} className="font-semibold text-[17px] active:opacity-50 transition-opacity">Done</button>
        </div>
      </div>

      {/* iOS Timestamp */}
      <div className="text-center text-[#8e8e93] text-[12px] font-medium mt-1 mb-2 uppercase tracking-tight">
        {currentDate}
      </div>

      {/* iOS Text Area */}
      <div className="flex-1 px-5 overflow-y-auto">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New Note"
          className="w-full bg-transparent border-none outline-none text-[19px] leading-snug resize-none h-full placeholder-[#48484a] caret-[#e5b32a]"
          spellCheck={false}
          autoComplete="off"
          enterKeyHint="done"
        />
      </div>

      {/* iOS Bottom Toolbar */}
      <div className="border-t border-[#38383a] bg-[#1c1c1e] px-6 py-3 flex justify-between items-center text-[#e5b32a] pb-8">
        <button className="active:opacity-50 transition-opacity"><CheckSquare size={22} /></button>
        <div className="flex items-center gap-10">
          <button className="active:opacity-50 transition-opacity"><Edit3 size={22} /></button>
          <button className="active:opacity-50 transition-opacity"><Trash2 size={22} /></button>
          <button className="active:opacity-50 transition-opacity"><MoreHorizontal size={22} /></button>
        </div>
      </div>
    </div>
  );
};

export default NotesInterface;
