<?php

namespace App\Http\Controllers;

use App\Http\Requests\Result\StoreResultRequest;
use App\Http\Requests\Result\UpdateResultRequest;
use App\Http\Requests\Result\BulkUpdateResultRequest;
use App\Models\Result;
use App\Models\Enrollment;
use App\Models\AssessmentConfiguration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResultController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Result::with(['student.user', 'courseUnit', 'quarter', 'academicYear'])
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

        if ($request->academic_year_id) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $results = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $results->items(),
            'meta' => [
                'page' => $results->currentPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
            ],
        ]);
    }

    public function byCourse(Request $request): JsonResponse
    {
        $lecturer = auth()->user()->lecturer;
        
        $query = Result::with(['student.user', 'enrollment'])
            ->where('course_unit_id', $request->course_unit_id)
            ->where('quarter_id', $request->quarter_id)
            ->where('academic_year_id', $request->academic_year_id);

        $results = $query->get();

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    public function store(StoreResultRequest $request): JsonResponse
    {
        $enrollment = Enrollment::findOrFail($request->enrollment_id);
        
        $result = Result::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'student_id' => $enrollment->student_id,
                'course_unit_id' => $enrollment->course_unit_id,
                'quarter_id' => $enrollment->quarter_id,
                'academic_year_id' => $enrollment->academic_year_id,
            ],
            [
                'tenant_id' => auth()->user()->tenant_id,
                'cw1_score' => $request->cw1_score,
                'cw2_score' => $request->cw2_score,
                'cw3_score' => $request->cw3_score,
                'cw4_score' => $request->cw4_score,
                'test_score' => $request->test_score,
                'exam_score' => $request->exam_score,
                'status' => 'draft',
                'created_by' => auth()->id(),
            ]
        );

        // Calculate total, grade, and grade points
        $config = AssessmentConfiguration::where('course_unit_id', $result->course_unit_id)
            ->where('quarter_id', $result->quarter_id)
            ->where('academic_year_id', $result->academic_year_id)
            ->first();

        if (!$config) {
            $config = AssessmentConfiguration::create([
                'tenant_id' => auth()->user()->tenant_id,
                'course_unit_id' => $result->course_unit_id,
                'quarter_id' => $result->quarter_id,
                'academic_year_id' => $result->academic_year_id,
                'cw1_weight' => 20.00,
                'cw2_weight' => 20.00,
                'cw3_weight' => 0.00,
                'cw4_weight' => 0.00,
                'test_weight' => 20.00,
                'exam_weight' => 40.00,
                'total_weight' => 100.00,
                'created_by' => auth()->id(),
            ]);
        }

        $result->total_score = $result->calculateTotalScore($config);
        $result->grade = $result->calculateGrade();
        $result->grade_points = $result->calculateGradePoints();
        $result->save();

        return response()->json([
            'success' => true,
            'data' => $result->load(['student.user', 'courseUnit']),
            'message' => 'Result saved successfully',
        ], 201);
    }

    public function bulkStore(BulkUpdateResultRequest $request): JsonResponse
    {
        DB::beginTransaction();
        
        try {
            foreach ($request->results as $resultData) {
                $enrollment = Enrollment::findOrFail($resultData['enrollment_id']);
                
                $result = Result::updateOrCreate(
                    [
                        'enrollment_id' => $enrollment->id,
                        'student_id' => $enrollment->student_id,
                        'course_unit_id' => $enrollment->course_unit_id,
                        'quarter_id' => $enrollment->quarter_id,
                        'academic_year_id' => $enrollment->academic_year_id,
                    ],
                    [
                        'tenant_id' => auth()->user()->tenant_id,
                        'cw1_score' => $resultData['cw1_score'] ?? null,
                        'cw2_score' => $resultData['cw2_score'] ?? null,
                        'cw3_score' => $resultData['cw3_score'] ?? null,
                        'cw4_score' => $resultData['cw4_score'] ?? null,
                        'test_score' => $resultData['test_score'] ?? null,
                        'exam_score' => $resultData['exam_score'] ?? null,
                        'status' => 'draft',
                        'updated_by' => auth()->id(),
                    ]
                );

                // Calculate totals
                $config = AssessmentConfiguration::where('course_unit_id', $result->course_unit_id)
                    ->where('quarter_id', $result->quarter_id)
                    ->where('academic_year_id', $result->academic_year_id)
                    ->first();

                if (!$config) {
                    $config = AssessmentConfiguration::create([
                        'tenant_id' => auth()->user()->tenant_id,
                        'course_unit_id' => $result->course_unit_id,
                        'quarter_id' => $result->quarter_id,
                        'academic_year_id' => $result->academic_year_id,
                        'cw1_weight' => 20.00,
                        'cw2_weight' => 20.00,
                        'cw3_weight' => 0.00,
                        'cw4_weight' => 0.00,
                        'test_weight' => 20.00,
                        'exam_weight' => 40.00,
                        'total_weight' => 100.00,
                        'created_by' => auth()->id(),
                    ]);
                }

                $result->total_score = $result->calculateTotalScore($config);
                $result->grade = $result->calculateGrade();
                $result->grade_points = $result->calculateGradePoints();
                $result->save();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Results saved successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'BULK_UPDATE_FAILED',
                    'message' => 'Failed to save results: ' . $e->getMessage(),
                ],
            ], 500);
        }
    }

    public function show(Result $result): JsonResponse
    {
        $result->load(['student.user', 'courseUnit', 'quarter', 'academicYear', 'enrollment']);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    public function update(UpdateResultRequest $request, Result $result): JsonResponse
    {
        $result->update([
            'cw1_score' => $request->cw1_score ?? $result->cw1_score,
            'cw2_score' => $request->cw2_score ?? $result->cw2_score,
            'cw3_score' => $request->cw3_score ?? $result->cw3_score,
            'cw4_score' => $request->cw4_score ?? $result->cw4_score,
            'test_score' => $request->test_score ?? $result->test_score,
            'exam_score' => $request->exam_score ?? $result->exam_score,
            'comments' => $request->comments ?? $result->comments,
            'updated_by' => auth()->id(),
        ]);

        // Recalculate totals
        $config = AssessmentConfiguration::where('course_unit_id', $result->course_unit_id)
            ->where('quarter_id', $result->quarter_id)
            ->where('academic_year_id', $result->academic_year_id)
            ->first();

        if (!$config) {
            $config = AssessmentConfiguration::create([
                'tenant_id' => auth()->user()->tenant_id,
                'course_unit_id' => $result->course_unit_id,
                'quarter_id' => $result->quarter_id,
                'academic_year_id' => $result->academic_year_id,
                'cw1_weight' => 20.00,
                'cw2_weight' => 20.00,
                'cw3_weight' => 0.00,
                'cw4_weight' => 0.00,
                'test_weight' => 20.00,
                'exam_weight' => 40.00,
                'total_weight' => 100.00,
                'created_by' => auth()->id(),
            ]);
        }

        $result->total_score = $result->calculateTotalScore($config);
        $result->grade = $result->calculateGrade();
        $result->grade_points = $result->calculateGradePoints();
        $result->save();

        return response()->json([
            'success' => true,
            'data' => $result->load(['student.user', 'courseUnit']),
            'message' => 'Result updated successfully',
        ]);
    }

    public function submit(Result $result): JsonResponse
    {
        if (!$result->isEditable()) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_EDITABLE',
                    'message' => 'This result cannot be submitted in its current state',
                ],
            ], 400);
        }

        $result->submit(auth()->user());

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Result submitted for review',
        ]);
    }

    public function review(Result $result): JsonResponse
    {
        $result->review(auth()->user());

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Result marked as under review',
        ]);
    }

    public function approve(Result $result): JsonResponse
    {
        $result->approve(auth()->user());

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Result approved',
        ]);
    }

    public function publish(Result $result): JsonResponse
    {
        $result->publish(auth()->user());

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Result published',
        ]);
    }

    public function destroy(Result $result): JsonResponse
    {
        $result->delete();

        return response()->json([
            'success' => true,
            'message' => 'Result deleted successfully',
        ]);
    }
}
