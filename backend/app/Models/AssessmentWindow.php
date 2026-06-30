<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class AssessmentWindow extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'course_unit_id',
        'quarter_id',
        'academic_year_id',
        'assessment_type',
        'open_time',
        'close_time',
        'is_locked',
        'override_by',
        'override_reason',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'open_time' => 'datetime',
        'close_time' => 'datetime',
        'is_locked' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
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

    public function overrideBy()
    {
        return $this->belongsTo(User::class, 'override_by');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function isOpen(): bool
    {
        if ($this->is_locked && !$this->override_by) {
            return false;
        }

        $now = Carbon::now();
        return $now->between($this->open_time, $this->close_time);
    }

    public function isEditable(): bool
    {
        return $this->isOpen();
    }

    public function scopeByCourse($query, $courseUnitId)
    {
        return $query->where('course_unit_id', $courseUnitId);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('assessment_type', $type);
    }

    public function scopeByQuarter($query, $quarterId)
    {
        return $query->where('quarter_id', $quarterId);
    }

    public function scopeByTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}

