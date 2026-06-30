<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\AcademicYear;
use App\Models\Quarter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DiagnoseQuarters extends Command
{
    protected $signature = 'diagnose:quarters';
    protected $description = 'Diagnose quarter save issues and seed test data';

    public function handle()
    {
        // --- Inspect current state ---
        $user = User::whereHas('role', function($q){ $q->where('name','admin'); })->first()
            ?? User::first();
        
        if (!$user) {
            $this->error("No user found at all!");
            return 1;
        }
        
        $this->info("=== USER ===");
        $this->line("Email: {$user->email} | tenant_id: {$user->tenant_id} | id: {$user->id}");

        $years = AcademicYear::all();
        $this->info("\n=== ACADEMIC YEARS ===");
        $this->line("Count: " . $years->count());
        foreach ($years as $y) {
            $this->line("  ID:{$y->id} Name:{$y->name} Tenant:{$y->tenant_id}");
        }

        $quarters = Quarter::withTrashed()->get();
        $this->info("\n=== QUARTERS (including soft-deleted) ===");
        $this->line("Count: " . $quarters->count());
        foreach ($quarters as $q) {
            $this->line("  ID:{$q->id} type:{$q->period_type} #:{$q->number} name:{$q->name} yr:{$q->academic_year_id} tenant:{$q->tenant_id} deleted:".($q->deleted_at ? 'YES' : 'no'));
        }

        // --- Check table structure ---
        $this->info("\n=== QUARTERS TABLE COLUMNS ===");
        $cols = DB::select("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'quarters' ORDER BY ordinal_position");
        foreach ($cols as $col) {
            $this->line("  {$col->column_name} ({$col->data_type}) nullable:{$col->is_nullable} default:".($col->column_default ?? 'none'));
        }

        // --- Check unique constraints ---
        $this->info("\n=== UNIQUE INDEXES ON QUARTERS ===");
        $indexes = DB::select("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'quarters'");
        foreach ($indexes as $idx) {
            $this->line("  {$idx->indexname}: {$idx->indexdef}");
        }

        // --- Test validation ---
        $this->info("\n=== VALIDATION TESTS ===");
        
        if ($years->count() === 0) {
            $this->error("Cannot test — no academic years!");
            return 1;
        }

        $year = $years->first();
        
        // Test 1: Quarter
        $this->testValidation('Quarter (num=1)', [
            'academic_year_id' => $year->id,
            'period_type'      => 'quarter',
            'name'             => 'Quarter 1',
            'number'           => 1,
            'start_date'       => '2024-09-01',
            'end_date'         => '2024-11-30',
            'is_current'       => false,
            'status'           => 'active',
        ]);

        // Test 2: Quarter num=3 (the failing case apparently)
        $this->testValidation('Quarter (num=3)', [
            'academic_year_id' => $year->id,
            'period_type'      => 'quarter',
            'name'             => 'Quarter 3',
            'number'           => 3,
            'start_date'       => '2025-04-01',
            'end_date'         => '2025-06-30',
            'is_current'       => false,
            'status'           => 'active',
        ]);

        // Test 3: Semester
        $this->testValidation('Semester (num=1)', [
            'academic_year_id' => $year->id,
            'period_type'      => 'semester',
            'name'             => 'Semester 1',
            'number'           => 1,
            'start_date'       => '2024-09-01',
            'end_date'         => '2025-01-31',
            'is_current'       => false,
            'status'           => 'active',
        ]);

        // Test 4: String number (what the grid might send)
        $this->testValidation('Quarter (num="1" as string)', [
            'academic_year_id' => $year->id,
            'period_type'      => 'quarter',
            'name'             => 'Quarter 1',
            'number'           => '1',  // string!
            'start_date'       => '2024-09-01',
            'end_date'         => '2024-11-30',
            'is_current'       => false,
            'status'           => 'active',
        ]);

        // --- Seed real data ---
        $this->info("\n=== SEEDING PERIODS ===");
        $this->seedPeriods($user, $year);

        return 0;
    }

    private function testValidation(string $label, array $data): bool
    {
        $periodType = $data['period_type'] ?? 'quarter';
        $maxNumber  = $periodType === 'semester' ? 2 : 4;

        $validator = Validator::make($data, [
            'academic_year_id' => 'required|exists:academic_years,id',
            'period_type'      => 'sometimes|string|in:quarter,semester',
            'name'             => 'required|string|max:255',
            'number'           => "required|integer|min:1|max:{$maxNumber}",
            'start_date'       => 'required|date',
            'end_date'         => 'required|date|after:start_date',
            'is_current'       => 'sometimes|boolean',
            'status'           => 'sometimes|string|in:active,archived',
        ]);

        if ($validator->fails()) {
            $this->error("  FAIL [{$label}]: " . implode(' | ', $validator->errors()->all()));
            return false;
        }

        $this->line("  PASS [{$label}]");
        return true;
    }

    private function seedPeriods(User $user, AcademicYear $year): void
    {
        // For diploma: 3 quarters per academic year
        $quarterData = [
            ['number' => 1, 'name' => 'Quarter 1', 'start' => '2024-09-01', 'end' => '2024-11-30'],
            ['number' => 2, 'name' => 'Quarter 2', 'start' => '2024-12-01', 'end' => '2025-02-28'],
            ['number' => 3, 'name' => 'Quarter 3', 'start' => '2025-03-01', 'end' => '2025-05-31'],
        ];

        // For degree: 2 semesters per academic year
        $semesterData = [
            ['number' => 1, 'name' => 'Semester 1', 'start' => '2024-09-01', 'end' => '2025-01-31'],
            ['number' => 2, 'name' => 'Semester 2', 'start' => '2025-02-01', 'end' => '2025-06-30'],
        ];

        $created = 0;
        $skipped = 0;

        foreach ($quarterData as $d) {
            try {
                $exists = Quarter::where('academic_year_id', $year->id)
                    ->where('period_type', 'quarter')
                    ->where('number', $d['number'])
                    ->where('tenant_id', $user->tenant_id)
                    ->exists();

                if ($exists) {
                    $this->line("  SKIP Quarter {$d['number']} (already exists)");
                    $skipped++;
                    continue;
                }

                Quarter::create([
                    'tenant_id'        => $user->tenant_id,
                    'academic_year_id' => $year->id,
                    'period_type'      => 'quarter',
                    'name'             => $d['name'],
                    'number'           => $d['number'],
                    'start_date'       => $d['start'],
                    'end_date'         => $d['end'],
                    'is_current'       => $d['number'] === 1,
                    'status'           => 'active',
                    'created_by'       => $user->id,
                ]);
                $this->info("  CREATED {$d['name']}");
                $created++;
            } catch (\Exception $e) {
                $this->error("  FAILED {$d['name']}: " . $e->getMessage());
            }
        }

        foreach ($semesterData as $d) {
            try {
                $exists = Quarter::where('academic_year_id', $year->id)
                    ->where('period_type', 'semester')
                    ->where('number', $d['number'])
                    ->where('tenant_id', $user->tenant_id)
                    ->exists();

                if ($exists) {
                    $this->line("  SKIP Semester {$d['number']} (already exists)");
                    $skipped++;
                    continue;
                }

                Quarter::create([
                    'tenant_id'        => $user->tenant_id,
                    'academic_year_id' => $year->id,
                    'period_type'      => 'semester',
                    'name'             => $d['name'],
                    'number'           => $d['number'],
                    'start_date'       => $d['start'],
                    'end_date'         => $d['end'],
                    'is_current'       => false,
                    'status'           => 'active',
                    'created_by'       => $user->id,
                ]);
                $this->info("  CREATED {$d['name']}");
                $created++;
            } catch (\Exception $e) {
                $this->error("  FAILED {$d['name']}: " . $e->getMessage());
            }
        }

        $this->info("\nDone: {$created} created, {$skipped} skipped.");
        
        // Show final state
        $this->info("\n=== FINAL QUARTERS IN DB ===");
        foreach (Quarter::orderBy('period_type')->orderBy('number')->get() as $q) {
            $this->line("  {$q->period_type} #{$q->number} '{$q->name}' yr:{$q->academic_year_id} [{$q->status}]");
        }
    }
}
