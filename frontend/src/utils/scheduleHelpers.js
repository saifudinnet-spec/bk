export const WIB_TIME_ZONE = 'Asia/Jakarta';

export const SESSION_PERIODS = [
  { id: 'morning', value: 'morning', label: 'Pagi', time: '08:00 – 11:00', slotsPerDay: 6 },
  { id: 'afternoon', value: 'afternoon', label: 'Siang', time: '11:00 – 14:00', slotsPerDay: 6 },
  { id: 'evening', value: 'evening', label: 'Sore', time: '14:00 – 18:00', slotsPerDay: 8 },
];

export const SESSION_SLOTS_COUNT = {
  morning: 6,
  afternoon: 6,
  evening: 8,
};

/**
 * Mengembalikan string tanggal 'YYYY-MM-DD' sesuai zona waktu WIB (Asia/Jakarta).
 */
export function getWibDateStr(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Menentukan periode sesi ('morning' | 'afternoon' | 'evening') berdasarkan start_time HH:MM WIB.
 */
export function resolveSessionPeriod(startTime = '') {
  const hm = String(startTime).substring(0, 5);
  if (hm < '11:00') return 'morning';
  if (hm < '14:00') return 'afternoon';
  return 'evening';
}

/**
 * Mengelompokkan daftar slot 30 menit menjadi 3 kelompok sesi harian (Pagi, Siang, Sore).
 */
export function groupSlotsBySessionPeriod(slots = []) {
  const grouped = { morning: [], afternoon: [], evening: [] };
  slots.forEach((slot) => {
    const period = slot.session_period || resolveSessionPeriod(slot.start_time);
    if (grouped[period]) {
      grouped[period].push(slot);
    } else {
      grouped.evening.push(slot);
    }
  });
  return grouped;
}

/**
 * Format timestamp ISO (UTC/ISO8601) menjadi tanggal WIB.
 */
export function formatWibDate(value, options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('id-ID', {
    timeZone: WIB_TIME_ZONE,
    ...options,
  });
}

/**
 * Format timestamp ISO (UTC/ISO8601) menjadi jam WIB (HH:MM).
 */
export function formatWibTime(value, options = { hour: '2-digit', minute: '2-digit' }) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('id-ID', {
    timeZone: WIB_TIME_ZONE,
    ...options,
  });
}

/**
 * Format tanggal kalender 'YYYY-MM-DD' secara aman tanpa tergeser offset UTC lokal.
 */
export function formatYmdDate(dateStr, options = { weekday: 'short', day: 'numeric', month: 'short' }) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString('id-ID', options);
}

