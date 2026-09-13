<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questionnaires', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('instructions')->nullable();
            $table->string('status', 30)->default('published');
            $table->string('version', 20)->default('1.0');
            $table->timestamps();
        });

        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('questionnaire_id')->constrained('questionnaires')->onDelete('cascade');
            $table->string('category', 100);
            $table->text('question_text');
            $table->string('question_type', 30)->default('likert'); // likert, single_choice, multiple_choice, textarea, yes_no
            $table->boolean('is_required')->default(true);
            $table->boolean('reverse_score')->default(false);
            $table->boolean('is_crisis_flag')->default(false);
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('question_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->string('label');
            $table->integer('score')->default(0);
            $table->integer('order')->default(0);
        });

        Schema::create('questionnaire_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('questionnaire_id')->constrained('questionnaires')->onDelete('cascade');
            $table->integer('total_score')->default(0);
            $table->json('category_scores')->nullable();
            $table->boolean('has_crisis_flag')->default(false);
            $table->string('status', 30)->default('SUBMITTED');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('response_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('response_id')->constrained('questionnaire_responses')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->foreignId('option_id')->nullable()->constrained('question_options')->onDelete('set null');
            $table->integer('score')->nullable();
            $table->text('text_answer')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('response_answers');
        Schema::dropIfExists('questionnaire_responses');
        Schema::dropIfExists('question_options');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('questionnaires');
    }
};
