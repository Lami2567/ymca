<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseUnit extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'department_id',
        'program_id',
        'year_of_study',
        'quarter_id',
        'code',
        'name',
        'credit_units',
        'description',
        'prerequisites',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'year_of_study' => 'integer',
        'credit_units' => 'integer',
        'prerequisites' => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function quarter()
    {
        return $this->belongsTo(Quarter::class);
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

    public function lecturerAssignments()
    {
        return $this->hasMany(LecturerAssignment::class);
    }

    public function assessmentConfiguration()
    {
        return $this->hasOne(AssessmentConfiguration::class);
    }

    public function assessmentWindows()
    {
        return $this->hasMany(AssessmentWindow::class);
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
        return $query->where('year_of_study', $year);
    }

    public function scopeByQuarter($query, $quarterId)
    {
        return $query->where('quarter_id', $quarterId);
    }

    public function scopeByProgramYearQuarter($query, $programId, $year, $quarterId)
    {
        return $query->where('program_id', $programId)
            ->where('year_of_study', $year)
            ->where('quarter_id', $quarterId);
    }

    public function scopeByTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}

