<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('enrollment_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_unit_id')->constrained()->onDelete('cascade');
            $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->decimal('cw1_score', 5, 2)->nullable();
            $table->decimal('cw2_score', 5, 2)->nullable();
            $table->decimal('cw3_score', 5, 2)->nullable();
            $table->decimal('cw4_score', 5, 2)->nullable();
            $table->decimal('test_score', 5, 2)->nullable();
            $table->decimal('exam_score', 5, 2)->nullable();
            $table->decimal('total_score', 5, 2)->nullable();
            $table->string('grade', 2)->nullable();
            $table->decimal('grade_points', 3, 2)->nullable();
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'published'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('published_at')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users');
            $table->text('comments')->nullable();
            $table->timestamps();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index('enrollment_id');
            $table->index('student_id');
            $table->index('course_unit_id');
            $table->index('quarter_id');
            $table->index('academic_year_id');
            $table->index('status');
            $table->index(['student_id', 'quarter_id', 'academic_year_id']);
            $table->unique('enrollment_id');
        });

        DB::statement("
            ALTER TABLE results ADD CONSTRAINT results_scores_check CHECK (
                (cw1_score IS NULL OR (cw1_score >= 0 AND cw1_score <= 100)) AND
                (cw2_score IS NULL OR (cw2_score >= 0 AND cw2_score <= 100)) AND
                (cw3_score IS NULL OR (cw3_score >= 0 AND cw3_score <= 100)) AND
                (cw4_score IS NULL OR (cw4_score >= 0 AND cw4_score <= 100)) AND
                (test_score IS NULL OR (test_score >= 0 AND test_score <= 100)) AND
                (exam_score IS NULL OR (exam_score >= 0 AND exam_score <= 100)) AND
                (total_score IS NULL OR (total_score >= 0 AND total_score <= 100))
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('results');
    }
};
