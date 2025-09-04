export type HSL = { h: number; s: number; l: number };

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 1); break;
      case g: h = (b - r) / d + 3; break;
      case b: h = (r - g) / d + 5; break;
    }
    h *= 60;
  }

  return { h, s: s * 100, l: l * 100 };
}

export function hslToString({ h, s, l }: HSL): string {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

// WCAG relative luminance
export function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const srgb = [r, g, b].map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  const [R, G, B] = srgb;
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(l1: number, l2: number) {
  const [a, b] = [l1, l2].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

export function pickForegroundForHsl(bg: HSL): string {
  // Roughly estimate foreground by converting to luminance using l value
  const isDark = bg.l < 50;
  // Light text on dark bg, dark text on light bg
  return isDark ? '210 40% 98%' : '222.2 47.4% 11.2%';
}
