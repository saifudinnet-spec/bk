<?php

namespace App\Services;

class CampusMockService
{
    private static array $mockDatabase = [
        '202401001' => [
            'nim' => '202401001',
            'name' => 'Ahmad Fauzan',
            'birth_place' => 'Surabaya',
            'birth_date' => '2002-05-14',
            'gender' => 'Laki-laki',
            'program_study' => 'S2 Pendidikan Agama Islam',
            'degree' => 'S2',
            'semester' => 3,
            'address' => 'Jl. Ketintang Baru No. 12, Surabaya',
            'email' => 'ahmad.fauzan@campus.ac.id',
            'phone' => '081234567891',
            'campus_status' => 'AKTIF',
            'campus_external_id' => 'CAM-2024-001',
        ],
        '202401002' => [
            'nim' => '202401002',
            'name' => 'Siti Nurhaliza',
            'birth_place' => 'Malang',
            'birth_date' => '2003-08-22',
            'gender' => 'Perempuan',
            'program_study' => 'S1 Psikologi',
            'degree' => 'S1',
            'semester' => 5,
            'address' => 'Jl. Soekarno Hatta No. 45, Malang',
            'email' => 'siti.nurhaliza@campus.ac.id',
            'phone' => '081234567892',
            'campus_status' => 'AKTIF',
            'campus_external_id' => 'CAM-2024-002',
        ],
        '202401003' => [
            'nim' => '202401003',
            'name' => 'Budi Santoso',
            'birth_place' => 'Yogyakarta',
            'birth_date' => '2004-01-10',
            'gender' => 'Laki-laki',
            'program_study' => 'S1 Teknik Informatika',
            'degree' => 'S1',
            'semester' => 3,
            'address' => 'Jl. Kaliurang KM 5, Yogyakarta',
            'email' => 'budi.santoso@campus.ac.id',
            'phone' => '081234567893',
            'campus_status' => 'AKTIF',
            'campus_external_id' => 'CAM-2024-003',
        ],
        '202401004' => [
            'nim' => '202401004',
            'name' => 'Dewi Anggraini',
            'birth_place' => 'Bandung',
            'birth_date' => '2003-11-30',
            'gender' => 'Perempuan',
            'program_study' => 'S1 Bimbingan dan Konseling',
            'degree' => 'S1',
            'semester' => 7,
            'address' => 'Jl. Dago Asri No. 8, Bandung',
            'email' => 'dewi.anggraini@campus.ac.id',
            'phone' => '081234567894',
            'campus_status' => 'AKTIF',
            'campus_external_id' => 'CAM-2024-004',
        ],
        '202401005' => [
            'nim' => '202401005',
            'name' => 'Rizky Pratama',
            'birth_place' => 'Jakarta',
            'birth_date' => '2004-04-18',
            'gender' => 'Laki-laki',
            'program_study' => 'S1 Manajemen Bisnis',
            'degree' => 'S1',
            'semester' => 3,
            'address' => 'Jl. Tebet Timur Dalam No. 19, Jakarta',
            'email' => 'rizky.pratama@campus.ac.id',
            'phone' => '081234567895',
            'campus_status' => 'AKTIF',
            'campus_external_id' => 'CAM-2024-005',
        ],
    ];

    public static function lookup(string $nim): ?array
    {
        $nim = trim($nim);

        if (isset(self::$mockDatabase[$nim])) {
            return self::$mockDatabase[$nim];
        }

        // Allow any valid 9-digit numeric NIM to generate a realistic fallback record
        if (preg_match('/^[0-9]{8,12}$/', $nim)) {
            $year = substr($nim, 0, 4);
            return [
                'nim' => $nim,
                'name' => 'Mahasiswa ' . substr($nim, -4),
                'birth_place' => 'Indonesia',
                'birth_date' => '2003-01-15',
                'gender' => 'Laki-laki',
                'program_study' => 'S1 Ilmu Komunikasi',
                'degree' => 'S1',
                'semester' => 3,
                'address' => 'Kampus Terpadu Gedung A',
                'email' => "mhs_{$nim}@campus.ac.id",
                'phone' => '081' . rand(10000000, 99999999),
                'campus_status' => 'AKTIF',
                'campus_external_id' => 'CAM-' . $nim,
            ];
        }

        return null;
    }

    public static function maskStudentData(array $student): array
    {
        $birthDate = $student['birth_date'] ?? '2002-01-01';
        $year = substr($birthDate, 0, 4);

        $email = $student['email'] ?? '';
        $maskedEmail = '';
        if ($email && strpos($email, '@') !== false) {
            [$local, $domain] = explode('@', $email, 2);
            $maskedEmail = substr($local, 0, 2) . '***@' . $domain;
        }

        $phone = $student['phone'] ?? '';
        $maskedPhone = '';
        if ($phone) {
            $maskedPhone = substr($phone, 0, 4) . '****' . substr($phone, -3);
        }

        return [
            'nim' => $student['nim'],
            'name' => $student['name'],
            'program_study' => $student['program_study'],
            'degree' => $student['degree'],
            'semester' => $student['semester'],
            'masked_birth_date' => "**/**/{$year}",
            'masked_email' => $maskedEmail,
            'masked_phone' => $maskedPhone,
            'campus_status' => $student['campus_status'],
        ];
    }
}
