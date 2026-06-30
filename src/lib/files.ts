import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Linking, Platform } from 'react-native';

import type { AttachmentRecord, PendingAttachment } from '../types';
import { makeId } from './ids';

const ROOT_DIR = `${FileSystem.documentDirectory}ai-chat-pocket/`;
const ATTACHMENT_DIR = `${ROOT_DIR}attachments/`;
const CHAT_BACKGROUND_DIR = `${ROOT_DIR}chat-backgrounds/`;
const ANDROID_PACKAGE_NAME = 'com.fanshanng.aichatpocket';
const ANDROID_DATABASE_DIR = `file:///data/user/0/${ANDROID_PACKAGE_NAME}/databases/`;
const ANDROID_DATABASE_DIR_FALLBACK = `file:///data/data/${ANDROID_PACKAGE_NAME}/databases/`;
const ASYNC_STORAGE_DB_FILE_NAMES = [
  'AsyncStorage',
  'AsyncStorage-wal',
  'AsyncStorage-shm',
  'AsyncStorage-journal',
  'RKStorage',
  'RKStorage-wal',
  'RKStorage-shm',
  'RKStorage-journal',
] as const;
export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

// Keep attachment size failures typed so UI code can localize them without
// parsing provider/runtime error strings.
export class AttachmentSizeError extends Error {
  readonly code = 'ATTACHMENT_TOO_LARGE';

  constructor(
    readonly fileName: string,
    readonly size: number,
    readonly limit: number
  ) {
    super(`Attachment "${fileName}" is too large (${size} > ${limit}).`);
    this.name = 'AttachmentSizeError';
    Object.setPrototypeOf(this, AttachmentSizeError.prototype);
  }
}

export function isAttachmentSizeError(error: unknown): error is AttachmentSizeError {
  return (
    error instanceof AttachmentSizeError ||
    (typeof error === 'object' &&
      error !== null &&
      (error as { code?: unknown }).code === 'ATTACHMENT_TOO_LARGE')
  );
}

export type SharedImageInput = string | {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
};

export type AttachmentCacheStats = {
  fileCount: number;
  totalBytes: number;
  referencedFileCount: number;
  referencedTotalBytes: number;
};

export type ExportedUserFile = {
  directoryUri: string;
  fileName: string;
  fileUri: string;
};

export type RawChatStorageBackup = {
  directoryUri: string;
  folderName: string;
  folderUri: string;
  fileNames: string[];
  manifestUri: string | null;
};

function padNumber(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function buildTimestampLabel(date = new Date()): string {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join('') + `-${padNumber(date.getHours())}${padNumber(date.getMinutes())}${padNumber(date.getSeconds())}`;
}

function buildTimestampedFileName(baseName: string, extension: string): string {
  const safeBaseName = sanitizeName(baseName) || 'pocket-ai-export';
  const safeExtension = extension.replace(/^\./, '').trim() || 'txt';
  return `${safeBaseName}-${buildTimestampLabel()}.${safeExtension}`;
}

async function ensureRootDir(): Promise<void> {
  await FileSystem.makeDirectoryAsync(ROOT_DIR, { intermediates: true }).catch(() => undefined);
}

async function pickExportDirectory(initialFileUrl?: string | null): Promise<string | null> {
  if (Platform.OS !== 'android') {
    await ensureRootDir();
    return ROOT_DIR;
  }

  const preferredInitialUri =
    initialFileUrl ?? FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
  const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(preferredInitialUri);
  return permission.granted ? permission.directoryUri : null;
}

async function writeTextExportFile(
  directoryUri: string,
  fileName: string,
  mimeType: string,
  content: string
): Promise<ExportedUserFile> {
  if (Platform.OS !== 'android') {
    const fileUri = `${directoryUri}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return {
      directoryUri,
      fileName,
      fileUri,
    };
  }

  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(directoryUri, fileName, mimeType);
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return {
    directoryUri,
    fileName,
    fileUri,
  };
}

async function copyLocalFileToSafDirectory(
  parentUri: string,
  sourceUri: string,
  targetName: string,
  mimeType: string
): Promise<string> {
  const targetUri = await FileSystem.StorageAccessFramework.createFileAsync(parentUri, targetName, mimeType);
  try {
    await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
  } catch {
    const base64 = await FileSystem.readAsStringAsync(sourceUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await FileSystem.writeAsStringAsync(targetUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  return targetUri;
}

function getRawAsyncStorageBackupCandidates(): string[] {
  if (Platform.OS !== 'android') {
    return [];
  }

  const roots = [ANDROID_DATABASE_DIR, ANDROID_DATABASE_DIR_FALLBACK];
  const candidates = roots.flatMap((root) =>
    ASYNC_STORAGE_DB_FILE_NAMES.map((fileName) => `${root}${fileName}`)
  );
  return [...new Set(candidates)];
}

export function getChatRecordsLocationUri(): string {
  return Platform.OS === 'android' ? ANDROID_DATABASE_DIR : ROOT_DIR;
}

export function getAttachmentCacheLocationUri(): string {
  return ATTACHMENT_DIR;
}

export async function openPrivateLocation(uri: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(uri).catch(() => null);
  if (!info?.exists) {
    return false;
  }

  try {
    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(uri);
      await Linking.openURL(contentUri);
      return true;
    }

    await Linking.openURL(uri);
    return true;
  } catch {
    try {
      await Linking.openURL(uri);
      return true;
    } catch {
      return false;
    }
  }
}

export async function openPrivateFile(uri: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(uri).catch(() => null);
  if (!info?.exists) {
    return false;
  }

  try {
    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(uri);
      await Linking.openURL(contentUri);
      return true;
    }

    await Linking.openURL(uri);
    return true;
  } catch {
    return false;
  }
}

export async function exportTextFileToUserDirectory(input: {
  suggestedBaseName: string;
  extension: string;
  mimeType: string;
  content: string;
  initialDirectoryUri?: string | null;
}): Promise<ExportedUserFile | null> {
  const directoryUri = await pickExportDirectory(input.initialDirectoryUri);
  if (!directoryUri) {
    return null;
  }

  const fileName = buildTimestampedFileName(input.suggestedBaseName, input.extension);
  return writeTextExportFile(directoryUri, fileName, input.mimeType, input.content);
}

export async function exportRawChatStorageBackupToUserDirectory(input?: {
  initialDirectoryUri?: string | null;
  manifestLines?: string[];
}): Promise<RawChatStorageBackup | null> {
  const sourceUris = (
    await Promise.all(
      getRawAsyncStorageBackupCandidates().map(async (uri) => {
        const info = await FileSystem.getInfoAsync(uri).catch(() => null);
        return info?.exists ? uri : null;
      })
    )
  ).filter((uri): uri is string => uri !== null);

  if (sourceUris.length === 0) {
    return null;
  }

  const directoryUri = await pickExportDirectory(input?.initialDirectoryUri);
  if (!directoryUri) {
    return null;
  }

  if (Platform.OS !== 'android') {
    return null;
  }

  const folderName = `pocket-ai-recovery-${buildTimestampLabel()}`;
  const folderUri = await FileSystem.StorageAccessFramework.makeDirectoryAsync(directoryUri, folderName);
  const fileNames: string[] = [];

  for (const sourceUri of sourceUris) {
    const fileName = sourceUri.split('/').pop() || `backup-${fileNames.length + 1}.bin`;
    await copyLocalFileToSafDirectory(folderUri, sourceUri, fileName, 'application/octet-stream');
    fileNames.push(fileName);
  }

  const manifestLines = [
    'Pocket AI raw local chat storage backup',
    `Exported at: ${new Date().toISOString()}`,
    `Database directory: ${getChatRecordsLocationUri()}`,
    'These files are a raw AsyncStorage backup for recovery/debugging.',
    'They are not imported automatically by the current app version.',
    ...(input?.manifestLines ?? []),
  ];

  const manifest = await writeTextExportFile(
    folderUri,
    'README.txt',
    'text/plain',
    manifestLines.join('\n')
  ).catch(() => null);

  return {
    directoryUri,
    folderName,
    folderUri,
    fileNames,
    manifestUri: manifest?.fileUri ?? null,
  };
}

function sanitizeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function normalizeDisplayName(value: string | null | undefined, fallback: string): string {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function extensionFromMime(mimeType: string | null | undefined): string {
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/gif') return '.gif';
  if (mimeType === 'image/webp') return '.webp';
  return '.jpg';
}

function inferMimeFromName(name: string, fallback: string): string {
  const lowered = name.toLowerCase();
  if (lowered.endsWith('.png')) return 'image/png';
  if (lowered.endsWith('.jpg') || lowered.endsWith('.jpeg')) return 'image/jpeg';
  if (lowered.endsWith('.gif')) return 'image/gif';
  if (lowered.endsWith('.webp')) return 'image/webp';
  if (lowered.endsWith('.pdf')) return 'application/pdf';
  if (lowered.endsWith('.md')) return 'text/markdown';
  if (lowered.endsWith('.txt')) return 'text/plain';
  if (lowered.endsWith('.json')) return 'application/json';
  if (lowered.endsWith('.csv')) return 'text/csv';
  if (lowered.endsWith('.html')) return 'text/html';
  return fallback;
}

function inferKindFromNameOrMime(name: string, mimeType: string): PendingAttachment['kind'] {
  return mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(name) ? 'image' : 'file';
}

function assertAttachmentSize(displayName: string, size: number): void {
  if (size > MAX_ATTACHMENT_BYTES) {
    throw new AttachmentSizeError(displayName, size, MAX_ATTACHMENT_BYTES);
  }
}

async function ensureAttachmentDir(): Promise<void> {
  await FileSystem.makeDirectoryAsync(ATTACHMENT_DIR, { intermediates: true });
}

async function ensureChatBackgroundDir(): Promise<void> {
  await FileSystem.makeDirectoryAsync(CHAT_BACKGROUND_DIR, { intermediates: true });
}

function dedupeAttachmentUris(attachments: AttachmentRecord[]): string[] {
  return [...new Set(attachments.map((attachment) => attachment.uri).filter(Boolean))];
}

export async function deleteAttachmentRecords(attachments: AttachmentRecord[]): Promise<void> {
  const uris = dedupeAttachmentUris(attachments);
  await Promise.all(
    uris.map((uri) =>
      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined)
    )
  );
}

export async function clearAllAttachmentFiles(): Promise<void> {
  await FileSystem.deleteAsync(ROOT_DIR, { idempotent: true }).catch(() => undefined);
}

export async function clearAttachmentCacheFiles(): Promise<void> {
  await FileSystem.deleteAsync(ATTACHMENT_DIR, { idempotent: true }).catch(() => undefined);
}

async function sweepChatBackgroundFiles(keepUri: string | null = null): Promise<void> {
  const directoryInfo = await FileSystem.getInfoAsync(CHAT_BACKGROUND_DIR).catch(() => null);
  if (!directoryInfo?.exists) {
    return;
  }

  const fileNames = await FileSystem.readDirectoryAsync(CHAT_BACKGROUND_DIR).catch(() => []);
  const deletions = fileNames
    .map((name) => `${CHAT_BACKGROUND_DIR}${name}`)
    .filter((uri) => uri !== keepUri)
    .map((uri) => FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined));

  await Promise.all(deletions);
}

// Keep appearance assets outside the attachment cache directory so custom chat
// backgrounds do not affect attachment stats or attachment export boundaries.
export async function deleteChatBackgroundImage(uri: string | null | undefined): Promise<void> {
  if (uri) {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
  }
  await sweepChatBackgroundFiles(null);
}

export async function persistChatBackgroundImage(
  input: {
    uri: string;
    name?: string | null;
    mimeType?: string | null;
  },
  previousUri: string | null = null
): Promise<string> {
  await ensureChatBackgroundDir();
  const extension = extensionFromMime(input.mimeType);
  const fileName = `chat-background-${Date.now()}${extension}`;
  const destination = `${CHAT_BACKGROUND_DIR}${fileName}`;
  await FileSystem.copyAsync({ from: input.uri, to: destination });

  if (previousUri && previousUri !== destination) {
    await FileSystem.deleteAsync(previousUri, { idempotent: true }).catch(() => undefined);
  }
  await sweepChatBackgroundFiles(destination);
  return destination;
}

export async function pickChatBackgroundImage(previousUri: string | null = null): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Photo library access is required to choose a chat background.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [9, 16],
    allowsMultipleSelection: false,
    base64: false,
    quality: 0.92,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  return persistChatBackgroundImage(
    {
      uri: asset.uri,
      name: asset.fileName || `chat-background-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
    },
    previousUri
  );
}

export async function sweepOrphanedAttachments(attachmentsToKeep: AttachmentRecord[]): Promise<void> {
  const directoryInfo = await FileSystem.getInfoAsync(ATTACHMENT_DIR);
  if (!directoryInfo.exists) {
    return;
  }

  const keepUris = new Set(dedupeAttachmentUris(attachmentsToKeep));
  const fileNames = await FileSystem.readDirectoryAsync(ATTACHMENT_DIR).catch(() => []);
  const deletions = fileNames
    .map((name) => `${ATTACHMENT_DIR}${name}`)
    .filter((uri) => !keepUris.has(uri))
    .map((uri) => FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined));

  await Promise.all(deletions);
}

function getReferencedAttachmentStats(attachments: AttachmentRecord[]): Pick<AttachmentCacheStats, 'referencedFileCount' | 'referencedTotalBytes'> {
  const unique = new Map<string, AttachmentRecord>();
  for (const attachment of attachments) {
    unique.set(attachment.uri || attachment.id, attachment);
  }

  let referencedTotalBytes = 0;
  for (const attachment of unique.values()) {
    referencedTotalBytes += attachment.size ?? 0;
  }

  return {
    referencedFileCount: unique.size,
    referencedTotalBytes,
  };
}

export async function getAttachmentCacheStats(attachments: AttachmentRecord[] = []): Promise<AttachmentCacheStats> {
  const referenced = getReferencedAttachmentStats(attachments);
  const directoryInfo = await FileSystem.getInfoAsync(ATTACHMENT_DIR);
  if (!directoryInfo.exists) {
    return { fileCount: 0, totalBytes: 0, ...referenced };
  }

  const fileNames = await FileSystem.readDirectoryAsync(ATTACHMENT_DIR).catch(() => []);
  let totalBytes = 0;
  let fileCount = 0;

  await Promise.all(
    fileNames.map(async (name) => {
      const info = await FileSystem.getInfoAsync(`${ATTACHMENT_DIR}${name}`).catch(() => null);
      if (!info?.exists) {
        return;
      }
      fileCount += 1;
      totalBytes += info.size ?? 0;
    })
  );

  return { fileCount, totalBytes, ...referenced };
}

async function persistAsset(
  input: {
    uri: string;
    name: string;
    mimeType?: string | null;
    size?: number | null;
  },
  kind: PendingAttachment['kind']
): Promise<PendingAttachment> {
  const displayName = normalizeDisplayName(input.name, `${kind}-${Date.now()}`);
  const size = input.size ?? 0;
  assertAttachmentSize(displayName, size);

  await ensureAttachmentDir();
  const safeName = sanitizeName(displayName) || `${kind}-${Date.now()}`;
  const id = makeId(kind);
  const destination = `${ATTACHMENT_DIR}${id}_${safeName}`;
  await FileSystem.copyAsync({ from: input.uri, to: destination });

  // Some Android content URIs do not report size before copying. Re-check the
  // private copy and remove it immediately if the real file exceeds the limit.
  const info = await FileSystem.getInfoAsync(destination).catch(() => null);
  const finalSize = info?.exists ? info.size ?? size : size;
  try {
    assertAttachmentSize(displayName, finalSize);
  } catch (error) {
    await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);
    throw error;
  }

  return {
    id,
    kind,
    name: displayName,
    uri: destination,
    mimeType: inferMimeFromName(displayName, input.mimeType || 'application/octet-stream'),
    size: finalSize,
  };
}

export async function persistRemoteAttachment(input: {
  url: string;
  name?: string;
  mimeType?: string;
}): Promise<AttachmentRecord | null> {
  await ensureAttachmentDir();
  const urlName = normalizeDisplayName(input.url.split('?')[0].split('/').pop(), '');
  const displayName = normalizeDisplayName(input.name || urlName, `remote-${Date.now()}`);
  const safeName = sanitizeName(displayName) || `remote-${Date.now()}`;
  const id = makeId('remote');
  const destination = `${ATTACHMENT_DIR}${id}_${safeName}`;

  const result = await FileSystem.downloadAsync(input.url, destination).catch(() => null);
  if (!result) {
    return null;
  }

  const headerMime =
    result.headers['content-type'] ||
    result.headers['Content-Type'] ||
    input.mimeType ||
    'application/octet-stream';
  const info = await FileSystem.getInfoAsync(result.uri);
  const mimeType = inferMimeFromName(displayName, headerMime);

  if (info.exists && (info.size ?? 0) > MAX_ATTACHMENT_BYTES) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true }).catch(() => undefined);
    return null;
  }

  return {
    id,
    kind: inferKindFromNameOrMime(displayName, mimeType),
    name: displayName,
    uri: result.uri,
    mimeType,
    size: info.exists ? info.size ?? 0 : 0,
  };
}

export async function persistSharedImageAttachments(inputs: SharedImageInput[]): Promise<PendingAttachment[]> {
  const attachments: PendingAttachment[] = [];
  for (const [index, input] of inputs.entries()) {
    const uri = typeof input === 'string' ? input : input.uri;
    const mimeType = typeof input === 'string' ? null : input.mimeType;
    const name =
      typeof input === 'string'
        ? null
        : input.name || `shared-image-${Date.now()}-${index + 1}${extensionFromMime(mimeType)}`;
    attachments.push(
      await persistAsset(
        {
          uri,
          name: name || `shared-image-${Date.now()}-${index + 1}.jpg`,
          mimeType: mimeType || 'image/jpeg',
          size: 0,
        },
        'image'
      )
    );
  }
  return attachments;
}

export async function pickImageAttachments(): Promise<PendingAttachment[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Photo library access is required to attach images.');
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    base64: false,
    quality: 0.9,
  });

  if (result.canceled || !result.assets) {
    return [];
  }

  const attachments: PendingAttachment[] = [];
  for (const asset of result.assets) {
    attachments.push(
      await persistAsset(
        {
          uri: asset.uri,
          name: asset.fileName || `image-${Date.now()}.jpg`,
          mimeType: asset.mimeType,
          size: asset.fileSize,
        },
        'image'
      )
    );
  }
  return attachments;
}

export async function captureImageAttachment(): Promise<PendingAttachment[]> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Camera access is required to take a photo.');
    return [];
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    base64: false,
    quality: 0.9,
  });

  if (result.canceled || !result.assets?.[0]) {
    return [];
  }

  const asset = result.assets[0];
  return [
    await persistAsset(
      {
        uri: asset.uri,
        name: asset.fileName || `camera-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      },
      'image'
    ),
  ];
}

export async function pickDocumentAttachments(): Promise<PendingAttachment[]> {
  const result = await DocumentPicker.getDocumentAsync({
    multiple: true,
    copyToCacheDirectory: true,
    base64: false,
    type: '*/*',
  });

  if (result.canceled || !result.assets) {
    return [];
  }

  const attachments: PendingAttachment[] = [];
  for (const asset of result.assets) {
    attachments.push(
      await persistAsset(
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          size: asset.size,
        },
        asset.mimeType?.startsWith('image/') ? 'image' : 'file'
      )
    );
  }
  return attachments;
}

export async function readAttachmentAsDataUrl(attachment: AttachmentRecord): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(attachment.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:${attachment.mimeType};base64,${base64}`;
}

export function extractDownloadableUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>)\]"']+/g) ?? [];
  const urls = matches
    .map((url) => url.replace(/[.,;:!?]+$/, ''))
    .filter((url) =>
      /\.(png|jpe?g|gif|webp|pdf|md|txt|json|csv|html)(\?|#|$)/i.test(url)
    );
  return [...new Set(urls)];
}
