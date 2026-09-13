<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CounselingCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'case_number',
        'user_id',
        'tutor_id',
        'topic_id',
        'custom_topic',
        'category',
        'method',
        'initial_reason',
        'assessment_answers',
        'priority',
        'location',
        'suggested_method',
        'suggested_method_note',
        'suggested_method_status',
        'status',
        'opened_at',
        'closed_at',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'assessment_answers' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($case) {
            if (empty($case->case_number)) {
                $year = date('Y');
                $count = static::whereYear('created_at', $year)->count() + 1;
                $case->case_number = sprintf('BK-%s-%06d', $year, $count);
            }
            if (empty($case->opened_at)) {
                $case->opened_at = now();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tutor()
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function topic()
    {
        return $this->belongsTo(CounselingTopic::class, 'topic_id');
    }

    public function sessions()
    {
        return $this->hasMany(CounselingSession::class, 'counseling_case_id');
    }

    public function actionPlans()
    {
        return $this->hasMany(CounselingActionPlan::class, 'counseling_case_id');
    }
}
