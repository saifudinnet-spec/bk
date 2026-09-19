import React from 'react';

const statusConfig = {
  // Case statuses
  NEW: { label: 'Kasus Baru', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  SCREENING_COMPLETED: { label: 'Screening Selesai', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  WAITING_REVIEW: { label: 'Menunggu Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  REVIEWED: { label: 'Telah Ditinjau', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  WAITING_SCHEDULE: { label: 'Pilih Jadwal', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  SCHEDULED: { label: 'Terjadwal', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  IN_PROGRESS: { label: 'Sedang Berjalan', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  FOLLOW_UP: { label: 'Tindak Lanjut', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  CLOSED: { label: 'Kasus Ditutup', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },

  // Session statuses
  READY: { label: 'Siap Dimulai', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300 animate-pulse' },
  COMPLETED: { label: 'Selesai', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  CANCELLED: { label: 'Dibatalkan', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },

  // Generic
  active: { label: 'Aktif', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  inactive: { label: 'Non-aktif', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
};

export const StatusBadge = ({ status, className = '' }) => {
  const config = statusConfig[status] || {
    label: status,
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
