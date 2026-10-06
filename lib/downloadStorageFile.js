/**
 * Forces an immediate browser download of a private Supabase Storage file.
 * Uses the storage download API (blob) instead of a signed URL so the file
 * saves to the device and the Supabase address is never shown.
 */
export async function downloadStorageFile(supabase, bucket, path, fileName) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;

  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || path.split('/').pop() || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
