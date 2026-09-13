<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Services\CampusMockService;
use Illuminate\Http\Request;

class CampusApiController extends Controller
{
    /**
     * Look up student information with privacy masking
     */
    public function lookup(Request $request)
    {
        $request->validate([
            'nim' => 'required|string',
        ]);

        $nim = trim($request->input('nim'));

        // Check if student already registered in the system
        $alreadyRegistered = StudentProfile::where('nim', $nim)->exists();
        if ($alreadyRegistered) {
            return response()->json([
                'registered' => true,
                'message' => 'NIM ini sudah memiliki akun di Ruang BK. Silakan langsung masuk ke sistem.',
            ], 200);
        }

        $data = CampusMockService::lookup($nim);
        if (!$data) {
            return response()->json([
                'registered' => false,
                'found' => false,
                'message' => 'Data mahasiswa dengan NIM tersebut tidak ditemukan pada sistem kampus.',
            ], 404);
        }

        // Return masked data for privacy UX
        $maskedData = CampusMockService::maskStudentData($data);

        return response()->json([
            'registered' => false,
            'found' => true,
            'data' => $maskedData,
        ]);
    }
}
