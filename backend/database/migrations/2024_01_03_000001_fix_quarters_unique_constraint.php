<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fix quarters table constraints:
 *
 * Problems found:
 * 1. UNIQUE(academic_year_id, number) — prevents a semester and a quarter
 *    from both having the same period number (e.g. Q2 and Sem2 conflict).
 *    Fix: replace with UNIQUE(academic_year_id, period_type, number) as a
 *    PARTIAL index excluding soft-deleted rows.
 *
 * 2. CHECK (number between 1 and 3) — blocks quarter #4.
 *    Fix: raise ceiling to 4.
 *
 * 3. Soft-deleted rows block the unique constraint for new rows with same key.
 *    Fix: use a partial unique index WHERE deleted_at IS NULL.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Drop the old bad unique constraint ────────────────────────────────
        // PostgreSQL: must drop the CONSTRAINT (not just the INDEX) when it's named
        DB::statement('ALTER TABLE quarters DROP CONSTRAINT IF EXISTS quarters_academic_year_id_number_unique');

        // ── Drop the number range constraint ──────────────────────────────────
        DB::statement('ALTER TABLE quarters DROP CONSTRAINT IF EXISTS quarters_number_check');

        // ── Create new partial unique index (excludes soft-deleted rows) ──────
        // Correct scope: one Q1, one Sem1, etc. per (academic_year, period_type).
        DB::statement('
            CREATE UNIQUE INDEX IF NOT EXISTS quarters_academic_year_period_number_unique
            ON quarters (academic_year_id, period_type, number)
            WHERE deleted_at IS NULL
        ');

        // ── New number range: quarters 1-4, semesters 1-2 handled in app validation ──
        DB::statement('ALTER TABLE quarters ADD CONSTRAINT quarters_number_range_check CHECK (number BETWEEN 1 AND 4)');

        // ── Update period_type check: only quarter, semester ──────────────────
        DB::statement('ALTER TABLE quarters DROP CONSTRAINT IF EXISTS quarters_period_type_check');
        DB::statement("ALTER TABLE quarters ADD CONSTRAINT quarters_period_type_check CHECK (period_type IN ('quarter', 'semester'))");
    }

    public function down(): void
    {
        // Restore old constraints
        DB::statement('DROP INDEX IF EXISTS quarters_academic_year_period_number_unique');
        DB::statement('ALTER TABLE quarters DROP CONSTRAINT IF EXISTS quarters_number_range_check');
        DB::statement('ALTER TABLE quarters DROP CONSTRAINT IF EXISTS quarters_period_type_check');

        DB::statement('CREATE UNIQUE INDEX quarters_academic_year_id_number_unique ON quarters (academic_year_id, number)');
        DB::statement('ALTER TABLE quarters ADD CONSTRAINT quarters_number_check CHECK (number BETWEEN 1 AND 3)');
        DB::statement("ALTER TABLE quarters ADD CONSTRAINT quarters_period_type_check CHECK (period_type IN ('quarter', 'semester', 'trimester'))");
    }
};
