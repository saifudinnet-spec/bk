<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CounselingNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'tutor_id',
        'summary',
        'private_note',
        'student_recommendation',
        'follow_up_required',
        'next_follow_up_at',
    ];

    protected $casts = [
        'follow_up_required' => 'boolean',
        'next_follow_up_at' => 'datetime',
    ];

    public function session()
    {
        return $this->belongsTo(CounselingSession::class, 'session_id');
    }

    public function tutor()
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }
}
