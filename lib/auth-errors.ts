export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : '';

  if (code.includes('configuration-not-found')) {
    return 'Authentication non activée. Console Firebase → Authentication → E-mail/Mot de passe → Activer.';
  }
  if (code.includes('email-already-in-use')) {
    return 'Cet email est déjà utilisé.';
  }
  if (code.includes('invalid-credential') || code.includes('wrong-password')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (code.includes('user-not-found')) {
    return "Aucun compte avec cet email. Créez-en un via « Créer mon compte ».";
  }
  if (code.includes('invalid-email')) {
    return 'Adresse email invalide.';
  }
  if (code.includes('too-many-requests')) {
    return 'Trop de tentatives. Réessayez dans quelques minutes.';
  }
  if (code.includes('network-request-failed')) {
    return 'Pas de connexion internet. Vérifiez votre réseau.';
  }
  if (code.includes('permission-denied')) {
    return 'Connexion OK, mais Firestore refuse l\'accès. Déployez firestore.rules dans Firebase.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Connexion impossible. Réessayez.';
}
