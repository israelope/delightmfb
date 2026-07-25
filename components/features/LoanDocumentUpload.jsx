'use client';

import { useEffect, useState } from 'react';
import { FileText, Upload, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { prepareUploadFile } from '@/lib/fileUpload';

export default function LoanDocumentUpload({ userId, onChange }) {
  const [hasDocument, setHasDocument] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function checkStatus() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('loan_documents')
      .select('id')
      .eq('user_id', userId)
      .is('loan_id', null)
      .limit(1)
      .maybeSingle();
    const ready = !!data;
    setHasDocument(ready);
    onChange?.(ready);
    setLoading(false);
  }

  useEffect(() => {
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const prepared = await prepareUploadFile(file);
      const supabase = createClient();
      const ext = file.type === 'application/pdf' ? 'pdf' : 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('loan-documents')
        .upload(path, prepared, { contentType: prepared.type || file.type });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('loan_documents').insert({
        user_id: userId,
        file_path: path,
        file_size: prepared.size,
      });

      if (insertError) throw insertError;

      await checkStatus();
    } catch (err) {
      setError(err.message ?? 'Could not upload that file. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-sm border border-rule bg-parchment px-4 py-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-cooperative" strokeWidth={1.75} />
        <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
          Signed loan request document
        </p>
      </div>

      {loading ? (
        <p className="mt-2 font-body text-sm text-ink-muted">Checking…</p>
      ) : hasDocument ? (
        <p className="mt-2 flex items-center gap-1.5 font-body text-sm text-cooperative-dark">
          <Check className="h-4 w-4" />
          Document uploaded and ready.
        </p>
      ) : (
        <p className="mt-2 font-body text-xs text-ink-muted">
          Upload a signed PDF or a photo of the signed page stating your intent to request a
          loan. Images are compressed automatically; PDFs must be under 1MB.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 rounded-sm bg-brick/10 px-3 py-2 font-body text-xs text-brick">
          {error}
        </p>
      )}

      <label
        className={`mt-3 inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-cooperative px-3 py-1.5 font-body text-xs font-medium text-cooperative transition-colors hover:bg-cooperative/5 ${
          uploading ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFile}
          className="hidden"
          disabled={uploading}
        />
        <Upload className="h-3.5 w-3.5" strokeWidth={2.25} />
        {uploading ? 'Uploading…' : hasDocument ? 'Replace document' : 'Upload document'}
      </label>
    </div>
  );
}
