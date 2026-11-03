<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeploymentLog extends Model
{
    protected $fillable = [
        'triggered_by',
        'action',
        'status',
        'commit_before',
        'commit_after',
        'output',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'started_at'  => 'datetime',
        'finished_at' => 'datetime',
    ];

    // Tidak pakai timestamps bawaan Laravel karena kita pakai kolom sendiri
    public $timestamps = false;
}

