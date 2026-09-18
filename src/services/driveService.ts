/**
 * Google Drive integration service for Smart School Bell backups & restores.
 * Uses Firebase Auth and Google Drive v3 API following the Google Workspace integration skill.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (NEVER stored in localStorage per skill directives)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const BACKUP_FILENAME = 'smart_school_bell_backup.json';

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime?: string;
  createdTime?: string;
  size?: string;
}

export type DriveFileMeta = DriveFileInfo;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve access token from Google authentication.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const signOutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Lists backups saved by Smart School Bell in the user's Google Drive
 */
export const listDriveBackups = async (): Promise<DriveFileInfo[]> => {
  if (!cachedAccessToken) {
    throw new Error('Not authenticated with Google Drive. Please sign in first.');
  }

  const query = encodeURIComponent(`name = '${BACKUP_FILENAME}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Uploads or updates backup JSON directly to Google Drive
 */
export const backupToGoogleDrive = async (
  backupJson: string
): Promise<{ success: boolean; fileId: string; modifiedTime: string }> => {
  if (!cachedAccessToken) {
    throw new Error('Not authenticated with Google Drive. Please sign in first.');
  }

  // Check if a backup file already exists
  const existingFiles = await listDriveBackups();
  const metadata = {
    name: BACKUP_FILENAME,
    mimeType: 'application/json',
    description: 'Smart School Bell timetable, bell audio settings, and holiday configuration backup',
  };

  if (existingFiles.length > 0) {
    // Update existing file content
    const fileId = existingFiles[0].id;
    const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;

    const res = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: backupJson,
    });

    if (!res.ok) {
      throw new Error(`Failed to update backup file in Google Drive: ${await res.text()}`);
    }

    const updatedData = await res.json();
    return {
      success: true,
      fileId: updatedData.id || fileId,
      modifiedTime: new Date().toISOString(),
    };
  } else {
    // Create new multipart file
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      backupJson +
      closeDelimiter;

    const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      throw new Error(`Failed to create backup file in Google Drive: ${await res.text()}`);
    }

    const createdData = await res.json();
    return {
      success: true,
      fileId: createdData.id,
      modifiedTime: new Date().toISOString(),
    };
  }
};

/**
 * Downloads and reads backup JSON from Google Drive
 */
export const restoreFromGoogleDrive = async (fileId?: string): Promise<string> => {
  if (!cachedAccessToken) {
    throw new Error('Not authenticated with Google Drive. Please sign in first.');
  }

  let targetId = fileId;
  if (!targetId) {
    const existingFiles = await listDriveBackups();
    if (existingFiles.length === 0) {
      throw new Error('No Smart School Bell backup file found in your Google Drive.');
    }
    targetId = existingFiles[0].id;
  }

  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${targetId}?alt=media`;
  const res = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to download backup from Google Drive: ${await res.text()}`);
  }

  return await res.text();
};

export const driveService = {
  getCurrentUser: () => getCurrentUser(),
  signIn: async () => {
    const res = await signInWithGoogle();
    return res.user;
  },
  signOut: async () => {
    await signOutGoogle();
  },
  listBackups: async (): Promise<DriveFileMeta[]> => {
    return await listDriveBackups();
  },
  backupToDrive: async (backupData: any, filename?: string) => {
    const jsonStr = typeof backupData === 'string' ? backupData : JSON.stringify(backupData, null, 2);
    return await backupToGoogleDrive(jsonStr);
  },
  restoreFromDrive: async (fileId?: string) => {
    const jsonStr = await restoreFromGoogleDrive(fileId);
    return JSON.parse(jsonStr);
  },
};
