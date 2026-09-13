<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NaraVoiceRecording;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class NaraVoiceController extends Controller
{
    /**
     * Get all script items with recording status and overall statistics
     */
    public function index(Request $request)
    {
        NaraVoiceRecording::seedDefaultsIfNeeded();

        $recordings = NaraVoiceRecording::with(['user:id,name,role'])
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        $totalScripts = $recordings->count();
        $recordedCount = $recordings->where('has_audio', true)->count();
        $pendingCount = $totalScripts - $recordedCount;
        $completionPct = $totalScripts > 0 ? (int) round(($recordedCount / $totalScripts) * 100) : 0;

        return response()->json([
            'recordings' => $recordings,
            'stats' => [
                'total_scripts' => $totalScripts,
                'recorded_count' => $recordedCount,
                'pending_count' => $pendingCount,
                'completion_percentage' => $completionPct,
            ],
            'categories' => $recordings->pluck('category')->unique()->values(),
        ]);
    }

    /**
     * Upload or save recorded audio for a specific script key
     */
    public function upload(Request $request, string $key)
    {
        $recording = NaraVoiceRecording::where('key', $key)->firstOrFail();

        $request->validate([
            'audio' => 'required|file|max:20480', // max 20MB
            'duration' => 'nullable|numeric',
        ]);

        $file = $request->file('audio');
        $duration = $request->input('duration') ? (int) round((float) $request->input('duration')) : null;

        // Ensure storage directory exists
        $dir = storage_path('app/public/voice_recordings');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        // Delete old audio file if present
        if ($recording->audio_path) {
            $oldFilePath = storage_path('app/public/' . ltrim($recording->audio_path, '/'));
            if (File::exists($oldFilePath)) {
                @unlink($oldFilePath);
            }
        }

        // Determine extension (support webm from MediaRecorder or uploaded mp3/wav/m4a)
        $clientExt = strtolower($file->getClientOriginalExtension());
        $mime = $file->getMimeType() ?: 'audio/webm';
        $ext = $clientExt ?: (str_contains($mime, 'webm') ? 'webm' : (str_contains($mime, 'wav') ? 'wav' : 'mp3'));

        $filename = $key . '_' . time() . '.' . $ext;
        $file->move($dir, $filename);

        $savedPath = 'voice_recordings/' . $filename;
        $savedFullPath = $dir . DIRECTORY_SEPARATOR . $filename;

        $recording->update([
            'audio_path' => $savedPath,
            'duration' => $duration,
            'mime_type' => $mime,
            'file_size' => File::exists($savedFullPath) ? filesize($savedFullPath) : $file->getSize(),
            'recorded_by' => $request->user() ? $request->user()->id : null,
        ]);

        $recording->load('user:id,name,role');

        return response()->json([
            'message' => 'Suara rekaman berhasil disimpan ke database!',
            'recording' => $recording,
        ]);
    }

    /**
     * Delete recorded audio for a specific script key
     */
    public function deleteAudio(string $key)
    {
        $recording = NaraVoiceRecording::where('key', $key)->firstOrFail();

        if ($recording->audio_path) {
            $filePath = storage_path('app/public/' . ltrim($recording->audio_path, '/'));
            if (File::exists($filePath)) {
                @unlink($filePath);
            }
        }

        $recording->update([
            'audio_path' => null,
            'duration' => null,
            'mime_type' => null,
            'file_size' => null,
            'recorded_by' => null,
        ]);

        return response()->json([
            'message' => 'Rekaman suara berhasil dihapus dan dikembalikan ke status belum direkam.',
            'recording' => $recording,
        ]);
    }

    /**
     * Update script metadata or text
     */
    public function update(Request $request, int $id)
    {
        $recording = NaraVoiceRecording::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:64',
            'text' => 'required|string',
            'context_hint' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $recording->update($validated);

        return response()->json([
            'message' => 'Naskah teks berhasil diperbarui.',
            'recording' => $recording,
        ]);
    }

    /**
     * Add a new custom script item
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|max:64|unique:nara_voice_recordings,key',
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:64',
            'text' => 'required|string',
            'context_hint' => 'nullable|string|max:255',
        ]);

        $maxOrder = NaraVoiceRecording::max('order') ?? 0;
        $validated['order'] = $maxOrder + 1;

        $recording = NaraVoiceRecording::create($validated);

        return response()->json([
            'message' => 'Naskah baru berhasil ditambahkan ke daftar rekaman.',
            'recording' => $recording,
        ], 201);
    }

    /**
     * Delete a script item entirely
     */
    public function destroy(int $id)
    {
        $recording = NaraVoiceRecording::findOrFail($id);

        if ($recording->audio_path) {
            $filePath = storage_path('app/public/' . ltrim($recording->audio_path, '/'));
            if (File::exists($filePath)) {
                @unlink($filePath);
            }
        }

        $recording->delete();

        return response()->json([
            'message' => 'Naskah berhasil dihapus.',
        ]);
    }

    /**
     * Public endpoint: Get map of all active recorded audios
     * Used by client-side VirtualGuide to play custom recordings
     */
    public function publicActiveRecordings()
    {
        NaraVoiceRecording::seedDefaultsIfNeeded();

        $recordings = NaraVoiceRecording::whereNotNull('audio_path')
            ->where('is_active', true)
            ->get(['id', 'key', 'title', 'text', 'audio_path', 'duration', 'mime_type']);

        $map = [];
        foreach ($recordings as $rec) {
            $map[$rec->key] = [
                'id' => $rec->id,
                'key' => $rec->key,
                'title' => $rec->title,
                'text' => $rec->text,
                'audio_url' => $rec->audio_url,
                'duration' => $rec->duration,
            ];
        }

        return response()->json([
            'recordings' => $map,
            'count' => count($map),
        ]);
    }

    /**
     * Public audio streaming endpoint with byte-ranges support
     */
    public function stream(string $key)
    {
        $recording = NaraVoiceRecording::where('key', $key)->firstOrFail();

        if (empty($recording->audio_path)) {
            return response()->json(['error' => 'Audio recording not found'], 404);
        }

        $filePath = storage_path('app/public/' . ltrim($recording->audio_path, '/'));
        if (!File::exists($filePath)) {
            return response()->json(['error' => 'Audio file missing from server'], 404);
        }

        $mime = $recording->mime_type ?: 'audio/webm';

        $response = new BinaryFileResponse($filePath);
        $response->headers->set('Content-Type', $mime);
        $response->headers->set('Cache-Control', 'public, max-age=86400');
        $response->headers->set('Accept-Ranges', 'bytes');
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, OPTIONS');

        return $response;
    }
}
