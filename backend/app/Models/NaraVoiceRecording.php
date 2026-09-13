<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class NaraVoiceRecording extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'category',
        'title',
        'text',
        'context_hint',
        'audio_path',
        'duration',
        'mime_type',
        'file_size',
        'recorded_by',
        'is_active',
        'order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'duration' => 'integer',
        'file_size' => 'integer',
        'order' => 'integer',
    ];

    protected $appends = [
        'audio_url',
        'has_audio',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function getAudioUrlAttribute(): ?string
    {
        if (empty($this->audio_path)) {
            return null;
        }

        // If it's already an absolute URL
        if (str_starts_with($this->audio_path, 'http://') || str_starts_with($this->audio_path, 'https://')) {
            return $this->audio_path;
        }

        return url('/storage/' . ltrim($this->audio_path, '/'));
    }

    public function getHasAudioAttribute(): bool
    {
        return !empty($this->audio_path);
    }

    /**
     * Default list of required Nara script dialogues
     */
    public static function getDefaultScripts(): array
    {
        return [
            // Kategori 1: Alur Pengajuan Konseling
            [
                'key' => 'counseling_step_0',
                'category' => 'Pengajuan Konseling',
                'title' => 'Langkah 0: Sapaan Awal Nara',
                'context_hint' => 'Dibacakan pertama kali saat mahasiswa membuka formulir asesmen awal.',
                'text' => 'Halo! Saya Nara, asisten virtual Anda. Yuk luangkan 2-3 menit menjawab 5 pertanyaan santai ini agar konselor mengenal situasimu dengan baik.',
                'order' => 1,
            ],
            [
                'key' => 'counseling_step_1',
                'category' => 'Pengajuan Konseling',
                'title' => 'Pertanyaan 1: Kendala Utama',
                'context_hint' => 'Panduan saat mahasiswa memilih kendala utama terkait topik yang dihadapi.',
                'text' => 'Pilih satu kendala yang paling menyita energimu saat ini. Jika belum ada di daftar pilihan, kamu juga bisa memilih opsi Lainnya.',
                'order' => 2,
            ],
            [
                'key' => 'counseling_step_2',
                'category' => 'Pengajuan Konseling',
                'title' => 'Pertanyaan 2: Durasi Kondisi',
                'context_hint' => 'Panduan saat mahasiswa ditanya berapa lama merasakan kondisi tersebut.',
                'text' => 'Kira-kira sudah berapa lama kamu merasakan kondisi ini? Informasi durasi penting agar konselor memahami perjalanan kondisimu.',
                'order' => 3,
            ],
            [
                'key' => 'counseling_step_3',
                'category' => 'Pengajuan Konseling',
                'title' => 'Pertanyaan 3: Tingkat Dampak Harian',
                'context_hint' => 'Panduan saat mahasiswa menilai skala dampak 1 sampai 5.',
                'text' => 'Seberapa besar kondisi ini memengaruhi fokus kuliah atau kegiatan harianmu? Pilih skala 1 sampai 5 ya.',
                'order' => 4,
            ],
            [
                'key' => 'counseling_step_4',
                'category' => 'Pengajuan Konseling',
                'title' => 'Pertanyaan 4: Upaya Mandiri Sebelumnya',
                'context_hint' => 'Panduan saat mahasiswa menceritakan apa yang sudah pernah dicoba.',
                'text' => 'Apakah ada cara atau upaya mandiri yang pernah kamu coba sebelumnya? Ceritakan apa saja, konselor siap mendengarkan tanpa menghakimi.',
                'order' => 5,
            ],
            [
                'key' => 'counseling_step_5',
                'category' => 'Pengajuan Konseling',
                'title' => 'Pertanyaan 5: Harapan Terhadap Konseling',
                'context_hint' => 'Panduan saat mahasiswa menuliskan harapan atau cerita utama.',
                'text' => 'Tuliskan hal utama atau harapan yang paling ingin kamu sampaikan langsung ke konselor. Ceritamu aman dan dijamin kerahasiaannya.',
                'order' => 6,
            ],
            [
                'key' => 'counseling_step_6',
                'category' => 'Pengajuan Konseling',
                'title' => 'Langkah 6: Rangkuman & Konfirmasi',
                'context_hint' => 'Dibacakan saat seluruh pertanyaan selesai dijawab sebelum memilih jadwal.',
                'text' => 'Semua jawabanmu sudah lengkap! Periksa kembali rangkuman di samping. Jika sudah sesuai, kita lanjut ke pemilihan jadwal konseling ya.',
                'order' => 7,
            ],

            // Kategori 2: Sapaan Interaktif & Poke
            [
                'key' => 'poke_1',
                'category' => 'Sapaan & Interaksi',
                'title' => 'Respon Sentuh 1: Nara Siap Membantu',
                'context_hint' => 'Diputar saat pengguna mengklik atau menyapa avatar Nara.',
                'text' => 'Halo! Nara siap bantu jika ada pertanyaan yang membingungkan.',
                'order' => 8,
            ],
            [
                'key' => 'poke_2',
                'category' => 'Sapaan & Interaksi',
                'title' => 'Respon Sentuh 2: Cerita Aman & Privat',
                'context_hint' => 'Pesan penguatan privasi mahasiswa.',
                'text' => 'Jawab dengan santai ya, ceritamu aman dan privat bersama konselor.',
                'order' => 9,
            ],
            [
                'key' => 'poke_3',
                'category' => 'Sapaan & Interaksi',
                'title' => 'Respon Sentuh 3: Apresiasi Langkah Awal',
                'context_hint' => 'Pesan afirmasi positif untuk keberanian mahasiswa.',
                'text' => 'Kamu hebat sudah mengambil langkah pertama untuk konseling!',
                'order' => 10,
            ],
            [
                'key' => 'poke_4',
                'category' => 'Sapaan & Interaksi',
                'title' => 'Respon Sentuh 4: Ajakan Melihat Tips',
                'context_hint' => 'Mengarahkan mahasiswa melihat tips pengisian.',
                'text' => 'Butuh panduan lebih dalam? Klik tombol Tips di atas ya.',
                'order' => 11,
            ],

            // Kategori 3: Sapaan Umum & Skrining
            [
                'key' => 'general_greeting',
                'category' => 'Sapaan & Interaksi',
                'title' => 'Sapaan Umum Ruang BK',
                'context_hint' => 'Sapaan singkat default Nara di berbagai sudut aplikasi.',
                'text' => 'Saya Nara, asisten virtual Anda di Ruang BK.',
                'order' => 12,
            ],
            [
                'key' => 'screening_intro',
                'category' => 'Skrining Mandiri',
                'title' => 'Pengantar Skrining Kesehatan Mental',
                'context_hint' => 'Dibacakan saat mahasiswa membuka tes kuesioner skrining 20 soal.',
                'text' => 'Selamat datang di asesmen kesehatan mental. Jawablah setiap pernyataan sesuai apa yang kamu rasakan selama 2 minggu terakhir dengan santai dan jujur.',
                'order' => 13,
            ],
        ];
    }

    /**
     * Ensure default script records exist
     */
    public static function seedDefaultsIfNeeded(): void
    {
        foreach (self::getDefaultScripts() as $script) {
            self::firstOrCreate(
                ['key' => $script['key']],
                $script
            );
        }
    }
}
