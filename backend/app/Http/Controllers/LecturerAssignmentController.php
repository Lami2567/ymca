<?php

namespace App\Http\Controllers;

use App\Http\Requests\LecturerAssignment\StoreLecturerAssignmentRequest;
use App\Http\Requests\LecturerAssignment\UpdateLecturerAssignmentRequest;
use App\Models\LecturerAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LecturerAssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LecturerAssignment::with(['lecturer.user', 'courseUnit', 'quarter', 'academicYear'])
            ->byTenant(auth()->user()->tenant_id);

        if ($request->lecturer_id) {
            $query->where('lecturer_id', $request->lecturer_id);
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

        $assignments = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $assignments->items(),
            'meta' => [
                'page' => $assignments->currentPage(),
                'per_page' => $assignments->perPage(),
                'total' => $assignments->total(),
            ],
        ]);
    }

    public function store(StoreLecturerAssignmentRequest $request): JsonResponse
    {
        $assignment = LecturerAssignment::create([
            'tenant_id' => auth()->user()->tenant_id,
            'lecturer_id' => $request->lecturer_id,
            'course_unit_id' => $request->course_unit_id,
            'quarter_id' => $request->quarter_id,
            'academic_year_id' => $request->academic_year_id,
            'assigned_by' => auth()->id(),
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'data' => $assignment->load(['lecturer.user', 'courseUnit', 'quarter', 'academicYear']),
            'message' => 'Lecturer assigned successfully',
        ], 201);
    }

    public function show(LecturerAssignment $assignment): JsonResponse
    {
        $assignment->load(['lecturer.user', 'courseUnit', 'quarter', 'academicYear', 'assignedBy']);

        return response()->json([
            'success' => true,
            'data' => $assignment,
        ]);
    }

    public function update(UpdateLecturerAssignmentRequest $request, LecturerAssignment $assignment): JsonResponse
    {
        $assignment->update([
            'lecturer_id' => $request->lecturer_id ?? $assignment->lecturer_id,
            'course_unit_id' => $request->course_unit_id ?? $assignment->course_unit_id,
            'quarter_id' => $request->quarter_id ?? $assignment->quarter_id,
            'academic_year_id' => $request->academic_year_id ?? $assignment->academic_year_id,
            'status' => $request->status ?? $assignment->status,
        ]);

        return response()->json([
            'success' => true,
            'data' => $assignment->load(['lecturer.user', 'courseUnit', 'quarter', 'academicYear']),
            'message' => 'Assignment updated successfully',
        ]);
    }

    public function destroy(LecturerAssignment $assignment): JsonResponse
    {
        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Assignment deleted successfully',
        ]);
    }
}
