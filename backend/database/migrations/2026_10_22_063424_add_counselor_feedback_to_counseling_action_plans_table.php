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
        Schema::table('counseling_action_plans', function (Blueprint $table) {
            $table->text('counselor_feedback')->nullable()->after('student_notes');
            $table->timestamp('verified_at')->nullable()->after('completed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('counseling_action_plans', function (Blueprint $table) {
            $table->dropColumn(['counselor_feedback', 'verified_at']);
        });
    }
};
