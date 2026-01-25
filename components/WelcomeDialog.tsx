import React, { useState } from 'react';
import { X, CheckCircle, Copy, Smartphone, Globe, CopyCheck } from 'lucide-react';

interface WelcomeDialogProps {
  isOpen: boolean;
  performerName: string;
  loginEmail: string;
  password: string;
  spectatorLink: string;
  onClose: () => void;
}

const WelcomeDialog: React.FC<WelcomeDialogProps> = ({
  isOpen,
  performerName,
  loginEmail,
  password,
  spectatorLink,
  onClose
}) => {
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyCompleteMessage = () => {
    const loginUrl = `${window.location.origin}/login`;
    
    const completeMessage = `✅ ${performerName}

🚨 IMPORTANT — Login after adding to Home Screen🚨

Welcome ${performerName}! Thank you for purchasing YoutubeMagic — get ready to blow minds with this amazing tool!

Android installation
	1.	Open this link in Chrome: ${loginUrl}
	2.	Tap the 3 dots (top-right) → Add to Home Screen
	3.	Tap Install, wait a few seconds, the app will appear on your home screen.

iPhone installation
	1.	Open Safari and go to: ${loginUrl}
	2.	Tap the Share icon
	3.	Scroll → Add to Home Screen

Login ID: ${loginEmail}
Password: ${password}`;

    navigator.clipboard.writeText(completeMessage);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const loginUrl = `${window.location.origin}/login`;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="sticky top-0 bg-[#1c1c1e] border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-500 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{performerName}</h2>
              <p className="text-xs text-white/40">Performer Created Successfully</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} className="text-white/40" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Important Notice */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🚨</div>
              <div>
                <h3 className="text-sm font-bold text-red-400 mb-1">IMPORTANT — Login after adding to Home Screen</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Welcome {performerName}! Thank you for purchasing YoutubeMagic — get ready to blow minds with this amazing tool!
                </p>
              </div>
            </div>
          </div>

          {/* Android Installation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="text-blue-400 w-5 h-5" />
              <h3 className="text-sm font-semibold text-white">Android Installation</h3>
            </div>
            <ol className="space-y-2 text-xs text-white/70 ml-7 list-decimal">
              <li>
                Open this link in Chrome:{' '}
                <a href={loginUrl} target="_blank" className="text-blue-400 hover:underline">
                  {loginUrl}
                </a>
              </li>
              <li>Tap the 3 dots (top-right) → Add to Home Screen</li>
              <li>Tap Install, wait a few seconds, the app will appear on your home screen.</li>
            </ol>
          </div>

          {/* iPhone Installation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="text-blue-400 w-5 h-5" />
              <h3 className="text-sm font-semibold text-white">iPhone Installation</h3>
            </div>
            <ol className="space-y-2 text-xs text-white/70 ml-7 list-decimal">
              <li>
                Open Safari and go to:{' '}
                <a href={loginUrl} target="_blank" className="text-blue-400 hover:underline">
                  {loginUrl}
                </a>
              </li>
              <li>Tap the Share icon</li>
              <li>Scroll → Add to Home Screen</li>
            </ol>
          </div>

          {/* Login Credentials */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Login Credentials</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Login ID</p>
                  <p className="text-sm text-white font-mono">{loginEmail}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(loginEmail, 'Login ID')}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Copy Login ID"
                >
                  <Copy size={16} className="text-white/60" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Password</p>
                  <p className="text-sm text-white font-mono">{password}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(password, 'Password')}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Copy Password"
                >
                  <Copy size={16} className="text-white/60" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                <div className="flex-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Spectator Link</p>
                  <p className="text-sm text-white font-mono break-all">{spectatorLink}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(spectatorLink, 'Spectator Link')}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                  title="Copy Spectator Link"
                >
                  <Copy size={16} className="text-white/60" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1c1c1e] border-t border-white/10 p-6 space-y-3">
          <button
            onClick={copyCompleteMessage}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {copiedAll ? (
              <>
                <CopyCheck size={18} />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                <span>Copy Complete Message</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeDialog;
