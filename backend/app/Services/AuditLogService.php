<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogService
{
    public static function log(string $action, ?string $entityType = null, ?string $entityId = null, ?array $metadata = null, ?int $userId = null)
    {
        try {
            $request = request();
            $currentUserId = $userId ?: ($request && $request->user() ? $request->user()->id : null);

            AuditLog::create([
                'user_id' => $currentUserId,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId ? (string)$entityId : null,
                'ip_address' => $request ? $request->ip() : null,
                'user_agent' => $request ? substr($request->userAgent() ?? '', 0, 500) : null,
                'metadata' => $metadata,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Log silently without breaking user request flow
            \Log::error('Audit log failed: ' . $e->getMessage());
        }
    }
}
