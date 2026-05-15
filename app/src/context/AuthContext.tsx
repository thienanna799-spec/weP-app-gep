import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import api, { setToken, clearToken } from '../services/api';
import { UserProfile } from '../types/user.types';

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: { uid: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] Setting up onAuthStateChanged listener...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AuthContext] onAuthStateChanged fired, user:', firebaseUser?.email || 'null');
      if (firebaseUser) {
        try {
          console.log('[AuthContext] Getting ID token...');
          const idToken = await firebaseUser.getIdToken();
          console.log('[AuthContext] Got ID token, calling /api/auth/google...');

          const res = await api.post<{ token: string; user: UserProfile }>('/auth/google', {
            idToken,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            avatar: firebaseUser.photoURL,
          });

          console.log('[AuthContext] Backend auth succeeded:', res.user?.email, 'role:', res.user?.role);
          setToken(res.token);
          setProfile(res.user as UserProfile);
        } catch (err: any) {
          console.error('[AuthContext] Backend auth FAILED:', err?.message || err);
          clearToken();
          setProfile(null);
        }
      } else {
        console.log('[AuthContext] No Firebase user, clearing auth');
        clearToken();
        setProfile(null);
      }
      console.log('[AuthContext] Setting loading = false');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const user = profile ? { uid: profile.uid, email: profile.email } : null;

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextValue => useContext(AuthContext);
