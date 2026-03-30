import fs from "fs";
import path from "path";

const IMAGES_DIR = process.env.IMAGES_DIR || path.join(process.cwd(), "data", "images");

export function ensureImagesDir() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
  return IMAGES_DIR;
}

export async function downloadImageToFile(sourceUrl, jobId) {
  ensureImagesDir();
  const ext = ".webp";
  const filename = `${jobId}${ext}`;
  const dest = path.join(IMAGES_DIR, filename);
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`download_failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return dest;
}

export function localPathForJob(jobId) {
  return path.join(ensureImagesDir(), `${jobId}.webp`);
}
