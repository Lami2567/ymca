<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Result extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'enrollment_id',
        'student_id',
        'course_unit_id',
        'quarter_id',
        'academic_year_id',
        'cw1_score',
        'cw2_score',
        'cw3_score',
        'cw4_score',
        'test_score',
        'exam_score',
        'total_score',
        'grade',
        'grade_points',
        'status',
        'submitted_at',
        'submitted_by',
        'reviewed_at',
        'reviewed_by',
        'approved_at',
        'approved_by',
        'published_at',
        'published_by',
        'comments',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'cw1_score' => 'decimal:2',
        'cw2_score' => 'decimal:2',
        'cw3_score' => 'decimal:2',
        'cw4_score' => 'decimal:2',
        'test_score' => 'decimal:2',
        'exam_score' => 'decimal:2',
        'total_score' => 'decimal:2',
        'grade_points' => 'decimal:2',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'approved_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
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

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function publishedBy()
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function calculateTotalScore(AssessmentConfiguration $config): float
    {
        $scores = [
            'cw1' => $this->cw1_score,
            'cw2' => $this->cw2_score,
            'cw3' => $this->cw3_score,
            'cw4' => $this->cw4_score,
            'test' => $this->test_score,
            'exam' => $this->exam_score,
        ];

        return $config->calculateTotalScore($scores);
    }

    public function calculateGrade(): string
    {
        $gradeScale = GradeScale::where('tenant_id', $this->tenant_id)
            ->where('is_active', true)
            ->where('min_score', '<=', $this->total_score)
            ->where('max_score', '>=', $this->total_score)
            ->orderByDesc('min_score')
            ->first();

        return $gradeScale?->grade ?? 'F';
    }

    public function calculateGradePoints(): float
    {
        $gradeScale = GradeScale::where('tenant_id', $this->tenant_id)
            ->where('is_active', true)
            ->where('min_score', '<=', $this->total_score)
            ->where('max_score', '>=', $this->total_score)
            ->orderByDesc('min_score')
            ->first();

        return $gradeScale?->grade_points ?? 0.00;
    }

    public function submit(User $user): void
    {
        $this->status = 'submitted';
        $this->submitted_at = now();
        $this->submitted_by = $user->id;
        $this->save();
    }

    public function review(User $user): void
    {
        $this->status = 'under_review';
        $this->reviewed_at = now();
        $this->reviewed_by = $user->id;
        $this->save();
    }

    public function approve(User $user): void
    {
        $this->status = 'approved';
        $this->approved_at = now();
        $this->approved_by = $user->id;
        $this->save();
    }

    public function publish(User $user): void
    {
        $this->status = 'published';
        $this->published_at = now();
        $this->published_by = $user->id;
        $this->save();
    }

    public function isEditable(): bool
    {
        return in_array($this->status, ['draft', 'submitted', 'under_review']);
    }

    public function scopeByStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
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

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeByTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}

