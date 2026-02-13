'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface AuthUser {
  id: string;
  username: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthMode = 'login' | 'register';

function AuthModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsSubmitting(false);
      setUsername('');
      setPassword('');
      setMode('login');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async () => {
    if (!username.trim() || !password.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Authentication failed.');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'login' ? 'Log in to enable all actions.' : 'Create an account to enable all actions.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            data-auth-exempt="true"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Any unique username"
              autoComplete="username"
              data-auth-exempt="true"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Any password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              data-auth-exempt="true"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting || !username.trim() || !password.trim()}
            className="flex-1 px-4 py-2.5 rounded-lg text-white font-semibold bg-ivy-gradient disabled:opacity-50"
            data-auth-exempt="true"
          >
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium"
            data-auth-exempt="true"
          >
            {mode === 'login' ? 'Need account?' : 'Have account?'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!response.ok) {
        setUser(null);
        return;
      }
      const data = await response.json();
      setUser(data.user || null);
    } catch (_error) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await refreshAuth();
      setIsLoading(false);
    };
    run();
  }, [refreshAuth]);

  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  useEffect(() => {
    const onAuthRequired = () => {
      if (!user) {
        setAuthModalOpen(true);
      }
    };

    window.addEventListener('ivy-auth-required', onAuthRequired);
    return () => window.removeEventListener('ivy-auth-required', onAuthRequired);
  }, [user]);

  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (user) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-auth-exempt="true"]')) return;

      const buttonLike = target.closest('button');
      if (!buttonLike) return;

      event.preventDefault();
      event.stopPropagation();
      setAuthModalOpen(true);
    };

    const onSubmitCapture = (event: Event) => {
      if (user) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-auth-exempt="true"]')) return;
      event.preventDefault();
      event.stopPropagation();
      setAuthModalOpen(true);
    };

    document.addEventListener('click', onClickCapture, true);
    document.addEventListener('submit', onSubmitCapture, true);
    return () => {
      document.removeEventListener('click', onClickCapture, true);
      document.removeEventListener('submit', onSubmitCapture, true);
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      authModalOpen,
      openAuthModal,
      closeAuthModal,
      refreshAuth,
      logout,
    }),
    [authModalOpen, closeAuthModal, isLoading, logout, openAuthModal, refreshAuth, user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        onSuccess={async () => {
          await refreshAuth();
          setAuthModalOpen(false);
        }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
