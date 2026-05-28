import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { firebaseAuth } from '@/lib/firebase';
import { subscribeUser } from '@/services/gameService';
import type { UserProfile } from '@/lib/types';

type AuthContextValue = { user: User | null; profile: UserProfile | null; loading: boolean };
const AuthContext = createContext<AuthContextValue>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      unsubProfile?.();
      if (u) unsubProfile = subscribeUser(u.uid, setProfile);
      else setProfile(null);
      setLoading(false);
    });
    return () => { unsubAuth(); unsubProfile?.(); };
  }, []);

  const value = useMemo(() => ({ user, profile, loading }), [user, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
