import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';

// URL domain server webhook — otomatis mendeteksi origin saat ini atau domain production
const SERVER_DOMAIN = typeof window !== 'undefined' && window.location.origin.includes('http')
  ? window.location.origin
  : 'https://konseling.uinssc.ac.id';
const WEBHOOK_URL   = `${SERVER_DOMAIN}/api/deploy/webhook`;

// ─── Status Badge ────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    success: 'bg-green-100 text-green-800',
    failed:  'bg-red-100 text-red-800',
    running: 'bg-yellow-100 text-yellow-800',
  };
  const label = { success: '✅ Sukses', failed: '❌ Gagal', running: '⏳ Berjalan' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {label[status] || status}
    </span>
  );
}

// ─── Status Server Card ──────────────────────────────────────
function ServerStatusCard({ status, loading, onRefresh }) {
  if (loading) return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
  if (!status) return null;

  const upToDate = status.behind_count === 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">📊 Status Versi Server</h3>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${upToDate ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {upToDate ? '✅ Up to date' : `⚠️ ${status.behind_count} commit tertinggal`}
          </span>
          <button onClick={onRefresh} className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1 rounded border hover:border-gray-300 transition">
            🔄
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Commit Aktif</p>
          <p className="font-mono font-semibold text-gray-700">{status.git_commit || '-'}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Branch</p>
          <p className="font-mono font-semibold text-gray-700">{status.git_branch || '-'}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">PHP</p>
          <p className="text-gray-700">{status.php_version?.split(' ').slice(0, 2).join(' ') || '-'}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Node</p>
          <p className="text-gray-700">{status.node_version || '-'}</p>
        </div>
        {status.last_deploy && (
          <div className="col-span-2">
            <p className="text-gray-400 text-xs mb-0.5">Deploy Terakhir</p>
            <p className="text-gray-700">
              {status.last_deploy.at} — oleh <span className="font-medium">{status.last_deploy.triggered_by}</span>
              {status.last_deploy.commit_after && (
                <span className="ml-1 font-mono text-xs text-emerald-600">({status.last_deploy.commit_after})</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Panel Konsol Output ────────────────────────────────────
function ConsolePanel({ output, status }) {
  const consoleRef = useRef(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output]);

  if (!output) return null;

  const borderColor = status === 'success'
    ? 'border-green-500/40'
    : status === 'failed'
    ? 'border-red-500/40'
    : 'border-yellow-500/40';

  return (
    <div className={`bg-slate-900 rounded-xl border ${borderColor} overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="ml-2 text-slate-400 text-xs font-mono">🖥 output konsol</span>
        </div>
        <div className="flex gap-2">
          {status === 'running' && (
            <span className="text-yellow-400 text-xs animate-pulse">⏳ Sedang berjalan...</span>
          )}
          <button
            onClick={() => navigator.clipboard.writeText(output)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700 hover:border-slate-500 transition"
          >
            📋 Salin
          </button>
          <button
            onClick={() => {
              const blob = new Blob([output], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'deploy-log.txt'; a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700 hover:border-slate-500 transition"
          >
            ↓ Unduh
          </button>
        </div>
      </div>
      <pre
        ref={consoleRef}
        className="p-4 text-sm font-mono text-slate-200 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-80"
      >
        {output}
      </pre>
    </div>
  );
}

// ─── Panel Aksi Deploy ────────────────────────────────────────
function DeployActionPanel({ onDeployDone }) {
  const [running, setRunning]   = useState(false);
  const [output, setOutput]     = useState('');
  const [deployStatus, setDeployStatus] = useState(null); // null | 'running' | 'success' | 'failed'
  const [confirmed, setConfirmed] = useState(false);

  const handleDeploy = async () => {
    setRunning(true);
    setDeployStatus('running');
    setOutput('Menghubungi server...\nMemulai proses deploy...\n\n');

    try {
      const data = await api.post('/admin/deploy/run');

      setOutput(data.output || '(Tidak ada output)');
      setDeployStatus(data.success ? 'success' : 'failed');
      setConfirmed(false);

      if (onDeployDone) onDeployDone();
    } catch (err) {
      setOutput(`ERROR: Gagal menghubungi server.\n${err.message || 'Terjadi kesalahan sistem'}`);
      setDeployStatus('failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">🔄 Pull & Update dari GitHub</h3>
        <p className="text-xs text-gray-500 mt-1">
          Jalankan: <span className="font-mono bg-gray-100 px-1 rounded">git pull</span> →{' '}
          <span className="font-mono bg-gray-100 px-1 rounded">npm run build</span> →{' '}
          <span className="font-mono bg-gray-100 px-1 rounded">migrate</span> →{' '}
          <span className="font-mono bg-gray-100 px-1 rounded">optimize</span>
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Langkah-langkah yang akan dijalankan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { step: '1', icon: '⬇️', label: 'Git Pull', desc: 'Ambil kode terbaru' },
            { step: '2', icon: '🔨', label: 'Build Frontend', desc: 'npm run build' },
            { step: '3', icon: '🗄️', label: 'Migrasi DB', desc: 'artisan migrate' },
            { step: '4', icon: '⚡', label: 'Optimasi', desc: 'artisan optimize' },
          ].map(({ step, icon, label, desc }) => (
            <div key={step} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-xs font-semibold text-gray-700">{label}</div>
              <div className="text-xs text-gray-400">{desc}</div>
            </div>
          ))}
        </div>

        {/* Warning & Konfirmasi */}
        {!running && deployStatus !== 'running' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800 font-semibold mb-1">⚠️ Perhatian sebelum deploy:</p>
            <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
              <li>Pastikan sudah push kode terbaru ke GitHub terlebih dahulu</li>
              <li>Proses ini tidak dapat dibatalkan setelah dimulai</li>
              <li>Proses membutuhkan waktu ~1–3 menit</li>
            </ul>
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs text-amber-800 font-medium">Saya sudah memahami dan siap menjalankan update</span>
            </label>
          </div>
        )}

        {/* Tombol Deploy */}
        {!running ? (
          <button
            onClick={handleDeploy}
            disabled={!confirmed && deployStatus !== 'success'}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              confirmed || deployStatus === 'success'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            🚀 Jalankan Pull & Update Sekarang
          </button>
        ) : (
          <div className="w-full py-3 rounded-xl bg-yellow-50 border border-yellow-200 text-center">
            <span className="text-yellow-700 font-semibold text-sm animate-pulse">
              ⏳ Proses berjalan, harap tunggu... (bisa 1–3 menit)
            </span>
          </div>
        )}

        {/* Hasil */}
        {deployStatus === 'success' && !running && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 font-semibold">
            ✅ Deploy berhasil! Kode server sudah diperbarui.
          </div>
        )}
        {deployStatus === 'failed' && !running && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 font-semibold">
            ❌ Deploy selesai dengan error. Lihat output konsol di bawah untuk detail.
          </div>
        )}

        {/* Konsol Output */}
        <ConsolePanel output={output} status={deployStatus} />
      </div>
    </div>
  );
}

// ─── Modal Konsol Riwayat ────────────────────────────────────
function ConsoleModal({ log, onClose }) {
  if (!log) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div>
            <span className="text-slate-300 text-sm font-mono">🖥 Output Deploy</span>
            <StatusBadge status={log.status} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>
        <pre className="flex-1 overflow-y-auto p-4 text-sm font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
          {log.output}
        </pre>
        <div className="px-4 py-2 border-t border-slate-700 flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(log.output)}
            className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded border border-slate-600 hover:border-slate-400 transition"
          >
            📋 Salin
          </button>
          <button
            onClick={() => {
              const blob = new Blob([log.output], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url;
              a.download = `deploy-${log.id}.txt`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded border border-slate-600 hover:border-slate-400 transition"
          >
            ↓ Unduh Log
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────
export default function AdminDeployPage() {
  const [logs, setLogs]                   = useState([]);
  const [serverStatus, setServerStatus]   = useState(null);
  const [loadingLogs, setLoadingLogs]     = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [selectedLog, setSelectedLog]     = useState(null);
  const [error, setError]                 = useState('');
  const [activeTab, setActiveTab]         = useState('action'); // 'action' | 'history'

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await api.get('/admin/deploy/logs');
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat riwayat deployment.');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const data = await api.get('/admin/deploy/status');
      setServerStatus(data);
    } catch {
      // tidak kritis
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStatus();
  }, []);

  const handleDeployDone = () => {
    fetchLogs();
    fetchStatus();
    setActiveTab('history');
  };

  const tabs = [
    { id: 'action',  label: '🚀 Pull & Update' },
    { id: 'history', label: '📋 Riwayat Deploy' },
    { id: 'info',    label: '📌 Info Webhook' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🚀 Update & Deployment</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola pembaruan kode server dari GitHub</p>
        </div>
        <button
          onClick={() => { fetchLogs(); fetchStatus(); }}
          className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:border-emerald-400 text-gray-600 hover:text-emerald-700 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Status Server — selalu tampil */}
      <div className="mb-5">
        <ServerStatusCard status={serverStatus} loading={loadingStatus} onRefresh={fetchStatus} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
      )}

      {/* Tab: Pull & Update */}
      {activeTab === 'action' && (
        <DeployActionPanel onDeployDone={handleDeployDone} />
      )}

      {/* Tab: Riwayat */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">📋 Riwayat Deployment</h3>
            <span className="text-xs text-gray-400">{logs.length} entri terakhir</span>
          </div>

          {loadingLogs ? (
            <div className="p-8 text-center text-gray-400 text-sm animate-pulse">Memuat riwayat...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <p className="text-2xl mb-2">📭</p>
              <p>Belum ada riwayat deployment.</p>
              <p className="mt-1">Jalankan Pull & Update atau lakukan push ke GitHub untuk memulai deployment otomatis.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Waktu</th>
                    <th className="px-5 py-3">Dipicu oleh</th>
                    <th className="px-5 py-3">Commit</th>
                    <th className="px-5 py-3">Durasi</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{log.started_at || '-'}</td>
                      <td className="px-5 py-3 font-medium text-gray-700">{log.triggered_by || '-'}</td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs text-gray-500">
                          {log.commit_before || '?'}
                          {' → '}
                          <span className="text-emerald-600 font-semibold">{log.commit_after || '?'}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{log.duration || '-'}</td>
                      <td className="px-5 py-3"><StatusBadge status={log.status} /></td>
                      <td className="px-5 py-3">
                        {log.output ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-xs px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-600 transition"
                          >
                            🖥 Lihat
                          </button>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Info Webhook */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-emerald-800 mb-1">📌 URL Webhook GitHub</p>
            <p className="text-xs text-emerald-700 mb-2">
              Daftarkan URL ini di: GitHub Repo → Settings → Webhooks → Add webhook
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 block bg-white border border-emerald-200 rounded px-3 py-2 text-sm font-mono text-emerald-900 break-all">
                {WEBHOOK_URL}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(WEBHOOK_URL)}
                className="shrink-0 px-3 py-2 rounded-lg border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition"
                title="Salin URL"
              >
                📋 Salin
              </button>
            </div>
            <p className="text-xs text-emerald-600 mt-2">
              Secret: gunakan nilai <code className="bg-white px-1 rounded">DEPLOY_SECRET</code> dari file <code className="bg-white px-1 rounded">.env</code> server
              {' '}(<span className="font-mono font-semibold">bk-deploy-2026-ruangbk</span>)
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-800 mb-3">📋 Cara Setup Webhook di GitHub</p>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Buka GitHub repo → klik <strong>Settings</strong></li>
              <li>Klik menu <strong>Webhooks</strong> → <strong>Add webhook</strong></li>
              <li>Isi <strong>Payload URL</strong> dengan URL di atas</li>
              <li>Pilih <strong>Content type:</strong> <code className="bg-gray-100 px-1 rounded">application/json</code></li>
              <li>Isi <strong>Secret</strong> dengan nilai <code className="bg-gray-100 px-1 rounded">DEPLOY_SECRET</code> yang ada di <code className="bg-gray-100 px-1 rounded">.env</code> server</li>
              <li>Pilih event: <strong>Just the push event</strong></li>
              <li>Klik <strong>Add webhook</strong></li>
            </ol>
            <p className="text-xs text-gray-400 mt-4">
              Setelah terdaftar, setiap kali Anda push ke branch <code className="bg-gray-100 px-1 rounded">main</code>, server akan otomatis menjalankan deploy.
            </p>
          </div>
        </div>
      )}

      {/* Modal konsol dari riwayat */}
      {selectedLog && <ConsoleModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
