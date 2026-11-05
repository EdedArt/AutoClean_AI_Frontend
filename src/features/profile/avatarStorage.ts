import { Directory, File, Paths } from 'expo-file-system';

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

export function getAvatarFileName(
  userId?: number | string | null,
  extension: string = '.jpg',
): string {
  const userKey = getSafeUserKey(userId);
  return `avatar_${userKey}_${Date.now()}${extension}`;
}

export function getAvatarFilePrefix(userId?: number | string | null): string {
  const userKey = getSafeUserKey(userId);
  return `avatar_${userKey}_`;
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

export async function deleteAvatarFiles(
  userId?: number | string | null,
  specificUri?: string | null,
): Promise<void> {
  const prefix = getAvatarFilePrefix(userId);

  if (specificUri && specificUri.trim().length > 0) {
    try {
      const specificFile = new File(specificUri.trim());
      if (specificFile.exists) {
        specificFile.delete();
      }
    } catch {
      // Ignore individual file deletion failure
    }
  }

  try {
    const items = Paths.document.list();
    for (const item of items) {
      if (item instanceof File && item.name.startsWith(prefix)) {
        try {
          if (item.exists) {
            item.delete();
          }
        } catch {
          // Ignore individual file deletion failure
        }
      }
    }
  } catch {
    // Ignore directory listing failure
  }
}

export async function persistAvatarFile(
  userId?: number | string | null,
  sourceUri?: string | null,
  previousUri?: string | null,
): Promise<string | null> {
  if (!sourceUri || sourceUri.trim().length === 0) {
    return null;
  }

  try {
    const trimmedSource = sourceUri.trim();
    const sourceFile = new File(trimmedSource);
    if (!sourceFile.exists) {
      return null;
    }

    const extension = getAvatarFileExtension(trimmedSource);
    const filename = getAvatarFileName(userId, extension);
    const destinationFile = new File(Paths.document, filename);

    await sourceFile.copy(destinationFile, { overwrite: true });

    if (!destinationFile.exists) {
      return null;
    }

    // Successfully written new file. Clean up previous avatar files for this user.
    try {
      if (previousUri && previousUri.trim() !== destinationFile.uri) {
        const prev = new File(previousUri.trim());
        if (prev.exists) {
          prev.delete();
        }
      }

      const prefix = getAvatarFilePrefix(userId);
      const items = Paths.document.list();
      for (const item of items) {
        if (
          item instanceof File &&
          item.name.startsWith(prefix) &&
          item.uri !== destinationFile.uri
        ) {
          if (item.exists) {
            item.delete();
          }
        }
      }
    } catch {
      // Old files cleanup failure should not prevent using the new avatar
    }

    return destinationFile.uri;
  } catch {
    return null;
  }
}
