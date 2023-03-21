import fs from 'fs/promises';

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}
