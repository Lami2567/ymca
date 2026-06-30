<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lecturer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'department_id',
        'employee_number',
        'title',
        'specialization',
        'qualification',
        'hire_date',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'hire_date' => 'date',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function assignments()
    {
        return $this->hasMany(LecturerAssignment::class);
    }

    public function getCurrentAssignments()
    {
        $currentQuarter = Quarter::current()->first();
        if (!$currentQuarter) return collect();

        return $this->assignments()
            ->where('quarter_id', $currentQuarter->id)
            ->where('status', 'active')
            ->with(['courseUnit', 'quarter', 'academicYear'])
            ->get();
    }

    public function getAssignedCourseUnits($quarterId, $academicYearId)
    {
        return $this->assignments()
            ->where('quarter_id', $quarterId)
            ->where('academic_year_id', $academicYearId)
            ->where('status', 'active')
            ->with('courseUnit')
            ->get();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopeByTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}

