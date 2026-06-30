<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Enrollment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'student_id',
        'course_unit_id',
        'quarter_id',
        'academic_year_id',
        'enrolled_at',
        'enrolled_by',
        'status',
    ];

    protected $casts = [
        'enrolled_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function courseUnit()
    {
        return $this->belongsTo(CourseUnit::class);
    }

    public function quarter()
    {
        return $this->belongsTo(Quarter::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function enrolledBy()
    {
        return $this->belongsTo(User::class, 'enrolled_by');
    }

    public function result()
    {
        return $this->hasOne(Result::class);
    }

    public function scopeRegistered($query)
    {
        return $query->where('status', 'registered');
    }

    public function scopeByStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeByQuarter($query, $quarterId)
    {
        return $query->where('quarter_id', $quarterId);
    }

    public function scopeByAcademicYear($query, $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    public function scopeByProgramYearQuarter($query, $programId, $year, $quarterId)
    {
        return $query->whereHas('courseUnit', function ($q) use ($programId, $year, $quarterId) {
            $q->where('program_id', $programId)
                ->where('year_of_study', $year)
                ->where('quarter_id', $quarterId);
        });
    }

    public function scopeByTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}

