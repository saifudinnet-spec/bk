<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuestionOption extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'question_id',
        'label',
        'score',
        'order',
    ];

    protected $casts = [
        'score' => 'integer',
        'order' => 'integer',
    ];

    public function question()
    {
        return $this->belongsTo(Question::class);
    }
}
