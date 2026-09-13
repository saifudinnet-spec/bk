<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class TtsController extends Controller
{
    /**
     * Directory for caching generated audio clips
     */
    protected function getCacheDir(): string
    {
        $dir = storage_path('app/tts_cache');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }
        return $dir;
    }

    /**
     * List available natural voices
     */
    public function voices()
    {
        return response()->json([
            'voices' => [
                [
                    'id' => 'gadis',
                    'name' => 'Nara Gadis (Alami & Ramah)',
                    'gender' => 'Wanita',
                    'badge' => 'Paling Natural',
                    'desc' => 'Suara perempuan Indonesia neural berintonasi halus dan sangat alami.',
                    'sample_text' => 'Halo! Saya Nara, siap mendampingi Anda di Ruang BK.'
                ],
                [
                    'id' => 'siti',
                    'name' => 'Nara Siti (Lembut & Santun)',
                    'gender' => 'Wanita',
                    'badge' => 'Lembut',
                    'desc' => 'Karakter suara yang lebih tenang, lembut, dan menenangkan.',
                    'sample_text' => 'Tarik napas sejenak, ceritamu aman dan privat bersama konselor.'
                ],
                [
                    'id' => 'google',
                    'name' => 'Nara Google (Jernih & Lancar)',
                    'gender' => 'Wanita',
                    'badge' => 'Cepat',
                    'desc' => 'Suara perempuan Indonesia dari Google TTS, artikulasi jelas.',
                    'sample_text' => 'Yuk luangkan dua menit untuk mengisi asesmen awal ini.'
                ],
                [
                    'id' => 'browser',
                    'name' => 'Suara Bawaan Komputer/Browser',
                    'gender' => 'Sistem',
                    'badge' => 'Offline',
                    'desc' => 'Synthesizer lokal browser (kualitas tergantung perangkat).',
                    'sample_text' => 'Ini adalah suara bawaan dari sistem browser Anda.'
                ]
            ],
            'default' => 'gadis'
        ]);
    }

    /**
     * Stream or download natural TTS audio
     */
    public function stream(Request $request)
    {
        $rawText = $request->query('text', '');
        $voice = strtolower($request->query('voice', 'gadis'));
        $rate = $request->query('rate', '+0%'); // e.g. -5%, +0%, +5%

        // Clean text: strip emojis, symbols, markdown formatting
        $cleanText = preg_replace('/[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{1F1E0}-\x{1F1FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', '', $rawText);
        $cleanText = preg_replace('/[*_~`#💡❓✨🎉🎙️]/u', '', $cleanText);
        $cleanText = trim(preg_replace('/\s+/', ' ', $cleanText));

        if (empty($cleanText)) {
            return response()->json(['error' => 'Text parameter is required'], 400);
        }

        // Truncate to reasonable max length for safety
        if (mb_strlen($cleanText) > 600) {
            $cleanText = mb_substr($cleanText, 0, 600) . '...';
        }

        $cacheDir = $this->getCacheDir();
        $cacheKey = md5($voice . '_' . $rate . '_' . $cleanText);
        $cacheFile = $cacheDir . DIRECTORY_SEPARATOR . $cacheKey . '.mp3';

        // 1. Return from cache if exists
        if (File::exists($cacheFile) && filesize($cacheFile) > 1024) {
            return $this->serveAudio($cacheFile);
        }

        // 2. Generate audio based on voice type
        $success = false;

        if ($voice === 'gadis' || $voice === 'siti') {
            $edgeVoice = ($voice === 'siti') ? 'jv-ID-SitiNeural' : 'id-ID-GadisNeural';
            $success = $this->generateEdgeTts($cleanText, $edgeVoice, $rate, $cacheFile);
            
            // If edge-tts failed for any reason, fallback to Google TTS
            if (!$success) {
                $success = $this->generateGoogleTts($cleanText, $cacheFile);
            }
        } else {
            // Default or 'google'
            $success = $this->generateGoogleTts($cleanText, $cacheFile);
            if (!$success) {
                // Fallback to Edge TTS
                $success = $this->generateEdgeTts($cleanText, 'id-ID-GadisNeural', '+0%', $cacheFile);
            }
        }

        if ($success && File::exists($cacheFile) && filesize($cacheFile) > 500) {
            return $this->serveAudio($cacheFile);
        }

        return response()->json([
            'error' => 'Failed to generate voice stream'
        ], 500);
    }

    /**
     * Generate speech using Microsoft Edge Neural Voice
     */
    protected function generateEdgeTts(string $text, string $voice, string $rate, string $outputPath): bool
    {
        try {
            $tempTextFile = tempnam(sys_get_temp_dir(), 'tts_text_') . '.txt';
            file_put_contents($tempTextFile, $text);

            // Execute python edge-tts with text file to avoid shell escaping issues with complex quotes
            $cmd = sprintf(
                'python -m edge_tts --voice %s --rate="%s" --file %s --write-media %s 2>&1',
                escapeshellarg($voice),
                escapeshellcmd($rate),
                escapeshellarg($tempTextFile),
                escapeshellarg($outputPath)
            );

            $output = [];
            $returnCode = 0;
            exec($cmd, $output, $returnCode);

            @unlink($tempTextFile);

            return ($returnCode === 0 && File::exists($outputPath) && filesize($outputPath) > 1024);
        } catch (\Throwable $e) {
            \Log::warning('Edge-TTS generation error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate speech using Google TTS audio stream
     */
    protected function generateGoogleTts(string $text, string $outputPath): bool
    {
        try {
            $client = new Client(['timeout' => 10]);
            
            // For longer texts, Google TTS supports ~180-200 chars per query chunk
            $chunks = $this->splitTextIntoChunks($text, 180);
            $combinedAudio = '';

            foreach ($chunks as $chunk) {
                $url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=' . urlencode($chunk);
                $res = $client->get($url, [
                    'headers' => [
                        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer' => 'https://translate.google.com/'
                    ]
                ]);

                if ($res->getStatusCode() === 200) {
                    $combinedAudio .= (string) $res->getBody();
                }
            }

            if (!empty($combinedAudio)) {
                file_put_contents($outputPath, $combinedAudio);
                return true;
            }

            return false;
        } catch (\Throwable $e) {
            \Log::warning('Google TTS generation error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Split text into sentence chunks within max length
     */
    protected function splitTextIntoChunks(string $text, int $maxLen = 180): array
    {
        if (mb_strlen($text) <= $maxLen) {
            return [$text];
        }

        $chunks = [];
        $sentences = preg_split('/(?<=[.?!,])\s+/u', $text);
        $current = '';

        foreach ($sentences as $sentence) {
            if (mb_strlen($current . ' ' . $sentence) <= $maxLen) {
                $current = trim($current . ' ' . $sentence);
            } else {
                if (!empty($current)) {
                    $chunks[] = $current;
                }
                if (mb_strlen($sentence) > $maxLen) {
                    // Force chunk by words
                    $words = explode(' ', $sentence);
                    $subCurrent = '';
                    foreach ($words as $w) {
                        if (mb_strlen($subCurrent . ' ' . $w) <= $maxLen) {
                            $subCurrent = trim($subCurrent . ' ' . $w);
                        } else {
                            $chunks[] = $subCurrent;
                            $subCurrent = $w;
                        }
                    }
                    $current = $subCurrent;
                } else {
                    $current = $sentence;
                }
            }
        }

        if (!empty($current)) {
            $chunks[] = $current;
        }

        return $chunks;
    }

    /**
     * Return audio response with proper streaming headers
     */
    protected function serveAudio(string $filePath): BinaryFileResponse
    {
        $response = new BinaryFileResponse($filePath);
        $response->headers->set('Content-Type', 'audio/mpeg');
        $response->headers->set('Cache-Control', 'public, max-age=86400');
        $response->headers->set('Accept-Ranges', 'bytes');
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        return $response;
    }
}
