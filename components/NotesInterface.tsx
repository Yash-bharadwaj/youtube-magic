
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft, Share, Trash2, Edit3, MoreHorizontal, Check,
  ArrowLeft, Pin, Bell, Image as ImageIcon, CheckSquare, Palette, ListTodo,
  Plus, Pencil
} from 'lucide-react';
import { DeviceOS } from '../types';

interface NotesInterfaceProps {
  onDone: (text: string) => void;
  os: DeviceOS;
}

interface Note {
  id: string;
  title: string;
  body: string;
  checklist: string[];
  updatedAt: string;
  colorIndex?: number;
}

const KEEP_COLORS = [
  { name: 'default', bg: 'bg-[#202124]', border: 'border-[#202124]' },
  { name: 'white', bg: 'bg-[#fafafa]', border: 'border-[#e0e0e0]' },
  { name: 'yellow', bg: 'bg-[#fef9c3]', border: 'border-[#fde047]' },
  { name: 'green', bg: 'bg-[#dcfce7]', border: 'border-[#86efac]' },
  { name: 'blue', bg: 'bg-[#dbeafe]', border: 'border-[#93c5fd]' },
  { name: 'purple', bg: 'bg-[#f3e8ff]', border: 'border-[#d8b4fe]' },
  { name: 'pink', bg: 'bg-[#fce7f3]', border: 'border-[#f9a8d4]' },
  { name: 'orange', bg: 'bg-[#ffedd5]', border: 'border-[#fdba74]' },
];

const DEFAULT_NOTES: Note[] = [
  {
    id: '1',
    title: 'Quick note',
    body: 'Meeting at 3pm\n\nCall back John\n\nGrocery: milk, eggs',
    checklist: ['Buy concert tickets'],
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    colorIndex: 0,
  },
  {
    id: '2',
    title: 'Shopping list',
    body: 'Bread\nButter\nCoffee\nToilet paper',
    checklist: [],
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    colorIndex: 2,
  },
  {
    id: '3',
    title: 'Ideas',
    body: 'App feature: dark mode\n\nBlog post: productivity tips\n\nSong: summer playlist',
    checklist: [],
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    colorIndex: 0,
  },
  {
    id: '4',
    title: 'Passwords',
    body: 'Netflix - ********\nBank - ********\n(use password manager!)',
    checklist: [],
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
    colorIndex: 0,
  },
  {
    id: '5',
    title: 'Trip plan',
    body: 'Flight: 6am Friday\nHotel: Downtown\nThings to see: museum, park',
    checklist: ['Book rental car', 'Print tickets'],
    updatedAt: new Date(Date.now() - 604800000).toISOString(),
    colorIndex: 3,
  },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatNoteDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function previewFromNote(note: Note, maxLen: number = 60): string {
  const parts = [note.title, note.body, ...note.checklist].filter(Boolean);
  const full = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (full.length <= maxLen) return full;
  return full.slice(0, maxLen) + '…';
}

const NotesInterface: React.FC<NotesInterfaceProps> = ({ onDone, os }) => {
  const [notes, setNotes] = useState<Note[]>(() => [...DEFAULT_NOTES]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [lastEdited, setLastEdited] = useState(() => new Date());
  const [toast, setToast] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [keepColorIndex, setKeepColorIndex] = useState(0);
  const [isPinned, setIsPinned] = useState(false);
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  /** After Done on new note: stay on editor by switching to this id once the note is in the list */
  const stayOnNoteIdRef = useRef<string | null>(null);
  /** Note ids that have been submitted once (Done clicked) — show "Save" instead of "Done" */
  const [submittedNoteIds, setSubmittedNoteIds] = useState<Set<string>>(() => new Set());

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg);
    const t = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(t);
  }, []);

  const openNote = useCallback((id: string | 'new') => {
    if (id === 'new') {
      setTitle('');
      setText('');
      setChecklistItems([]);
      setKeepColorIndex(0);
      setLastEdited(new Date());
      setShowMoreMenu(false);
      setShowColorPicker(false);
      setEditingNoteId('new');
    } else {
      const note = notes.find((n) => n.id === id);
      if (note) {
        setTitle(note.title);
        setText(note.body);
        setChecklistItems([...note.checklist]);
        setKeepColorIndex(note.colorIndex ?? 0);
        setLastEdited(new Date(note.updatedAt));
        setShowMoreMenu(false);
        setShowColorPicker(false);
        setEditingNoteId(id);
      }
    }
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [notes]);

  const saveCurrentNote = useCallback((): Note | null => {
    const body = text.trim();
    const tit = title.trim();
    const checklist = checklistItems.filter(Boolean);
    if (!tit && !body && checklist.length === 0) return null;
    const updatedAt = new Date().toISOString();
    if (editingNoteId === 'new') {
      const newNote: Note = {
        id: generateId(),
        title: tit || 'Untitled',
        body,
        checklist,
        updatedAt,
        colorIndex: keepColorIndex,
      };
      setNotes((prev) => [newNote, ...prev]);
      return newNote;
    }
    const idx = notes.findIndex((n) => n.id === editingNoteId);
    if (idx === -1) return null;
    const updated: Note = {
      ...notes[idx],
      title: tit || 'Untitled',
      body,
      checklist,
      updatedAt,
      colorIndex: keepColorIndex,
    };
    setNotes((prev) => prev.map((n) => (n.id === editingNoteId ? updated : n)));
    return updated;
  }, [editingNoteId, title, text, checklistItems, keepColorIndex, notes]);

  const closeEditor = useCallback(() => {
    saveCurrentNote();
    setEditingNoteId(null);
  }, [saveCurrentNote]);

  const handleDone = useCallback(() => {
    const finalContent = getFinalContent();
    if (editingNoteId === 'new') {
      if (finalContent.trim()) {
        const saved = saveCurrentNote();
        onDone(finalContent);
        if (saved) stayOnNoteIdRef.current = saved.id;
      } else {
        setEditingNoteId(null);
      }
    } else {
      saveCurrentNote();
      setSubmittedNoteIds((prev) => new Set(prev).add(editingNoteId));
    }
  }, [editingNoteId, saveCurrentNote, onDone]);

  const handleEditSave = useCallback(() => {
    saveCurrentNote();
    closeEditor();
  }, [saveCurrentNote, closeEditor]);

  const isSubmittedNote = editingNoteId !== null && editingNoteId !== 'new' && submittedNoteIds.has(editingNoteId);
  const primaryActionLabel = isSubmittedNote ? 'Save' : 'Done';
  const primaryActionHandler = isSubmittedNote ? handleEditSave : handleDone;

  // After saving a new note, switch to editing that note so we stay in editor (not list)
  useEffect(() => {
    const id = stayOnNoteIdRef.current;
    if (!id || !notes.some((n) => n.id === id)) return;
    stayOnNoteIdRef.current = null;
    setEditingNoteId(id);
    setSubmittedNoteIds((prev) => new Set(prev).add(id));
  }, [notes]);

  useEffect(() => {
    if (editingNoteId && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editingNoteId]);

  useEffect(() => {
    if (editingNoteId && (text || title || checklistItems.length)) {
      const id = setInterval(() => setLastEdited(new Date()), 60000);
      return () => clearInterval(id);
    }
  }, [editingNoteId, text, title, checklistItems]);

  // Volume up/down (and power where available) trigger primary action (Done or Save)
  useEffect(() => {
    if (!editingNoteId) return;
    const onHardwareKey = (e: KeyboardEvent) => {
      const isVolumeUp = e.key === 'VolumeUp' || e.keyCode === 447;
      const isVolumeDown = e.key === 'VolumeDown' || e.keyCode === 448;
      const isPower = e.key === 'Power' || e.keyCode === 255;
      if (isVolumeUp || isVolumeDown || isPower) {
        e.preventDefault();
        e.stopPropagation();
        primaryActionHandler();
      }
    };
    window.addEventListener('keydown', onHardwareKey);
    return () => window.removeEventListener('keydown', onHardwareKey);
  }, [editingNoteId, primaryActionHandler]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const finalContent = getFinalContent();
      if (finalContent.trim() && editingNoteId === 'new' && !isSubmittedNote) {
        e.preventDefault();
        primaryActionHandler();
      }
    }
  };

  const getFinalContent = (): string => {
    const parts = [title, text, ...checklistItems.filter(Boolean)].filter(Boolean);
    return parts.join(' ');
  };

  const handleShare = () => {
    const content = getFinalContent();
    if (content.trim()) {
      navigator.clipboard.writeText(content);
      showToastMsg('Copied to clipboard');
    }
  };

  const handleTrashInEditor = () => {
    setTitle('');
    setText('');
    setChecklistItems([]);
    setShowMoreMenu(false);
    if (editingNoteId && editingNoteId !== 'new') {
      setNotes((prev) => prev.filter((n) => n.id !== editingNoteId));
      closeEditor();
    }
    showToastMsg('Note deleted');
  };

  const handleAddChecklistItem = () => {
    setChecklistItems((prev) => [...prev, '']);
  };

  const updateChecklistItem = (index: number, value: string) => {
    setChecklistItems((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index));
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).replace(' at', '');

  const editedTime = lastEdited.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const keepColor = KEEP_COLORS[keepColorIndex];
  const isLightKeep = keepColorIndex >= 1;

  // ——— List view ———
  if (editingNoteId === null) {
    if (os === 'android') {
      return (
        <div className="notes-keep fixed inset-0 bg-[#202124] text-[#e8eaed] flex flex-col overflow-hidden z-[300]">
          <div className="h-[env(safe-area-inset-top)] bg-[#1a1a1a]" />
          <div className="flex items-center justify-between px-4 py-3 min-h-[56px] border-b border-[#3c4043]">
            <h1 className="text-[20px] font-normal tracking-tight text-[#e8eaed]">Keep</h1>
            <button
              type="button"
              onClick={() => openNote('new')}
              className="p-2 rounded-full text-[#e8eaed] active:bg-white/10"
              title="New note"
            >
              <Plus size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <button
              type="button"
              onClick={() => openNote('new')}
              className="w-full flex items-start gap-3 px-4 py-3 rounded-lg border border-[#3c4043] text-left mb-2 hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <Pencil size={20} className="text-[#9aa0a6] mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[14px] text-[#9aa0a6] leading-[20px]">Take a note…</span>
              </div>
            </button>
            {notes.map((note) => {
              const color = KEEP_COLORS[note.colorIndex ?? 0];
              const isLight = (note.colorIndex ?? 0) >= 1;
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => openNote(note.id)}
                  className={`w-full text-left p-4 rounded-lg border mb-2 transition-transform active:scale-[0.99] ${color.bg} ${color.border} border`}
                >
                  <p className={`text-[16px] font-medium leading-[24px] truncate ${isLight ? 'text-[#202124]' : 'text-[#e8eaed]'}`}>
                    {note.title || 'Untitled'}
                  </p>
                  <p className={`text-[14px] leading-[20px] truncate mt-0.5 ${isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]'}`}>
                    {previewFromNote(note, 50)}
                  </p>
                  <p className={`text-[12px] leading-[16px] mt-1.5 ${isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]'}`}>
                    {formatNoteDate(note.updatedAt)}
                  </p>
                </button>
              );
            })}
          </div>
          {toast && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[350] px-4 py-2.5 rounded-lg bg-[#303134] text-[#e8eaed] text-[14px] font-normal animate-in fade-in duration-200">
              {toast}
            </div>
          )}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      );
    }

    // iOS list view — SF Pro: 17pt nav, 13pt caption, 17pt list title, 15pt preview, 11pt date
    return (
      <div className="notes-ios fixed inset-0 bg-[#1c1c1e] text-white flex flex-col overflow-hidden z-[300]">
        <div className="h-[env(safe-area-inset-top)] bg-[#1c1c1e]" />
        <div className="flex items-center justify-between px-4 py-3 min-h-[44px] border-b border-[#38383a]">
          <h1 className="text-[17px] font-semibold leading-[22px] text-white">Notes</h1>
          <button
            type="button"
            onClick={() => openNote('new')}
            className="p-2 text-[#e5b32a] active:opacity-60"
            title="New note"
          >
            <Pencil size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-[#8e8e93] text-[13px] font-medium leading-[18px] uppercase tracking-[0.02em]">
            All Notes
          </div>
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => openNote(note.id)}
              className="w-full flex flex-col items-start px-4 py-3.5 border-b border-[#38383a] text-left active:bg-white/5 transition-colors"
            >
              <p className="text-[17px] font-medium leading-[22px] text-white truncate w-full">
                {note.title || 'Untitled'}
              </p>
              <p className="text-[15px] font-normal leading-[20px] text-[#8e8e93] truncate w-full mt-0.5">
                {previewFromNote(note, 45)}
              </p>
              <p className="text-[11px] font-normal leading-[13px] text-[#8e8e93] mt-1.5">
                {formatNoteDate(note.updatedAt)}
              </p>
            </button>
          ))}
        </div>
        {toast && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[350] px-5 py-2.5 rounded-xl bg-[#2c2c2e] text-white text-[13px] font-medium leading-[18px] animate-in fade-in duration-200">
            {toast}
          </div>
        )}
        <div className="h-[env(safe-area-inset-bottom)] bg-[#1c1c1e]" />
      </div>
    );
  }

  // ——— Editor view (Keep) — Material: 22sp title, 16sp body, 12sp caption, 14sp menu
  if (os === 'android') {
    return (
      <div className={`notes-keep fixed inset-0 flex flex-col overflow-hidden animate-in fade-in duration-300 z-[300] ${keepColor.bg} ${isLightKeep ? 'text-[#202124]' : 'text-[#e8eaed]'}`}>
        <div className="h-[env(safe-area-inset-top)] bg-[#1a1a1a]" />
        <div className="flex justify-between items-center px-2 py-2 min-h-[56px]">
          <button
            type="button"
            onClick={closeEditor}
            className="p-3 rounded-full transition-colors active:bg-black/10"
            style={{ color: isLightKeep ? '#5f6368' : '#9aa0a6' }}
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`p-3 rounded-full transition-colors active:bg-black/10 ${isPinned ? 'opacity-100' : 'opacity-70'}`}
              style={{ color: isLightKeep ? '#5f6368' : '#9aa0a6' }}
            >
              <Pin size={20} className={isPinned ? 'fill-current' : ''} />
            </button>
            <button
              type="button"
              onClick={() => showToastMsg('Reminder set')}
              className="p-3 rounded-full transition-colors active:bg-black/10"
              style={{ color: isLightKeep ? '#5f6368' : '#9aa0a6' }}
            >
              <Bell size={20} />
            </button>
            <button
              type="button"
              onClick={primaryActionHandler}
              className="px-4 py-2 text-[14px] font-medium rounded-lg transition-colors active:bg-black/10"
              style={{ color: isLightKeep ? '#1a73e8' : '#e8eaed' }}
            >
              {primaryActionLabel}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          <input
            ref={titleRef}
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none text-[22px] font-normal leading-[28px] placeholder-[#5f6368] mb-0.5"
            style={{ color: isLightKeep ? '#202124' : '#e8eaed' }}
            autoComplete="off"
            enterKeyHint="next"
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Note"
            className="w-full bg-transparent border-none outline-none text-[16px] font-normal leading-[24px] resize-none min-h-[120px] placeholder-[#5f6368]"
            style={{ color: isLightKeep ? '#202124' : '#e8eaed' }}
            spellCheck={false}
            autoComplete="off"
            enterKeyHint="done"
          />
          {checklistItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <button
                type="button"
                className="mt-1 shrink-0 rounded-full border-2 w-5 h-5 flex items-center justify-center transition-colors active:scale-95"
                style={{ borderColor: isLightKeep ? '#5f6368' : '#9aa0a6' }}
              >
                <Check size={12} className="opacity-0" />
              </button>
              <input
                type="text"
                value={item}
                onChange={(e) => updateChecklistItem(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !item && checklistItems.length > 0) {
                    e.preventDefault();
                    removeChecklistItem(i);
                  }
                }}
                placeholder="List item"
                className="flex-1 bg-transparent border-none outline-none text-[16px] leading-[24px] placeholder-[#5f6368]"
                style={{ color: isLightKeep ? '#202124' : '#e8eaed' }}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => removeChecklistItem(i)}
                className="p-1 rounded-full active:bg-black/10"
                style={{ color: isLightKeep ? '#5f6368' : '#9aa0a6' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div
          className="px-3 py-2 flex justify-between items-center border-t min-h-[56px]"
          style={{ borderColor: isLightKeep ? 'rgba(0,0,0,0.08)' : '#3c4043' }}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => showToastMsg('Image placeholder')}
              className="p-2.5 rounded-full transition-colors active:bg-black/10"
              style={{ color: isLightKeep ? '#5f6368' : '#9aa0a6' }}
            >
              <ImageIcon size={20} />
            </button>
            <button type="button" onClick={handleAddChecklistItem} className="p-2.5 rounded-full transition-colors active:bg-black/10" style={{ color: isLightKeep ? '#5f6368' : '#9aa0a6' }}>
              <ListTodo size={20} />
            </button>
            <button type="button" onClick={() => showToastMsg('Drawing not available')} className="p-2.5 rounded-full transition-colors active:bg-black/10" style={{ color: isLightKeep ? '#5f6368' : '#9aa0a6' }}>
              <Edit3 size={20} />
            </button>
            <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} className="p-2.5 rounded-full transition-colors active:bg-black/10" style={{ color: isLightKeep ? '#5f6368' : '#9aa0a6' }}>
              <Palette size={20} />
            </button>
          </div>
          <div className="text-[12px] font-normal leading-[16px]" style={{ color: isLightKeep ? '#5f6368' : '#9aa0a6' }}>
            Edited {editedTime}
          </div>
          <div className="relative">
            <button type="button" onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2.5 rounded-full transition-colors active:bg-black/10" style={{ color: isLightKeep ? '#5f6368' : '#9aa0a6' }}>
              <MoreHorizontal size={20} />
            </button>
            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute right-0 bottom-full mb-1 py-1 rounded-lg shadow-xl border z-20 min-w-[160px]" style={{ backgroundColor: isLightKeep ? '#fff' : '#303134', borderColor: isLightKeep ? '#e0e0e0' : '#5f6368' }}>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(getFinalContent()); showToastMsg('Copy of note created'); setShowMoreMenu(false); }} className="w-full px-4 py-2.5 text-left text-[14px] leading-[20px]" style={{ color: isLightKeep ? '#202124' : '#e8eaed' }}>
                    Make a copy
                  </button>
                  <button type="button" onClick={() => { handleTrashInEditor(); setShowMoreMenu(false); }} className="w-full px-4 py-2.5 text-left text-[14px] leading-[20px] text-red-500">
                    Delete note
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {showColorPicker && (
          <div className="px-3 py-2 flex gap-2 flex-wrap border-t" style={{ borderColor: isLightKeep ? 'rgba(0,0,0,0.08)' : '#3c4043' }}>
            {KEEP_COLORS.map((c, i) => (
              <button key={c.name} type="button" onClick={() => { setKeepColorIndex(i); setShowColorPicker(false); }} className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-95 ${c.bg} ${keepColorIndex === i ? 'border-white ring-2 ring-offset-2 ring-[#1a73e8]' : 'border-transparent'}`} />
            ))}
          </div>
        )}
        {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[350] px-4 py-2.5 rounded-lg bg-[#303134] text-[#e8eaed] text-[14px] font-normal leading-[20px] animate-in fade-in slide-in-from-bottom-2 duration-200">
            {toast}
          </div>
        )}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    );
  }

  // ——— Editor view (iOS) — SF Pro: 17pt nav/body, 13pt caption, 20pt title, 15pt secondary/menu
  return (
    <div className="notes-ios fixed inset-0 bg-[#1c1c1e] text-white flex flex-col overflow-hidden animate-in fade-in duration-300 z-[300]">
      <div className="h-[env(safe-area-inset-top)] bg-[#1c1c1e]" />
      <div className="flex justify-between items-center px-4 py-3 min-h-[44px] bg-[#1c1c1e] border-b border-[#38383a]">
        <button type="button" onClick={closeEditor} className="flex items-center gap-1 text-[#e5b32a] text-[17px] font-medium leading-[22px] active:opacity-60 transition-opacity -ml-2">
          <ChevronLeft size={24} />
          <span>Notes</span>
        </button>
        <div className="flex items-center gap-6">
          <button type="button" onClick={handleShare} className="text-[#e5b32a] active:opacity-60 transition-opacity p-1">
            <Share size={22} />
          </button>
          <button type="button" onClick={primaryActionHandler} className="text-[#e5b32a] font-semibold text-[17px] leading-[22px] active:opacity-60 transition-opacity">
            {primaryActionLabel}
          </button>
        </div>
      </div>
      <div className="text-center text-[#8e8e93] text-[13px] font-medium leading-[18px] py-2 uppercase tracking-[0.02em]">
        {currentDate}
      </div>
      <div className="flex-1 px-5 pb-4 overflow-y-auto">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Title"
          className="w-full bg-transparent border-none outline-none text-[20px] font-semibold leading-[25px] text-white placeholder-[#48484a] mb-1"
          autoComplete="off"
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New Note"
          className="w-full bg-transparent border-none outline-none text-[17px] font-normal leading-[22px] resize-none min-h-[200px] placeholder-[#48484a] caret-[#e5b32a]"
          spellCheck={false}
          autoComplete="off"
          enterKeyHint="done"
        />
        {checklistItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <button type="button" className="shrink-0 w-6 h-6 rounded-full border-2 border-[#e5b32a] flex items-center justify-center">
              <Check size={14} className="text-[#e5b32a] opacity-0" />
            </button>
            <input
              type="text"
              value={item}
              onChange={(e) => updateChecklistItem(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Backspace' && !item && checklistItems.length > 0) { e.preventDefault(); removeChecklistItem(i); } }}
              placeholder="List item"
              className="flex-1 bg-transparent border-none outline-none text-[17px] font-normal leading-[22px] text-white placeholder-[#48484a]"
              autoComplete="off"
            />
            <button type="button" onClick={() => removeChecklistItem(i)} className="p-1 text-[#8e8e93] active:opacity-60">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      <div className="border-t border-[#38383a] bg-[#1c1c1e] px-6 py-3 flex justify-between items-center pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button type="button" onClick={handleAddChecklistItem} className="text-[#e5b32a] active:opacity-60 transition-opacity p-2">
          <CheckSquare size={24} />
        </button>
        <div className="flex items-center gap-8">
          <button type="button" onClick={() => textareaRef.current?.focus()} className="text-[#e5b32a] active:opacity-60 transition-opacity p-2">
            <Edit3 size={22} />
          </button>
          <button type="button" onClick={handleTrashInEditor} className="text-[#e5b32a] active:opacity-60 transition-opacity p-2">
            <Trash2 size={22} />
          </button>
          <div className="relative">
            <button type="button" onClick={() => setShowMoreMenu(!showMoreMenu)} className="text-[#e5b32a] active:opacity-60 transition-opacity p-2">
              <MoreHorizontal size={22} />
            </button>
            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute right-0 bottom-full mb-2 py-1 rounded-xl bg-[#2c2c2e] border border-[#38383a] shadow-xl z-20 min-w-[180px]">
                  <button type="button" onClick={() => { navigator.clipboard.writeText(getFinalContent()); showToastMsg('Copied'); setShowMoreMenu(false); }} className="w-full px-4 py-3 text-left text-[15px] font-normal leading-[20px] text-white">
                    Copy
                  </button>
                  <button type="button" onClick={() => { handleTrashInEditor(); setShowMoreMenu(false); }} className="w-full px-4 py-3 text-left text-[15px] font-normal leading-[20px] text-red-400">
                    Delete Note
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[350] px-5 py-2.5 rounded-xl bg-[#2c2c2e] text-white text-[13px] font-medium leading-[18px] animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toast}
        </div>
      )}
      <div className="h-[env(safe-area-inset-bottom)] bg-[#1c1c1e]" />
    </div>
  );
};

export default NotesInterface;
