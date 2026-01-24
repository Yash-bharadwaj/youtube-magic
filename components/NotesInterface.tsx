
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
    minute: '2-digit'
  });

  if (os === 'android') {
    // Google Keep / Android Style
    return (
      <div className="fixed inset-0 bg-[#202124] text-[#e8eaed] flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-300">
        {/* Android Header */}
        <div className="flex justify-between items-center px-4 py-4">
          <button onClick={handleDone} className="p-2 -ml-2 text-[#9aa0a6]">
            <ArrowLeft size={24} />
          </button>
          <div className="flex gap-4 text-[#9aa0a6]">
            <Pin size={22} />
            <Bell size={22} />
            <Archive size={22} />
          </div>
        </div>

        {/* Android Content Area */}
        <div className="flex-1 px-6 overflow-y-auto">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[22px] font-medium placeholder-[#9aa0a6] mb-4"
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Note"
            className="w-full bg-transparent border-none outline-none text-[16px] leading-relaxed resize-none h-full placeholder-[#9aa0a6]"
            spellCheck={false}
          />
        </div>

        {/* Android Footer Bar */}
        <div className="bg-[#202124] px-4 py-3 flex justify-between items-center border-t border-[#3c4043]">
          <div className="flex gap-6 text-[#9aa0a6]">
            <PlusSquare size={20} />
            <Palette size={20} />
          </div>
          <div className="text-[#9aa0a6] text-[12px]">Edited {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          <div className="text-[#9aa0a6]">
            <MoreHorizontal size={20} />
          </div>
        </div>
      </div>
    );
  }

  // iOS Style (Default)
  return (
    <div className="fixed inset-0 bg-[#1c1c1e] text-white flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-300">
      <div className="flex justify-between items-center px-4 py-3 bg-[#1c1c1e]">
        <div className="flex items-center text-[#e5b32a] text-lg">
          <ChevronLeft size={24} />
          <span>Notes</span>
        </div>
        <div className="flex gap-6 text-[#e5b32a]">
          <Share size={22} />
          <button onClick={handleDone} className="font-semibold text-lg">Done</button>
        </div>
      </div>

      <div className="text-center text-[#8e8e93] text-[13px] mt-2 mb-4">
        {currentDate}
      </div>

      <div className="flex-1 px-5 overflow-y-auto">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New Note"
          className="w-full bg-transparent border-none outline-none text-[19px] leading-relaxed resize-none h-full placeholder-[#48484a]"
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      <div className="border-t border-[#38383a] bg-[#1c1c1e] px-6 py-4 flex justify-between items-center text-[#e5b32a]">
        <CheckSquare size={24} className="opacity-50" />
        <div className="flex items-center gap-10">
          <Edit3 size={24} className="opacity-50" />
          <Trash2 size={24} className="opacity-50" />
          <MoreHorizontal size={24} className="opacity-50" />
        </div>
      </div>
    </div>
  );
};

export default NotesInterface;
