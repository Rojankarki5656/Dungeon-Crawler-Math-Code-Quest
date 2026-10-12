import { useState } from 'react';
import { useAuthStore } from '@/state/authStore';
import { AuthError } from '@/lib/auth';
import { PixelPanel } from './pixel/PixelPanel';
import { PixelButton } from './pixel/PixelButton';
import { PixelText } from './pixel/PixelText';
import { ConnectionBadge } from './ConnectionBadge';

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL: 'EMAIL LOOKS INVALID',
  PASSWORD_LENGTH_8_72: 'PASSWORD MUST BE 8+ CHARS',
  PLAYER_NAME_LENGTH_3_20: 'NAME MUST BE 3-20 CHARS',
  PLAYER_NAME_INVALID_CHARS: 'NAME: A-Z 0-9 _ - ONLY',
  EMAIL_TAKEN: 'EMAIL ALREADY REGISTERED',
  PLAYER_NAME_TAKEN: 'NAME ALREADY TAKEN',
  INVALID_CREDENTIALS: 'WRONG EMAIL OR PASSWORD',
  UNKNOWN_ERROR: 'SOMETHING WENT WRONG',
};

export function AuthScreen() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const login = useAuthStore((s) => s.login);
  const signup = useAuthStore((s) => s.signup);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await signup(email, password, playerName);
      }
    } catch (err) {
      const code = err instanceof AuthError ? err.code : 'UNKNOWN_ERROR';
      setError(ERROR_MESSAGES[code] ?? code);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[480px] space-y-5">
        <div className="text-center">
          <PixelText size="xl" color="#ffd166" className="block px-float">
            DUNGEON
          </PixelText>
          <PixelText size="lg" color="#4a7fd4" className="mt-3 block">
            MATH / CODE QUEST
          </PixelText>
          <div className="mt-4 flex justify-center">
            <ConnectionBadge />
          </div>
        </div>

        <PixelPanel
          title={tab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          className="p-5 pt-7"
        >
          <div className="mb-5 flex gap-2">
            <PixelButton
              variant={tab === 'login' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => { setTab('login'); setError(null); }}
              className="flex-1"
              type="button"
            >
              LOGIN
            </PixelButton>
            <PixelButton
              variant={tab === 'signup' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => { setTab('signup'); setError(null); }}
              className="flex-1"
              type="button"
            >
              SIGN UP
            </PixelButton>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {tab === 'signup' && (
              <Field label="HERO NAME">
                <input
                  className="px-input w-full px-3 py-3 text-[12px] tracking-widest"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.replace(/[^A-Za-z0-9_\-]/g, '').slice(0, 20))}
                  placeholder="ARCANE_7"
                  autoComplete="nickname"
                  spellCheck={false}
                />
              </Field>
            )}

            <Field label="EMAIL">
              <input
                type="email"
                className="px-input w-full px-3 py-3 text-[12px] tracking-widest"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 120))}
                placeholder="hero@dungeon.dev"
                autoComplete="email"
                spellCheck={false}
              />
            </Field>

            <Field label="PASSWORD">
              <input
                type="password"
                className="px-input w-full px-3 py-3 text-[12px] tracking-widest"
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, 72))}
                placeholder="••••••••"
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
              />
            </Field>

            {error && (
              <div
                className="px-3 py-2"
                style={{
                  background: 'rgba(224,65,65,0.1)',
                  border: '2px solid rgba(224,65,65,0.5)',
                }}
              >
                <PixelText size="xs" color="#e04141">{error}</PixelText>
              </div>
            )}

            <PixelButton
              type="submit"
              full
              size="lg"
              variant={tab === 'login' ? 'primary' : 'good'}
              disabled={busy || !email || !password || (tab === 'signup' && !playerName)}
            >
              {busy ? 'WORKING...' : tab === 'login' ? 'ENTER DUNGEON' : 'CREATE HERO'}
            </PixelButton>
          </form>

          <div className="mt-5 border-t-2 border-px-border pt-4">
            <PixelText size="xs" color="#55678a">
              {tab === 'login'
                ? 'NO ACCOUNT YET? CLICK SIGN UP.'
                : 'PASSWORD MIN 8 CHARS · NAME 3-20 CHARS.'}
            </PixelText>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <PixelText size="xs" color="#8fa3c8" className="mb-2 block">{label}</PixelText>
      {children}
    </div>
  );
}