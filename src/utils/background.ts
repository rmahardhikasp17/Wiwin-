import { db } from '@/services/database';

export async function getBackgroundImage(): Promise<string | undefined> {
  const rec = await db.settings.where('key').equals('bg_image').first();
  return rec?.value as string | undefined;
}

export async function saveBackgroundImage(dataUrl: string) {
  const existing = await db.settings.where('key').equals('bg_image').first();
  if (existing) await db.settings.update(existing.id!, { value: dataUrl });
  else await db.settings.add({ key: 'bg_image', value: dataUrl });
}

export async function clearBackgroundImage() {
  const existing = await db.settings.where('key').equals('bg_image').first();
  if (existing) await db.settings.delete(existing.id!);
}
