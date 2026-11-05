import { Directory, Paths } from 'expo-file-system';

export const AVATAR_STORAGE_PREFIX = 'autoclean.avatar';

export function getSafeUserKey(userId?: number | string | null): string {
  if (userId !== undefined && userId !== null && String(userId).trim() !== '') {
    return String(userId).trim();
  }
  return 'default';
}

export function getAvatarStorageKey(userId?: number | string | null): string {
  const userKey = getSafeUserKey(userId);
  if (userKey !== 'default') {
    return `${AVATAR_STORAGE_PREFIX}.${userKey}`;
  }
  return AVATAR_STORAGE_PREFIX;
}

export function getAvatarFileExtension(uri: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (match && match[1]) {
    const ext = match[1].toLowerCase();
    if (ext === 'jpeg' || ext === 'jpg' || ext === 'png' || ext === 'webp') {
      return `.${ext}`;
    }
  }
  return '.jpg';
}

export function getPersistentAvatarDirectory(): Directory {
  return Paths.document;
}

export function isPersistentAvatarPath(uri: string | null | undefined): boolean {
  if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
    return false;
  }
  try {
    const docUri = Paths.document.uri;
    const normalizedDocUri = docUri.endsWith('/') ? docUri : `${docUri}/`;
    return uri.startsWith(normalizedDocUri) || uri.startsWith(docUri);
  } catch {
    return false;
  }
}
