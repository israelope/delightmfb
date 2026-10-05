'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Upload, Check, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

const TEMPLATE_TYPES = [
  {
    type: 'application',
    label: 'Loan application form',
    description: 'Blank form members download, fill, and sign before requesting a loan.',
    path: 'application-form.pdf',
  },
  {
    type: 'bond',
    label: 'Loan bond',
    description: 'Blank form members sign after disbursement to confirm they received the funds.',
    path: 'loan-bond.pdf',
  },
];

const MAX_PDF_KB = 1000;

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LoanFormSettings() {
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState(null);
  const [viewingType, setViewingType] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadTemplates() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('loan_templates').select('*');
    const map = {};
    (data ?? []).forEach((row) => {
      map[row.type] = row;
    });
    setTemplates(map);
    setLoading(false);
  }

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDownload(type) {
    const row = templates[type];
    if (!row) return;
    setError('');
    setViewingType(type);
    const supabase = createClient();
    const { data: signed, error: signError } = await supabase.storage
      .from('loan-forms')
      .createSignedUrl(row.file_path, 60);
    setViewingType(null);
    if (signError || !signed) {
      setError('Could not open that document. Please try again.');
      return;
    }
    window.open(signed.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleUpload(type, file) {
    const config = TEMPLATE_TYPES.find((t) => t.type === type);
    if (!file || !config) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF document.');
      return;
    }
    const sizeKB = file.size / 1024;
    if (sizeKB > MAX_PDF_KB) {
      setError(
        `That PDF is ${Math.round(sizeKB)}KB — please keep it under ${MAX_PDF_KB}KB.`
      );
      return;
    }

    setError('');
    setNotice('');
    setUploadingType(type);

    try {
      const supabase = createClient();
      const path = config.path;

      const { error: uploadError } = await supabase.storage
        .from('loan-forms')
        .upload(path, file, { contentType: 'application/pdf', upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: upsertError } = await supabase.from('loan_templates').upsert(
        {
          type,
          file_path: path,
          file_name: file.name,
          file_size: file.size,
          uploaded_by: user?.id ?? null,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'type' }
      );
      if (upsertError) throw upsertError;

      await loadTemplates();
      setNotice(
        `${config.label} updated. Members will download this version from their loans page.`
      );
    } catch (err) {
      setError(err.message ?? 'Could not upload that file. Please try again.');
    } finally {
      setUploadingType(null);
    }
  }

  function onFileChange(type, e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    handleUpload(type, file);
  }

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Loan documents</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Upload the blank forms members download, fill, and upload back to apply for a loan
            or confirm disbursement.
          </p>
        </div>
        <FileText className="h-5 w-5 text-cooperative" strokeWidth={1.75} />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-4 flex items-center gap-1.5 rounded-sm bg-cooperative/10 px-3 py-2 font-body text-sm text-cooperative-dark">
          <Check className="h-4 w-4" />
          {notice}
        </p>
      )}

      {loading ? (
        <p className="mt-4 font-body text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="mt-5 space-y-5">
          {TEMPLATE_TYPES.map((config) => {
            const row = templates[config.type];
            const busy = uploadingType === config.type;
            return (
              <div
                key={config.type}
                className="rounded-sm border border-rule bg-parchment px-4 py-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
                      {config.label}
                    </p>
                    <p className="mt-1 font-body text-sm text-ink">{config.description}</p>
                    {row ? (
                      <p className="mt-2 font-mono text-xs text-ink-muted">
                        {row.file_name}
                        {row.file_size ? ` · ${formatSize(row.file_size)}` : ''}
                        {row.created_at &&
                          ` · Updated ${new Date(row.created_at).toLocaleDateString('en-NG')}`}
                      </p>
                    ) : (
                      <p className="mt-2 font-body text-xs text-brick">
                        No form uploaded yet — members will see the generic instruction instead.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      disabled={!row}
                      loading={viewingType === config.type}
                      onClick={() => handleDownload(config.type)}
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
                      Download
                    </Button>
                    <label
                      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm bg-cooperative px-3 py-1.5 font-body text-xs font-medium text-parchment-soft transition-colors hover:bg-cooperative-dark ${
                        busy ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => onFileChange(config.type, e)}
                        className="hidden"
                        disabled={busy}
                      />
                      {busy ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
                      ) : (
                        <Upload className="h-3.5 w-3.5" strokeWidth={2.25} />
                      )}
                      {busy ? 'Uploading…' : row ? 'Replace' : 'Upload'}
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
