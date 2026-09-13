<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tutor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nip',
        'specialization',
        'bio',
        'photo',
        'is_available',
    ];

    protected $casts = [
        'is_available' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function topics()
    {
        return $this->belongsToMany(CounselingTopic::class, 'counselor_topics', 'tutor_id', 'topic_id')
                    ->withPivot('expertise_tags')
                    ->withTimestamps();
    }
}
