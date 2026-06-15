import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';

export type OTAState = {
  /** True tant qu'on n'a pas fini la vérification (ou que le timeout est atteint). */
  checking: boolean;
  /** True quand une mise à jour a été détectée et qu'on la télécharge. */
  downloading: boolean;
  /** Message d'erreur éventuel (réseau, etc.). Non bloquant. */
  error?: string;
};

/**
 * Vérifie au démarrage si une mise à jour EAS Update est disponible.
 *
 * - Skip en mode dev (les OTA ne fonctionnent pas avec expo-dev-client en mode JS).
 * - Si une update est dispo : télécharge puis recharge l'app.
 * - Si pas de réseau / pas d'update / erreur : passe outre sans bloquer.
 * - Timeout de sécurité pour ne jamais bloquer l'app indéfiniment.
 */
export function useOTAUpdate(timeoutMs = 4000): OTAState {
  const [state, setState] = useState<OTAState>({
    checking: true,
    downloading: false,
  });

  useEffect(() => {
    let cancelled = false;

    const finish = (patch: Partial<OTAState> = {}) => {
      if (cancelled) return;
      setState((s) => ({ ...s, checking: false, downloading: false, ...patch }));
    };

    // En dev (ou si expo-updates n'est pas actif), on ne tente pas.
    if (__DEV__ || !Updates.isEnabled) {
      finish();
      return () => {
        cancelled = true;
      };
    }

    const timer = setTimeout(() => finish({ error: 'timeout' }), timeoutMs);

    (async () => {
      try {
        const res = await Updates.checkForUpdateAsync();
        if (cancelled) return;

        if (res.isAvailable) {
          setState((s) => ({ ...s, downloading: true }));
          await Updates.fetchUpdateAsync();
          if (cancelled) return;
          clearTimeout(timer);
          // Recharge l'app sur le nouveau bundle. Ne resolve jamais.
          await Updates.reloadAsync();
        } else {
          clearTimeout(timer);
          finish();
        }
      } catch (e: any) {
        clearTimeout(timer);
        finish({ error: e?.message ?? 'unknown error' });
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [timeoutMs]);

  return state;
}
