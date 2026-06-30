<?php

namespace App\Http\Controllers;

use App\Http\Requests\Program\StoreProgramRequest;
use App\Http\Requests\Program\UpdateProgramRequest;
use App\Models\Program;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Program::with(['department', 'courseUnits'])
            ->byTenant(auth()->user()->tenant_id);

        if ($request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->search) {
            $query->where('name', 'ilike', "%{$request->search}%")
                ->orWhere('code', 'ilike', "%{$request->search}%");
        }

        $programs = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $programs->items(),
            'meta' => [
                'page' => $programs->currentPage(),
                'per_page' => $programs->perPage(),
                'total' => $programs->total(),
            ],
        ]);
    }

    public function store(StoreProgramRequest $request): JsonResponse
    {
        $program = Program::create([
            'tenant_id' => auth()->user()->tenant_id,
            'department_id' => $request->department_id,
            'code' => $request->code,
            'name' => $request->name,
            'type' => $request->type,
            'duration_years' => $request->duration_years,
            'description' => $request->description,
            'total_credit_units' => 0,
            'status' => 'active',
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $program->load('department'),
            'message' => 'Program created successfully',
        ], 201);
    }

    public function show(Program $program): JsonResponse
    {
        $program->load(['department', 'courseUnits' => function ($q) {
            $q->orderBy('year_of_study')->orderBy('quarter_id');
        }]);

        return response()->json([
            'success' => true,
            'data' => $program,
        ]);
    }

    public function update(UpdateProgramRequest $request, Program $program): JsonResponse
    {
        $program->update([
            'department_id' => $request->has('department_id') ? $request->department_id : $program->department_id,
            'code' => $request->has('code') ? $request->code : $program->code,
            'name' => $request->has('name') ? $request->name : $program->name,
            'type' => $request->has('type') ? $request->type : $program->type,
            'duration_years' => $request->has('duration_years') ? $request->duration_years : $program->duration_years,
            'description' => $request->has('description') ? $request->description : $program->description,
            'status' => $request->has('status') ? $request->status : $program->status,
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $program->load('department'),
            'message' => 'Program updated successfully',
        ]);
    }

    public function destroy(Program $program): JsonResponse
    {
        $program->delete();

        return response()->json([
            'success' => true,
            'message' => 'Program deleted successfully',
        ]);
    }
}
