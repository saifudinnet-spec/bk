<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GeneralProfile;
use App\Models\Notification;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\CampusBridgeService;
use App\Services\CampusMockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Unified login for Student, General, Tutor, and Admin.
     * If user is a student (or identifier is a NIM), authenticates directly with Campus Portal API (bridge.uinssc.ac.id).
     * Synchronizes and provisions student profile data (nama, ttl, jenjang, prodi, alamat, no telp).
     * Missing fields in API remain null/empty.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'identifier' => 'required|string',
            'password' => 'required|string',
            'user_type' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $identifier = trim($request->input('identifier'));
        $password = $request->input('password');
        $userType = $request->input('user_type');

        // Check if student login is requested or identifier is numeric NIM
        $isStudentLogin = ($userType === 'student') || preg_match('/^[0-9]{8,14}$/', $identifier);

        if ($isStudentLogin) {
            // Attempt authentication against Campus Portal API (bridge.uinssc.ac.id/api/portal/user)
            $portalResult = CampusBridgeService::authenticatePortal($identifier, $password);

            if (!empty($portalResult['authenticated']) && !empty($portalResult['data'])) {
                // Sync or provision student account with retrieved profile data
                $user = CampusBridgeService::syncOrProvisionStudent($portalResult['data'], $password);

                if ($user->status !== 'active') {
                    return response()->json([
                        'message' => 'Akun Anda sedang dinonaktifkan. Silakan hubungi admin.',
                    ], 403);
                }

                $token = $user->createToken('bk_online_auth')->plainTextToken;

                AuditLogService::log('portal_login', 'User', (string)$user->id, [
                    'role' => 'STUDENT',
                    'nim' => $identifier,
                    'source' => 'bridge.uinssc.ac.id',
                ], $user->id);

                return response()->json([
                    'message' => 'Login Portal Mahasiswa UINSSC berhasil.',
                    'token' => $token,
                    'user' => $this->formatUserResponse($user),
                ]);
            }
        }

        // Local Authentication (for Admin, Tutor, General, or Demo Students)
        $user = User::where('email', $identifier)->first();

        if (!$user) {
            $user = User::where('phone', $identifier)->first();
        }

        if (!$user) {
            $studentProfile = StudentProfile::where('nim', $identifier)->first();
            if ($studentProfile) {
                $user = $studentProfile->user;
            }
        }

        if ($user && Hash::check($password, $user->password)) {
            if ($user->status !== 'active') {
                return response()->json([
                    'message' => 'Akun Anda sedang dinonaktifkan. Silakan hubungi admin.',
                ], 403);
            }

            $token = $user->createToken('bk_online_auth')->plainTextToken;

            AuditLogService::log('login', 'User', (string)$user->id, [
                'role' => $user->role,
                'identifier' => $identifier,
            ], $user->id);

            return response()->json([
                'message' => 'Login berhasil.',
                'token' => $token,
                'user' => $this->formatUserResponse($user),
            ]);
        }

        if ($isStudentLogin) {
            return response()->json([
                'message' => 'NIM atau kata sandi Portal Mahasiswa tidak sesuai.',
            ], 401);
        }

        return response()->json([
            'message' => 'Kredensial yang dimasukkan tidak sesuai.',
        ], 401);
    }

    /**
     * Register student using Campus Mock Data
     */
    public function registerStudent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nim' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $nim = trim($request->input('nim'));

        // Check if NIM is already registered
        if (StudentProfile::where('nim', $nim)->exists()) {
            return response()->json([
                'message' => 'NIM ini sudah terdaftar dalam sistem. Silakan login.',
            ], 409);
        }

        // First attempt verification with live Campus Portal API
        $portalResult = CampusBridgeService::authenticatePortal($nim, $request->input('password'));
        if (!empty($portalResult['authenticated']) && !empty($portalResult['data'])) {
            $user = CampusBridgeService::syncOrProvisionStudent($portalResult['data'], $request->input('password'));
            $token = $user->createToken('bk_online_auth')->plainTextToken;
            return response()->json([
                'message' => 'Registrasi dan sinkronisasi Portal Mahasiswa UINSSC berhasil.',
                'token' => $token,
                'user' => $this->formatUserResponse($user),
            ], 201);
        }

        // Lookup from Campus API Mock as fallback
        $campusData = CampusMockService::lookup($nim);
        if (!$campusData) {
            return response()->json([
                'message' => 'Data mahasiswa tidak ditemukan di pangkalan data kampus atau kata sandi portal tidak sesuai.',
            ], 404);
        }

        // Verify or fallback unique email
        $email = $campusData['email'];
        if (User::where('email', $email)->exists()) {
            $email = "mhs_{$nim}_" . time() . "@campus.ac.id";
        }

        // Create User
        $user = User::create([
            'name' => $campusData['name'],
            'email' => $email,
            'phone' => $campusData['phone'],
            'password' => Hash::make($request->input('password')),
            'role' => 'STUDENT',
            'user_type' => 'student',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Create Student Profile
        StudentProfile::create([
            'user_id' => $user->id,
            'nim' => $campusData['nim'],
            'program_study' => $campusData['program_study'],
            'degree' => $campusData['degree'],
            'semester' => $campusData['semester'] ?? null,
            'birth_place' => $campusData['birth_place'],
            'birth_date' => $campusData['birth_date'],
            'gender' => $campusData['gender'],
            'address' => $campusData['address'],
            'campus_status' => $campusData['campus_status'],
            'campus_external_id' => $campusData['campus_external_id'],
        ]);

        // Notification welcome
        Notification::create([
            'user_id' => $user->id,
            'type' => 'welcome',
            'title' => 'Selamat Datang di Ruang BK',
            'message' => 'Akun mahasiswa Anda telah berhasil diverifikasi dan terdaftar.',
        ]);

        AuditLogService::log('register_student', 'User', (string)$user->id, ['nim' => $nim], $user->id);

        $token = $user->createToken('bk_online_auth')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi mahasiswa berhasil.',
            'token' => $token,
            'user' => $this->formatUserResponse($user),
        ], 201);
    }

    /**
     * Register general user with 3-step wizard data
     */
    public function registerGeneral(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nik' => 'required|string|min:16|max:20',
            'name' => 'required|string|max:150',
            'birth_place' => 'required|string|max:100',
            'birth_date' => 'required|date',
            'gender' => 'required|string|in:Laki-laki,Perempuan',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi formulir pendaftaran gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name' => trim($request->input('name')),
            'email' => strtolower(trim($request->input('email'))),
            'phone' => trim($request->input('phone')),
            'password' => Hash::make($request->input('password')),
            'role' => 'GENERAL',
            'user_type' => 'general',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        GeneralProfile::create([
            'user_id' => $user->id,
            'nik' => trim($request->input('nik')),
            'birth_place' => trim($request->input('birth_place')),
            'birth_date' => $request->input('birth_date'),
            'gender' => $request->input('gender'),
            'address' => trim($request->input('address')),
        ]);

        Notification::create([
            'user_id' => $user->id,
            'type' => 'welcome',
            'title' => 'Selamat Datang di Ruang BK',
            'message' => 'Akun pengguna umum Anda telah berhasil dibuat. Ruang aman siap mendampingi Anda.',
        ]);

        AuditLogService::log('register_general', 'User', (string)$user->id, [], $user->id);

        $token = $user->createToken('bk_online_auth')->plainTextToken;

        return response()->json([
            'message' => 'Pendaftaran akun berhasil.',
            'token' => $token,
            'user' => $this->formatUserResponse($user),
        ], 201);
    }

    /**
     * Get current authenticated user details
     */
    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'user' => $this->formatUserResponse($user),
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()->delete();
            AuditLogService::log('logout', 'User', (string)$user->id, [], $user->id);
        }

        return response()->json([
            'message' => 'Berhasil keluar dari sistem.',
        ]);
    }

    private function formatUserResponse(User $user): array
    {
        $user->loadMissing(['studentProfile', 'generalProfile', 'tutorProfile']);

        $profile = null;
        if ($user->isStudent() && $user->studentProfile) {
            $profile = [
                'type' => 'student',
                'nim' => $user->studentProfile->nim,
                'program_study' => $user->studentProfile->program_study,
                'degree' => $user->studentProfile->degree,
                'campus_status' => $user->studentProfile->campus_status,
                'gender' => $user->studentProfile->gender,
                'birth_date' => $user->studentProfile->birth_date ? $user->studentProfile->birth_date->format('Y-m-d') : null,
                'birth_place' => $user->studentProfile->birth_place,
                'address' => $user->studentProfile->address,
            ];
        } elseif ($user->isGeneral() && $user->generalProfile) {
            $profile = [
                'type' => 'general',
                'gender' => $user->generalProfile->gender,
                'birth_date' => $user->generalProfile->birth_date ? $user->generalProfile->birth_date->format('Y-m-d') : null,
                'birth_place' => $user->generalProfile->birth_place,
                'address' => $user->generalProfile->address,
            ];
        } elseif ($user->isTutor() && $user->tutorProfile) {
            $profile = [
                'type' => 'tutor',
                'nip' => $user->tutorProfile->nip,
                'specialization' => $user->tutorProfile->specialization,
                'bio' => $user->tutorProfile->bio,
                'photo' => $user->tutorProfile->photo,
                'is_available' => $user->tutorProfile->is_available,
            ];
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'user_type' => $user->user_type,
            'avatar' => $user->avatar,
            'status' => $user->status,
            'profile' => $profile,
        ];
    }
}
