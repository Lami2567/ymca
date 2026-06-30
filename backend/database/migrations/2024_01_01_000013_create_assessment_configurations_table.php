<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_configurations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_unit_id')->constrained()->onDelete('cascade');
            $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->decimal('cw1_weight', 5, 2)->default(0.00);
            $table->decimal('cw2_weight', 5, 2)->default(0.00);
            $table->decimal('cw3_weight', 5, 2)->default(0.00);
            $table->decimal('cw4_weight', 5, 2)->default(0.00);
            $table->decimal('test_weight', 5, 2)->default(0.00);
            $table->decimal('exam_weight', 5, 2)->default(0.00);
            $table->decimal('total_weight', 5, 2)->default(100.00);
            $table->timestamps();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index('course_unit_id');
            $table->unique(['course_unit_id', 'quarter_id', 'academic_year_id']);
        });

        DB::statement('ALTER TABLE assessment_configurations ADD CONSTRAINT assessment_configurations_total_weight_check CHECK (total_weight = 100.00)');
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_configurations');
    }
};
