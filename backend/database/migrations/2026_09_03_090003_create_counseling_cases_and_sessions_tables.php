<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mood_checkins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('mood', ['VERY_GOOD', 'GOOD', 'NEUTRAL', 'NOT_GOOD', 'BAD']);
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('counseling_cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_number', 50)->unique(); // BK-YYYY-XXXXXX
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('tutor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('category', 50); // Akademik, Pribadi, Sosial, Keluarga, Ekonomi, Karier, Adaptasi, Lainnya
            $table->text('initial_reason');
            $table->enum('priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT'])->default('MEDIUM');
            $table->enum('status', [
                'NEW',
                'SCREENING_COMPLETED',
                'WAITING_REVIEW',
                'REVIEWED',
                'WAITING_SCHEDULE',
                'SCHEDULED',
                'IN_PROGRESS',
                'FOLLOW_UP',
                'CLOSED'
            ])->default('NEW');
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('tutor_availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tutor_id')->constrained('users')->onDelete('cascade');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('slot_duration')->default(60); // minutes
            $table->enum('status', ['AVAILABLE', 'BOOKED', 'UNAVAILABLE'])->default('AVAILABLE');
            $table->timestamps();
        });

        Schema::create('counseling_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('counseling_case_id')->constrained('counseling_cases')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('tutor_id')->constrained('users')->onDelete('cascade');
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->enum('status', ['SCHEDULED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])->default('SCHEDULED');
            $table->string('meeting_provider', 30)->default('zoom');
            $table->string('meeting_number', 50)->nullable();
            $table->string('meeting_password', 50)->nullable();
            $table->text('meeting_url')->nullable();
            $table->string('zoom_meeting_id', 100)->nullable();
            $table->timestamps();
        });

        Schema::create('counseling_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('counseling_sessions')->onDelete('cascade');
            $table->foreignId('tutor_id')->constrained('users')->onDelete('cascade');
            $table->text('summary')->nullable();
            $table->text('private_note')->nullable(); // strictly tutor/permission only
            $table->text('student_recommendation')->nullable(); // student visible
            $table->boolean('follow_up_required')->default(false);
            $table->dateTime('next_follow_up_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('counseling_notes');
        Schema::dropIfExists('counseling_sessions');
        Schema::dropIfExists('tutor_availabilities');
        Schema::dropIfExists('counseling_cases');
        Schema::dropIfExists('mood_checkins');
    }
};
