<?php

namespace App\Services;

use App\Models\CounselingSession;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;

class ZoomService
{
    public static function isConfigured(): bool
    {
        $key = SystemSetting::get('zoom_sdk_key', env('ZOOM_SDK_KEY', ''));
        $secret = SystemSetting::get('zoom_sdk_secret', env('ZOOM_SDK_SECRET', ''));

        return !empty($key) && !empty($secret);
    }

    public static function isMockMode(): bool
    {
        return false;
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
        if (!$forceTest && !$isTestSession) {
            if ($now->lt($startTime->copy()->subMinutes(15))) {
                $diffMins = $now->diffInMinutes($startTime);
                throw new \Exception("Ruang konseling baru dibuka 15 menit sebelum jadwal (mulai dalam {$diffMins} menit lagi).", 400);
            }
        }

        $permanentId = SystemSetting::get('zoom_permanent_meeting_id', '');
        $permanentPassword = SystemSetting::get('zoom_permanent_meeting_password', '');
        $permanentUrl = SystemSetting::get('zoom_permanent_meeting_url', '');

        // Determine meeting number: Zoom requires purely numeric digits (9-11 digits)
        $meetingNumber = $session->meeting_number;
        if (empty($meetingNumber) || !ctype_digit((string)$meetingNumber)) {
            $cleanedPermanent = preg_replace('/\D/', '', $permanentId);
            if (!empty($cleanedPermanent)) {
                $meetingNumber = $cleanedPermanent;
            } else {
                $meetingNumber = '9' . str_pad((string)$session->id, 4, '0', STR_PAD_LEFT) . rand(10000, 99999);
            }

            // Sync meeting info back to session record so both peers use the exact same room
            $session->update([
                'meeting_number' => $meetingNumber,
                'meeting_password' => $session->meeting_password ?: ($permanentPassword ?: 'bk1234'),
                'meeting_url' => $session->meeting_url ?: $permanentUrl,
            ]);
        }

        $passWord = $session->meeting_password ?: ($permanentPassword ?: 'bk1234');
        $isUserTutor = $session->tutor_id === $user->id || $user->isAdmin();

        $sdkKey = SystemSetting::get('zoom_sdk_key', env('ZOOM_SDK_KEY', ''));
        $sdkSecret = SystemSetting::get('zoom_sdk_secret', env('ZOOM_SDK_SECRET', ''));
        $iat = time() - 30;
        $exp = $iat + 60 * 60 * 2; // 2 hours

        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $payload = [
            'appKey' => $sdkKey,
            'sdkKey' => $sdkKey,
            'mn' => (string)$meetingNumber,
            'role' => 0, // 0 allows both tutor and student to join reliably without requiring ZAK token
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
            'meeting_number' => (string)$meetingNumber,
            'password' => (string)$passWord,
            'role' => 0,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'session_title' => 'Konseling Online: ' . ($session->counselingCase ? $session->counselingCase->category : 'Sesi BK'),
            'tutor_name' => $session->tutor ? $session->tutor->name : 'Tutor BK',
            'student_name' => $session->user ? $session->user->name : 'Peserta',
            'direct_join_url' => $session->meeting_url ?: $permanentUrl,
            'is_tutor' => $isUserTutor,
        ];
    }

    private static function base64UrlEncode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }
}
