<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_windows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_unit_id')->constrained()->onDelete('cascade');
            $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->enum('assessment_type', ['cw1', 'cw2', 'cw3', 'cw4', 'test', 'exam']);
            $table->timestamp('open_time');
            $table->timestamp('close_time');
            $table->boolean('is_locked')->default(true);
            $table->foreignId('override_by')->nullable()->constrained('users');
            $table->text('override_reason')->nullable();
            $table->timestamps();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index('course_unit_id');
            $table->index('assessment_type');
        });

        DB::statement('ALTER TABLE assessment_windows ADD CONSTRAINT assessment_windows_times_check CHECK (close_time > open_time)');
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_windows');
    }
};
