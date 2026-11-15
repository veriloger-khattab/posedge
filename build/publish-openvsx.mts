// Publishes the packaged VSIX to Open VSX, the registry behind Cursor, VSCodium, Windsurf and others.
// The Visual Studio Marketplace needs no script: upload the same file at marketplace.visualstudio.com/manage.
//
// The access token is read from the OVSX_PAT environment variable by the ovsx tool itself, so it never
// appears on a command line, in this repository or in a chat. See docs/publishing.md.
//
//   npm run package && npm run publish:openvsx

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const { name, publisher, version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const vsix = join(ROOT, 'dist-vsix', `${name}-${version}.vsix`);

if (!existsSync(vsix)) throw new Error(`${vsix} does not exist. Run npm run package first.`);
if (!process.env.OVSX_PAT) throw new Error('Set the OVSX_PAT environment variable to your Open VSX access token first. See docs/publishing.md.');

const ovsx = (args: string, allowFailure = false): void => {
  try {
    execSync(`npx --yes ovsx ${args}`, { cwd: ROOT, stdio: 'inherit' });
  } catch (error) {
    if (!allowFailure) throw error;
  }
};

// The namespace must exist before the first publish. On later releases this reports that it already
// exists, which is fine.
ovsx(`create-namespace ${publisher}`, true);
ovsx(`publish "${vsix}"`);
console.log(`Published ${publisher}.${name} ${version} to Open VSX: https://open-vsx.org/extension/${publisher}/${name}`);
