<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CounselingActionPlan extends Model
{
    use HasFactory;

    protected $table = 'counseling_action_plans';

    protected $fillable = [
        'counseling_case_id',
        'session_id',
        'user_id',
        'tutor_id',
        'title',
        'description',
        'category',
        'due_date',
        'status',
        'completed_at',
        'student_notes',
    ];

    protected $casts = [
        'due_date' => 'date',
        'completed_at' => 'datetime',
    ];

    public function counselingCase()
    {
        return $this->belongsTo(CounselingCase::class, 'counseling_case_id');
    }

    public function session()
    {
        return $this->belongsTo(CounselingSession::class, 'session_id');
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
