<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CounselingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'counseling_case_id',
        'user_id',
        'tutor_id',
        'start_at',
        'end_at',
        'status',
        'method',
        'location',
        'meeting_provider',
        'meeting_number',
        'meeting_password',
        'meeting_url',
        'zoom_meeting_id',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    public function counselingCase()
    {
        return $this->belongsTo(CounselingCase::class, 'counseling_case_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tutor()
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function note()
    {
        return $this->hasOne(CounselingNote::class, 'session_id');
    }

    public function feedback()
    {
        return $this->hasOne(SessionFeedback::class, 'session_id');
    }

    public function messages()
    {
        return $this->hasMany(CounselingMessage::class, 'session_id')->orderBy('created_at', 'asc');
    }
}
