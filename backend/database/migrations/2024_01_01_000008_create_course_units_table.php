<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->foreignId('program_id')->constrained()->onDelete('cascade');
            $table->integer('year_of_study');
            $table->foreignId('quarter_id')->constrained()->onDelete('cascade');
            $table->string('code');
            $table->string('name');
            $table->integer('credit_units');
            $table->text('description')->nullable();
            $table->json('prerequisites')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index('department_id');
            $table->index('program_id');
            $table->index('quarter_id');
            $table->index('code');
            $table->index(['program_id', 'year_of_study', 'quarter_id']);
            $table->unique(['tenant_id', 'code']);
        });

        DB::statement('ALTER TABLE course_units ADD CONSTRAINT course_units_credit_units_check CHECK (credit_units > 0)');
        DB::statement('ALTER TABLE course_units ADD CONSTRAINT course_units_year_of_study_check CHECK (year_of_study > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('course_units');
    }
};
