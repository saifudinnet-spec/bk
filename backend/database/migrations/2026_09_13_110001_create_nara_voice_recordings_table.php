<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nara_voice_recordings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 64)->unique(); // e.g. counseling_step_0, poke_1, etc.
            $table->string('category', 64)->default('Pengajuan Konseling');
            $table->string('title', 255);
            $table->text('text'); // The script text that must be read
            $table->string('context_hint', 255)->nullable();
            $table->string('audio_path', 255)->nullable();
            $table->integer('duration')->nullable(); // duration in seconds
            $table->string('mime_type', 64)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nara_voice_recordings');
    }
};
