import { db } from '@/services/database';
import { HSL, rgbToHsl, hslToString, clamp, pickForegroundForHsl } from './color';

export type ThemeColors = {
  primary: string; // H S% L%
  primaryForeground: string;
  accent?: string;
  ring?: string;
  sidebarPrimary?: string;
  sidebarPrimaryForeground?: string;
};

export async function loadThemeFromSettings() {
  try {
    const settings = await db.settings.toArray();
    const themeColors = settings.find(s => s.key === 'theme_colors')?.value as ThemeColors | undefined;
    if (themeColors) {
      applyThemeColors(themeColors);
    }
  } catch (e) {
    // ignore
  }
}

export function applyThemeColors(colors: ThemeColors) {
  const root = document.documentElement;
  if (colors.primary) root.style.setProperty('--primary', colors.primary);
  if (colors.primaryForeground) root.style.setProperty('--primary-foreground', colors.primaryForeground);
  if (colors.accent) root.style.setProperty('--accent', colors.accent);
  if (colors.ring) root.style.setProperty('--ring', colors.ring);
  if (colors.sidebarPrimary) root.style.setProperty('--sidebar-primary', colors.sidebarPrimary);
  if (colors.sidebarPrimaryForeground) root.style.setProperty('--sidebar-primary-foreground', colors.sidebarPrimaryForeground);
}

export async function saveTheme(colors: ThemeColors, imageDataUrl?: string) {
  // Persist to settings
  const payloads: { key: string; value: any }[] = [
    { key: 'theme_colors', value: colors },
  ];
  if (imageDataUrl) payloads.push({ key: 'theme_image', value: imageDataUrl });

  for (const { key, value } of payloads) {
    const existing = await db.settings.where('key').equals(key).first();
    if (existing) await db.settings.update(existing.id!, { value });
    else await db.settings.add({ key, value });
  }
}

export async function clearTheme() {
  const keys = ['theme_colors', 'theme_image'];
  for (const key of keys) {
    const existing = await db.settings.where('key').equals(key).first();
    if (existing) await db.settings.delete(existing.id!);
  }
}

export async function getSavedThemeImage(): Promise<string | undefined> {
  const existing = await db.settings.where('key').equals('theme_image').first();
  return existing?.value as string | undefined;
}

// Extract a palette from image data by computing average color of sampled pixels
export async function extractThemeFromImage(imageDataUrl: string): Promise<ThemeColors> {
  const img = await loadImage(imageDataUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const targetSize = 120; // downscale for performance
  const scale = Math.min(targetSize / img.width, targetSize / img.height, 1);
  canvas.width = Math.max(1, Math.floor(img.width * scale));
  canvas.height = Math.max(1, Math.floor(img.height * scale));
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  const step = 4 * 5; // sample every 5th pixel
  for (let i = 0; i < data.length; i += step) {
    const a = data[i + 3];
    if (a < 64) continue; // skip transparent
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Skip near white/near black to avoid background bias
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const brightness = (r + g + b) / (3 * 255);
    if (brightness > 0.95 || brightness < 0.05) continue;
    if (sat < 0.05) continue; // very gray

    rSum += r; gSum += g; bSum += b; count++;
  }

  // Fallback: if nothing passed filters, use full average
  if (count === 0) {
    for (let i = 0; i < data.length; i += step) {
      const a = data[i + 3];
      if (a < 64) continue;
      rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2]; count++;
    }
  }

  const rAvg = Math.round(rSum / Math.max(1, count));
  const gAvg = Math.round(gSum / Math.max(1, count));
  const bAvg = Math.round(bSum / Math.max(1, count));
  const hsl: HSL = rgbToHsl(rAvg, gAvg, bAvg);

  // Build theme based on this hue
  const primary: HSL = {
    h: hsl.h,
    s: clamp(hsl.s, 30, 90),
    l: clamp(hsl.l, 30, 55),
  };
  const accent: HSL = {
    h: hsl.h,
    s: clamp(hsl.s * 0.6, 20, 75),
    l: clamp(hsl.l + 15, 35, 75),
  };
  const ring: HSL = {
    h: hsl.h,
    s: clamp(hsl.s * 0.8, 30, 85),
    l: clamp(hsl.l + 10, 40, 70),
  };

  const primaryStr = hslToString(primary);
  const accentStr = hslToString(accent);
  const ringStr = hslToString(ring);
  const primaryFg = pickForegroundForHsl(primary);

  return {
    primary: primaryStr,
    primaryForeground: primaryFg,
    accent: accentStr,
    ring: ringStr,
    sidebarPrimary: primaryStr,
    sidebarPrimaryForeground: primaryFg,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
