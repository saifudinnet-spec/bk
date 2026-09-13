<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('session_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->unique()->constrained('counseling_sessions')->onDelete('cascade');
            $table->foreignId('counseling_case_id')->constrained('counseling_cases')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // student/client
            $table->foreignId('tutor_id')->constrained('users')->onDelete('cascade'); // counselor
            $table->unsignedTinyInteger('rating'); // 1 - 5 stars
            $table->string('mood_after', 50)->nullable(); // MUCH_BETTER, BETTER, NEUTRAL, NEED_FOLLOWUP
            $table->json('aspects')->nullable(); // { empathy: 5, clarity: 4, comfort: 5 }
            $table->text('comment')->nullable();
            $table->boolean('is_anonymous')->default(false);
            $table->timestamps();
        });

        Schema::create('counseling_action_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('counseling_case_id')->constrained('counseling_cases')->onDelete('cascade');
            $table->foreignId('session_id')->nullable()->constrained('counseling_sessions')->onDelete('set null');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // student
            $table->foreignId('tutor_id')->nullable()->constrained('users')->onDelete('set null'); // counselor
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category', 50)->default('Self-Care'); // Self-Care, Akademik, Relasi, Medis, Lainnya
            $table->date('due_date')->nullable();
            $table->enum('status', ['PENDING', 'IN_PROGRESS', 'COMPLETED'])->default('PENDING');
            $table->timestamp('completed_at')->nullable();
            $table->text('student_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('counseling_action_plans');
        Schema::dropIfExists('session_feedbacks');
    }
};
