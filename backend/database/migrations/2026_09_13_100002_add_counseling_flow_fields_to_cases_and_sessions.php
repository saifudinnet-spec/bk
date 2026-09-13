<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('counseling_cases', function (Blueprint $table) {
            $table->foreignId('topic_id')->nullable()->after('tutor_id')->constrained('counseling_topics')->onDelete('set null');
            $table->string('custom_topic')->nullable()->after('topic_id');
            $table->string('method', 30)->default('ZOOM')->after('category'); // CHAT, ZOOM, OFFLINE
            $table->json('assessment_answers')->nullable()->after('initial_reason');
            $table->string('location')->nullable()->after('priority');
            $table->string('suggested_method', 30)->nullable()->after('location');
            $table->text('suggested_method_note')->nullable()->after('suggested_method');
            $table->string('suggested_method_status', 30)->default('NONE')->after('suggested_method_note'); // NONE, PENDING, ACCEPTED, REJECTED
        });

        Schema::table('counseling_sessions', function (Blueprint $table) {
            $table->string('method', 30)->default('ZOOM')->after('end_at'); // CHAT, ZOOM, OFFLINE
            $table->string('location')->nullable()->after('method');
        });

        Schema::table('tutor_availabilities', function (Blueprint $table) {
            $table->string('method', 30)->default('ALL')->after('slot_duration'); // ALL, CHAT, ZOOM, OFFLINE
        });
    }

    public function down(): void
    {
        Schema::table('tutor_availabilities', function (Blueprint $table) {
            $table->dropColumn('method');
        });

        Schema::table('counseling_sessions', function (Blueprint $table) {
            $table->dropColumn(['method', 'location']);
        });

        Schema::table('counseling_cases', function (Blueprint $table) {
            $table->dropForeign(['topic_id']);
            $table->dropColumn([
                'topic_id',
                'custom_topic',
                'method',
                'assessment_answers',
                'location',
                'suggested_method',
                'suggested_method_note',
                'suggested_method_status'
            ]);
        });
    }
};
