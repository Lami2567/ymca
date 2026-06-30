<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_unit_id')->constrained()->onDelete('cascade');
            $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->timestamp('enrolled_at')->useCurrent();
            $table->foreignId('enrolled_by')->nullable()->constrained('users');
            $table->enum('status', ['registered', 'dropped', 'completed', 'failed'])->default('registered');
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index('student_id');
            $table->index('course_unit_id');
            $table->index('quarter_id');
            $table->index('academic_year_id');
            $table->index('status');
            $table->unique(['student_id', 'course_unit_id', 'quarter_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
