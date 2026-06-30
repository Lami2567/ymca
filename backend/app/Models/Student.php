<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted()
    {
        static::creating(function ($student) {
            if (empty($student->uuid)) {
                $student->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    protected $fillable = [
        'uuid',
        'tenant_id',
        'user_id',
        'program_id',
        'student_number',
        'admission_date',
        'current_year_of_study',
        'expected_graduation_date',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'admission_date' => 'date',
        'expected_graduation_date' => 'date',
        'current_year_of_study' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function results()
    {
        return $this->hasMany(Result::class);
    }

    public function getCurrentQuarterEnrollments()
    {
        $currentQuarter = Quarter::current()->first();
        if (!$currentQuarter) return collect();

        return $this->enrollments()
            ->where('quarter_id', $currentQuarter->id)
            ->with('courseUnit')
            ->get();
    }

    public function calculateGPA(?Quarter $quarter = null): float
    {
        $query = $this->results()->whereNotNull('grade_points');
        
        if ($quarter) {
            $query->where('quarter_id', $quarter->id);
        }

        $results = $query->with('enrollment.courseUnit')->get();
        
        if ($results->isEmpty()) return 0.0;

        $totalPoints = 0;
        $totalCredits = 0;

        foreach ($results as $result) {
            $credits = $result->enrollment?->courseUnit?->credit_units ?? 0;
            $totalPoints += $result->grade_points * $credits;
            $totalCredits += $credits;
        }

        return $totalCredits > 0 ? round($totalPoints / $totalCredits, 2) : 0.0;
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByProgram($query, $programId)
    {
        return $query->where('program_id', $programId);
    }

    public function scopeByYear($query, int $year)
    {
        return $query->where('current_year_of_study', $year);
    }

    public function scopeByTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}

