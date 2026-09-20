<?php

namespace Database\Seeders;

use App\Models\CounselingCase;
use App\Models\CounselingNote;
use App\Models\CounselingSession;
use App\Models\CounselingTopic;
use App\Models\GeneralProfile;
use App\Models\MoodCheckin;
use App\Models\Notification;
use App\Models\Question;
use App\Models\Questionnaire;
use App\Models\QuestionnaireResponse;
use App\Models\QuestionOption;
use App\Models\ResponseAnswer;
use App\Models\StudentProfile;
use App\Models\SystemSetting;
use App\Models\Tutor;
use App\Models\TutorAvailability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. System Settings
        SystemSetting::set('tutor_assignment_mode', 'student_select');
        SystemSetting::set('crisis_flag_enabled', 'true');
        SystemSetting::set('zoom_mock_mode', 'true');
        SystemSetting::set('zoom_test_feature_enabled', 'true');

        $commonPassword = Hash::make('password');

        // 2. Admin
        $admin = User::create([
            'name' => 'Administrator BK',
            'email' => 'admin@example.test',
            'phone' => '081122334455',
            'password' => $commonPassword,
            'role' => 'ADMIN',
            'user_type' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // 3. Tutors
        $tutorsData = [
            [
                'name' => 'Dr. Ahmad Fauzi, M.Psi., Psikolog',
                'email' => 'tutor@example.test',
                'phone' => '081234567801',
                'nip' => '198205142010121001',
                'specialization' => 'Kesehatan Mental, Adaptasi Kampus & Regulasi Emosi',
                'bio' => 'Konselor psikologi dengan pengalaman lebih dari 10 tahun mendampingi mahasiswa dan masyarakat umum dalam mengelola stres akademik dan kecemasan.',
                'photo' => '/images/counselor_ahmad.jpg',
            ],
            [
                'name' => 'Nurlina Permata, S.Pd., M.Kons.',
                'email' => 'tutor2@example.test',
                'phone' => '081234567802',
                'nip' => '198708222015042002',
                'specialization' => 'Bimbingan Karier, Motivasi Belajar & Perencanaan Masa Depan',
                'bio' => 'Fokus pada bimbingan karier terstruktur, eksplorasi potensi diri, serta kesiapan transisi dari dunia perkuliahan ke dunia kerja.',
                'photo' => '/images/counselor_dian.jpg',
            ],
            [
                'name' => 'Bambang Sudarsono, M.A.',
                'email' => 'tutor3@example.test',
                'phone' => '081234567803',
                'nip' => '199003112019031003',
                'specialization' => 'Hubungan Sosial, Resolusi Konflik Keluarga & Pribadi',
                'bio' => 'Konselor interpersonal dengan pendekatan humanistik yang ramah, hangat, dan mengedepankan ruang aman tanpa penghakiman.',
                'photo' => '/images/counselor_bambang.jpg',
            ],
        ];

        $tutorModels = [];
        $tutorProfileModels = [];
        foreach ($tutorsData as $tData) {
            $tUser = User::create([
                'name' => $tData['name'],
                'email' => $tData['email'],
                'phone' => $tData['phone'],
                'avatar' => $tData['photo'],
                'password' => $commonPassword,
                'role' => 'TUTOR',
                'user_type' => 'tutor',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);

            $tProfile = Tutor::create([
                'user_id' => $tUser->id,
                'nip' => $tData['nip'],
                'specialization' => $tData['specialization'],
                'bio' => $tData['bio'],
                'photo' => $tData['photo'],
                'is_available' => true,
            ]);

            $tutorModels[] = $tUser;
            $tutorProfileModels[] = $tProfile;
        }

        // 3.1 Counseling Topics & Counselor Assignment (Many-to-Many)
        $topicsData = [
            [
                'id' => 1,
                'title' => 'Akademik & Skripsi',
                'slug' => 'akademik-skripsi',
                'tag' => 'Akademik',
                'icon' => 'GraduationCap',
                'description' => 'Prokrastinasi, kebuntuan menyusun tugas akhir, motivasi belajar turun, atau kesulitan bimbingan.',
                'order' => 1,
            ],
            [
                'id' => 2,
                'title' => 'Kecemasan & Overthinking',
                'slug' => 'kecemasan-overthinking',
                'tag' => 'Emosi',
                'icon' => 'Brain',
                'description' => 'Pikiran cemas berlebihan tentang masa depan, panic attack, overthinking, atau insomnia.',
                'order' => 2,
            ],
            [
                'id' => 3,
                'title' => 'Stres Perkuliahan & Burnout',
                'slug' => 'stres-burnout',
                'tag' => 'Kesehatan Mental',
                'icon' => 'Sparkles',
                'description' => 'Kelelahan emosional akibat beban tugas, organisasi, dan tuntutan akademik yang menumpuk.',
                'order' => 3,
            ],
            [
                'id' => 4,
                'title' => 'Relasi Pertemanan & Sosial',
                'slug' => 'relasi-sosial',
                'tag' => 'Sosial',
                'icon' => 'Users',
                'description' => 'Konflik dengan teman satu angkatan, kesepian di perantauan, atau adaptasi lingkungan baru.',
                'order' => 4,
            ],
            [
                'id' => 5,
                'title' => 'Keluarga & Ekonomi',
                'slug' => 'keluarga-ekonomi',
                'tag' => 'Keluarga',
                'icon' => 'Home',
                'description' => 'Dilema ekspektasi orang tua, konflik internal keluarga, atau kecemasan finansial kuliah.',
                'order' => 5,
            ],
            [
                'id' => 6,
                'title' => 'Arah Karier & Masa Depan',
                'slug' => 'arah-karier-masa-depan',
                'tag' => 'Karier',
                'icon' => 'Compass',
                'description' => 'Bingung menentukan peminatan, magang, persiapan karier profesional, atau krisis quarter-life.',
                'order' => 6,
            ],
        ];

        $topicModels = [];
        foreach ($topicsData as $tp) {
            $topicModels[$tp['id']] = CounselingTopic::create($tp);
        }

        // Attach topics to tutors with relevant expertise
        // Tutor 1: Dr. Ahmad Fauzi -> Akademik, Kecemasan, Stres
        $tutorProfileModels[0]->topics()->attach([
            1 => ['expertise_tags' => json_encode(['Stres Akademik', 'Prokrastinasi Skripsi', 'Motivasi Belajar', 'Tugas Akhir'])],
            2 => ['expertise_tags' => json_encode(['Panic Attack', 'Overthinking Masa Depan', 'Insomnia', 'Regulasi Emosi'])],
            3 => ['expertise_tags' => json_encode(['Burnout Akademik', 'Kelelahan Mental', 'Keseimbangan Hidup Kampus'])],
        ]);

        // Tutor 2: Nurlina Permata -> Akademik, Karier, Stres
        $tutorProfileModels[1]->topics()->attach([
            1 => ['expertise_tags' => json_encode(['Manajemen Waktu', 'Metode Belajar Efektif', 'Perencanaan Studi'])],
            3 => ['expertise_tags' => json_encode(['Manajemen Beban Tugas', 'Keseimbangan Organisasi'])],
            6 => ['expertise_tags' => json_encode(['Peminatan Jurusan', 'Kesiapan Magang & Kerja', 'Quarter-Life Crisis', 'Eksplorasi Potensi'])],
        ]);

        // Tutor 3: Bambang Sudarsono -> Relasi Sosial, Keluarga & Ekonomi, Kecemasan
        $tutorProfileModels[2]->topics()->attach([
            2 => ['expertise_tags' => json_encode(['Kecemasan Sosial', 'Rasa Percaya Diri', 'Public Speaking Anxiety'])],
            4 => ['expertise_tags' => json_encode(['Konflik Teman Sebaya', 'Adaptasi Kuliah Perantauan', 'Kesepian', 'Komunikasi Asertif'])],
            5 => ['expertise_tags' => json_encode(['Komunikasi Orang Tua', 'Ekspektasi Keluarga', 'Resolusi Konflik Pribadi', 'Beban Finansial'])],
        ]);

        // 4. Students (10 students)
        $studentsData = [
            ['nim' => '202401001', 'name' => 'Ahmad Fauzan', 'prodi' => 'S2 Pendidikan Agama Islam', 'degree' => 'S2', 'semester' => 3, 'gender' => 'Laki-laki', 'email' => 'student@example.test', 'phone' => '081234567891'],
            ['nim' => '202401002', 'name' => 'Siti Nurhaliza', 'prodi' => 'S1 Psikologi', 'degree' => 'S1', 'semester' => 5, 'gender' => 'Perempuan', 'email' => 'siti.nur@example.test', 'phone' => '081234567892'],
            ['nim' => '202401003', 'name' => 'Budi Santoso', 'prodi' => 'S1 Teknik Informatika', 'degree' => 'S1', 'semester' => 3, 'gender' => 'Laki-laki', 'email' => 'budi.santoso@example.test', 'phone' => '081234567893'],
            ['nim' => '202401004', 'name' => 'Dewi Anggraini', 'prodi' => 'S1 Bimbingan Konseling', 'degree' => 'S1', 'semester' => 7, 'gender' => 'Perempuan', 'email' => 'dewi.ang@example.test', 'phone' => '081234567894'],
            ['nim' => '202401005', 'name' => 'Rizky Pratama', 'prodi' => 'S1 Manajemen Bisnis', 'degree' => 'S1', 'semester' => 3, 'gender' => 'Laki-laki', 'email' => 'rizky.pratama@example.test', 'phone' => '081234567895'],
            ['nim' => '202401006', 'name' => 'Putri Ayu Lestari', 'prodi' => 'S1 Kedokteran', 'degree' => 'S1', 'semester' => 5, 'gender' => 'Perempuan', 'email' => 'putri.ayu@example.test', 'phone' => '081234567896'],
            ['nim' => '202401007', 'name' => 'Dimas Arya', 'prodi' => 'S1 Ilmu Hukum', 'degree' => 'S1', 'semester' => 1, 'gender' => 'Laki-laki', 'email' => 'dimas.arya@example.test', 'phone' => '081234567897'],
            ['nim' => '202401008', 'name' => 'Anisa Rahmawati', 'prodi' => 'S1 Ilmu Komunikasi', 'degree' => 'S1', 'semester' => 7, 'gender' => 'Perempuan', 'email' => 'anisa.rahma@example.test', 'phone' => '081234567898'],
            ['nim' => '202401009', 'name' => 'Fajar Nugraha', 'prodi' => 'S1 Farmasi', 'degree' => 'S1', 'semester' => 3, 'gender' => 'Laki-laki', 'email' => 'fajar.nugraha@example.test', 'phone' => '081234567899'],
            ['nim' => '202401010', 'name' => 'Zahra Aulia', 'prodi' => 'S1 Arsitektur', 'degree' => 'S1', 'semester' => 5, 'gender' => 'Perempuan', 'email' => 'zahra.aulia@example.test', 'phone' => '081234567810'],
        ];

        $studentUsers = [];
        foreach ($studentsData as $s) {
            $user = User::create([
                'name' => $s['name'],
                'email' => $s['email'],
                'phone' => $s['phone'],
                'password' => $commonPassword,
                'role' => 'STUDENT',
                'user_type' => 'student',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);

            StudentProfile::create([
                'user_id' => $user->id,
                'nim' => $s['nim'],
                'program_study' => $s['prodi'],
                'degree' => $s['degree'],
                'semester' => $s['semester'],
                'birth_place' => 'Surabaya',
                'birth_date' => '2002-05-14',
                'gender' => $s['gender'],
                'address' => 'Jl. Kampus No. ' . rand(1, 100),
                'campus_status' => 'AKTIF',
                'campus_external_id' => 'CAM-' . $s['nim'],
            ]);

            $studentUsers[] = $user;
        }

        // 5. General Users (5 users)
        $generalData = [
            ['name' => 'Hendra Setiawan', 'nik' => '3578012304950001', 'email' => 'general@example.test', 'phone' => '081398765401', 'gender' => 'Laki-laki'],
            ['name' => 'Maya Kartika', 'nik' => '3578012304950002', 'email' => 'maya.kartika@example.test', 'phone' => '081398765402', 'gender' => 'Perempuan'],
            ['name' => 'Rahmat Hidayat', 'nik' => '3578012304950003', 'email' => 'rahmat.h@example.test', 'phone' => '081398765403', 'gender' => 'Laki-laki'],
            ['name' => 'Lestari Wulandari', 'nik' => '3578012304950004', 'email' => 'lestari.w@example.test', 'phone' => '081398765404', 'gender' => 'Perempuan'],
            ['name' => 'Agus Prasetyo', 'nik' => '3578012304950005', 'email' => 'agus.prasetyo@example.test', 'phone' => '081398765405', 'gender' => 'Laki-laki'],
        ];

        $generalUsers = [];
        foreach ($generalData as $g) {
            $user = User::create([
                'name' => $g['name'],
                'email' => $g['email'],
                'phone' => $g['phone'],
                'password' => $commonPassword,
                'role' => 'GENERAL',
                'user_type' => 'general',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);

            GeneralProfile::create([
                'user_id' => $user->id,
                'nik' => $g['nik'],
                'birth_place' => 'Jakarta',
                'birth_date' => '1995-04-20',
                'gender' => $g['gender'],
                'address' => 'Jl. Melati Indah No. 24',
            ]);

            $generalUsers[] = $user;
        }

        // 6. Questionnaires (3 questionnaires)
        $q1 = Questionnaire::create([
            'title' => 'Screening Kebutuhan Bimbingan & Konseling (Komprehensif)',
            'description' => 'Instrumen evaluasi mandiri untuk memetakan kebutuhan dukungan akademik, emosional, sosial, dan perencanaan karier.',
            'instructions' => 'Pilihlah respon yang paling mencerminkan kondisi Anda dalam 2–4 minggu terakhir. Tidak ada jawaban yang salah atau benar.',
            'status' => 'published',
            'version' => '1.0',
        ]);

        $q2 = Questionnaire::create([
            'title' => 'Screening Kesiapan Karier & Masa Depan',
            'description' => 'Evaluasi terarah mengenai perencanaan karier, eksplorasi peluang magang/kerja, serta kesiapan profesional.',
            'instructions' => 'Jawablah setiap pertanyaan sesuai keyakinan diri Anda saat ini.',
            'status' => 'draft',
            'version' => '1.0',
        ]);

        $q3 = Questionnaire::create([
            'title' => 'Check-in Adaptasi Mahasiswa Baru',
            'description' => 'Pemetaan transisi belajar, adaptasi pertemanan, dan manajemen kemandirian.',
            'instructions' => 'Khusus bagi mahasiswa baru yang sedang menjalani semester awal.',
            'status' => 'draft',
            'version' => '1.0',
        ]);

        // Questions for Q1 (18 Likert questions + 2 Open questions = Exactly 20 questions)
        $likertQuestions = [
            // 1. Akademik (3 questions)
            ['category' => 'Akademik', 'text' => 'Saya merasa kewalahan dengan beban tugas atau tuntutan perkuliahan.', 'crisis' => false, 'reverse' => false],
            ['category' => 'Akademik', 'text' => 'Saya kesulitan berkonsentrasi atau mempertahankan fokus saat belajar.', 'crisis' => false, 'reverse' => false],
            ['category' => 'Akademik', 'text' => 'Saya merasa motivasi belajar saya menurun signifikan akhir-akhir ini.', 'crisis' => false, 'reverse' => false],

            // 2. Emosi / Stres (3 questions)
            ['category' => 'Emosi / Stres', 'text' => 'Saya sering merasa cemas, gelisah, atau tegang tanpa alasan yang pasti.', 'crisis' => false, 'reverse' => false],
            ['category' => 'Emosi / Stres', 'text' => 'Saya merasa sulit beristirahat atau mengalami gangguan tidur karena beban pikiran.', 'crisis' => false, 'reverse' => false],
            ['category' => 'Emosi / Stres', 'text' => 'Saya merasa putus asa atau merasa tidak ada jalan keluar dari permasalahan saya.', 'crisis' => true, 'reverse' => false], // Crisis flag

            // 3. Sosial (3 questions)
            ['category' => 'Sosial', 'text' => 'Saya merasa memiliki seseorang yang nyaman untuk diajak bercerita secara terbuka.', 'crisis' => false, 'reverse' => true],
            ['category' => 'Sosial', 'text' => 'Saya merasa terisolasi atau kesulitan menjalin pertemanan di lingkungan sekitar.', 'crisis' => false, 'reverse' => false],
            ['category' => 'Sosial', 'text' => 'Saya merasa cemas atau tidak nyaman saat harus berinteraksi dalam kelompok.', 'crisis' => false, 'reverse' => false],

            // 4. Keluarga dan Ekonomi (3 questions)
            ['category' => 'Keluarga dan Ekonomi', 'text' => 'Saya merasa masalah atau dinamika keluarga memengaruhi konsentrasi aktivitas saya.', 'crisis' => false, 'reverse' => false],
            ['category' => 'Keluarga dan Ekonomi', 'text' => 'Kondisi ekonomi atau biaya hidup menjadi beban pikiran utama bagi saya.', 'crisis' => false, 'reverse' => false],
            ['category' => 'Keluarga dan Ekonomi', 'text' => 'Tuntutan atau ekspektasi keluarga membuat saya merasa tertekan.', 'crisis' => false, 'reverse' => false],

            // 5. Karier dan Masa Depan (3 questions)
            ['category' => 'Karier dan Masa Depan', 'text' => 'Saya merasa bingung menentukan arah peminatan atau tujuan setelah lulus.', 'crisis' => false, 'reverse' => false],
            ['category' => 'Karier dan Masa Depan', 'text' => 'Saya merasa cemas apakah keahlian saya relevan dengan tuntutan dunia kerja.', 'crisis' => false, 'reverse' => false],
            ['category' => 'Karier dan Masa Depan', 'text' => 'Saya memiliki gambaran yang jelas mengenai langkah karier yang ingin saya capai.', 'crisis' => false, 'reverse' => true],

            // 6. Kebutuhan Dukungan (3 questions)
            ['category' => 'Kebutuhan Dukungan', 'text' => 'Saya merasa memerlukan bimbingan rutin dari seorang konselor profesional.', 'crisis' => false, 'reverse' => false],
            ['category' => 'Kebutuhan Dukungan', 'text' => 'Saya merasa terbantu ketika memiliki sesi evaluasi dan target mingguan.', 'crisis' => false, 'reverse' => false],
            ['category' => 'Kebutuhan Dukungan', 'text' => 'Saya merasa pikiran untuk menyakiti diri sendiri pernah terlintas saat tertekan.', 'crisis' => true, 'reverse' => false], // Crisis flag
        ];

        $likertOptions = [
            ['label' => 'Tidak Pernah', 'score' => 0],
            ['label' => 'Jarang', 'score' => 1],
            ['label' => 'Kadang', 'score' => 2],
            ['label' => 'Sering', 'score' => 3],
            ['label' => 'Sangat Sering', 'score' => 4],
        ];

        $order = 1;
        foreach ($likertQuestions as $lq) {
            $question = Question::create([
                'questionnaire_id' => $q1->id,
                'category' => $lq['category'],
                'question_text' => $lq['text'],
                'question_type' => 'likert',
                'is_required' => true,
                'reverse_score' => $lq['reverse'],
                'is_crisis_flag' => $lq['crisis'],
                'order' => $order++,
            ]);

            foreach ($likertOptions as $idx => $opt) {
                QuestionOption::create([
                    'question_id' => $question->id,
                    'label' => $opt['label'],
                    'score' => $opt['score'],
                    'order' => $idx + 1,
                ]);
            }
        }

        // 2 Open questions (Total 18 + 2 = 20 questions)
        $openQuestions = [
            'Ceritakan secara singkat hal yang paling mengganggu pikiran atau aktivitas kuliah Anda saat ini.',
            'Apa harapan atau bantuan utama yang Anda inginkan dari layanan konseling Ruang BK?',
        ];

        foreach ($openQuestions as $oq) {
            Question::create([
                'questionnaire_id' => $q1->id,
                'category' => 'Kebutuhan Dukungan',
                'question_text' => $oq,
                'question_type' => 'textarea',
                'is_required' => false,
                'reverse_score' => false,
                'is_crisis_flag' => false,
                'order' => $order++,
            ]);
        }

        // 7. Tutor Availabilities for the next 7 days
        foreach ($tutorModels as $tutor) {
            for ($d = 0; $d < 5; $d++) {
                $targetDate = Carbon::today()->addDays($d);
                // 3 slots per day: 09:00 (CHAT), 10:30 (ZOOM), 13:30 (OFFLINE)
                $times = [
                    ['start' => '09:00:00', 'end' => '10:00:00', 'method' => 'CHAT'],
                    ['start' => '10:30:00', 'end' => '11:30:00', 'method' => 'ZOOM'],
                    ['start' => '13:30:00', 'end' => '14:30:00', 'method' => 'OFFLINE'],
                ];
                foreach ($times as $t) {
                    TutorAvailability::create([
                        'tutor_id' => $tutor->id,
                        'date' => $targetDate->format('Y-m-d'),
                        'start_time' => $t['start'],
                        'end_time' => $t['end'],
                        'method' => $t['method'],
                        'slot_duration' => 60,
                        'status' => 'AVAILABLE',
                    ]);
                }
            }
        }

        // 8. Mood Checkins for student@example.test
        $primaryStudent = $studentUsers[0];
        $moods = ['GOOD', 'VERY_GOOD', 'NEUTRAL', 'GOOD', 'VERY_GOOD'];
        foreach ($moods as $idx => $m) {
            MoodCheckin::create([
                'user_id' => $primaryStudent->id,
                'mood' => $m,
                'note' => $idx === 0 ? 'Hari ini perkuliahan berjalan lancar, merasa cukup berenergi.' : null,
                'created_at' => Carbon::now()->subDays(4 - $idx),
            ]);
        }

        // 9. Sample Screening Submission for student@example.test
        $q1Questions = Question::where('questionnaire_id', $q1->id)->with('options')->get();
        $sampleAnswers = [];
        foreach ($q1Questions as $q) {
            if ($q->question_type === 'likert') {
                $opt = $q->options->where('score', 2)->first() ?: $q->options->first();
                $sampleAnswers[] = [
                    'question_id' => $q->id,
                    'option_id' => $opt->id,
                    'score' => $opt->score,
                    'text_answer' => null,
                ];
            } else {
                $sampleAnswers[] = [
                    'question_id' => $q->id,
                    'option_id' => null,
                    'score' => null,
                    'text_answer' => 'Ingin mendapatkan strategi manajemen waktu dan regulasi stres yang lebih terukur.',
                ];
            }
        }

        $screeningResp = QuestionnaireResponse::create([
            'user_id' => $primaryStudent->id,
            'questionnaire_id' => $q1->id,
            'total_score' => 32,
            'category_scores' => [
                ['category' => 'Akademik', 'score' => 7, 'max_score' => 12, 'percentage' => 58, 'level' => 'Sedang'],
                ['category' => 'Emosi / Stres', 'score' => 8, 'max_score' => 12, 'percentage' => 67, 'level' => 'Tinggi'],
                ['category' => 'Sosial', 'score' => 4, 'max_score' => 12, 'percentage' => 33, 'level' => 'Rendah'],
                ['category' => 'Keluarga dan Ekonomi', 'score' => 5, 'max_score' => 12, 'percentage' => 42, 'level' => 'Sedang'],
                ['category' => 'Karier dan Masa Depan', 'score' => 7, 'max_score' => 12, 'percentage' => 58, 'level' => 'Sedang'],
                ['category' => 'Kebutuhan Dukungan', 'score' => 5, 'max_score' => 12, 'percentage' => 42, 'level' => 'Sedang'],
            ],
            'has_crisis_flag' => false,
            'status' => 'SUBMITTED',
            'submitted_at' => Carbon::now()->subDays(1),
        ]);

        foreach ($sampleAnswers as $sa) {
            ResponseAnswer::create([
                'response_id' => $screeningResp->id,
                'question_id' => $sa['question_id'],
                'option_id' => $sa['option_id'],
                'score' => $sa['score'],
                'text_answer' => $sa['text_answer'],
            ]);
        }

        // 10. Sample Counseling Case & Session for student@example.test
        $sampleCase = CounselingCase::create([
            'case_number' => 'BK-2026-000001',
            'user_id' => $primaryStudent->id,
            'tutor_id' => $tutorModels[0]->id,
            'category' => 'Emosi / Stres',
            'initial_reason' => 'Saya merasa kewalahan mengatur waktu antara pengerjaan tesis S2 dan mengelola kecemasan akademik.',
            'priority' => 'MEDIUM',
            'status' => 'SCHEDULED',
            'opened_at' => Carbon::now()->subDays(2),
        ]);

        // Create an upcoming session for today (active ready to join for test)
        $startSession = Carbon::now()->addMinutes(5);
        $endSession = Carbon::now()->addMinutes(65);

        $session1 = CounselingSession::create([
            'counseling_case_id' => $sampleCase->id,
            'user_id' => $primaryStudent->id,
            'tutor_id' => $tutorModels[0]->id,
            'start_at' => $startSession,
            'end_at' => $endSession,
            'status' => 'READY',
            'meeting_provider' => 'zoom',
            'meeting_number' => 'BK849201948',
            'meeting_password' => 'bk2026',
            'zoom_meeting_id' => 'BK849201948',
        ]);

        // A past completed session with notes
        $pastStart = Carbon::now()->subDays(7)->setHour(10)->setMinute(0);
        $pastEnd = $pastStart->copy()->addHour();
        $pastSession = CounselingSession::create([
            'counseling_case_id' => $sampleCase->id,
            'user_id' => $primaryStudent->id,
            'tutor_id' => $tutorModels[0]->id,
            'start_at' => $pastStart,
            'end_at' => $pastEnd,
            'status' => 'COMPLETED',
            'meeting_provider' => 'zoom',
            'meeting_number' => 'BK771239102',
            'meeting_password' => 'bk1234',
            'zoom_meeting_id' => 'BK771239102',
        ]);

        CounselingNote::create([
            'session_id' => $pastSession->id,
            'tutor_id' => $tutorModels[0]->id,
            'summary' => 'Sesi orientasi awal membahas sumber utama kecemasan dalam pengerjaan tugas akhir.',
            'private_note' => 'Mahasiswa menunjukkan keterbukaan yang baik. Perlu pemantauan pada pola tidur dan overthinking.',
            'student_recommendation' => 'Menerapkan teknik Pomodoro 25 menit dan membuat daftar prioritas mingguan terpecah.',
            'follow_up_required' => true,
            'next_follow_up_at' => $startSession,
        ]);

        // 11. Sample Notifications
        Notification::create([
            'user_id' => $primaryStudent->id,
            'type' => 'booking_confirmed',
            'title' => 'Jadwal Konsultasi Anda Telah Dikonfirmasi',
            'message' => 'Sesi konseling Anda bersama Dr. Ahmad Fauzi siap dimulai dalam beberapa menit.',
            'created_at' => Carbon::now()->subHours(1),
        ]);

        Notification::create([
            'user_id' => $primaryStudent->id,
            'type' => 'recommendation_ready',
            'title' => 'Rekomendasi Konseling Tersedia',
            'message' => 'Tutor telah menambahkan catatan tindak lanjut untuk sesi sebelumnya.',
            'created_at' => Carbon::now()->subDays(6),
        ]);

        Notification::create([
            'user_id' => $tutorModels[0]->id,
            'type' => 'new_counseling_request',
            'title' => 'Sesi Konseling Mendatang',
            'message' => 'Sesi bersama mahasiswa Ahmad Fauzan (BK-2026-000001) dijadwalkan hari ini.',
            'created_at' => Carbon::now()->subMinutes(30),
        ]);
    }
}
