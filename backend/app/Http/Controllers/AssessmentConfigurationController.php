<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssessmentConfiguration\StoreAssessmentConfigurationRequest;
use App\Http\Requests\AssessmentConfiguration\UpdateAssessmentConfigurationRequest;
use App\Models\AssessmentConfiguration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssessmentConfigurationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AssessmentConfiguration::with(['courseUnit', 'quarter', 'academicYear'])
            ->byTenant(auth()->user()->tenant_id);

        if ($request->course_unit_id) {
            $query->where('course_unit_id', $request->course_unit_id);
        }

        if ($request->quarter_id) {
            $query->where('quarter_id', $request->quarter_id);
        }

        if ($request->academic_year_id) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        $configurations = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $configurations->items(),
            'meta' => [
                'page' => $configurations->currentPage(),
                'per_page' => $configurations->perPage(),
                'total' => $configurations->total(),
            ],
        ]);
    }

    public function store(StoreAssessmentConfigurationRequest $request): JsonResponse
    {
        $configuration = AssessmentConfiguration::create([
            'tenant_id' => auth()->user()->tenant_id,
            'course_unit_id' => $request->course_unit_id,
            'quarter_id' => $request->quarter_id,
            'academic_year_id' => $request->academic_year_id,
            'cw1_weight' => $request->cw1_weight ?? 0,
            'cw2_weight' => $request->cw2_weight ?? 0,
            'cw3_weight' => $request->cw3_weight ?? 0,
            'cw4_weight' => $request->cw4_weight ?? 0,
            'test_weight' => $request->test_weight ?? 0,
            'exam_weight' => $request->exam_weight ?? 0,
            'total_weight' => $request->total_weight ?? 100,
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $configuration->load(['courseUnit', 'quarter', 'academicYear']),
            'message' => 'Assessment configuration created successfully',
        ], 201);
    }

    public function show(AssessmentConfiguration $configuration): JsonResponse
    {
        $configuration->load(['courseUnit', 'quarter', 'academicYear']);

        return response()->json([
            'success' => true,
            'data' => $configuration,
        ]);
    }

    public function update(UpdateAssessmentConfigurationRequest $request, AssessmentConfiguration $configuration): JsonResponse
    {
        $configuration->update([
            'cw1_weight' => $request->cw1_weight ?? $configuration->cw1_weight,
            'cw2_weight' => $request->cw2_weight ?? $configuration->cw2_weight,
            'cw3_weight' => $request->cw3_weight ?? $configuration->cw3_weight,
            'cw4_weight' => $request->cw4_weight ?? $configuration->cw4_weight,
            'test_weight' => $request->test_weight ?? $configuration->test_weight,
            'exam_weight' => $request->exam_weight ?? $configuration->exam_weight,
            'total_weight' => $request->total_weight ?? $configuration->total_weight,
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $configuration->load(['courseUnit', 'quarter', 'academicYear']),
            'message' => 'Assessment configuration updated successfully',
        ]);
    }

    public function destroy(AssessmentConfiguration $configuration): JsonResponse
    {
        $configuration->delete();

        return response()->json([
            'success' => true,
            'message' => 'Assessment configuration deleted successfully',
        ]);
    }

    public function storeOrUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'course_unit_id' => 'required|exists:course_units,id',
            'quarter_id' => 'required|exists:quarters,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'cw1_weight' => 'nullable|numeric|min:0|max:100',
            'cw2_weight' => 'nullable|numeric|min:0|max:100',
            'cw3_weight' => 'nullable|numeric|min:0|max:100',
            'cw4_weight' => 'nullable|numeric|min:0|max:100',
            'test_weight' => 'nullable|numeric|min:0|max:100',
            'exam_weight' => 'nullable|numeric|min:0|max:100',
        ]);

        $cw1 = floatval($request->cw1_weight ?? 0);
        $cw2 = floatval($request->cw2_weight ?? 0);
        $cw3 = floatval($request->cw3_weight ?? 0);
        $cw4 = floatval($request->cw4_weight ?? 0);
        $test = floatval($request->test_weight ?? 0);
        $exam = floatval($request->exam_weight ?? 0);

        $totalWeight = $cw1 + $cw2 + $cw3 + $cw4 + $test + $exam;

        if (abs($totalWeight - 100) > 0.01) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_WEIGHTS',
                    'message' => 'The sum of all weights must equal exactly 100%. Current total: ' . $totalWeight . '%',
                ],
            ], 422);
        }

        $config = AssessmentConfiguration::updateOrCreate(
            [
                'tenant_id' => auth()->user()->tenant_id,
                'course_unit_id' => $request->course_unit_id,
                'quarter_id' => $request->quarter_id,
                'academic_year_id' => $request->academic_year_id,
            ],
            [
                'cw1_weight' => $cw1,
                'cw2_weight' => $cw2,
                'cw3_weight' => $cw3,
                'cw4_weight' => $cw4,
                'test_weight' => $test,
                'exam_weight' => $exam,
                'total_weight' => 100.00,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $config,
            'message' => 'Assessment configuration saved successfully',
        ]);
    }
}
