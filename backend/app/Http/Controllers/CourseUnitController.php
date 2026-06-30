<?php

namespace App\Http\Controllers;

use App\Http\Requests\CourseUnit\StoreCourseUnitRequest;
use App\Http\Requests\CourseUnit\UpdateCourseUnitRequest;
use App\Models\CourseUnit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseUnitController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CourseUnit::with(['department', 'program', 'quarter'])
            ->byTenant(auth()->user()->tenant_id);

        if ($request->program_id) {
            $query->where('program_id', $request->program_id);
        }

        if ($request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->year_of_study) {
            $query->where('year_of_study', $request->year_of_study);
        }

        if ($request->quarter_id) {
            $query->where('quarter_id', $request->quarter_id);
        }

        if ($request->search) {
            $query->where('name', 'ilike', "%{$request->search}%")
                ->orWhere('code', 'ilike', "%{$request->search}%");
        }

        $courseUnits = $query->orderBy('program_id')
            ->orderBy('year_of_study')
            ->orderBy('quarter_id')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $courseUnits->items(),
            'meta' => [
                'page' => $courseUnits->currentPage(),
                'per_page' => $courseUnits->perPage(),
                'total' => $courseUnits->total(),
            ],
        ]);
    }

    public function store(StoreCourseUnitRequest $request): JsonResponse
    {
        $prerequisites = $request->prerequisites;
        if (is_string($prerequisites)) {
            $prerequisites = array_filter(array_map('trim', explode(',', $prerequisites)));
            $prerequisites = array_values($prerequisites);
        }

        $courseUnit = CourseUnit::create([
            'tenant_id' => auth()->user()->tenant_id,
            'department_id' => $request->department_id,
            'program_id' => $request->program_id,
            'year_of_study' => $request->year_of_study,
            'quarter_id' => $request->quarter_id,
            'code' => $request->code,
            'name' => $request->name,
            'credit_units' => $request->credit_units,
            'description' => $request->description,
            'prerequisites' => $prerequisites,
            'status' => 'active',
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $courseUnit->load(['department', 'program', 'quarter']),
            'message' => 'Course unit created successfully',
        ], 201);
    }

    public function show(CourseUnit $courseUnit): JsonResponse
    {
        $courseUnit->load(['department', 'program', 'quarter', 'assessmentConfiguration']);

        return response()->json([
            'success' => true,
            'data' => $courseUnit,
        ]);
    }

    public function update(UpdateCourseUnitRequest $request, CourseUnit $courseUnit): JsonResponse
    {
        $prerequisites = $courseUnit->prerequisites;
        if ($request->has('prerequisites')) {
            $prerequisites = $request->prerequisites;
            if (is_string($prerequisites)) {
                $prerequisites = array_filter(array_map('trim', explode(',', $prerequisites)));
                $prerequisites = array_values($prerequisites);
            }
        }

        $courseUnit->update([
            'department_id' => $request->has('department_id') ? $request->department_id : $courseUnit->department_id,
            'program_id' => $request->has('program_id') ? $request->program_id : $courseUnit->program_id,
            'year_of_study' => $request->has('year_of_study') ? $request->year_of_study : $courseUnit->year_of_study,
            'quarter_id' => $request->has('quarter_id') ? $request->quarter_id : $courseUnit->quarter_id,
            'code' => $request->has('code') ? $request->code : $courseUnit->code,
            'name' => $request->has('name') ? $request->name : $courseUnit->name,
            'credit_units' => $request->has('credit_units') ? $request->credit_units : $courseUnit->credit_units,
            'description' => $request->has('description') ? $request->description : $courseUnit->description,
            'prerequisites' => $prerequisites,
            'status' => $request->has('status') ? $request->status : $courseUnit->status,
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $courseUnit->load(['department', 'program', 'quarter']),
            'message' => 'Course unit updated successfully',
        ]);
    }

    public function destroy(CourseUnit $courseUnit): JsonResponse
    {
        $courseUnit->delete();

        return response()->json([
            'success' => true,
            'message' => 'Course unit deleted successfully',
        ]);
    }
}
