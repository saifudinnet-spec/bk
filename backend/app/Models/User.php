<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'user_type',
        'avatar',
        'status',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isStudent(): bool
    {
        return $this->role === 'STUDENT';
    }

    public function isGeneral(): bool
    {
        return $this->role === 'GENERAL';
    }

    public function isTutor(): bool
    {
        return $this->role === 'TUTOR';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'ADMIN';
    }

    public function studentProfile()
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function generalProfile()
    {
        return $this->hasOne(GeneralProfile::class);
    }

    public function tutorProfile()
    {
        return $this->hasOne(Tutor::class);
    }

    public function moodCheckins()
    {
        return $this->hasMany(MoodCheckin::class);
    }

    public function questionnaireResponses()
    {
        return $this->hasMany(QuestionnaireResponse::class);
    }

    public function studentCases()
    {
        return $this->hasMany(CounselingCase::class, 'user_id');
    }

    public function tutorCases()
    {
        return $this->hasMany(CounselingCase::class, 'tutor_id');
    }

    public function studentSessions()
    {
        return $this->hasMany(CounselingSession::class, 'user_id');
    }

    public function tutorSessions()
    {
        return $this->hasMany(CounselingSession::class, 'tutor_id');
    }

    public function availabilities()
    {
        return $this->hasMany(TutorAvailability::class, 'tutor_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
