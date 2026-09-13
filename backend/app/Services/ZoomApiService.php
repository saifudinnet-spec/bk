<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ZoomApiService
{
    /**
     * Get Zoom Server-to-Server OAuth credentials from SystemSetting or env
     */
    public static function getCredentials(): array
    {
        return [
            'account_id' => SystemSetting::get('zoom_account_id', env('ZOOM_ACCOUNT_ID', '')),
            'client_id' => SystemSetting::get('zoom_client_id', env('ZOOM_CLIENT_ID', '')),
            'client_secret' => SystemSetting::get('zoom_client_secret', env('ZOOM_CLIENT_SECRET', '')),
            'host_email' => SystemSetting::get('zoom_host_email', env('ZOOM_HOST_EMAIL', '')),
            'mock_mode' => SystemSetting::get('zoom_mock_mode', env('ZOOM_MOCK_MODE', 'true')) === 'true',
        ];
    }

    /**
     * Check if Zoom API credentials are fully configured
     */
    public static function isConfigured(): bool
    {
        $creds = self::getCredentials();
        return !empty($creds['account_id']) && !empty($creds['client_id']) && !empty($creds['client_secret']);
    }

    /**
     * Determine if live Zoom API should be used
     */
    public static function isLiveMode(): bool
    {
        $creds = self::getCredentials();
        return !$creds['mock_mode'] && self::isConfigured();
    }

    /**
     * Request Server-to-Server OAuth Access Token from Zoom
     */
    public static function getAccessToken(): string
    {
        $creds = self::getCredentials();

        if (empty($creds['account_id']) || empty($creds['client_id']) || empty($creds['client_secret'])) {
            throw new \Exception('Kredensial Zoom Server-to-Server OAuth belum dikonfigurasi di Panel Admin.');
        }

        $cacheKey = 'zoom_s2s_access_token_' . md5($creds['account_id'] . $creds['client_id']);

        $cachedToken = Cache::get($cacheKey);
        if ($cachedToken) {
            return $cachedToken;
        }

        try {
            $response = Http::asForm()
                ->withBasicAuth($creds['client_id'], $creds['client_secret'])
                ->timeout(15)
                ->post('https://zoom.us/oauth/token', [
                    'grant_type' => 'account_credentials',
                    'account_id' => $creds['account_id'],
                ]);

            if ($response->failed()) {
                $errorData = $response->json() ?? [];
                $errorMsg = $errorData['reason'] ?? $errorData['error'] ?? $response->body();
                throw new \Exception("Autentikasi Zoom gagal: {$errorMsg}");
            }

            $data = $response->json();
            $token = $data['access_token'];
            $expiresIn = ($data['expires_in'] ?? 3600) - 120; // safe buffer

            Cache::put($cacheKey, $token, max(60, $expiresIn));

            return $token;
        } catch (\Exception $e) {
            Log::error('Zoom OAuth Token Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Test Zoom API connection & verify account details
     */
    public static function testConnection(): array
    {
        try {
            $token = self::getAccessToken();
            $creds = self::getCredentials();
            $userEndpoint = !empty($creds['host_email']) ? urlencode($creds['host_email']) : 'me';

            $response = Http::withToken($token)
                ->timeout(15)
                ->get("https://api.zoom.us/v2/users/{$userEndpoint}");

            if ($response->failed()) {
                $errorData = $response->json() ?? [];
                $errorMsg = $errorData['message'] ?? $response->body();
                return [
                    'success' => false,
                    'message' => "Gagal terhubung ke Zoom API: {$errorMsg}",
                ];
            }

            $userData = $response->json();
            $accountType = match((int)($userData['type'] ?? 1)) {
                1 => 'Basic (Gratis)',
                2 => 'Licensed / Pro',
                3 => 'On-Prem / Corporate',
                default => 'Akun Terverifikasi'
            };

            return [
                'success' => true,
                'message' => 'Koneksi ke Zoom Server-to-Server OAuth berhasil!',
                'data' => [
                    'account_id' => $userData['account_id'] ?? $creds['account_id'],
                    'name' => trim(($userData['first_name'] ?? '') . ' ' . ($userData['last_name'] ?? '')),
                    'email' => $userData['email'] ?? ($creds['host_email'] ?: '-'),
                    'account_type' => $accountType,
                    'timezone' => $userData['timezone'] ?? 'Asia/Jakarta',
                    'status' => $userData['status'] ?? 'active',
                ],
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Create a scheduled Zoom Meeting on the host account
     */
    public static function createMeeting(
        string $topic,
        string $startTimeIso,
        int $durationMinutes = 60,
        ?string $hostEmail = null
    ): array {
        // Fallback to Mock if in mock mode or not configured
        if (!self::isLiveMode()) {
            $meetingNumber = 'BK' . rand(100, 999) . rand(1000, 9999);
            $meetingPassword = 'bk' . rand(1000, 9999);
            return [
                'is_live' => false,
                'id' => $meetingNumber,
                'password' => $meetingPassword,
                'join_url' => null, // will use in-app room
                'start_url' => null,
            ];
        }

        try {
            $token = self::getAccessToken();
            $creds = self::getCredentials();
            $userId = !empty($hostEmail) ? $hostEmail : (!empty($creds['host_email']) ? $creds['host_email'] : 'me');

            // Format start time to ISO 8601 UTC
            $startTime = Carbon::parse($startTimeIso)->toIso8601ZuluString();

            $payload = [
                'topic' => $topic,
                'type' => 2, // Scheduled Meeting
                'start_time' => $startTime,
                'duration' => $durationMinutes,
                'timezone' => 'Asia/Jakarta',
                'password' => 'bk' . rand(1000, 9999),
                'agenda' => "Sesi Bimbingan Konseling Mahasiswa melalui Ruang BK UIN SSC.",
                'settings' => [
                    'host_video' => true,
                    'participant_video' => true,
                    'waiting_room' => true,
                    'join_before_host' => false,
                    'mute_upon_entry' => false,
                    'approval_type' => 0, // Automatically Approve
                    'audio' => 'both',
                    'auto_recording' => 'none',
                ],
            ];

            $response = Http::withToken($token)
                ->timeout(20)
                ->post("https://api.zoom.us/v2/users/{$userId}/meetings", $payload);

            if ($response->failed()) {
                $err = $response->json() ?? [];
                Log::warning('Zoom createMeeting API failed, falling back to mock room:', $err);
                
                // Graceful fallback to mock so flow is not blocked
                $meetingNumber = 'BK' . rand(100, 999) . rand(1000, 9999);
                $meetingPassword = 'bk' . rand(1000, 9999);
                return [
                    'is_live' => false,
                    'id' => $meetingNumber,
                    'password' => $meetingPassword,
                    'join_url' => null,
                    'start_url' => null,
                    'api_error' => $err['message'] ?? 'Gagal menghubungi API Zoom.',
                ];
            }

            $data = $response->json();

            return [
                'is_live' => true,
                'id' => (string)$data['id'],
                'password' => $data['password'] ?? '',
                'join_url' => $data['join_url'] ?? null,
                'start_url' => $data['start_url'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('Exception in ZoomApiService::createMeeting: ' . $e->getMessage());

            // Graceful fallback
            $meetingNumber = 'BK' . rand(100, 999) . rand(1000, 9999);
            $meetingPassword = 'bk' . rand(1000, 9999);
            return [
                'is_live' => false,
                'id' => $meetingNumber,
                'password' => $meetingPassword,
                'join_url' => null,
                'start_url' => null,
                'api_error' => $e->getMessage(),
            ];
        }
    }
}
