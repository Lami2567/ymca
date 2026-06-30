<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quarters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->integer('number');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_current')->default(false);
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->timestamps();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index('academic_year_id');
            $table->index('is_current');
            $table->unique(['academic_year_id', 'number']);
        });

        DB::statement('ALTER TABLE quarters ADD CONSTRAINT quarters_dates_check CHECK (end_date > start_date)');
        DB::statement('ALTER TABLE quarters ADD CONSTRAINT quarters_number_check CHECK (number between 1 and 3)');
    }

    public function down(): void
    {
        Schema::dropIfExists('quarters');
    }
};
