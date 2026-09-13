<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('counseling_topics', function (Blueprint $table) {
            $table->id();
            $table->string('title', 100);
            $table->string('slug', 100)->unique();
            $table->string('tag', 50)->nullable();
            $table->text('description')->nullable();
            $table->string('icon', 50)->default('Sparkles');
            $table->boolean('is_active')->default(true);
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('counselor_topics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tutor_id')->constrained('tutors')->onDelete('cascade');
            $table->foreignId('topic_id')->constrained('counseling_topics')->onDelete('cascade');
            $table->json('expertise_tags')->nullable();
            $table->timestamps();

            $table->unique(['tutor_id', 'topic_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('counselor_topics');
        Schema::dropIfExists('counseling_topics');
    }
};
