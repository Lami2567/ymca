<?php

namespace App\Http\Controllers;

use App\Http\Requests\Department\StoreDepartmentRequest;
use App\Http\Requests\Department\UpdateDepartmentRequest;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Department::with(['head', 'programs'])
            ->byTenant(auth()->user()->tenant_id);

        if ($request->search) {
            $query->where('name', 'ilike', "%{$request->search}%")
                ->orWhere('code', 'ilike', "%{$request->search}%");
        }

        $departments = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $departments->items(),
            'meta' => [
                'page' => $departments->currentPage(),
                'per_page' => $departments->perPage(),
                'total' => $departments->total(),
            ],
        ]);
    }

    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $department = Department::create([
            'tenant_id' => auth()->user()->tenant_id,
            'code' => $request->code,
            'name' => $request->name,
            'description' => $request->description,
            'head_id' => $request->head_id,
            'status' => 'active',
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $department->load('head'),
            'message' => 'Department created successfully',
        ], 201);
    }

    public function show(Department $department): JsonResponse
    {
        $department->load(['head', 'programs', 'courseUnits']);

        return response()->json([
            'success' => true,
            'data' => $department,
        ]);
    }

    public function update(UpdateDepartmentRequest $request, Department $department): JsonResponse
    {
        $department->update([
            'code' => $request->has('code') ? $request->code : $department->code,
            'name' => $request->has('name') ? $request->name : $department->name,
            'description' => $request->has('description') ? $request->description : $department->description,
            'head_id' => $request->has('head_id') ? $request->head_id : $department->head_id,
            'status' => $request->has('status') ? $request->status : $department->status,
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $department->load('head'),
            'message' => 'Department updated successfully',
        ]);
    }

    public function destroy(Department $department): JsonResponse
    {
        $department->delete();

        return response()->json([
            'success' => true,
            'message' => 'Department deleted successfully',
        ]);
    }
}
