<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TutorAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'tutor_id',
        'date',
        'start_time',
        'end_time',
        'slot_duration',
        'method',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'slot_duration' => 'integer',
    ];

    public function tutor()
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }
}
