'use client';

import { useEffect, useState } from 'react';
import { FileSignature, Download, Upload, Check, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { prepareUploadFile } from '@/lib/fileUpload';
import { downloadStorageFile } from '@/lib/downloadStorageFile';
import { formatNaira, formatDate } from '@/lib/utils';

export default function LoanBondUpload({ userId, loanId, principal, disbursedAt, onChange }) {
  const [hasBond, setHasBond] = useState(false);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function checkStatus() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: bondDoc }, { data: templateRow }] = await Promise.all([
      supabase
        .from('loan_documents')
        .select('id')
        .eq('user_id', userId)
        .eq('loan_id', loanId)
        .eq('document_type', 'bond')
        .limit(1)
        .maybeSingle(),
      supabase
        .from('loan_templates')
        .select('file_path, file_name')
        .eq('type', 'bond')
        .maybeSingle(),
    ]);
    const ready = !!bondDoc;
    setHasBond(ready);
    setTemplate(templateRow ?? null);
    onChange?.(ready);
    setLoading(false);
  }

  useEffect(() => {
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loanId]);

  async function handleDownload() {
    if (!template?.file_path) return;
    setError('');
    setDownloading(true);
    const supabase = createClient();
    try {
      await downloadStorageFile(
        supabase,
        'loan-forms',
        template.file_path,
        template.file_name || 'loan-bond.pdf'
      );
    } catch {
      setError('Could not download the loan bond form. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const prepared = await prepareUploadFile(file);
      const supabase = createClient();
      const ext = file.type === 'application/pdf' ? 'pdf' : 'jpg';
      const path = `${userId}/${loanId}/bond.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('loan-documents')
        .upload(path, prepared, {
          contentType: prepared.type || file.type,
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('loan_documents').insert({
        user_id: userId,
        loan_id: loanId,
        document_type: 'bond',
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
    <div className="rounded-sm border border-brass/40 bg-brass/5 px-4 py-3">
      <div className="flex items-center gap-2">
        <FileSignature className="h-4 w-4 text-brass" strokeWidth={1.75} />
        <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
          Loan bond
        </p>
      </div>

      {loading ? (
        <p className="mt-2 font-body text-sm text-ink-muted">Checking…</p>
      ) : hasBond ? (
        <p className="mt-2 flex items-center gap-1.5 font-body text-sm text-cooperative-dark">
          <Check className="h-4 w-4" />
          Signed loan bond on file. Only an admin can reject it if changes are needed.
        </p>
      ) : (
        <>
          <p className="mt-2 font-body text-xs text-ink-muted">
            Confirm receipt of {formatNaira(principal)}
            {disbursedAt && <> disbursed on {formatDate(disbursedAt)}</>}. Download the loan bond,
            fill and sign it, then upload the completed copy below.
          </p>
          {template ? (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="mt-2.5 inline-flex items-center gap-1.5 font-body text-xs font-medium text-cooperative underline-offset-2 hover:underline disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
              {downloading ? 'Downloading…' : 'Download loan bond form'}
            </button>
          ) : (
            <p className="mt-2 font-body text-xs text-brick">
              The loan bond form has not been uploaded by an admin yet. Please check back shortly
              or contact the cooperative.
            </p>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="mt-2 rounded-sm bg-brick/10 px-3 py-2 font-body text-xs text-brick">
          {error}
        </p>
      )}

      {!loading && !hasBond && (
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
          {uploading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
          ) : (
            <Upload className="h-3.5 w-3.5" strokeWidth={2.25} />
          )}
          {uploading ? 'Uploading…' : 'Upload signed bond'}
        </label>
      )}
    </div>
  );
}
