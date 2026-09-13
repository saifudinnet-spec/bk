<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SessionFeedback extends Model
{
    use HasFactory;

    protected $table = 'session_feedbacks';

    protected $fillable = [
        'session_id',
        'counseling_case_id',
        'user_id',
        'tutor_id',
        'rating',
        'mood_after',
        'aspects',
        'comment',
        'is_anonymous',
    ];

    protected $casts = [
        'rating' => 'integer',
        'aspects' => 'array',
        'is_anonymous' => 'boolean',
    ];

    public function session()
    {
        return $this->belongsTo(CounselingSession::class, 'session_id');
    }

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
}
