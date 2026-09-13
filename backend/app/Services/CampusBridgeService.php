<?php

namespace App\Services;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CampusBridgeService
{
    /**
     * Get the base API URL for the campus bridge
     */
    public static function getApiUrl(): string
    {
        return config('services.campus_bridge.url', env('CAMPUS_BRIDGE_API_URL', 'https://bridge.uinssc.ac.id/api'));
    }

    /**
     * Authenticate student credentials directly against the Campus Portal API
     * POST {{apiUrl}}/portal/user (form-data: nim, password)
     */
    public static function authenticatePortal(string $nim, string $password): array
    {
        $nim = trim($nim);
        $apiUrl = rtrim(self::getApiUrl(), '/');

        try {
            $response = Http::asForm()
                ->timeout(8)
                ->withHeaders([
                    'Accept' => 'application/json',
                ])
                ->post("{$apiUrl}/portal/user", [
                    'nim' => $nim,
                    'password' => $password,
                ]);

            if ($response->successful()) {
                $json = $response->json();

                // If bridge reports status true with student data
                if (isset($json['status']) && $json['status'] === true && !empty($json['data'])) {
                    $raw = is_array($json['data']) ? $json['data'] : [];

                    // Extract and normalize fields; if not available in API, leave as null (dikosongkan)
                    $parsed = [
                        'nim' => !empty($raw['nim']) ? trim((string)$raw['nim']) : $nim,
                        'name' => !empty($raw['nama']) ? trim($raw['nama']) : (!empty($raw['nama_lengkap']) ? trim($raw['nama_lengkap']) : null),
                        'birth_place' => !empty($raw['tempat_lahir']) ? trim($raw['tempat_lahir']) : null,
                        'birth_date' => !empty($raw['tanggal_lahir']) ? trim($raw['tanggal_lahir']) : null,
                        'degree' => !empty($raw['jenjang']) ? trim($raw['jenjang']) : null,
                        'program_study' => !empty($raw['program_studi_nama']) ? trim($raw['program_studi_nama']) : (!empty($raw['prodi']) ? trim($raw['prodi']) : null),
                        'address' => !empty($raw['alamat']) ? trim($raw['alamat']) : (!empty($raw['alamat_domisili']) ? trim($raw['alamat_domisili']) : (!empty($raw['alamat_ktp']) ? trim($raw['alamat_ktp']) : null)),
                        'phone' => !empty($raw['no_hp']) ? trim($raw['no_hp']) : (!empty($raw['nomor_handphone']) ? trim($raw['nomor_handphone']) : null),
                        'email' => !empty($raw['email']) ? trim($raw['email']) : null,
                        'gender' => !empty($raw['jenis_kelamin']) ? trim($raw['jenis_kelamin']) : null,
                        'photo' => !empty($raw['foto']) ? trim($raw['foto']) : null,
                        'campus_status' => (isset($raw['status']) && $raw['status'] === 'A') ? 'AKTIF' : (!empty($raw['status_mahasiswa']) ? $raw['status_mahasiswa'] : 'AKTIF'),
                        'ipk' => !empty($raw['ipk']) ? trim($raw['ipk']) : null,
                        'portal_token' => $json['token'] ?? null,
                    ];

                    return [
                        'authenticated' => true,
                        'data' => $parsed,
                        'raw' => $raw,
                    ];
                }

                return [
                    'authenticated' => false,
                    'message' => 'NIM atau kata sandi Portal Mahasiswa tidak sesuai.',
                ];
            }

            return [
                'authenticated' => false,
                'message' => 'NIM atau kata sandi Portal Mahasiswa tidak sesuai.',
            ];
        } catch (\Throwable $e) {
            Log::warning('CampusBridge connection error: ' . $e->getMessage(), ['nim' => $nim]);

            return [
                'authenticated' => false,
                'connection_error' => true,
                'message' => 'Koneksi ke Portal Kampus UINSSC sedang mengalami gangguan atau timeout. Silakan coba sesaat lagi.',
            ];
        }
    }

    /**
     * Synchronize or create a local student user from verified Portal API data.
     * Missing fields remain null as requested.
     */
    public static function syncOrProvisionStudent(array $portalData, string $password): User
    {
        $nim = $portalData['nim'];
        $studentProfile = StudentProfile::where('nim', $nim)->first();

        if ($studentProfile) {
            $user = $studentProfile->user;

            // Sync password with portal password
            $user->password = Hash::make($password);

            // Update user details if available from API
            if (!empty($portalData['name'])) {
                $user->name = $portalData['name'];
            }
            if (!empty($portalData['phone'])) {
                $user->phone = $portalData['phone'];
            }
            if (!empty($portalData['email'])) {
                $existingEmailUser = User::where('email', $portalData['email'])->where('id', '!=', $user->id)->exists();
                if (!$existingEmailUser) {
                    $user->email = $portalData['email'];
                }
            }
            $user->save();

            // Update Student Profile with fields from API; if not present, set to null
            $studentProfile->update([
                'program_study' => $portalData['program_study'] ?? null,
                'degree' => $portalData['degree'] ?? null,
                'birth_place' => $portalData['birth_place'] ?? null,
                'birth_date' => $portalData['birth_date'] ?? null,
                'gender' => $portalData['gender'] ?? null,
                'address' => $portalData['address'] ?? null,
                'campus_status' => $portalData['campus_status'] ?? 'AKTIF',
            ]);

            return $user;
        }

        // New student registration via Portal API
        $email = $portalData['email'] ?? null;
        if (empty($email) || User::where('email', $email)->exists()) {
            $email = "mhs_{$nim}@mail.syekhnurjati.ac.id";
        }

        $user = User::create([
            'name' => $portalData['name'] ?? "Mahasiswa {$nim}",
            'email' => $email,
            'phone' => $portalData['phone'] ?? null,
            'password' => Hash::make($password),
            'role' => 'STUDENT',
            'user_type' => 'student',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        StudentProfile::create([
            'user_id' => $user->id,
            'nim' => $nim,
            'program_study' => $portalData['program_study'] ?? null,
            'degree' => $portalData['degree'] ?? null,
            'semester' => 1,
            'birth_place' => $portalData['birth_place'] ?? null,
            'birth_date' => $portalData['birth_date'] ?? null,
            'gender' => $portalData['gender'] ?? null,
            'address' => $portalData['address'] ?? null,
            'campus_status' => $portalData['campus_status'] ?? 'AKTIF',
            'campus_external_id' => "PORTAL-{$nim}",
        ]);

        return $user;
    }
}
