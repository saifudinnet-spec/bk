<?php

namespace App\Services;

use App\Models\CounselingSession;
use App\Models\User;
use Carbon\Carbon;

class ZoomService
{
    public static function isMockMode(): bool
    {
        $mock = env('ZOOM_MOCK_MODE', 'true');
        $key = env('ZOOM_SDK_KEY');
        $secret = env('ZOOM_SDK_SECRET');

        return filter_var($mock, FILTER_VALIDATE_BOOLEAN) || empty($key) || empty($secret);
    }

    /**
     * Generate Zoom Meeting SDK JWT signature with rigorous security & ownership checks
     */
    public static function generateSignature(User $user, CounselingSession $session, bool $forceTest = false): array
    {
        // 1. Authorization: Only the assigned student or tutor may join (auto-pair for test sessions)
        if ($session->user_id !== $user->id && $session->tutor_id !== $user->id && !$user->isAdmin()) {
            if (str_starts_with($session->counselingCase?->case_number ?? '', 'TEST')) {
                if ($user->isTutor()) {
                    $session->tutor_id = $user->id;
                    $session->save();
                    $session->counselingCase?->update(['tutor_id' => $user->id]);
                } elseif ($user->isStudent() || $user->isGeneral()) {
                    $session->user_id = $user->id;
                    $session->save();
                    $session->counselingCase?->update(['user_id' => $user->id]);
                } else {
                    throw new \Exception('Akses ditolak: Anda tidak terdaftar dalam sesi konseling ini.', 403);
                }
            } else {
                throw new \Exception('Akses ditolak: Anda tidak terdaftar dalam sesi konseling ini.', 403);
            }
        }

        // 2. Validate Session Status
        if (in_array($session->status, ['COMPLETED', 'CANCELLED'])) {
            throw new \Exception('Sesi konseling ini sudah selesai atau telah dibatalkan.', 400);
        }

        // 3. Time Window Validation: Can join up to 15 minutes before start (bypassed if forceTest or test session)
        $now = Carbon::now();
        $startTime = Carbon::parse($session->start_at);
        $endTime = Carbon::parse($session->end_at);

        $isTestSession = str_starts_with($session->counselingCase?->case_number ?? '', 'TEST');
        if (!$forceTest && !$isTestSession && !self::isMockMode()) {
            if ($now->lt($startTime->copy()->subMinutes(15))) {
                $diffMins = $now->diffInMinutes($startTime);
                throw new \Exception("Ruang konseling baru dibuka 15 menit sebelum jadwal (mulai dalam {$diffMins} menit lagi).", 400);
            }
        }

        // Determine role: 1 for tutor (host), 0 for student (attendee)
        $role = ($session->tutor_id === $user->id || $user->isAdmin()) ? 1 : 0;
        $meetingNumber = $session->meeting_number ?: 'BK' . $session->id . rand(1000, 9999);
        $passWord = $session->meeting_password ?: 'bk1234';

        if (self::isMockMode()) {
            return [
                'is_mock' => true,
                'signature' => 'MOCK_ZOOM_TOKEN_' . base64_encode($user->id . '_' . $session->id . '_' . time()),
                'meeting_number' => $meetingNumber,
                'password' => $passWord,
                'role' => $role,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'session_title' => 'Konseling Online: ' . ($session->counselingCase ? $session->counselingCase->category : 'Sesi BK'),
                'tutor_name' => $session->tutor ? $session->tutor->name : 'Tutor BK',
                'student_name' => $session->user ? $session->user->name : 'Peserta',
            ];
        }

        $sdkKey = env('ZOOM_SDK_KEY');
        $sdkSecret = env('ZOOM_SDK_SECRET');
        $iat = time() - 30;
        $exp = $iat + 60 * 60 * 2; // 2 hours

        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $payload = [
            'appKey' => $sdkKey,
            'sdkKey' => $sdkKey,
            'mn' => $meetingNumber,
            'role' => $role,
            'iat' => $iat,
            'exp' => $exp,
            'tokenExp' => $exp,
        ];

        $base64Header = self::base64UrlEncode(json_encode($header));
        $base64Payload = self::base64UrlEncode(json_encode($payload));
        $signature = hash_hmac('sha256', "{$base64Header}.{$base64Payload}", $sdkSecret, true);
        $base64Signature = self::base64UrlEncode($signature);

        $jwt = "{$base64Header}.{$base64Payload}.{$base64Signature}";

        return [
            'is_mock' => false,
            'signature' => $jwt,
            'sdk_key' => $sdkKey,
            'meeting_number' => $meetingNumber,
            'password' => $passWord,
            'role' => $role,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'session_title' => 'Konseling Online: ' . ($session->counselingCase ? $session->counselingCase->category : 'Sesi BK'),
            'tutor_name' => $session->tutor ? $session->tutor->name : 'Tutor BK',
            'student_name' => $session->user ? $session->user->name : 'Peserta',
        ];
    }

    private static function base64UrlEncode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }
}
