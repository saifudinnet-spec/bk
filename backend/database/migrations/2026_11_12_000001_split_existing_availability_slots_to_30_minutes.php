<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pecah slot ketersediaan yang durasinya > 30 menit (mis. blok 08:00-11:00)
     * menjadi slot per 30 menit agar konseli bisa memilih jam spesifik.
     */
    public function up(): void
    {
        if (!Schema::hasTable('tutor_availabilities')) {
            return;
        }

        DB::transaction(function () {
            $rows = DB::table('tutor_availabilities')
                ->where('status', 'AVAILABLE')
                ->get();

            foreach ($rows as $row) {
                $dateStr = substr((string) $row->date, 0, 10);
                $start   = Carbon::parse($dateStr . ' ' . $row->start_time, 'Asia/Jakarta');
                $end     = Carbon::parse($dateStr . ' ' . $row->end_time, 'Asia/Jakarta');

                if ($start->diffInMinutes($end, false) <= 30) {
                    // Sudah <= 30 menit, pastikan slot_duration = 30 bila perlu
                    if ((int) $row->slot_duration !== 30 && $start->diffInMinutes($end, false) === 30) {
                        DB::table('tutor_availabilities')
                            ->where('id', $row->id)
                            ->update(['slot_duration' => 30]);
                    }
                    continue;
                }

                // Hapus blok lama lalu buat pecahan slot per 30 menit
                DB::table('tutor_availabilities')->where('id', $row->id)->delete();

                $cursor = $start->copy();
                while ($cursor->copy()->addMinutes(30)->lte($end)) {
                    $slotStart = $cursor->format('H:i:s');
                    $slotEnd   = $cursor->copy()->addMinutes(30)->format('H:i:s');

                    $exists = DB::table('tutor_availabilities')
                        ->where('tutor_id', $row->tutor_id)
                        ->where('date', $dateStr)
                        ->whereIn('start_time', [$slotStart, substr($slotStart, 0, 5)])
                        ->exists();

                    if (!$exists) {
                        DB::table('tutor_availabilities')->insert([
                            'tutor_id'      => $row->tutor_id,
                            'date'          => $dateStr,
                            'start_time'    => $slotStart,
                            'end_time'      => $slotEnd,
                            'slot_duration' => 30,
                            'method'        => $row->method ?? 'ALL',
                            'status'        => 'AVAILABLE',
                            'created_at'    => $row->created_at ?? now(),
                            'updated_at'    => now(),
                        ]);
                    }

                    $cursor->addMinutes(30);
                }
            }
        });
    }

    public function down(): void
    {
        // Tidak perlu mengembalikan ke blok besar agar slot 30 menit tetap terjaga
    }
};
