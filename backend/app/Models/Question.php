<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'questionnaire_id',
        'category',
        'question_text',
        'question_type',
        'is_required',
        'reverse_score',
        'is_crisis_flag',
        'order',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'reverse_score' => 'boolean',
        'is_crisis_flag' => 'boolean',
        'order' => 'integer',
    ];

    public function questionnaire()
    {
        return $this->belongsTo(Questionnaire::class);
    }

    public function options()
    {
        return $this->hasMany(QuestionOption::class)->orderBy('order');
    }
}
