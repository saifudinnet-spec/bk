import React from 'react';

export const AdminAuditTab = ({ auditLogs = [] }) => {
  return (
    <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
      <h3 className="text-sm font-bold text-darktext">Audit Logs Keamanan & Aktivitas Sensitif</h3>
      <p className="text-xs text-mutedtext">
        Merekam akses data sensitif, login, submit screening, dan pembuatan catatan konseling.
      </p>

      <div className="space-y-2.5">
        {auditLogs.length === 0 ? (
          <p className="text-xs text-mutedtext italic py-4">Belum ada catatan log aktivitas.</p>
        ) : (
          auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-800 capitalize">{log.action}</span>
                  <span className="text-mutedtext">oleh {log.user?.name || 'Anonim'} ({log.user?.role || 'Guest'})</span>
                </div>
                <span className="text-[10px] text-mutedtext font-mono">
                  {new Date(log.created_at).toLocaleString('id-ID')}
                </span>
              </div>

              {log.ip_address && (
                <div className="text-[10px] text-mutedtext font-mono">
                  IP: {log.ip_address} {log.entity_type ? `• Target: ${log.entity_type} #${log.entity_id}` : ''}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminAuditTab;
