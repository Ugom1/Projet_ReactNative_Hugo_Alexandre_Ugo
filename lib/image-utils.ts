/** Convertit une URI locale (web/mobile) en data URL pour stockage Firestore. */
export async function uriToDataUrl(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri;
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Impossible de lire l\'image'));
    reader.readAsDataURL(blob);
  });
}

/** Taille max ~750 Ko en base64 pour rester sous la limite Firestore. */
export const MAX_AVATAR_DATA_URL_LENGTH = 750_000;
