import imageCompression from 'browser-image-compression';

const TARGET_KB = 100;
const HARD_CAP_KB = 1000; // matches the 1MB bucket limit set in Supabase

/**
 * Prepares a file for upload to a private Supabase Storage bucket.
 *
 * - Images are compressed client-side toward ~100KB using
 *   browser-image-compression, which reliably hits a target size by
 *   iteratively reducing quality/resolution.
 * - PDFs cannot be reliably compressed to a guaranteed size in the
 *   browser (embedded scanned images need real re-encoding a lightweight
 *   JS library can't do), so we just validate size and give a clear
 *   message if one's too big, rather than pretend to compress it.
 *
 * Throws an Error with a user-facing message if the file can't be used.
 */
export async function prepareUploadFile(file) {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  if (!isImage && !isPdf) {
    throw new Error('Please upload a PDF or an image (JPG/PNG) of the signed document.');
  }

  if (isPdf) {
    const sizeKB = file.size / 1024;
    if (sizeKB > HARD_CAP_KB) {
      throw new Error(
        `That PDF is ${Math.round(sizeKB)}KB — please keep it under ${HARD_CAP_KB}KB. A simple text document with a signature is usually well under this; if it's a scanned photo, try converting it to a JPG instead, which we can compress automatically.`
      );
    }
    return file;
  }

  // Image: compress toward the target size.
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: TARGET_KB / 1024,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });
    return compressed;
  } catch {
    throw new Error('Could not process that image. Please try a different file.');
  }
}
