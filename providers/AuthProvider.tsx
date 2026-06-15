import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { ensureUserDoc } from '@/services/authService';
import { subscribeUser, syncCardCatalog } from '@/services/gameService';
import type { UserProfile } from '@/lib/types';

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileError: string | null;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  profileError: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      setProfileError(null);
      unsubProfile?.();

      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      ensureUserDoc(u.uid, u.email || '', u.displayName || undefined)
        .then(() => syncCardCatalog().catch((e) => console.warn('[DTM] catalogue:', e?.message)))
        .catch(() => {
          setProfileError(
            'Profil introuvable. Publiez les règles Firestore (Firestore → Règles → Publier).'
          );
        })
        .finally(() => {
          unsubProfile = subscribeUser(u.uid, (p) => {
            setProfile(p);
            if (p) setProfileError(null);
            setLoading(false);
          });
        });
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, profileError }),
    [user, profile, loading, profileError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
