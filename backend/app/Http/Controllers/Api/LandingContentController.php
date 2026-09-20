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
     * Default landing page structure and texts.
     */
    public static function getDefaultContent(): array
    {
        return [
            'hero' => [
                'tagline' => '',
                'title' => 'Ada Hal yang Sedang Membebani Pikiranmu?',
                'subtitle' => 'Akses layanan bimbingan konseling dan pendampingan psikologis profesional tanpa biaya. Ceritamu aman, rahasia, dan didengarkan dengan penuh empati.',
                'image_url' => '/images/banner1.jpg',
                'banner_images' => [
                    '/images/banner1.jpg',
                    '/images/banner3.jpg',
                ],
                'layout_style' => 'banner_wide',
                'online_card_title' => 'Konseling Individu Online',
                'online_card_badge' => 'Online',
                'online_card_desc' => 'Sesi video privat via Zoom terenkripsi dari mana saja, fleksibel dengan jadwal perkuliahan Anda.',
                'offline_card_title' => 'Konseling Tatap Muka Kampus',
                'offline_card_badge' => 'Offline',
                'offline_card_desc' => 'Pertemuan tatap muka langsung di Ruang Konseling Gedung Pusat Kemahasiswaan yang privat dan nyaman.',
            ],
            'navbar' => [
                'top_announcement' => 'Pusat Layanan Bimbingan & Konseling Mahasiswa',
                'top_badge' => 'UINSSC CYBER CAMPUS',
                'top_free_text' => '100% Fasilitas Kampus Bebas Biaya',
                'brand_name' => 'Ruang BK',
                'brand_campus' => 'UINSSC',
                'brand_tagline' => 'Bimbingan & Konseling Terpadu',
                'logo_url' => '/logobk.png',
                'menu' => [
                    ['label' => 'Layanan', 'href' => '#layanan'],
                    ['label' => 'Topik Bimbingan', 'href' => '#masalah'],
                    ['label' => 'Artikel', 'href' => '/artikel'],
                    ['label' => 'Konselor Kami', 'href' => '#konselor'],
                    ['label' => 'Cara Kerja', 'href' => '#cara-kerja'],
                    ['label' => 'FAQ', 'href' => '#faq'],
                ],
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
                ],
            ],
            'services' => [
                'tag' => 'Pilihan Layanan Terpadu',
                'title' => 'Layanan Bimbingan yang Tersedia',
                'subtitle' => 'Pilih metode bimbingan konseling yang paling nyaman dan sesuai dengan preferensi privasi Anda.',
                'items' => [
                    [
                        'id' => 1,
                        'title' => 'Konseling Individu Online',
                        'desc' => 'Sesi video privat via Zoom terenkripsi dari mana saja, fleksibel dengan jadwal perkuliahan Anda.',
                        'tag' => 'Online',
                        'icon' => 'Video',
                    ],
                    [
                        'id' => 2,
                        'title' => 'Konseling Tatap Muka Kampus',
                        'desc' => 'Pertemuan tatap muka langsung di Ruang Konseling Gedung Pusat Kemahasiswaan yang privat dan nyaman.',
                        'tag' => 'Offline',
                        'icon' => 'Building2',
                    ],
                ],
            ],
            'problems' => [
                'tag' => 'Kategori Pendampingan',
                'title' => 'Sedang Menghadapi Masalah Apa?',
                'subtitle' => 'Tidak ada masalah yang terlalu sepele. Konselor kami siap mendampingi berbagai dinamika kehidupan mahasiswa.',
                'items' => [
                    [
                        'id' => 1,
                        'title' => 'Akademik & Skripsi',
                        'desc' => 'Prokrastinasi, kebuntuan tugas akhir, motivasi belajar turun, atau kesulitan bimbingan.',
                        'tag' => 'Akademik',
                        'icon' => 'GraduationCap',
                    ],
                    [
                        'id' => 2,
                        'title' => 'Kecemasan & Overthinking',
                        'desc' => 'Pikiran cemas berlebihan tentang masa depan, panic attack, overthinking, atau insomnia.',
                        'tag' => 'Emosi',
                        'icon' => 'Brain',
                    ],
                    [
                        'id' => 3,
                        'title' => 'Stres Perkuliahan & Burnout',
                        'desc' => 'Kelelahan emosional akibat beban tugas, organisasi, dan tuntutan akademik yang menumpuk.',
                        'tag' => 'Kesehatan Mental',
                        'icon' => 'Sparkles',
                    ],
                    [
                        'id' => 4,
                        'title' => 'Relasi Pertemanan & Sosial',
                        'desc' => 'Konflik dengan teman satu angkatan, kesepian di perantauan, atau adaptasi lingkungan baru.',
                        'tag' => 'Sosial',
                        'icon' => 'Users',
                    ],
                    [
                        'id' => 5,
                        'title' => 'Keluarga & Ekonomi',
                        'desc' => 'Dilema ekspektasi orang tua, konflik internal keluarga, atau kecemasan finansial kuliah.',
                        'tag' => 'Keluarga',
                        'icon' => 'Home',
                    ],
                    [
                        'id' => 6,
                        'title' => 'Arah Karier & Masa Depan',
                        'desc' => 'Bingung menentukan peminatan, magang, persiapan karier profesional, atau krisis quarter-life.',
                        'tag' => 'Karier',
                        'icon' => 'Compass',
                    ],
                ],
            ],
            'steps' => [
                'tag' => 'Alur Konseling',
                'title' => '3 Langkah Mudah Memulai Konseling',
                'subtitle' => 'Proses pendaftaran cepat, transparan, dan terintegrasi langsung dengan jadwal konselor.',
                'items' => [
                    [
                        'step_number' => '01',
                        'title' => 'Isi Screening Mandiri Singkat',
                        'desc' => 'Evaluasi kondisi emosional dan kebutuhan bimbinganmu dalam 3 menit kuesioner terstruktur.',
                    ],
                    [
                        'step_number' => '02',
                        'title' => 'Pilih Konselor & Waktu Pertemuan',
                        'desc' => 'Pilih konselor yang sesuai dengan topikmu dan tentukan jam yang cocok dengan jadwal kuliah.',
                    ],
                    [
                        'step_number' => '03',
                        'title' => 'Mulai Sesi Konseling Privat',
                        'desc' => 'Masuk ke ruang video Zoom terenkripsi langsung dari aplikasi atau hadir di Ruang BK kampus.',
                    ],
                ],
            ],
            'screening_cta' => [
                'tag' => 'Deteksi Dini Kesehatan Mental',
                'title' => 'Ingin Tahu Kondisi Emosi dan Kebutuhanmu Saat Ini?',
                'desc' => 'Screening terstruktur kami membantu memetakan area stres akademik, emosional, dan sosial tanpa label penghakiman. Bebas biaya dan rahasia.',
                'button_text' => 'Mulai Screening Mandiri',
            ],
            'faqs' => [
                [
                    'question' => 'Apakah layanan bimbingan konseling ini berbayar?',
                    'answer' => 'Tidak sama sekali. Seluruh layanan bimbingan konseling ini 100% GRATIS dan merupakan hak fasilitas resmi kampus bagi seluruh mahasiswa aktif dan sivitas akademika.',
                ],
                [
                    'question' => 'Apakah rahasia dan cerita saya dijamin aman?',
                    'answer' => 'Sangat aman. Konselor kami terikat oleh kode etik profesi dan standar kerahasiaan institusi. Cerita dan catatan sesi Anda tidak akan dipublikasikan atau dibagikan kepada dosen maupun pihak luar.',
                ],
                [
                    'question' => 'Apakah sesi konseling dilakukan secara online atau tatap muka?',
                    'answer' => 'Anda bebas memilih! Kami menyediakan sesi video online (terintegrasi Zoom SDK tanpa instalasi rumit) maupun tatap muka langsung di Ruang Konseling Gedung Kemahasiswaan Kampus.',
                ],
                [
                    'question' => 'Bagaimana jika saya merasa gugup atau tidak tahu harus mulai dari mana?',
                    'answer' => 'Itu sangat wajar dan normal. Konselor kami sangat ramah, hangat, dan siap membimbing percakapan dengan santai. Anda tidak dituntut untuk langsung berbicara terstruktur.',
                ],
                [
                    'question' => 'Berapa lama durasi satu sesi konseling?',
                    'answer' => 'Satu sesi berlangsung selama 50 hingga 60 menit, memberikan waktu yang cukup untuk berdiskusi mendalam dan merumuskan langkah praktis.',
                ],
            ],
            'testimonials' => [
                'tag' => 'Pengalaman Mahasiswa',
                'title' => 'Cerita Mahasiswa yang Telah Bertumbuh',
                'subtitle' => 'Mendengar pengalaman mereka yang menemukan kembali ketenangan dan kejelasan pikiran.',
                'items' => [
                    [
                        'id' => 1,
                        'name' => 'Fadhil R.',
                        'faculty' => 'Mahasiswa Teknik Informatika - Semester 7',
                        'text' => 'Sangat terbantu saat stuck skripsi dan overthinking masa depan. Konselornya ramah dan tidak menghakimi sama sekali. Sekarang jauh lebih lega dan fokus.',
                        'rating' => 5,
                    ],
                    [
                        'id' => 2,
                        'name' => 'Nabila S.',
                        'faculty' => 'Mahasiswi Psikologi - Semester 5',
                        'text' => 'Platformnya nyaman banget, bisa langsung video call tanpa ribet. Ruang yang benar-benar aman buat menumpahkan unek-unek tanpa takut di judge.',
                        'rating' => 5,
                    ],
                    [
                        'id' => 3,
                        'name' => 'Rian H.',
                        'faculty' => 'Mahasiswa Manajemen - Semester 3',
                        'text' => 'Adaptasi kuliah rantau sempat bikin stres berat. Setelah 2 sesi konseling, saya dapat tips regulasi emosi yang praktis dan aplikatif.',
                        'rating' => 5,
                    ],
                ],
            ],
            'articles' => [
                'tag' => 'Edukasi & Tips Kampus',
                'title' => 'Artikel & Panduan Kesehatan Mental',
                'subtitle' => 'Bacaan ringan dan berbasis bukti untuk mendukung kesejahteraan psikologis dan produktivitas studi Anda.',
                'items' => [
                    [
                        'id' => 1,
                        'title' => '5 Trik Mengatasi Burnout & Prokrastinasi Saat Menyusun Skripsi',
                        'category' => 'Tips Akademik',
                        'read_time' => '4 min baca',
                        'date' => '02 Sep 2026',
                        'author' => 'Tim Konselor UINSSC',
                        'image_url' => '',
                        'snippet' => 'Rasa jenuh dan kebuntuan tugas akhir adalah respons alami otak saat mengalami kelelahan mental. Kenali teknik micro-stepping untuk mengembalikan motivasi belajar.',
                        'content' => 'Banyak mahasiswa tingkat akhir merasa terjebak dalam siklus menunda-nunda bukan karena malas, melainkan karena rasa cemas berlebihan terhadap standar kesempurnaan skripsi. Kunci utamanya adalah membagi target besar menjadi langkah-langkah mikro (micro-stepping) yang hanya membutuhkan waktu 15 menit setiap sesinya.',
                    ],
                    [
                        'id' => 2,
                        'title' => 'Mengenal Perbedaan Cemas Wajar vs Overthinking Berlebihan',
                        'category' => 'Kesehatan Mental',
                        'read_time' => '3 min baca',
                        'date' => '28 Agu 2026',
                        'author' => 'Psikolog Dian P., M.Psi.',
                        'image_url' => '',
                        'snippet' => 'Kecemasan adalah sistem alarm alami tubuh. Namun jika pikiran terus berputar tanpa solusi nyata, kenali teknik grounding 5-4-3-2-1 untuk menenangkan sistem saraf.',
                        'content' => 'Rasa cemas sebelum ujian atau presentasi sidang adalah wajar dan membantu kita tetap waspada. Namun jika kekhawatiran itu terjadi terus menerus tanpa pemicu yang jelas hingga mengganggu pola tidur dan makan, saatnya berkonsultasi dengan konselor atau psikolog profesional.',
                    ],
                    [
                        'id' => 3,
                        'title' => 'Panduan Membuka Diri saat Pertama Kali Menjalani Sesi Konseling',
                        'category' => 'Tips Konseling',
                        'read_time' => '5 min baca',
                        'date' => '20 Agu 2026',
                        'author' => 'Ahmad Fauzi, S.Psi.',
                        'image_url' => '',
                        'snippet' => 'Merasa gugup sebelum konseling adalah hal yang lumrah. Ruang konseling adalah tempat yang aman tanpa penghakiman untuk membagikan cerita Anda.',
                        'content' => 'Ruang konseling adalah zona aman tanpa penilaian. Anda tidak perlu menyusun cerita secara rapi atau runtut. Cukup sampaikan apa yang paling membebani pikiran Anda saat ini. Konselor kampus kami siap mendengarkan dan membantu Anda menemukan perspektif baru.',
                    ],
                ],
            ],
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

                // Explicitly override banner_images from $content if defined
                // (array_replace_recursive merges numeric arrays by index, which leads to mixing default and custom banners)
                if (isset($content['hero']['banner_images']) && is_array($content['hero']['banner_images'])) {
                    $base['hero']['banner_images'] = array_values(array_filter(
                        $content['hero']['banner_images'],
                        function ($img) {
                            $u = is_array($img) ? ($img['url'] ?? '') : (string)$img;
                            if (empty($u)) return false;
                            if (str_starts_with($u, '/storage/banners/')) {
                                return File::exists(storage_path('app/public/banners/' . basename($u)));
                            }
                            return true;
                        }
                    ));
                }

                if (isset($content['hero']['image_url'])) {
                    $heroImg = (string) $content['hero']['image_url'];
                    if (str_starts_with($heroImg, '/storage/banners/') && !File::exists(storage_path('app/public/banners/' . basename($heroImg)))) {
                        $heroImg = $base['hero']['banner_images'][0] ?? '';
                    }
                    $base['hero']['image_url'] = $heroImg;
                } else {
                    $base['hero']['image_url'] = $base['hero']['banner_images'][0] ?? '';
                }
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
            'general_counselee_enabled' => SystemSetting::get('general_counselee_enabled', 'true') === 'true',
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

        // Process any base64 images to file storage
        $this->processBase64Images($content);

        // Sanitize missing storage banner files
        if (isset($content['hero']['banner_images']) && is_array($content['hero']['banner_images'])) {
            $content['hero']['banner_images'] = array_values(array_filter(
                $content['hero']['banner_images'],
                function ($img) {
                    $u = is_array($img) ? ($img['url'] ?? '') : (string)$img;
                    if (empty($u)) return false;
                    if (str_starts_with($u, '/storage/banners/')) {
                        return File::exists(storage_path('app/public/banners/' . basename($u)));
                    }
                    return true;
                }
            ));
        }

        $heroImg = $content['hero']['image_url'] ?? '';
        if (str_starts_with($heroImg, '/storage/banners/') && !File::exists(storage_path('app/public/banners/' . basename($heroImg)))) {
            $heroImg = !empty($content['hero']['banner_images']) ? $content['hero']['banner_images'][0] : '';
        }
        $content['hero']['image_url'] = $heroImg;

        SystemSetting::updateOrCreate(
            ['key' => 'landing_content'],
            ['value' => json_encode($content)]
        );

        AuditLogService::log(
            'update_landing_content',
            'landing_content',
            null,
            ['desc' => 'Konten landing page diperbarui oleh admin'],
            Auth::id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Konten landing page berhasil diperbarui!',
            'data' => $content,
        ]);
    }

    /**
     * Upload banner or promotional image (Admin only).
     * Supports single or multiple file uploads.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg,gif|max:10240',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp,svg,gif|max:10240',
        ]);

        $files = [];
        if ($request->hasFile('images')) {
            $files = $request->file('images');
        } elseif ($request->hasFile('image')) {
            $files = [$request->file('image')];
        }

        if (empty($files)) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada file gambar yang diunggah.',
            ], 422);
        }

        $dir = storage_path('app/public/banners');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        $uploadedUrls = [];
        foreach ($files as $file) {
            $uniqueSuffix = time() . '_' . bin2hex(random_bytes(4));
            $originalExt = strtolower($file->getClientOriginalExtension());
            $filename = 'banner_' . $uniqueSuffix . '.' . $originalExt;
            $file->move($dir, $filename);
            $uploadedUrls[] = '/storage/banners/' . $filename;
        }

        // Auto-persist to DB immediately so all banner slides update right away
        $setting = SystemSetting::where('key', 'landing_content')->first();
        if ($setting && $setting->value) {
            $data = is_array($setting->value) ? $setting->value : json_decode($setting->value, true);
        } else {
            $data = self::getDefaultContent();
        }

        $existingBanners = [];
        if (isset($data['hero']['banner_images']) && is_array($data['hero']['banner_images'])) {
            foreach ($data['hero']['banner_images'] as $img) {
                $imgUrl = is_array($img) ? ($img['url'] ?? '') : (string)$img;
                if ($imgUrl && !in_array($imgUrl, $uploadedUrls)) {
                    if (str_starts_with($imgUrl, '/storage/banners/')) {
                        if (File::exists(storage_path('app/public/banners/' . basename($imgUrl)))) {
                            $existingBanners[] = $imgUrl;
                        }
                    } else {
                        $existingBanners[] = $imgUrl;
                    }
                }
            }
        }

        // Append new banners to existing list
        $mergedBanners = array_values(array_unique(array_merge($existingBanners, $uploadedUrls)));
        $data['hero']['banner_images'] = $mergedBanners;
        if (empty($data['hero']['image_url']) || !in_array($data['hero']['image_url'], $mergedBanners)) {
            $data['hero']['image_url'] = $mergedBanners[0] ?? '';
        }

        SystemSetting::updateOrCreate(
            ['key' => 'landing_content'],
            ['value' => json_encode($data)]
        );

        AuditLogService::log(
            'upload_banner_image',
            'banner',
            null,
            ['desc' => 'Admin mengunggah ' . count($uploadedUrls) . ' gambar banner baru'],
            Auth::id()
        );

        return response()->json([
            'success' => true,
            'message' => count($uploadedUrls) . ' foto banner berhasil diunggah & disimpan!',
            'url' => $uploadedUrls[0],
            'urls' => $uploadedUrls,
            'data' => $data,
        ]);
    }

    /**
     * Delete a single or multiple banner images.
     */
    public function deleteImage(Request $request): JsonResponse
    {
        $imageUrl = $request->input('image_url');
        if (!$imageUrl && !$request->input('clean_all_custom_banners')) {
            return response()->json(['success' => false, 'message' => 'Parameter image_url diperlukan.'], 422);
        }

        if ($imageUrl && str_starts_with($imageUrl, '/storage/banners/')) {
            $filePath = storage_path('app/public/banners/' . basename($imageUrl));
            if (File::exists($filePath)) {
                @unlink($filePath);
            }
        }

        if ($request->input('clean_all_custom_banners') === true) {
            $customFiles = File::glob(storage_path('app/public/banners/*'));
            foreach ($customFiles as $cf) {
                @unlink($cf);
            }
        }

        $setting = SystemSetting::where('key', 'landing_content')->first();
        if ($setting && $setting->value) {
            $data = is_array($setting->value) ? $setting->value : json_decode($setting->value, true);
        } else {
            $data = self::getDefaultContent();
        }

        if ($request->input('clean_all_custom_banners') === true) {
            $data['hero']['banner_images'] = [];
            $data['hero']['image_url'] = '';
        } else {
            // Get current banners list, defaulting if not previously set
            $currentBanners = $data['hero']['banner_images'] ?? self::getDefaultContent()['hero']['banner_images'];
            $newBanners = [];
            foreach ($currentBanners as $b) {
                $bUrl = is_array($b) ? ($b['url'] ?? '') : (string)$b;
                if ($bUrl && $bUrl !== $imageUrl) {
                    if (str_starts_with($bUrl, '/storage/banners/')) {
                        if (File::exists(storage_path('app/public/banners/' . basename($bUrl)))) {
                            $newBanners[] = $bUrl;
                        }
                    } else {
                        $newBanners[] = $bUrl;
                    }
                }
            }
            $data['hero']['banner_images'] = array_values(array_unique($newBanners));
            if (($data['hero']['image_url'] ?? '') === $imageUrl || !in_array($data['hero']['image_url'] ?? '', $data['hero']['banner_images'])) {
                $data['hero']['image_url'] = $data['hero']['banner_images'][0] ?? '';
            }
        }

        SystemSetting::updateOrCreate(
            ['key' => 'landing_content'],
            ['value' => json_encode($data)]
        );

        AuditLogService::log(
            'delete_banner_image',
            'banner',
            null,
            ['desc' => 'Admin menghapus banner: ' . ($imageUrl ?: 'semua')],
            Auth::id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Foto banner berhasil dihapus!',
            'data' => $data,
        ]);
    }

    /**
     * Reset landing content to factory default.
     */
    public function reset(): JsonResponse
    {
        $default = self::getDefaultContent();
        SystemSetting::updateOrCreate(
            ['key' => 'landing_content'],
            ['value' => json_encode($default)]
        );

        AuditLogService::log(
            'reset_landing_content',
            'landing_content',
            null,
            ['desc' => 'Admin mereset konten landing page ke bawaan awal'],
            Auth::id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Konten landing page berhasil direset ke pengaturan bawaan.',
            'data' => $default,
        ]);
    }

    /**
     * Process base64 encoded images in content.
     */
    private function processBase64Images(array &$content): void
    {
        if (isset($content['hero']['banner_images']) && is_array($content['hero']['banner_images'])) {
            foreach ($content['hero']['banner_images'] as $i => $img) {
                if (is_string($img) && str_starts_with($img, 'data:image')) {
                    $content['hero']['banner_images'][$i] = $this->saveBase64Image($img, 'banner_' . ($i + 1));
                } elseif (is_array($img) && isset($img['url']) && str_starts_with($img['url'], 'data:image')) {
                    $content['hero']['banner_images'][$i]['url'] = $this->saveBase64Image($img['url'], 'banner_' . ($i + 1));
                }
            }
        }
    }

    /**
     * Save base64 image data into storage.
     */
    private function saveBase64Image(string $base64, string $prefix): string
    {
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64, $type)) {
            return $base64;
        }
        $ext = strtolower($type[1]);
        if ($ext === 'jpeg') $ext = 'jpg';
        $data = substr($base64, strpos($base64, ',') + 1);
        $data = base64_decode($data);
        if (!$data) return $base64;

        $dir = storage_path('app/public/banners');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }
        $filename = $prefix . '_' . time() . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
        File::put($dir . DIRECTORY_SEPARATOR . $filename, $data);
        return '/storage/banners/' . $filename;
    }
}
