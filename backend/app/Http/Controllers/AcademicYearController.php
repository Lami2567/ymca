<?php

namespace App\Http\Controllers;

use App\Http\Requests\AcademicYear\StoreAcademicYearRequest;
use App\Http\Requests\AcademicYear\UpdateAcademicYearRequest;
use App\Models\AcademicYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AcademicYear::byTenant(auth()->user()->tenant_id);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $academicYears = $query->orderBy('start_date', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $academicYears->items(),
            'meta' => [
                'page' => $academicYears->currentPage(),
                'per_page' => $academicYears->perPage(),
                'total' => $academicYears->total(),
            ],
        ]);
    }

    public function current(): JsonResponse
    {
        $currentYear = AcademicYear::byTenant(auth()->user()->tenant_id)
            ->current()
            ->with('quarters')
            ->first();

        return response()->json([
            'success' => true,
            'data' => $currentYear,
        ]);
    }

    public function store(StoreAcademicYearRequest $request): JsonResponse
    {
        $academicYear = AcademicYear::create([
            'tenant_id' => auth()->user()->tenant_id,
            'name' => $request->name,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_current' => $request->is_current ?? false,
            'status' => 'active',
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $academicYear,
            'message' => 'Academic year created successfully',
        ], 201);
    }

    public function show(AcademicYear $academicYear): JsonResponse
    {
        $academicYear->load('quarters');

        return response()->json([
            'success' => true,
            'data' => $academicYear,
        ]);
    }

    public function update(UpdateAcademicYearRequest $request, AcademicYear $academicYear): JsonResponse
    {
        $academicYear->update([
            'name' => $request->name ?? $academicYear->name,
            'start_date' => $request->start_date ?? $academicYear->start_date,
            'end_date' => $request->end_date ?? $academicYear->end_date,
            'is_current' => $request->is_current ?? $academicYear->is_current,
            'status' => $request->status ?? $academicYear->status,
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $academicYear,
            'message' => 'Academic year updated successfully',
        ]);
    }

    public function destroy(AcademicYear $academicYear): JsonResponse
    {
        $academicYear->delete();

        return response()->json([
            'success' => true,
            'message' => 'Academic year deleted successfully',
        ]);
    }
}
