<?php

namespace App\Http\Controllers;

use App\Http\Requests\Enrollment\StoreEnrollmentRequest;
use App\Models\Enrollment;
use App\Models\Result;
use App\Models\AssessmentConfiguration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EnrollmentController extends Controller
{
    public function enroll(Request $request): JsonResponse
    {
        DB::beginTransaction();
        
        try {
            $studentId = $request->student_id;
            $courseUnitIds = $request->course_unit_ids;
            $quarterId = $request->quarter_id;
            $academicYearId = $request->academic_year_id;

            foreach ($courseUnitIds as $courseUnitId) {
                $enrollment = Enrollment::create([
                    'tenant_id' => auth()->user()->tenant_id,
                    'student_id' => $studentId,
                    'course_unit_id' => $courseUnitId,
                    'quarter_id' => $quarterId,
                    'academic_year_id' => $academicYearId,
                    'enrolled_by' => auth()->id(),
                    'status' => 'registered',
                ]);

                // Create empty result record
                Result::create([
                    'tenant_id' => auth()->user()->tenant_id,
                    'enrollment_id' => $enrollment->id,
                    'student_id' => $studentId,
                    'course_unit_id' => $courseUnitId,
                    'quarter_id' => $quarterId,
                    'academic_year_id' => $academicYearId,
                    'status' => 'draft',
                    'created_by' => auth()->id(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Student enrolled successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'ENROLLMENT_FAILED',
                    'message' => 'Failed to enroll student: ' . $e->getMessage(),
                ],
            ], 500);
        }
    }

    public function drop(Enrollment $enrollment): JsonResponse
    {
        DB::beginTransaction();
        
        try {
            $enrollment->update(['status' => 'dropped']);
            
            // Also delete the result
            Result::where('enrollment_id', $enrollment->id)->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Course dropped successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'DROP_FAILED',
                    'message' => 'Failed to drop course: ' . $e->getMessage(),
                ],
            ], 500);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $query = Enrollment::with(['student.user', 'courseUnit', 'quarter', 'academicYear'])
            ->byTenant(auth()->user()->tenant_id);

        if ($request->student_id) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->course_unit_id) {
            $query->where('course_unit_id', $request->course_unit_id);
        }

        if ($request->quarter_id) {
            $query->where('quarter_id', $request->quarter_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $enrollments = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $enrollments->items(),
            'meta' => [
                'page' => $enrollments->currentPage(),
                'per_page' => $enrollments->perPage(),
                'total' => $enrollments->total(),
            ],
        ]);
    }
}
