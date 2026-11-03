<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deployment_logs', function (Blueprint $table) {
            $table->id();
            $table->string('triggered_by')->default('system'); // nama pusher atau admin
            $table->string('action')->default('full_deploy');  // 'full_deploy', 'git_pull', 'build', dll
            $table->string('status')->default('running');      // 'running', 'success', 'failed'
            $table->string('commit_before', 40)->nullable();
            $table->string('commit_after', 40)->nullable();
            $table->longText('output')->nullable();            // output terminal lengkap
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deployment_logs');
    }
};

