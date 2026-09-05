import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In-memory/localStorage mock auth for AI Studio preview
function createMockAuthClient(): any {
  const STORAGE_KEY = 'storyengine_mock_session';

  const defaultUser = {
    id: 'demo-user-123',
    email: 'creator@storyengine.ai',
    user_metadata: { display_name: 'Story Creator' },
    app_metadata: { provider: 'email' },
    created_at: new Date().toISOString(),
  };

  const getStoredSession = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // fallback
    }
    // Default to authenticated demo user so app is immediately usable
    const initialSession = {
      access_token: 'demo-session-token-story-engine',
      token_type: 'bearer',
      user: defaultUser,
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSession));
    } catch (e) {}
    return initialSession;
  };

  let currentSession = getStoredSession();
  const listeners = new Set<(event: string, session: any) => void>();

  const notify = (event: string) => {
    listeners.forEach((listener) => {
      try {
        listener(event, currentSession);
      } catch (e) {
        console.error('Auth listener error:', e);
      }
    });
  };

  return {
    auth: {
      async getSession() {
        return { data: { session: currentSession }, error: null };
      },
      async getUser() {
        return { data: { user: currentSession?.user || null }, error: null };
      },
      async signInWithPassword({ email }: { email: string; password?: string }) {
        currentSession = {
          access_token: 'demo-session-token-story-engine',
          token_type: 'bearer',
          user: {
            ...defaultUser,
            email: email || 'creator@storyengine.ai',
          },
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSession));
        } catch (e) {}
        notify('SIGNED_IN');
        return { data: { user: currentSession.user, session: currentSession }, error: null };
      },
      async signUp({ email }: { email: string; password?: string }) {
        return this.signInWithPassword({ email });
      },
      async setSession(session: any) {
        currentSession = session;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSession));
        } catch (e) {}
        notify('SIGNED_IN');
        return { data: { session: currentSession, user: currentSession?.user }, error: null };
      },
      async signOut() {
        currentSession = null;
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
        notify('SIGNED_OUT');
        return { error: null };
      },
      onAuthStateChange(callback: (event: string, session: any) => void) {
        listeners.add(callback);
        // Call callback asynchronously with current session
        setTimeout(() => callback(currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', currentSession), 0);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                listeners.delete(callback);
              },
            },
          },
        };
      },
    },
    // Stub for direct supabase.from calls if any exist in frontend
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
  };
}

const isRealSupabase = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your_supabase_') &&
  supabaseUrl.startsWith('http')
);

export const supabase: any = isRealSupabase
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockAuthClient();

