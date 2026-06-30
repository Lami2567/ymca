<?php

namespace App\Http\Controllers;

use App\Models\Result;
use App\Models\Student;
use App\Models\CourseUnit;
use Illuminate\Http\JsonResponse;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ResultsExport;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function performance(): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $courseUnitId = request()->course_unit_id;
        $quarterId = request()->quarter_id;
        $academicYearId = request()->academic_year_id;

        $query = Result::byTenant($tenantId)
            ->with(['student.user', 'courseUnit', 'quarter', 'academicYear'])
            ->published();

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

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    public function exportResults(): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $courseUnitId = request()->course_unit_id;
        $quarterId = request()->quarter_id;
        $academicYearId = request()->academic_year_id;

        $query = Result::byTenant($tenantId)
            ->with(['student.user', 'courseUnit'])
            ->published();

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

        return Excel::download(new ResultsExport($results), 'results.xlsx');
    }

    public function generateTranscript($studentId): JsonResponse
    {
        $student = Student::with(['user', 'program.department'])->findOrFail($studentId);
        
        $results = Result::where('student_id', $studentId)
            ->with(['courseUnit', 'quarter', 'academicYear'])
            ->published()
            ->orderBy('academic_year_id')
            ->orderBy('quarter_id')
            ->get();

        $gpa = $student->calculateGPA();

        $pdf = PDF::loadView('reports.transcript', [
            'student' => $student,
            'results' => $results,
            'gpa' => $gpa,
        ]);

        return $pdf->download("transcript_{$student->student_number}.pdf");
    }
}
