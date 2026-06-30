<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Add period_type to quarters table.
 *
 * Allows the institution to create quarters (1–3 per year),
 * semesters (1–2 per year), or trimesters (1–3 per year) within
 * the same academic year. Existing records default to 'quarter'.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quarters', function (Blueprint $table) {
            $table->string('period_type', 20)->default('quarter')->after('academic_year_id');
        });

        // Back-fill existing rows
        DB::statement("UPDATE quarters SET period_type = 'quarter' WHERE period_type IS NULL OR period_type = ''");

        // Add a check constraint for allowed period types
        DB::statement("ALTER TABLE quarters ADD CONSTRAINT quarters_period_type_check CHECK (period_type IN ('quarter', 'semester', 'trimester'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE quarters DROP CONSTRAINT IF EXISTS quarters_period_type_check');
        Schema::table('quarters', function (Blueprint $table) {
            $table->dropColumn('period_type');
        });
    }
};
