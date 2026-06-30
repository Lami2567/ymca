<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LecturerAssignment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'lecturer_id',
        'course_unit_id',
        'quarter_id',
        'academic_year_id',
        'assigned_at',
        'assigned_by',
        'status',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function lecturer()
    {
        return $this->belongsTo(Lecturer::class);
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

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByLecturer($query, $lecturerId)
    {
        return $query->where('lecturer_id', $lecturerId);
    }

    public function scopeByCourse($query, $courseUnitId)
    {
        return $query->where('course_unit_id', $courseUnitId);
    }

    public function scopeByQuarter($query, $quarterId)
    {
        return $query->where('quarter_id', $quarterId);
    }

    public function scopeByAcademicYear($query, $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    public function scopeByTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}

