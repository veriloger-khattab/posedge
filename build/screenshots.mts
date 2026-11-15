// Renders the marketplace icon and the README screenshots with a headless Chromium browser
// (Microsoft Edge on Windows, Chrome/Chromium on Linux and macOS). Dev-only; outputs are committed.
//
//   node build/preview.mts && node build/gallery.mts && node build/clock-mock.mts && node build/screenshots.mts

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(import.meta.dirname, '..');

function findBrowser(): string {
  const candidates = [
    process.env.CHROME_PATH ?? '',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  const found = candidates.find((c) => c && existsSync(c));
  if (!found) throw new Error('No Chromium-based browser found; set CHROME_PATH.');
  return found;
}

const sleep = (ms: number): void => void Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function shot(url: string, out: string, width: number, height: number, scale = 2, transparent = false): void {
  // A fresh profile per shot: a second launch on a busy profile exits without taking the screenshot.
  const profile = mkdtempSync(join(tmpdir(), 'posedge-shot-'));
  const before = existsSync(out) ? statSync(out).mtimeMs : 0;
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--user-data-dir=${profile}`,
    `--force-device-scale-factor=${scale}`,
    `--window-size=${width},${height}`,
    `--screenshot=${out}`,
  ];
  if (transparent) args.push('--default-background-color=00000000');
  execFileSync(findBrowser(), [...args, url], { stdio: 'ignore' });
  // Edge's launcher can exit while a child process is still rendering, so wait for the file itself.
  const written = (): boolean => existsSync(out) && statSync(out).mtimeMs !== before && statSync(out).size > 0;
  for (let i = 0; i < 300 && !written(); i++) sleep(100);
  if (!written()) throw new Error(`The browser did not write ${out}`);
  sleep(500); // let the browser finish writing and release its profile
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 250 });
  } catch {
    // A leftover temp folder is harmless.
  }
  console.log(`wrote ${out.replace(ROOT, '.')}`);
}

const url = (rel: string): string => pathToFileURL(join(ROOT, rel)).href;

mkdirSync(join(ROOT, 'assets', 'screenshots'), { recursive: true });

// Marketplace icon: 256x256 PNG rendered from assets/icon.svg.
const iconPage = join(tmpdir(), 'posedge-icon.html');
writeFileSync(iconPage, `<html><body style="margin:0;background:transparent"><img src="${url('assets/icon.svg')}" width="256" height="256"></body></html>`);
shot(pathToFileURL(iconPage).href, join(ROOT, 'assets', 'icon.png'), 256, 256, 1, true);

shot(url('preview/posedge-graphite.html'), join(ROOT, 'assets', 'screenshots', 'graphite.png'), 1100, 1500);
shot(url('preview/posedge-midnight.html'), join(ROOT, 'assets', 'screenshots', 'midnight.png'), 1100, 1100);
shot(url('preview/posedge-daylight.html'), join(ROOT, 'assets', 'screenshots', 'daylight.png'), 1100, 1500);
shot(url('preview/posedge-high-contrast.html'), join(ROOT, 'assets', 'screenshots', 'high-contrast.png'), 1100, 1100);
shot(url('preview/icons.html'), join(ROOT, 'assets', 'screenshots', 'icons.png'), 1000, 1100);
shot(url('preview/icons-daylight.html'), join(ROOT, 'assets', 'screenshots', 'icons-daylight.png'), 1000, 1100);
shot(url('preview/clock.html'), join(ROOT, 'assets', 'screenshots', 'clock.png'), 940, 120);

// Legend as PNG (the Marketplace does not allow SVG images in READMEs).
const legendPage = join(tmpdir(), 'posedge-legend.html');
writeFileSync(legendPage, `<html><body style="margin:0;background:#141414"><img src="${url('media/walkthrough/legend.svg')}"></body></html>`);
shot(pathToFileURL(legendPage).href, join(ROOT, 'assets', 'legend.png'), 1140, 460, 2);
