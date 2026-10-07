import fs from 'fs';
import path from 'path';

/**
 * Resolve the root uploads directory safely.
 * Works whether server is executed from project root or /server directory.
 */
export const getUploadsDir = (): string => {
  let targetDir = path.resolve(process.cwd(), 'uploads', 'profiles');
  
  // If running inside server/ directory, target ../uploads/profiles
  if (!fs.existsSync(path.resolve(process.cwd(), 'uploads')) && fs.existsSync(path.resolve(process.cwd(), '..', 'uploads'))) {
    targetDir = path.resolve(process.cwd(), '..', 'uploads', 'profiles');
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  return targetDir;
};

/**
 * Validate image magic bytes to prevent file extension spoofing.
 * Supports JPEG, PNG, and WebP.
 */
export const verifyImageMagicBytes = (filePath: string): boolean => {
  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    // JPEG signature: FF D8 FF
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;

    // WebP signature: 'RIFF' at offset 0, 'WEBP' at offset 8
    const isWebp =
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';

    return isJpeg || isPng || isWebp;
  } catch (error) {
    return false;
  }
};

/**
 * Safely delete an uploaded file without directory traversal risks.
 */
export const deleteFileSafely = async (fileRelativePath: string | null | undefined): Promise<boolean> => {
  if (!fileRelativePath) return false;

  try {
    const normalized = path.normalize(fileRelativePath);
    const filename = path.basename(normalized);

    // Ensure we only touch files inside uploads/profiles
    const fullPath = path.join(getUploadsDir(), filename);

    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
  } catch (error) {
    // Non-fatal if file doesn't exist
  }

  return false;
};
