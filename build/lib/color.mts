// Color math used by the generators and the validator. No dependencies.
//
// - sRGB <-> linear, WCAG relative luminance and contrast ratio
// - OKLab / OKLCH (Björn Ottosson) for perceptual mixing and distances
// - CIEDE2000 (via CIELAB, D65) for classic ΔE reporting
// - Colour-vision-deficiency simulation (Machado et al. 2009, severity 1.0)

export interface RGB {
  r: number; // 0..1, gamma-encoded sRGB
  g: number;
  b: number;
}

export interface Lab {
  L: number;
  a: number;
  b: number;
}

export interface LCh {
  L: number;
  C: number;
  h: number; // degrees
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

export function parseHex(hex: string): { rgb: RGB; alpha: number } {
  const m = /^#([0-9a-f]{3,8})$/i.exec(hex.trim());
  if (!m) throw new Error(`Invalid hex color: ${hex}`);
  let h = m[1];
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
  if (h.length !== 6 && h.length !== 8) throw new Error(`Invalid hex color: ${hex}`);
  const n = (i: number): number => parseInt(h.slice(i, i + 2), 16) / 255;
  return { rgb: { r: n(0), g: n(2), b: n(4) }, alpha: h.length === 8 ? n(6) : 1 };
}

export function toHex(rgb: RGB, alpha = 1): string {
  const c = (x: number): string => Math.round(clamp01(x) * 255).toString(16).padStart(2, '0');
  const base = `#${c(rgb.r)}${c(rgb.g)}${c(rgb.b)}`.toUpperCase();
  return alpha >= 1 ? base : `${base}${c(alpha).toUpperCase()}`;
}

/** Returns `hex` with the given alpha (0..1) as #RRGGBBAA. */
export function withAlpha(hex: string, alpha: number): string {
  return toHex(parseHex(hex).rgb, alpha);
}

export const srgbToLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const linearToSrgb = (c: number): number => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** Alpha-composites `fg` (may carry alpha) over an opaque `bg`. */
export function composite(fg: string, bg: string): string {
  const f = parseHex(fg);
  const b = parseHex(bg).rgb;
  const a = f.alpha;
  return toHex({ r: f.rgb.r * a + b.r * (1 - a), g: f.rgb.g * a + b.g * (1 - a), b: f.rgb.b * a + b.b * (1 - a) });
}

export function luminance(hex: string): number {
  const { r, g, b } = parseHex(hex).rgb;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** WCAG 2.x contrast ratio. A translucent `fg` is composited over `bg` first. */
export function contrast(fg: string, bg: string): number {
  const f = luminance(composite(fg, bg));
  const b = luminance(bg);
  const [hi, lo] = f > b ? [f, b] : [b, f];
  return (hi + 0.05) / (lo + 0.05);
}

// ---------------------------------------------------------------- OKLab / OKLCH

function linearRgbToOklab(r: number, g: number, b: number): Lab {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToLinearRgb(lab: Lab): [number, number, number] {
  const l = (lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b) ** 3;
  const m = (lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b) ** 3;
  const s = (lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function toOklab(hex: string): Lab {
  const { r, g, b } = parseHex(hex).rgb;
  return linearRgbToOklab(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
}

export function fromOklab(lab: Lab): string {
  const [r, g, b] = oklabToLinearRgb(lab);
  return toHex({ r: linearToSrgb(clamp01(r)), g: linearToSrgb(clamp01(g)), b: linearToSrgb(clamp01(b)) });
}

export function toOklch(hex: string): LCh {
  const { L, a, b } = toOklab(hex);
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { L, C: Math.hypot(a, b), h: h < 0 ? h + 360 : h };
}

const inGamut = ([r, g, b]: [number, number, number]): boolean =>
  [r, g, b].every((c) => c >= -1e-4 && c <= 1 + 1e-4);

/** OKLCH -> hex, reducing chroma until the color fits in sRGB (keeps hue and lightness). */
export function fromOklch(lch: LCh): string {
  const rad = (lch.h * Math.PI) / 180;
  let C = lch.C;
  for (let i = 0; i < 40; i++) {
    const lab = { L: lch.L, a: C * Math.cos(rad), b: C * Math.sin(rad) };
    if (inGamut(oklabToLinearRgb(lab)) || C < 1e-4) return fromOklab(lab);
    C *= 0.95;
  }
  return fromOklab({ L: lch.L, a: 0, b: 0 });
}

/** Perceptual mix in OKLab. t = 0 -> a, t = 1 -> b. */
export function mix(a: string, b: string, t: number): string {
  const A = toOklab(a);
  const B = toOklab(b);
  return fromOklab({ L: A.L + (B.L - A.L) * t, a: A.a + (B.a - A.a) * t, b: A.b + (B.b - A.b) * t });
}

/** Sets OKLCH lightness (0..1) keeping hue; chroma optionally scaled. */
export function withLightness(hex: string, L: number, chromaScale = 1): string {
  const c = toOklch(hex);
  return fromOklch({ L, C: c.C * chromaScale, h: c.h });
}

/** Euclidean distance in OKLab, scaled by 100 (≈ 1 is a just-noticeable difference, 10+ is clearly distinct). */
export function deltaEOK(a: string, b: string): number {
  const A = toOklab(a);
  const B = toOklab(b);
  return 100 * Math.hypot(A.L - B.L, A.a - B.a, A.b - B.b);
}

// ---------------------------------------------------------------- CIEDE2000

function toCieLab(hex: string): Lab {
  const { r, g, b } = parseHex(hex).rgb;
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const X = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047;
  const Y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B;
  const Z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883;
  const f = (t: number): number => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(X);
  const fy = f(Y);
  const fz = f(Z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export function deltaE2000(hexA: string, hexB: string): number {
  const p = toCieLab(hexA);
  const q = toCieLab(hexB);
  const rad = Math.PI / 180;
  const C1 = Math.hypot(p.a, p.b);
  const C2 = Math.hypot(q.a, q.b);
  const Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1 = (1 + G) * p.a;
  const a2 = (1 + G) * q.a;
  const c1 = Math.hypot(a1, p.b);
  const c2 = Math.hypot(a2, q.b);
  const hue = (b: number, a: number): number => {
    if (a === 0 && b === 0) return 0;
    const h = Math.atan2(b, a) / rad;
    return h < 0 ? h + 360 : h;
  };
  const h1 = hue(p.b, a1);
  const h2 = hue(q.b, a2);
  const dL = q.L - p.L;
  const dC = c2 - c1;
  let dh = 0;
  if (c1 * c2 !== 0) {
    dh = h2 - h1;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(c1 * c2) * Math.sin((dh / 2) * rad);
  const Lm = (p.L + q.L) / 2;
  const cm = (c1 + c2) / 2;
  let hm = h1 + h2;
  if (c1 * c2 !== 0) {
    if (Math.abs(h1 - h2) > 180) hm = h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2;
    else hm = (h1 + h2) / 2;
  }
  const T =
    1 -
    0.17 * Math.cos((hm - 30) * rad) +
    0.24 * Math.cos(2 * hm * rad) +
    0.32 * Math.cos((3 * hm + 6) * rad) -
    0.2 * Math.cos((4 * hm - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hm - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(cm ** 7 / (cm ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lm - 50) ** 2) / Math.sqrt(20 + (Lm - 50) ** 2);
  const Sc = 1 + 0.045 * cm;
  const Sh = 1 + 0.015 * cm * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh));
}

// ---------------------------------------------------------------- Colour-vision deficiency

export type Cvd = 'protan' | 'deutan' | 'tritan';

// Machado, Oliveira & Fernandes (2009), severity 1.0, applied in linear RGB.
const CVD_MATRICES: Record<Cvd, number[]> = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
};

export function simulateCvd(hex: string, kind: Cvd): string {
  const { r, g, b } = parseHex(hex).rgb;
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const m = CVD_MATRICES[kind];
  const out = (i: number): number => linearToSrgb(clamp01(m[i] * R + m[i + 1] * G + m[i + 2] * B));
  return toHex({ r: out(0), g: out(3), b: out(6) });
}
