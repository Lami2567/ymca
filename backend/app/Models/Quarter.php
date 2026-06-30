<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quarter extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'academic_year_id',
        'period_type',
        'name',
        'number',
        'start_date',
        'end_date',
        'is_current',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
        'number' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function courseUnits()
    {
        return $this->hasMany(CourseUnit::class);
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

    public function assessmentConfigurations()
    {
        return $this->hasMany(AssessmentConfiguration::class);
    }

    public function assessmentWindows()
    {
        return $this->hasMany(AssessmentWindow::class);
    }

    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByAcademicYear($query, $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    public function scopeByNumber($query, int $number)
    {
        return $query->where('number', $number);
    }

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            if ($model->is_current) {
                // Only clear is_current for periods of the SAME type within the same
                // academic year. This lets diplomas have a current Quarter AND degrees
                // have a current Semester simultaneously.
                static::where('academic_year_id', $model->academic_year_id)
                    ->where('period_type', $model->period_type)
                    ->where('id', '!=', $model->id)
                    ->update(['is_current' => false]);
            }
        });
    }

    public function scopeByTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}

