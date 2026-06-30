<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssessmentConfiguration extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'course_unit_id',
        'quarter_id',
        'academic_year_id',
        'cw1_weight',
        'cw2_weight',
        'cw3_weight',
        'cw4_weight',
        'test_weight',
        'exam_weight',
        'total_weight',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'cw1_weight' => 'decimal:2',
        'cw2_weight' => 'decimal:2',
        'cw3_weight' => 'decimal:2',
        'cw4_weight' => 'decimal:2',
        'test_weight' => 'decimal:2',
        'exam_weight' => 'decimal:2',
        'total_weight' => 'decimal:2',
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

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function calculateTotalScore(array $scores): float
    {
        $total = 0;
        
        if (isset($scores['cw1'])) $total += $scores['cw1'] * ($this->cw1_weight / 100);
        if (isset($scores['cw2'])) $total += $scores['cw2'] * ($this->cw2_weight / 100);
        if (isset($scores['cw3'])) $total += $scores['cw3'] * ($this->cw3_weight / 100);
        if (isset($scores['cw4'])) $total += $scores['cw4'] * ($this->cw4_weight / 100);
        if (isset($scores['test'])) $total += $scores['test'] * ($this->test_weight / 100);
        if (isset($scores['exam'])) $total += $scores['exam'] * ($this->exam_weight / 100);
        
        return round($total, 2);
    }

    public function scopeByTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}

