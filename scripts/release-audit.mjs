import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseVersion(value) {
  return value.split('.').map((part) => Number.parseInt(part, 10));
}

function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0);
    if (delta !== 0) {
      return delta;
    }
  }
  return 0;
}

function listFilesRecursive(dir, output = []) {
  if (!existsSync(dir)) {
    return output;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') {
      continue;
    }
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      listFilesRecursive(fullPath, output);
    } else {
      output.push(fullPath);
    }
  }
  return output;
}

function requiredSection(note, heading) {
  check(note.includes(`## ${heading}`), `Release note missing section: ${heading}`);
}

function assertReleaseNoteShape(version, versionCode) {
  const notePath = `release-notes/RELEASE_NOTES_v${version}.md`;
  check(existsSync(join(root, notePath)), `Current release note missing: ${notePath}`);

  const note = read(notePath);
  check(note.includes(`# Pocket AI v${version}`), 'Current release note title does not match package version');
  for (const heading of [
    'Version',
    'Change Summary',
    'Modified Files',
    'New Files',
    'Test Results',
    'APK SHA256',
    'Git Sync',
  ]) {
    requiredSection(note, heading);
  }

  check(note.includes(`App version: \`${version}\``), 'Current release note app version mismatch');
  check(note.includes(`Android \`versionCode\`: \`${versionCode}\``), 'Current release note versionCode mismatch');
  check(!/\bPending(?: build)?\b/i.test(note), 'Current release note still contains Pending markers');
  check(/[A-F0-9]{64}/.test(note), 'Current release note missing a SHA256-looking APK hash');
}

function assertRecentReleaseNotesHaveStandardShape() {
  const notesDir = join(root, 'release-notes');
  const noteFiles = readdirSync(notesDir)
    .filter((name) => /^RELEASE_NOTES_v1\.2\.\d+\.md$/.test(name))
    .map((name) => ({
      name,
      version: name.match(/^RELEASE_NOTES_v(.+)\.md$/)?.[1] ?? '0.0.0',
    }))
    .filter((entry) => compareVersions(entry.version, '1.2.2') >= 0);

  for (const entry of noteFiles) {
    const note = read(`release-notes/${entry.name}`);
    for (const heading of ['Version', 'Change Summary', 'Modified Files', 'Test Results', 'APK SHA256']) {
      check(note.includes(`## ${heading}`), `${entry.name} missing section: ${heading}`);
    }
  }
}

function assertReadmeIsReleasePageClean() {
  const readme = read('README.md');
  check(!/^##\s*(下载|Download)\b/im.test(readme), 'README should not contain a Download section');
  check(!readme.includes('release-notes/'), 'README should not point to local-only release-notes/');
  check(readme.includes('GitHub Releases'), 'README should point public release notes to GitHub Releases');
}

function assertForbiddenUploadFiles(version) {
  const uploadRoot = basename(root).toLowerCase() === 'ai-chat-pocket-git'
    ? root
    : join(root, '..', 'ai-chat-pocket-git');

  check(existsSync(uploadRoot), `Upload folder missing: ${uploadRoot}`);

  const uploadPackagePath = join(uploadRoot, 'package.json');
  if (existsSync(uploadPackagePath)) {
    const uploadPackage = JSON.parse(readFileSync(uploadPackagePath, 'utf8'));
    check(uploadPackage.version === version, 'Upload folder package.json version does not match current version');
  }

  const forbiddenPatterns = [
    /(^|[\\/])node_modules([\\/]|$)/,
    /(^|[\\/])build([\\/]|$)/,
    /(^|[\\/])LOCAL_PRIVATE([\\/]|$)/,
    /(^|[\\/])local\.properties$/i,
    /(^|[\\/])keystore\.properties$/i,
    /\.(apk|aab|jks|keystore|log)$/i,
    /(^|[\\/])tmp_/i,
  ];

  const badFiles = listFilesRecursive(uploadRoot).filter((file) => {
    const rel = relative(uploadRoot, file);
    return forbiddenPatterns.some((pattern) => pattern.test(rel));
  });

  check(badFiles.length === 0, `Forbidden files found in upload folder:\n${badFiles.join('\n')}`);
}

// Keep this audit separate from smoke: it validates release packaging records after the APK hash is known.
const packageJson = JSON.parse(read('package.json'));
const appJson = JSON.parse(read('app.json'));
const releases = read('src/lib/releases.ts');
const gradle = read('android/app/build.gradle');
const handoff = read('PROJECT_HANDOFF.md');
const architecturePlan = read('docs/ARCHITECTURE_PLAN.md');
const gitignore = read('.gitignore');

const version = packageJson.version;
const versionCode = gradle.match(/versionCode\s+(\d+)/)?.[1] ?? '';
const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1] ?? '';

check(/^\d+\.\d+\.\d+$/.test(version), 'package.json version should be semver-like');
check(appJson.expo?.version === version, 'app.json version mismatch');
check(new RegExp(`APP_VERSION\\s*=\\s*['"]${escapeRegExp(version)}['"]`).test(releases), 'APP_VERSION mismatch');
check(versionName === version, 'Android versionName mismatch');
check(Number.parseInt(versionCode, 10) > 0, 'Android versionCode missing or invalid');
check(packageJson.scripts?.['release:audit'] === 'node scripts/release-audit.mjs', 'package release:audit script missing');

assertReleaseNoteShape(version, versionCode);
assertRecentReleaseNotesHaveStandardShape();
assertReadmeIsReleasePageClean();
assertForbiddenUploadFiles(version);

check(handoff.includes(`Current version: \`${version}\` / Android \`versionCode ${versionCode}\``), 'PROJECT_HANDOFF current version mismatch');
check(handoff.includes(`Current v${version} APK SHA-256`), 'PROJECT_HANDOFF missing current APK SHA section');
check(architecturePlan.includes(`Current version: \`v${version}\``), 'Architecture plan current version mismatch');
check(architecturePlan.includes('v1.3.0'), 'Architecture plan should keep the v1.3.0 release target visible');

for (const requiredIgnore of [
  'node_modules/',
  'android/app/build/',
  'android/keystore.properties',
  'LOCAL_PRIVATE/',
  'release-notes/',
  '*.jks',
  '*.keystore',
]) {
  check(gitignore.includes(requiredIgnore), `.gitignore missing ${requiredIgnore}`);
}

console.log(`Release audit passed for v${version} (versionCode ${versionCode})`);
