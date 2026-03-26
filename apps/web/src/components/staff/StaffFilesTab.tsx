import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { Download, Eye, Paperclip, Trash2 } from 'lucide-react';
import { apiJson, apiForm } from '../../lib/api';

type FileRow = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string | null;
};

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Self-contained files tab. Pass the base API path for the user
 * e.g. `/api/staff/providers/5` or `/api/staff/team/admin/3`.
 */
export function StaffFilesTab({ basePath, queryKey }: { basePath: string; queryKey: string[] }) {
  const qc = useQueryClient();
  const fullKey = [...queryKey, 'files'];

  const filesQ = useQuery({
    queryKey: fullKey,
    queryFn: () => apiJson<{ items: FileRow[] }>(`${basePath}/files`),
  });

  const deleteMut = useMutation({
    mutationFn: (fileId: string) =>
      apiJson(`${basePath}/files/${fileId}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: fullKey }),
  });

  async function handleUpload(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    try {
      await apiForm(`${basePath}/files`, fd);
      void qc.invalidateQueries({ queryKey: fullKey });
    } catch {
      alert('Upload failed');
    }
  }

  const files = filesQ.data?.items ?? [];

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-5 text-sm text-zinc-400 hover:border-zinc-500">
        <Paperclip className="h-4 w-4 shrink-0" />
        <span>Click to upload a file (max 15 MB)</span>
        <input
          type="file"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) await handleUpload(file);
          }}
        />
      </label>

      {filesQ.isPending && <p className="text-sm text-zinc-500">Loading files…</p>}
      {filesQ.isError && (
        <p className="text-sm text-red-400">{(filesQ.error as Error).message}</p>
      )}

      {!filesQ.isPending && files.length === 0 && (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
          No files uploaded yet.
        </p>
      )}

      {files.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Size</th>
                <th className="px-4 py-2.5">Uploaded</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {files.map((f) => (
                <tr key={f.id} className="bg-zinc-900/20 hover:bg-zinc-900/50">
                  <td
                    className="max-w-xs truncate px-4 py-2.5 font-medium text-zinc-100"
                    title={f.originalName}
                  >
                    {f.originalName}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400">{fmtBytes(f.sizeBytes)}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{fmtDate(f.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`${basePath}/files/${f.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-zinc-200"
                        title="View"
                        aria-label="View file"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={`${basePath}/files/${f.id}?download=1`}
                        download={f.originalName}
                        className="text-zinc-500 hover:text-zinc-200"
                        title="Download"
                        aria-label="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        disabled={deleteMut.isPending}
                        onClick={() => {
                          if (confirm('Remove this file?')) deleteMut.mutate(f.id);
                        }}
                        className="text-zinc-500 hover:text-red-400 disabled:opacity-50"
                        aria-label="Delete file"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
