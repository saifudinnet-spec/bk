<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nim',
        'program_study',
        'degree',
        'semester',
        'birth_place',
        'birth_date',
        'gender',
        'address',
        'campus_status',
        'campus_external_id',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'semester' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
