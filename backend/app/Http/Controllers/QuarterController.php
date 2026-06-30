<?php

namespace App\Http\Controllers;

use App\Http\Requests\Quarter\StoreQuarterRequest;
use App\Http\Requests\Quarter\UpdateQuarterRequest;
use App\Models\Quarter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuarterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Quarter::with('academicYear')
            ->byTenant(auth()->user()->tenant_id);

        if ($request->academic_year_id) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        if ($request->period_type) {
            $query->where('period_type', $request->period_type);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $quarters = $query->orderBy('academic_year_id')
            ->orderBy('number')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $quarters->items(),
            'meta' => [
                'page' => $quarters->currentPage(),
                'per_page' => $quarters->perPage(),
                'total' => $quarters->total(),
            ],
        ]);
    }

    public function current(): JsonResponse
    {
        $query = Quarter::byTenant(auth()->user()->tenant_id)
            ->current()
            ->with('academicYear');

        // Optional: filter by period type (e.g. ?period_type=semester)
        if (request()->period_type) {
            $query->where('period_type', request()->period_type);
        }

        // Return all current periods (one per period_type may be current at once)
        $currentPeriods = $query->get();

        return response()->json([
            'success' => true,
            // For backwards compatibility, 'data' is the first result (or null),
            // and 'all' contains all current periods indexed by type.
            'data'    => $currentPeriods->first(),
            'all'     => $currentPeriods->keyBy('period_type'),
        ]);
    }

    public function store(StoreQuarterRequest $request): JsonResponse
    {
        $quarter = Quarter::create([
            'tenant_id'       => auth()->user()->tenant_id,
            'academic_year_id'=> $request->academic_year_id,
            'period_type'     => $request->period_type ?? 'quarter',
            'name'            => $request->name,
            'number'          => $request->number,
            'start_date'      => $request->start_date,
            'end_date'        => $request->end_date,
            'is_current'      => $request->is_current ?? false,
            'status'          => 'active',
            'created_by'      => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $quarter->load('academicYear'),
            'message' => 'Quarter created successfully',
        ], 201);
    }

    public function show(Quarter $quarter): JsonResponse
    {
        $quarter->load('academicYear', 'courseUnits');

        return response()->json([
            'success' => true,
            'data' => $quarter,
        ]);
    }

    public function update(UpdateQuarterRequest $request, Quarter $quarter): JsonResponse
    {
        $quarter->update([
            'academic_year_id' => $request->academic_year_id ?? $quarter->academic_year_id,
            'period_type'      => $request->period_type ?? $quarter->period_type,
            'name'             => $request->name ?? $quarter->name,
            'number'           => $request->number ?? $quarter->number,
            'start_date'       => $request->start_date ?? $quarter->start_date,
            'end_date'         => $request->end_date ?? $quarter->end_date,
            'is_current'       => $request->is_current ?? $quarter->is_current,
            'status'           => $request->status ?? $quarter->status,
            'updated_by'       => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $quarter->load('academicYear'),
            'message' => 'Quarter updated successfully',
        ]);
    }

    public function destroy(Quarter $quarter): JsonResponse
    {
        $quarter->delete();

        return response()->json([
            'success' => true,
            'message' => 'Quarter deleted successfully',
        ]);
    }
}
