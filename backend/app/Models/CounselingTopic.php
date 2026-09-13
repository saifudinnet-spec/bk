<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CounselingTopic extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'tag',
        'description',
        'icon',
        'is_active',
        'order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    public function tutors()
    {
        return $this->belongsToMany(Tutor::class, 'counselor_topics', 'topic_id', 'tutor_id')
                    ->withPivot('expertise_tags')
                    ->withTimestamps();
    }

    public function cases()
    {
        return $this->hasMany(CounselingCase::class, 'topic_id');
    }
}
