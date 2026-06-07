import { compareVersions } from './version';

export const APP_VERSION = '1.1.0';

const LATEST_RELEASE_URL = 'https://api.github.com/repos/HDdssX/Pocket-AI/releases/latest';

type GitHubReleasePayload = {
  tag_name?: string;
  html_url?: string;
  name?: string;
};

export type LatestRelease = {
  version: string;
  url?: string;
};

export async function fetchLatestRelease(): Promise<LatestRelease> {
  const response = await fetch(LATEST_RELEASE_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub HTTP ${response.status}`);
  }

  const payload = await response.json() as GitHubReleasePayload;
  const version = (payload.tag_name || payload.name || '').replace(/^v/i, '').trim();
  if (!version) {
    throw new Error('No release tag');
  }

  return {
    version,
    url: payload.html_url,
  };
}

export function isNewerRelease(version: string): boolean {
  return compareVersions(version, APP_VERSION) > 0;
}
