<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;

class LandingContentController extends Controller
{
    /**
     * Get default landing page content (Bicarakan.id inspired, Campus tailored).
     */
    public static function getDefaultContent(): array
    {
        return [
            'hero' => [
                'tagline' => '',
                'title' => "Ada Hal yang Sedang Membebani Pikiranmu?",
                'subtitle' => 'Akses layanan bimbingan konseling dan pendampingan psikologis profesional tanpa biaya. Ceritamu aman, rahasia, dan didengarkan dengan penuh empati.',
                'image_url' => '/images/banner1.jpg',
                'banner_images' => [
                    '/images/banner1.jpg',
                    '/images/banner3.jpg',
                    '/images/hero_counseling.jpg',
                ],
                'layout_style' => 'banner_wide',
                'online_card_title' => 'Konseling Online via Zoom & Chat',
                'online_card_desc' => 'Sesi privat fleksibel dari mana saja, aman dan nyaman.',
                'offline_card_title' => 'Konseling Tatap Muka di Kampus',
                'offline_card_desc' => 'Pertemuan langsung di Ruang Layanan BK Gedung Pusat Mahasiswa Lt. 2.',
            ],
            'trust_badges' => [
                ['icon' => 'ShieldCheck', 'text' => 'Bebas Biaya'],
                ['icon' => 'Award', 'text' => 'Psikolog & Konselor Berlisensi'],
                ['icon' => 'Lock', 'text' => 'Kerahasiaan Data Terjamin'],
                ['icon' => 'Video', 'text' => 'Pilihan Online & Tatap Muka'],
            ],
            'problems' => [
                'title' => 'Sedang Menghadapi Masalah Apa?',
                'subtitle' => 'Setiap tantangan memiliki jalan keluar. Temukan konselor dengan keahlian yang tepat untuk mendampingimu:',
                'items' => [
                    [
                        'id' => 1,
                        'title' => 'Akademik & Skripsi',
                        'desc' => 'Prokrastinasi, kebuntuan menyusun tugas akhir, motivasi belajar turun, atau kesulitan bimbingan.',
                        'tag' => 'Akademik',
                        'icon' => 'GraduationCap'
                    ],
                    [
                        'id' => 2,
                        'title' => 'Kecemasan & Overthinking',
                        'desc' => 'Pikiran cemas berlebihan tentang masa depan, panic attack, overthinking, atau insomnia.',
                        'tag' => 'Emosi',
                        'icon' => 'Brain'
                    ],
                    [
                        'id' => 3,
                        'title' => 'Stres Perkuliahan & Burnout',
                        'desc' => 'Kelelahan emosional akibat beban tugas, organisasi, dan tuntutan akademik yang menumpuk.',
                        'tag' => 'Kesehatan Mental',
                        'icon' => 'Sparkles'
                    ],
                    [
                        'id' => 4,
                        'title' => 'Relasi Pertemanan & Sosial',
                        'desc' => 'Konflik dengan teman satu angkatan, kesepian di perantauan, atau adaptasi lingkungan baru.',
                        'tag' => 'Sosial',
                        'icon' => 'Users'
                    ],
                    [
                        'id' => 5,
                        'title' => 'Keluarga & Ekonomi',
                        'desc' => 'Dilema ekspektasi orang tua, konflik internal keluarga, atau kecemasan finansial kuliah.',
                        'tag' => 'Keluarga',
                        'icon' => 'Home'
                    ],
                    [
                        'id' => 6,
                        'title' => 'Arah Karier & Masa Depan',
                        'desc' => 'Bingung menentukan peminatan, magang, persiapan karier profesional, atau krisis quarter-life.',
                        'tag' => 'Karier',
                        'icon' => 'Compass'
                    ],
                ]
            ],
            'steps' => [
                'title' => 'Langkah Mudah Memulai Konseling',
                'subtitle' => 'Hanya butuh 3 langkah sederhana untuk mendapatkan ruang aman bercerita',
                'items' => [
                    [
                        'step_number' => '01',
                        'title' => 'Isi Screening Mandiri Singkat',
                        'desc' => 'Evaluasi kondisi emosional dan kebutuhan bimbinganmu dalam 3 menit kuesioner terstruktur.'
                    ],
                    [
                        'step_number' => '02',
                        'title' => 'Pilih Konselor & Waktu Pertemuan',
                        'desc' => 'Pilih konselor yang sesuai dengan topikmu dan tentukan jam yang tidak bertabrakan dengan jadwal kuliah.'
                    ],
                    [
                        'step_number' => '03',
                        'title' => 'Mulai Sesi Konseling Privat',
                        'desc' => 'Masuk ke ruang video Zoom terenkripsi langsung dari aplikasi atau hadir di Ruang BK kampus.'
                    ]
                ]
            ],
            'screening_cta' => [
                'tag' => 'Tes Kesehatan Mental Kampus',
                'title' => 'Ingin Tahu Kondisi Emosi dan Kebutuhanmu Saat Ini?',
                'desc' => 'Screening terstruktur kami membantu memetakan area stres akademik, emosional, dan sosial tanpa label penghakiman. Bebas biaya dan rahasia.',
                'button_text' => 'Mulai Screening Mandiri'
            ],
            'faqs' => [
                [
                    'question' => 'Apakah layanan bimbingan konseling ini berbayar?',
                    'answer' => 'Tidak sama sekali. Seluruh layanan bimbingan konseling ini 100% GRATIS dan merupakan hak fasilitas resmi kampus bagi seluruh mahasiswa aktif dan sivitas akademika.'
                ],
                [
                    'question' => 'Apakah rahasia dan cerita saya dijamin aman?',
                    'answer' => 'Sangat aman. Konselor kami terikat oleh kode etik profesi dan standar kerahasiaan institusi. Cerita dan catatan sesi Anda tidak akan dipublikasikan atau dibagikan kepada dosen maupun pihak luar.'
                ],
                [
                    'question' => 'Apakah sesi konseling dilakukan secara online atau tatap muka?',
                    'answer' => 'Anda bebas memilih! Kami menyediakan sesi video online (terintegrasi Zoom SDK tanpa instalasi rumit) maupun tatap muka langsung di Ruang Konseling Gedung Kemahasiswaan Kampus.'
                ],
                [
                    'question' => 'Bagaimana jika saya merasa gugup atau tidak tahu harus mulai dari mana?',
                    'answer' => 'Itu sangat wajar dan normal. Konselor kami sangat ramah, hangat, dan siap membimbing percakapan dengan santai. Anda tidak dituntut untuk langsung berbicara terstruktur.'
                ],
                [
                    'question' => 'Berapa lama durasi satu sesi konseling?',
                    'answer' => 'Satu sesi berlangsung selama 50 hingga 60 menit, memberikan waktu yang cukup untuk berdiskusi mendalam dan merumuskan langkah praktis.'
                ]
            ],
            'testimonials' => [
                [
                    'id' => 1,
                    'name' => 'Fadhil R.',
                    'faculty' => 'Mahasiswa Teknik Informatika - Semester 7',
                    'text' => 'Sangat terbantu saat stuck skripsi dan overthinking masa depan. Konselornya ramah dan tidak menghakimi sama sekali. Sekarang jauh lebih lega dan fokus.',
                    'rating' => 5
                ],
                [
                    'id' => 2,
                    'name' => 'Nabila S.',
                    'faculty' => 'Mahasiswi Psikologi - Semester 5',
                    'text' => 'Platformnya nyaman banget, bisa langsung video call tanpa ribet. Ruang yang benar-benar aman buat menumpahkan unek-unek tanpa takut di-judge.',
                    'rating' => 5
                ],
                [
                    'id' => 3,
                    'name' => 'Rian H.',
                    'faculty' => 'Mahasiswa Manajemen - Semester 3',
                    'text' => 'Adaptasi kuliah rantau sempat bikin stres berat. Setelah 2 sesi konseling, saya dapat tips regulasi emosi yang praktis dan aplikatif.',
                    'rating' => 5
                ]
            ],
            'services' => [
                'title' => 'Layanan Bimbingan & Konseling Terpadu',
                'subtitle' => 'Dukungan komprehensif dari konselor & psikolog berlisensi untuk kenyamanan dan kesehatan mental sivitas akademika',
                'items' => [
                    [
                        'id' => 1,
                        'title' => 'Konseling Individu Online',
                        'desc' => 'Sesi video privat via Zoom terenkripsi dari mana saja, fleksibel dengan jadwal perkuliahan Anda.',
                        'tag' => 'Online',
                        'icon' => 'Video'
                    ],
                    [
                        'id' => 2,
                        'title' => 'Konseling Tatap Muka Kampus',
                        'desc' => 'Pertemuan tatap muka langsung di Ruang Konseling Gedung Pusat Kemahasiswaan yang privat dan nyaman.',
                        'tag' => 'Offline',
                        'icon' => 'Building2'
                    ],
                    [
                        'id' => 3,
                        'title' => 'Screening Kebutuhan Psikologis',
                        'desc' => 'Evaluasi mandiri terstruktur untuk memetakan beban emosi, stres akademik, dan kesiapan mental.',
                        'tag' => 'Mandiri',
                        'icon' => 'Sparkles'
                    ],
                    [
                        'id' => 4,
                        'title' => 'Konsultasi Karier & Masa Depan',
                        'desc' => 'Eksplorasi minat bakat, persiapan magang, dan strategi mengatasi kecemasan quarter-life crisis.',
                        'tag' => 'Karier',
                        'icon' => 'Compass'
                    ]
                ]
            ],
            'articles' => [
                'title' => 'Artikel & Wawasan Kesehatan Mental',
                'subtitle' => 'Tips psikologis praktis, edukasi kesehatan mental, dan panduan menjalani kehidupan perkuliahan yang sehat',
                'items' => [
                    [
                        'id' => 1,
                        'title' => 'Strategi Praktis Mengatasi Prokrastinasi Skripsi & Tugas Akhir',
                        'category' => 'Akademik',
                        'read_time' => '4 min baca',
                        'date' => '02 Sep 2026',
                        'author' => 'Tim Konselor UINSSC',
                        'image_url' => '/images/banner1.jpg',
                        'snippet' => 'Rasa jenuh dan kebuntuan tugas akhir adalah respons alami otak saat mengalami kelelahan mental. Kenali teknik micro-stepping untuk mengembalikan motivasi belajar.',
                        'content' => "Banyak mahasiswa tingkat akhir merasa terjebak dalam siklus menunda-nunda bukan karena malas, melainkan karena rasa cemas berlebihan terhadap standar kesempurnaan skripsi.\n\nKetika kita memandang skripsi sebagai satu buku tebal utuh dengan ratusan halaman, otak kita secara psikologis mempersepsikannya sebagai \"ancaman besar\". Reaksi defensif alami kita adalah menghindari pekerjaan tersebut dengan mencari distraksi seperti membuka media sosial atau bermain game.\n\n### Mengapa Kita Menunda? (Procrastination vs Laziness)\nPenelitian psikologi pendidikan menunjukkan bahwa prokrastinasi adalah masalah regulasi emosi, bukan manajemen waktu semata. Kita menunda karena ingin menghindari perasaan tidak nyaman: takut salah, takut revisi berulang, atau cemas akan respons dosen pembimbing.\n\n### Teknik Praktis Micro-Stepping (Langkah Mikro):\n1. **Pecah Target Menjadi Potongan Sangat Kecil:** Alih-alih menulis \"Selesaikan Bab 2 hari ini\", ubah menjadi \"Tulis 2 paragraf pengantar teori hari ini\".\n2. **Gunakan Prinsip 15 Menit:** Berjanjilah pada diri sendiri untuk hanya duduk dan mengetik selama 15 menit. Jika setelah 15 menit ingin berhenti, Anda boleh berhenti. Seringkali setelah 15 menit berjalan, momentum positif akan terbentuk secara otomatis.\n3. **Turunkan Standar Draf Pertama:** Draf pertama dibuat untuk dievaluasi, bukan untuk langsung sempurna. Izinkan diri Anda menulis dengan bebas tanpa self-censorship.\n4. **Jadwalkan Konsultasi Rutin:** Jangan menunggu tulisan rapi untuk menemui Dosen Pembimbing Akademik atau Konselor. Mendiskusikan kerangka berpikir justru menghemat waktu berbulan-bulan."
                    ],
                    [
                        'id' => 2,
                        'title' => 'Mengenal Perbedaan Cemas Wajar vs Overthinking Berlebihan',
                        'category' => 'Kesehatan Mental',
                        'read_time' => '3 min baca',
                        'date' => '28 Agu 2026',
                        'author' => 'Psikolog Dian P., M.Psi.',
                        'image_url' => '/images/hero_counseling.jpg',
                        'snippet' => 'Kecemasan adalah sistem alarm alami tubuh. Namun jika pikiran terus berputar tanpa solusi nyata, kenali teknik grounding 5-4-3-2-1 untuk menenangkan sistem saraf.',
                        'content' => "Kecemasan adalah sistem alarm alami tubuh kita yang dirancang untuk menjaga kita tetap aman dan waspada. Namun ketika alarm tersebut terus berbunyi tanpa henti padahal tidak ada bahaya nyata di depan mata, kita mulai memasuki fase overthinking yang menguras energi.\n\n### Cemas Wajar vs Cemas Berlebihan\n* **Cemas Wajar:** Membantu kita bersiap menghadapi ujian, memotivasi kita belajar, dan mereda begitu situasi telah selesai dihadapi.\n* **Overthinking Berlebihan:** Pikiran berputar pada skenario terburuk (\"Bagaimana jika saya gagal total? Bagaimana jika semua orang menertawakan saya?\"), memicu gejala fisik seperti jantung berdebar, insomnia, dan asam lambung naik.\n\n### Pertolongan Pertama: Teknik Grounding 5-4-3-2-1\nSaat Anda merasa pikiran mulai melayang ke mana-mana, tarik napas dalam-dalam dan sebutkan di sekitar Anda:\n* **5 hal** yang bisa Anda lihat dengan mata.\n* **4 hal** yang bisa Anda raba/sentuh fisiknya.\n* **3 suara** yang bisa Anda dengar saat ini.\n* **2 aroma** yang bisa Anda cium.\n* **1 rasa** di lidah Anda atau 1 hal baik tentang diri Anda.\n\nTeknik ini memaksa otak rasional Anda kembali ke momen masa kini (*here and now*) dan menurunkan aktivitas sistem saraf simpatik."
                    ],
                    [
                        'id' => 3,
                        'title' => 'Panduan Membuka Diri saat Pertama Kali Menjalani Sesi Konseling',
                        'category' => 'Tips Konseling',
                        'read_time' => '5 min baca',
                        'date' => '20 Agu 2026',
                        'author' => 'Ahmad Fauzi, S.Psi.',
                        'image_url' => '/images/banner1.jpg',
                        'snippet' => 'Merasa gugup sebelum konseling adalah hal yang lumrah. Ruang konseling adalah tempat yang aman tanpa penghakiman untuk membagikan cerita Anda.',
                        'content' => "Banyak mahasiswa yang ragu berkonsultasi karena membayangkan sesi konseling itu seperti \"diinterogasi\" atau \"dihakimi\". Faktanya, konseling modern adalah ruang dialog setara yang hangat dan penuh penerimaan.\n\n### Mitos Umum Seputar Bimbingan Konseling:\n1. **Mitos:** \"Hanya mahasiswa yang bermasalah berat atau sakit jiwa yang ke BK.\"\n   * **Fakta:** Lebih dari 80% mahasiswa datang untuk konsultasi perencanaan karier, manajemen stres skripsi, atau sekadar membutuhkan teman bicara netral yang objektif.\n2. **Mitos:** \"Cerita saya nanti bocor ke dosen penguji atau fakultas.\"\n   * **Fakta:** Kerahasiaan konseling dilindungi undang-undang dan kode etik psikologi. Tidak ada informasi yang dibagikan tanpa izin tertulis dari Anda.\n\n### Apa yang Harus Dipersiapkan?\nJawabannya: **Tidak ada yang wajib disiapkan.** Anda tidak perlu membuat catatan rapi atau menghafalkan kronologi masalah. Datanglah apa adanya. Konselor kami yang berpengalaman akan membimbing percakapan dengan ritme yang membuat Anda merasa aman dan nyaman."
                    ]
                ]
            ],
            'navbar' => [
                'top_announcement' => 'Pusat Layanan Bimbingan & Konseling Mahasiswa',
                'top_badge' => 'UINSSC CYBER CAMPUS',
                'top_free_text' => '100% Fasilitas Kampus Bebas Biaya',
                'brand_name' => 'Ruang BK',
                'brand_campus' => 'UINSSC',
                'brand_tagline' => 'Bimbingan & Konseling Terpadu',
                'menu' => [
                    ['label' => 'Layanan', 'href' => '#layanan'],
                    ['label' => 'Topik Bimbingan', 'href' => '#masalah'],
                    ['label' => 'Artikel', 'href' => '/artikel'],
                    ['label' => 'Konselor Kami', 'href' => '#konselor'],
                    ['label' => 'Cara Kerja', 'href' => '#cara-kerja'],
                    ['label' => 'FAQ', 'href' => '#faq'],
                ]
            ],
            'footer' => [
                'brand_title' => 'Ruang BK UIN Siber Syekh Nurjati Cirebon',
                'description' => 'Pusat Layanan Bimbingan Konseling & Pendampingan Psikologis Mahasiswa. Menghadirkan ruang aman digital yang inklusif untuk bertumbuh, merawat kesehatan mental, dan mendukung keberhasilan studi siber.',
                'badge_text' => 'Layanan 100% Bebas Biaya bagi Seluruh Sivitas Akademika',
                'hotline_title' => 'Hotline Darurat Kampus',
                'hotline_desc' => 'Jika membutuhkan dukungan krisis psikologis segera:',
                'hotline_number' => '119 Ext 8 (Sejiwa Kemenkes)',
                'hotline_subtext' => 'Atau hubungi Tim Siaga Konseling UINSSC (0812-3456-7890)',
                'office_location' => 'Gedung Pusat Layanan Kemahasiswaan Lt. 2, Kampus Siber UINSSC',
                'contact_email' => 'bk-online@syekhnurjati.ac.id',
                'copyright' => '© ' . date('Y') . ' UIN Siber Syekh Nurjati Cirebon (UINSSC). Hak Cipta Dilindungi.',
                'confidentiality_notice' => 'Kerahasiaan data bimbingan konseling dijamin kode etik profesional.',
                'quick_links' => [
                    ['label' => 'Pilihan Layanan', 'href' => '#layanan'],
                    ['label' => 'Topik Bimbingan', 'href' => '#masalah'],
                    ['label' => 'Artikel Edukasi', 'href' => '/artikel'],
                    ['label' => 'Daftar Konselor', 'href' => '#konselor'],
                    ['label' => 'Masuk Akun', 'href' => '/login'],
                ]
            ]
        ];
    }

    /**
     * Get active landing content.
     */
    public function show(): JsonResponse
    {
        $setting = SystemSetting::where('key', 'landing_content')->first();
        $base = self::getDefaultContent();
        $isCustom = false;

        if ($setting && $setting->value) {
            $content = json_decode($setting->value, true);
            if (is_array($content)) {
                $base = array_replace_recursive($base, $content);
                $isCustom = true;
            }
        }

        // Merge dynamic Web CMS settings into response
        $base['web_settings'] = [
            'site_title' => SystemSetting::get('site_title', 'Ruang BK - Layanan Bimbingan & Konseling Kampus'),
            'site_tagline' => SystemSetting::get('site_tagline', 'Ruang Aman untuk Tumbuh dan Bercerita'),
            'contact_email' => SystemSetting::get('contact_email', 'bk@kampus.ac.id'),
            'contact_whatsapp' => SystemSetting::get('contact_whatsapp', '+62 812-3456-7890'),
            'campus_address' => SystemSetting::get('campus_address', 'Gedung Pusat Kegiatan Mahasiswa Lt. 2, Kampus Terpadu'),
            'operating_hours' => SystemSetting::get('operating_hours', 'Senin - Jumat, 08:00 - 16:00 WIB'),
            'announcement_bar_enabled' => SystemSetting::get('announcement_bar_enabled', 'false') === 'true',
            'announcement_text' => SystemSetting::get('announcement_text', 'Layanan Konseling Tatap Muka & Online tetap beroperasi penuh.'),
        ];

        return response()->json([
            'success' => true,
            'data' => $base,
            'is_custom' => $isCustom,
        ]);
    }

    /**
     * Update landing content (Admin only).
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'hero' => 'required|array',
            'hero.title' => 'required|string|max:255',
            'hero.subtitle' => 'required|string|max:1000',
        ]);

        $content = $request->all();

        // Safety: If any image is sent as a large base64 string, write it to file storage to prevent MySQL max_allowed_packet error
        $this->processBase64Images($content);

        SystemSetting::updateOrCreate(
            ['key' => 'landing_content'],
            ['value' => json_encode($content)]
        );

        AuditLogService::log(
            Auth::id(),
            'update_landing_content',
            'Konten landing page diperbarui oleh admin'
        );

        return response()->json([
            'success' => true,
            'message' => 'Konten landing page berhasil diperbarui!',
            'data' => $content,
        ]);
    }

    /**
     * Upload banner or promotional image (Admin only).
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,svg,gif|max:10240', // Max 10MB
        ]);

        // Clean up previous image file if specified
        $previousImageUrl = $request->input('previous_image_url');
        if ($previousImageUrl && str_contains($previousImageUrl, '/storage/banners/')) {
            $prevFile = storage_path('app/public/banners/' . basename($previousImageUrl));
            if (File::exists($prevFile)) {
                @unlink($prevFile);
            }
        }

        $file = $request->file('image');
        $dir = storage_path('app/public/banners');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        $filename = 'banner_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $file->getClientOriginalExtension();
        $file->move($dir, $filename);

        $url = '/storage/banners/' . $filename;

        // Auto-persist to DB immediately so the hero banner updates right away
        $setting = SystemSetting::where('key', 'landing_content')->first();
        $updatedData = null;
        if ($setting && $setting->value) {
            $data = is_array($setting->value) ? $setting->value : json_decode($setting->value, true);
            // If old image exists in storage and is different, delete old file too
            if (!empty($data['hero']['image_url']) && str_contains($data['hero']['image_url'], '/storage/banners/') && $data['hero']['image_url'] !== $url) {
                $oldDiskFile = storage_path('app/public/banners/' . basename($data['hero']['image_url']));
                if (File::exists($oldDiskFile)) {
                    @unlink($oldDiskFile);
                }
            }

            $data['hero']['image_url'] = $url;
            $data['hero']['banner_images'] = [
                $url,
                '/images/banner3.jpg',
                '/images/hero_counseling.jpg',
            ];
            $setting->value = json_encode($data);
            $setting->save();
            $updatedData = $data;
        }

        AuditLogService::log(
            Auth::id(),
            'upload_banner_image',
            'Admin mengunggah gambar banner baru: ' . $filename
        );

        return response()->json([
            'success' => true,
            'message' => 'Gambar banner berhasil diunggah dan disimpan!',
            'url' => $url,
            'data' => $updatedData,
        ]);
    }

    /**
     * Delete banner image permanently from disk and database (Admin only).
     */
    public function deleteImage(Request $request): JsonResponse
    {
        $imageUrl = $request->input('image_url');
        $deletedFromFileSystem = false;

        // 1. Delete physical file from disk if located in storage/banners
        if ($imageUrl && str_contains($imageUrl, '/storage/banners/')) {
            $filename = basename($imageUrl);
            $filePath = storage_path('app/public/banners/' . $filename);
            if (File::exists($filePath)) {
                @unlink($filePath);
                $deletedFromFileSystem = true;
            }
        }

        // 2. Also clean any other custom banner files in storage if all are cleared
        if ($request->input('clean_all_custom_banners') === true) {
            $customFiles = File::glob(storage_path('app/public/banners/*'));
            foreach ($customFiles as $cf) {
                @unlink($cf);
            }
        }

        // 3. Immediately persist update in SystemSetting database
        $setting = SystemSetting::where('key', 'landing_content')->first();
        $updatedData = null;
        if ($setting && $setting->value) {
            $data = is_array($setting->value) ? $setting->value : json_decode($setting->value, true);

            // Set image_url to empty
            $data['hero']['image_url'] = '';

            // Update banner_images to remove deleted image or reset to defaults
            $data['hero']['banner_images'] = [
                '/images/banner1.jpg',
                '/images/banner3.jpg',
                '/images/hero_counseling.jpg',
            ];

            $setting->value = json_encode($data);
            $setting->save();
            $updatedData = $data;
        }

        AuditLogService::log(
            Auth::id(),
            'delete_banner_image',
            'Admin menghapus gambar banner secara permanen: ' . ($imageUrl ?: 'semua')
        );

        return response()->json([
            'success' => true,
            'message' => 'Foto banner berhasil dihapus permanen dari server dan database!',
            'deleted_from_disk' => $deletedFromFileSystem,
            'data' => $updatedData,
        ]);
    }

    /**
     * Convert any Base64 image data URLs in content into storage files.
     */
    private function processBase64Images(array &$content): void
    {
        if (isset($content['hero']['image_url']) && is_string($content['hero']['image_url']) && str_starts_with($content['hero']['image_url'], 'data:image')) {
            $content['hero']['image_url'] = $this->saveBase64Image($content['hero']['image_url'], 'hero_banner');
        }

        if (isset($content['hero']['banner_images']) && is_array($content['hero']['banner_images'])) {
            foreach ($content['hero']['banner_images'] as $i => $img) {
                if (is_string($img) && str_starts_with($img, 'data:image')) {
                    $content['hero']['banner_images'][$i] = $this->saveBase64Image($img, 'banner_' . ($i + 1));
                } elseif (is_array($img) && isset($img['url']) && is_string($img['url']) && str_starts_with($img['url'], 'data:image')) {
                    $content['hero']['banner_images'][$i]['url'] = $this->saveBase64Image($img['url'], 'banner_' . ($i + 1));
                }
            }
        }
    }

    /**
     * Save a base64 encoded image string into storage/app/public/banners and return relative URL.
     */
    private function saveBase64Image(string $base64Data, string $prefix = 'img'): string
    {
        $dir = storage_path('app/public/banners');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
            $data = substr($base64Data, strpos($base64Data, ',') + 1);
            $ext = strtolower($type[1]);
            if (!in_array($ext, ['jpg', 'jpeg', 'gif', 'png', 'webp', 'svg'])) {
                $ext = 'jpg';
            }
            $decoded = base64_decode($data);
            if ($decoded !== false) {
                $filename = $prefix . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                file_put_contents($dir . DIRECTORY_SEPARATOR . $filename, $decoded);
                return '/storage/banners/' . $filename;
            }
        }

        return $base64Data;
    }

    /**
     * Reset landing content to default.
     */
    public function resetDefault(): JsonResponse
    {
        SystemSetting::where('key', 'landing_content')->delete();

        AuditLogService::log(
            Auth::id(),
            'reset_landing_content',
            'Konten landing page di-reset ke pengaturan awal oleh admin'
        );

        return response()->json([
            'success' => true,
            'message' => 'Konten landing page berhasil dikembalikan ke default.',
            'data' => self::getDefaultContent(),
        ]);
    }
}
