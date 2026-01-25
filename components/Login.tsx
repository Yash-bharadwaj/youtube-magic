
import React, { useState, useEffect } from 'react';
import { Youtube, Lock, User, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';
import { getAllPerformers } from '../services/firestoreService';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for saved credentials on mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('rememberedCredentials');
    if (savedCredentials) {
      try {
        const { username: savedUsername, password: savedPassword } = JSON.parse(savedCredentials);
        setUsername(savedUsername);
        setPassword(savedPassword);
        setRememberMe(true);
        // Auto-login if credentials are saved
        handleAutoLogin(savedUsername, savedPassword);
      } catch (e) {
        console.error('Error loading saved credentials:', e);
      }
    }
  }, []);

  const handleAutoLogin = async (savedUsername: string, savedPassword: string) => {
    try {
      const performers = await getAllPerformers();
      const trimmedUsername = savedUsername.trim().toLowerCase();
      const trimmedPassword = savedPassword.trim();
      
      const user = performers.find(p => {
        const dbUsername = p.username.trim().toLowerCase();
        const dbPassword = (p as any).password || '';
        return dbUsername === trimmedUsername && dbPassword === trimmedPassword;
      });
      
      if (user) {
        onLogin(user);
      } else if (savedUsername === 'admin' && savedPassword === 'admin') {
        onLogin({ username: 'admin', role: 'ADMIN', slug: 'admin-room' });
      }
    } catch (err) {
      console.error("Auto-login error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const performers = await getAllPerformers();
      const trimmedUsername = username.trim().toLowerCase();
      const trimmedPassword = password.trim();
      
      const user = performers.find(p => {
        const dbUsername = p.username.trim().toLowerCase();
        const dbPassword = (p as any).password || '';
        return dbUsername === trimmedUsername && dbPassword === trimmedPassword;
      });
      
      if (user) {
        // Save credentials if "Remember Me" is checked
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            username: trimmedUsername,
            password: trimmedPassword
          }));
        } else {
          localStorage.removeItem('rememberedCredentials');
        }
        onLogin(user);
      } else if (username === 'admin' && password === 'admin') {
        // Save credentials if "Remember Me" is checked
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            username: 'admin',
            password: 'admin'
          }));
        } else {
          localStorage.removeItem('rememberedCredentials');
        }
        onLogin({ username: 'admin', role: 'ADMIN', slug: 'admin-room' });
      } else {
        setError('Invalid credentials or system offline.');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('Connection failure.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-16 text-center animate-in fade-in duration-1000">
      <div className="flex flex-col items-center gap-2 mb-12">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-4">
          <Youtube className="text-[#FF0000] w-9 h-9 fill-current" />
        </div>
        <h1 className="text-sm font-semibold text-white tracking-tight">
          YoutubeMagic
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-[320px] space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
            <input
              type="text"
              placeholder="Your Username / Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs tracking-widest outline-none focus:border-white/30 transition-all placeholder:text-white/10 text-white lowercase"
              autoComplete="username"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-xs tracking-widest outline-none focus:border-white/30 transition-all placeholder:text-white/10 text-white normal-case"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-2 focus:ring-white/20 cursor-pointer"
          />
          <label htmlFor="rememberMe" className="text-xs text-white/60 cursor-pointer">
            Remember me
          </label>
        </div>

        {error && <p className="text-red-500/60 text-[10px] uppercase tracking-widest animate-pulse">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-xl bg-white text-black font-bold text-xs tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 relative overflow-hidden flex items-center justify-center group"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
              <span>LOGIN TO PORTAL</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;
