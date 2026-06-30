<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssessmentWindow\StoreAssessmentWindowRequest;
use App\Http\Requests\AssessmentWindow\UpdateAssessmentWindowRequest;
use App\Models\AssessmentWindow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssessmentWindowController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AssessmentWindow::with(['courseUnit', 'quarter', 'academicYear'])
            ->byTenant(auth()->user()->tenant_id);

        if ($request->course_unit_id) {
            $query->where('course_unit_id', $request->course_unit_id);
        }

        if ($request->quarter_id) {
            $query->where('quarter_id', $request->quarter_id);
        }

        if ($request->assessment_type) {
            $query->where('assessment_type', $request->assessment_type);
        }

        $windows = $query->orderBy('open_time')->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $windows->items(),
            'meta' => [
                'page' => $windows->currentPage(),
                'per_page' => $windows->perPage(),
                'total' => $windows->total(),
            ],
        ]);
    }

    public function store(StoreAssessmentWindowRequest $request): JsonResponse
    {
        $window = AssessmentWindow::create([
            'tenant_id' => auth()->user()->tenant_id,
            'course_unit_id' => $request->course_unit_id,
            'quarter_id' => $request->quarter_id,
            'academic_year_id' => $request->academic_year_id,
            'assessment_type' => $request->assessment_type,
            'open_time' => $request->open_time,
            'close_time' => $request->close_time,
            'is_locked' => true,
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $window->load(['courseUnit', 'quarter', 'academicYear']),
            'message' => 'Assessment window created successfully',
        ], 201);
    }

    public function show(AssessmentWindow $window): JsonResponse
    {
        $window->load(['courseUnit', 'quarter', 'academicYear', 'overrideBy']);

        return response()->json([
            'success' => true,
            'data' => $window,
        ]);
    }

    public function update(UpdateAssessmentWindowRequest $request, AssessmentWindow $window): JsonResponse
    {
        $window->update([
            'open_time' => $request->open_time ?? $window->open_time,
            'close_time' => $request->close_time ?? $window->close_time,
            'is_locked' => $request->is_locked ?? $window->is_locked,
            'override_by' => $request->is_locked === false ? auth()->id() : null,
            'override_reason' => $request->override_reason,
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $window->load(['courseUnit', 'quarter', 'academicYear']),
            'message' => 'Assessment window updated successfully',
        ]);
    }

    public function unlock(AssessmentWindow $window): JsonResponse
    {
        $window->update([
            'is_locked' => false,
            'override_by' => auth()->id(),
            'override_reason' => 'Manual unlock by ' . auth()->user()->full_name,
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $window,
            'message' => 'Assessment window unlocked successfully',
        ]);
    }

    public function lock(AssessmentWindow $window): JsonResponse
    {
        $window->update([
            'is_locked' => true,
            'override_by' => auth()->id(),
            'override_reason' => 'Manual lock by ' . auth()->user()->full_name,
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $window,
            'message' => 'Assessment window locked successfully',
        ]);
    }

    public function destroy(AssessmentWindow $window): JsonResponse
    {
        $window->delete();

        return response()->json([
            'success' => true,
            'message' => 'Assessment window deleted successfully',
        ]);
    }
}
