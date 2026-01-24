
import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, ShieldAlert, LogOut, Link as LinkIcon, Copy } from 'lucide-react';
import { PerformerUser } from '../types';
import { getAllPerformers, createPerformer, deletePerformer } from '../services/firestoreService';
import ConfirmDialog from './ConfirmDialog';
import Toast, { ToastType } from './Toast';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [performers, setPerformers] = useState<PerformerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [performerToDelete, setPerformerToDelete] = useState<{id: string, slug: string} | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ isVisible: boolean, message: string, type: ToastType }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  useEffect(() => {
    fetchPerformers();
  }, []);

  const fetchPerformers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPerformers();
      setPerformers(data);
    } catch (error) {
      console.error("Error fetching performers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (newName.trim().length < 3) {
      errors.name = "Name must be at least 3 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUsername)) {
      errors.username = "Please enter a valid email address";
    }

    if (newPassword.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newSlug)) {
      errors.slug = "Link name can only contain small letters, numbers, and dashes";
    }

    if (performers.some(p => p.slug === newSlug.toLowerCase())) {
      errors.slug = "This custom link is already taken";
    }
    if (performers.some(p => p.username.toLowerCase() === newUsername.toLowerCase())) {
      errors.username = "This email is already registered";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddPerformer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const newUser: PerformerUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName.trim(),
      username: newUsername.trim().toLowerCase(),
      password: newPassword,
      slug: newSlug.toLowerCase().trim(),
      lastLogin: new Date().toISOString()
    };
    
    try {
      await createPerformer(newUser);
      await fetchPerformers();
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewSlug('');
      setFormErrors({});
      setShowAddForm(false);
      showToast('Performer created successfully');
    } catch (error) {
      console.error("Error creating performer:", error);
      showToast('Failed to create performer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (performerToDelete) {
      try {
        await deletePerformer(performerToDelete.id, performerToDelete.slug);
        await fetchPerformers();
        showToast('Performer deleted');
      } catch (error) {
        console.error("Error deleting performer:", error);
        showToast('Failed to delete performer', 'error');
      } finally {
        setIsDeleteDialogOpen(false);
        setPerformerToDelete(null);
      }
    }
  };

  const handleDeleteClick = (id: string, slug: string) => {
    setPerformerToDelete({ id, slug });
    setIsDeleteDialogOpen(true);
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard');
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    showToast('Email copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <ShieldAlert className="text-black w-5 h-5" />
            </div>
            <span className="text-sm font-bold tracking-tight">Admin Dashboard</span>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-500/60 hover:text-red-500 text-xs transition-all"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-1">
              <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60">
                Total: {performers.length}
              </span>
            </div>
            <p className="text-white/40 text-sm">Manage performer accounts and access links</p>
          </div>
          
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-lg text-sm font-semibold hover:bg-white/90 transition-all active:scale-95"
          >
            <Plus size={16} />
            {showAddForm ? 'Cancel' : 'Create Performer'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddPerformer} className="mb-12 p-8 bg-white/5 border border-white/10 rounded-xl animate-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
              <div className="space-y-2">
                <label className="text-xs text-white/60 font-medium">Performer Name</label>
                <input
                  type="text"
                  placeholder="e.g. The Great Illusionist"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (formErrors.name) setFormErrors({...formErrors, name: ''});
                  }}
                  className={`w-full bg-black/40 border ${formErrors.name ? 'border-red-500/50' : 'border-white/10'} p-4 text-sm outline-none focus:border-white/30 rounded-lg transition-all text-white`}
                  required
                />
                {formErrors.name ? (
                  <p className="text-xs text-red-500">{formErrors.name}</p>
                ) : (
                  <p className="text-xs text-white/30">Used for internal identification.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/60 font-medium">Custom Link Name</label>
                <input
                  type="text"
                  placeholder="e.g. yash"
                  value={newSlug}
                  onChange={(e) => {
                    setNewSlug(e.target.value);
                    if (formErrors.slug) setFormErrors({...formErrors, slug: ''});
                  }}
                  className={`w-full bg-black/40 border ${formErrors.slug ? 'border-red-500/50' : 'border-white/10'} p-4 text-sm outline-none focus:border-white/30 rounded-lg transition-all text-white`}
                  required
                />
                {formErrors.slug ? (
                  <p className="text-xs text-red-500">{formErrors.slug}</p>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-white/30">Spectator URL: {window.location.origin}/<strong>{newSlug || 'name'}</strong></p>
                    {newSlug && (
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/${newSlug}`;
                          navigator.clipboard.writeText(url);
                          showToast('Spectator link copied');
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-white/40 hover:text-white transition-colors shrink-0"
                      >
                        <Copy size={12} />
                        Copy
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/60 font-medium">Login Email</label>
                <input
                  type="email"
                  placeholder="e.g. magician@email.com"
                  value={newUsername}
                  onChange={(e) => {
                    setNewUsername(e.target.value);
                    if (formErrors.username) setFormErrors({...formErrors, username: ''});
                  }}
                  className={`w-full bg-black/40 border ${formErrors.username ? 'border-red-500/50' : 'border-white/10'} p-4 text-sm outline-none focus:border-white/30 rounded-lg transition-all text-white`}
                  required
                />
                {formErrors.username && (
                  <p className="text-xs text-red-500">{formErrors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/60 font-medium">Login Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (formErrors.password) setFormErrors({...formErrors, password: ''});
                  }}
                  className={`w-full bg-black/40 border ${formErrors.password ? 'border-red-500/50' : 'border-white/10'} p-4 text-sm outline-none focus:border-white/30 rounded-lg transition-all text-white`}
                  required
                />
                {formErrors.password && (
                  <p className="text-xs text-red-500">{formErrors.password}</p>
                )}
              </div>
            </div>
            <button 
              disabled={isSubmitting}
              className="bg-white text-black hover:bg-white/90 disabled:opacity-50 px-8 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95"
            >
              {isSubmitting ? 'Creating...' : 'Save & Create Performer'}
            </button>
          </form>
        )}

        {/* User Table */}
        <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.02]">
          <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_120px] p-4 border-b border-white/5 text-xs font-medium text-white/40">
            <span>No.</span>
            <span>Performer</span>
            <span>Login Email</span>
            <span>Spectator Link</span>
            <span>Last Seen</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="p-12 text-center text-white/30 text-sm animate-pulse">
                Loading performers...
              </div>
            ) : performers.map((performer, index) => (
              <div key={performer.id} className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_120px] p-4 items-center text-sm text-white/70 hover:bg-white/[0.02] transition-colors group">
                <span className="text-xs text-white/30">{(index + 1).toString().padStart(2, '0')}</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-white">{performer.name}</span>
                  <span className="text-xs text-white/30">ID: {performer.id}</span>
                </div>
                <div className="flex items-center gap-2 pr-4 min-w-0">
                  <span className="text-white/50 truncate text-sm">{performer.username}</span>
                  <button onClick={() => copyEmail(performer.username)} className="p-1 hover:text-white text-white/30 transition-colors shrink-0">
                    <Copy size={12} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-sm">/{performer.slug}</span>
                  <button onClick={() => copyLink(performer.slug)} className="p-1 hover:text-white text-white/30 transition-colors">
                    <LinkIcon size={12} />
                  </button>
                </div>
                <span className="text-xs text-white/40">{formatDate(performer.lastLogin)}</span>
                <div className="text-right">
                  <button 
                    onClick={() => handleDeleteClick(performer.id, performer.slug)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-medium"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Performer"
        message="This will permanently remove the performer and their dedicated sync room. This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        confirmText="Confirm Delete"
      />

      <Toast 
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default AdminDashboard;
