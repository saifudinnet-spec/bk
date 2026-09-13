<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuestionnaireResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'questionnaire_id',
        'total_score',
        'category_scores',
        'has_crisis_flag',
        'status',
        'submitted_at',
    ];

    protected $casts = [
        'total_score' => 'integer',
        'category_scores' => 'array',
        'has_crisis_flag' => 'boolean',
        'submitted_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function questionnaire()
    {
        return $this->belongsTo(Questionnaire::class);
    }

    public function answers()
    {
        return $this->hasMany(ResponseAnswer::class, 'response_id');
    }
}
