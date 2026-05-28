import { FirebaseError } from 'firebase/app';

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/operation-not-allowed':
        return 'Inscription par email désactivée. Dans Firebase Console → Authentication → Sign-in method, active « Email/Password ».';
      case 'auth/email-already-in-use':
        return 'Cet email est déjà utilisé. Connecte-toi ou choisis un autre email.';
      case 'auth/weak-password':
        return 'Mot de passe trop faible (minimum 6 caractères).';
      case 'auth/invalid-email':
        return 'Adresse email invalide.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Email ou mot de passe incorrect.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Réessaie dans quelques minutes.';
      case 'auth/network-request-failed':
        return 'Problème réseau. Vérifie ta connexion internet.';
      case 'permission-denied':
        return 'Accès Firestore refusé. Configure les règles Firestore (voir README) ou passe en mode test.';
      default:
        return `${error.message} (${error.code})`;
    }
  }
  if (error instanceof Error) return error.message;
  return 'Une erreur est survenue. Réessaie.';
}
