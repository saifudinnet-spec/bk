<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResponseAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'response_id',
        'question_id',
        'option_id',
        'score',
        'text_answer',
    ];

    protected $casts = [
        'score' => 'integer',
    ];

    public function response()
    {
        return $this->belongsTo(QuestionnaireResponse::class, 'response_id');
    }

    public function question()
    {
        return $this->belongsTo(Question::class);
    }

    public function option()
    {
        return $this->belongsTo(QuestionOption::class);
    }
}
