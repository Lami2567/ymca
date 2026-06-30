<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lecturers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('department_id')->nullable()->constrained();
            $table->string('employee_number')->unique();
            $table->enum('title', ['mr', 'mrs', 'ms', 'dr', 'prof'])->default('mr');
            $table->string('specialization')->nullable();
            $table->string('qualification')->nullable();
            $table->date('hire_date');
            $table->enum('status', ['active', 'inactive', 'on_leave'])->default('active');
            $table->timestamps();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index('user_id');
            $table->index('department_id');
            $table->index('employee_number');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lecturers');
    }
};
