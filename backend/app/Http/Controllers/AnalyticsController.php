<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Lecturer;
use App\Models\CourseUnit;
use App\Models\Department;
use App\Models\Result;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;

        $totalStudents = Student::byTenant($tenantId)->active()->count();
        $activeLecturers = Lecturer::byTenant($tenantId)->active()->count();
        $totalCourseUnits = CourseUnit::byTenant($tenantId)->active()->count();
        $totalDepartments = Department::byTenant($tenantId)->active()->count();
        
        $pendingApprovals = Result::byTenant($tenantId)
            ->whereIn('status', ['submitted', 'under_review'])
            ->count();

        $currentQuarter = \App\Models\Quarter::current()->first();
        $currentQuarterRegistrations = $currentQuarter 
            ? Enrollment::byTenant($tenantId)
                ->where('quarter_id', $currentQuarter->id)
                ->registered()
                ->count()
            : 0;

        // Calculate overall pass rate
        $publishedResults = Result::byTenant($tenantId)->published()->get();
        $passCount = $publishedResults->filter(fn($r) => $r->grade_points >= 2.0)->count();
        $overallPassRate = $publishedResults->count() > 0 
            ? round(($passCount / $publishedResults->count()) * 100, 2) 
            : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'total_students' => $totalStudents,
                'active_lecturers' => $activeLecturers,
                'total_course_units' => $totalCourseUnits,
                'total_departments' => $totalDepartments,
                'pending_approvals' => $pendingApprovals,
                'current_quarter_registrations' => $currentQuarterRegistrations,
                'overall_pass_rate' => $overallPassRate,
            ],
        ]);
    }

    public function performance(): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $courseUnitId = request()->course_unit_id;
        $quarterId = request()->quarter_id;
        $academicYearId = request()->academic_year_id;

        $query = Result::byTenant($tenantId)->published();

        if ($courseUnitId) {
            $query->where('course_unit_id', $courseUnitId);
        }

        if ($quarterId) {
            $query->where('quarter_id', $quarterId);
        }

        if ($academicYearId) {
            $query->where('academic_year_id', $academicYearId);
        }

        $results = $query->get();

        if ($results->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'average_score' => 0,
                    'median_score' => 0,
                    'pass_rate' => 0,
                    'fail_rate' => 0,
                    'highest_score' => 0,
                    'lowest_score' => 0,
                    'grade_distribution' => [],
                    'total_students' => 0,
                ],
            ]);
        }

        $scores = $results->pluck('total_score')->filter()->values();
        
        $averageScore = $scores->avg() ?? 0;
        $medianScore = $this->calculateMedian($scores);
        $passCount = $results->filter(fn($r) => $r->grade_points >= 2.0)->count();
        $passRate = round(($passCount / $results->count()) * 100, 2);
        $failRate = 100 - $passRate;
        $highestScore = $scores->max() ?? 0;
        $lowestScore = $scores->min() ?? 0;

        $gradeDistribution = $results->groupBy('grade')
            ->map(fn($group) => $group->count())
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'average_score' => round($averageScore, 2),
                'median_score' => round($medianScore, 2),
                'pass_rate' => $passRate,
                'fail_rate' => $failRate,
                'highest_score' => round($highestScore, 2),
                'lowest_score' => round($lowestScore, 2),
                'grade_distribution' => $gradeDistribution,
                'total_students' => $results->count(),
            ],
        ]);
    }

    private function calculateMedian($scores): float
    {
        if ($scores->isEmpty()) return 0;
        
        $sorted = $scores->sort()->values();
        $count = $sorted->count();
        $middle = floor($count / 2);

        if ($count % 2 === 0) {
            return ($sorted[$middle - 1] + $sorted[$middle]) / 2;
        }

        return $sorted[$middle];
    }
}
