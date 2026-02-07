import React, { useState, useCallback } from 'react';
import { Settings } from 'lucide-react';

const STORAGE_ENABLED = 'enigma_notes_autoSubmitEnabled';
const STORAGE_SECONDS = 'enigma_notes_autoSubmitSeconds';
const MIN_SECONDS = 1;
const MAX_SECONDS = 60;

export interface AutoSubmitSettings {
  enabled: boolean;
  seconds: number;
}

interface NotesPerformerSettingsProps {
  enabled: boolean;
  seconds: number;
  onSettingsChange: (settings: AutoSubmitSettings) => void;
}

export function loadAutoSubmitSettings(): AutoSubmitSettings {
  try {
    const enabled = localStorage.getItem(STORAGE_ENABLED);
    const seconds = localStorage.getItem(STORAGE_SECONDS);
    return {
      enabled: enabled === 'true',
      seconds: seconds != null ? Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, parseInt(seconds, 10) || 4)) : 4,
    };
  } catch {
    return { enabled: false, seconds: 4 };
  }
}

function saveAutoSubmitSettings(settings: AutoSubmitSettings) {
  try {
    localStorage.setItem(STORAGE_ENABLED, String(settings.enabled));
    localStorage.setItem(STORAGE_SECONDS, String(settings.seconds));
  } catch (_) {}
}

const NotesPerformerSettings: React.FC<NotesPerformerSettingsProps> = ({
  enabled,
  seconds,
  onSettingsChange,
}) => {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(() => String(seconds));

  const persistAndNotify = useCallback(
    (next: AutoSubmitSettings) => {
      saveAutoSubmitSettings(next);
      onSettingsChange(next);
    },
    [onSettingsChange]
  );

  const setEnabled = (value: boolean) => {
    persistAndNotify({ enabled: value, seconds });
  };

  const setSeconds = (value: number) => {
    const clamped = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, value));
    persistAndNotify({ enabled, seconds: clamped });
    setInputVal(String(clamped));
  };

  const handleInputBlur = () => {
    const n = parseInt(inputVal, 10);
    if (!Number.isNaN(n)) setSeconds(n);
    else setInputVal(String(seconds));
  };

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) setInputVal(String(seconds));
  };

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[400] flex flex-col items-end">
      {open && (
        <>
          <div className="fixed inset-0 z-[400]" aria-hidden onClick={() => setOpen(false)} />
          <div className="relative z-[401] w-64 rounded-xl bg-[#1c1c1e] border border-[#38383a] shadow-xl p-4 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <p className="text-[#8e8e93] text-[12px] leading-[16px] mb-3">
              If you don&apos;t tap Done, the note will send automatically after the time below.
            </p>
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-[#e8eaed] text-[13px]">Auto-submit after time</span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled(!enabled)}
                className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                  enabled ? 'bg-[#e5b32a]' : 'bg-[#38383a]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    enabled ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            {enabled && (
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="number"
                  min={MIN_SECONDS}
                  max={MAX_SECONDS}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onBlur={handleInputBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                      handleInputBlur();
                      setOpen(false);
                    }
                  }}
                  className="w-14 bg-[#2c2c2e] border border-[#38383a] rounded-lg px-2 py-1.5 text-white text-[13px] text-center outline-none focus:border-[#e5b32a]"
                />
                <span className="text-[#8e8e93] text-[12px]">sec</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (enabled) {
                  const n = parseInt(inputVal, 10);
                  if (!Number.isNaN(n)) setSeconds(Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, n)));
                }
                setOpen(false);
              }}
              className="w-full py-2 rounded-lg bg-[#e5b32a] text-black text-[13px] font-medium active:opacity-90"
            >
              Done
            </button>
          </div>
        </>
      )}
      <button
        type="button"
        onClick={handleOpen}
        className="w-11 h-11 rounded-full bg-[#2c2c2e] border border-[#38383a] flex items-center justify-center text-[#e5b32a] shadow-lg active:scale-95 transition-transform"
        aria-label="Settings"
      >
        <Settings size={20} />
      </button>
    </div>
  );
};

export default NotesPerformerSettings;
