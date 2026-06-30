<?php

namespace App\Http\Controllers;

use App\Http\Requests\Lecturer\StoreLecturerRequest;
use App\Http\Requests\Lecturer\UpdateLecturerRequest;
use App\Models\Lecturer;
use App\Models\CourseUnit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LecturerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Lecturer::with(['user', 'department'])
            ->byTenant(auth()->user()->tenant_id);

        if ($request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $query->where('employee_number', 'ilike', "%{$request->search}%")
                ->orWhereHas('user', function ($q) use ($request) {
                    $q->where('first_name', 'ilike', "%{$request->search}%")
                        ->orWhere('last_name', 'ilike', "%{$request->search}%");
                });
        }

        $lecturers = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $lecturers->items(),
            'meta' => [
                'page' => $lecturers->currentPage(),
                'per_page' => $lecturers->perPage(),
                'total' => $lecturers->total(),
            ],
        ]);
    }

    public function store(StoreLecturerRequest $request): JsonResponse
    {
        $userId = $request->user_id;

        if (!$userId) {
            $lecturerRole = \App\Models\Role::where('name', 'lecturer')->first();
            $user = \App\Models\User::create([
                'tenant_id' => auth()->user()->tenant_id,
                'role_id' => $lecturerRole?->id,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'password' => bcrypt($request->password ?? 'password'),
                'status' => 'active',
            ]);
            $userId = $user->id;
        }

        $allowedTitles = ['mr', 'mrs', 'ms', 'dr', 'prof'];
        $title = $request->title ? strtolower(str_replace('.', '', trim($request->title))) : 'mr';
        if (!in_array($title, $allowedTitles)) {
            $title = 'mr';
        }

        $lecturer = Lecturer::create([
            'tenant_id' => auth()->user()->tenant_id,
            'user_id' => $userId,
            'department_id' => $request->department_id,
            'employee_number' => $request->employee_number,
            'title' => $title,
            'specialization' => $request->specialization,
            'qualification' => $request->qualification,
            'hire_date' => $request->hire_date,
            'status' => 'active',
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $lecturer->load(['user', 'department']),
            'message' => 'Lecturer created successfully',
        ], 201);
    }

    /**
     * Bulk create/update lecturers in a single transaction.
     * Accepts: { items: [ { id?, employee_number, first_name, last_name, email, department_id, ... } ] }
     */
    public function bulk(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.employee_number' => 'required|string',
            'items.*.first_name' => 'required_without:items.*.user_id|string|max:255',
            'items.*.last_name' => 'required_without:items.*.user_id|string|max:255',
            'items.*.email' => 'required_without:items.*.user_id|email',
            'items.*.department_id' => 'required|integer|exists:departments,id',
            'items.*.hire_date' => 'required|date',
            'items.*.title' => 'nullable|string|max:255',
            'items.*.specialization' => 'nullable|string',
            'items.*.qualification' => 'nullable|string',
            'items.*.status' => 'nullable|string|in:active,inactive,on_leave',
        ]);

        $tenantId = auth()->user()->tenant_id;
        $authId = auth()->id();
        $saved = [];
        $errors = [];

        // Normalize title values to DB enum format: 'Mr.' → 'mr', 'Dr.' → 'dr', etc.
        $allowedTitles = ['mr', 'mrs', 'ms', 'dr', 'prof'];
        $normalizeTitle = function (?string $val) use ($allowedTitles): string {
            if (!$val) return 'mr';
            $normalized = strtolower(str_replace('.', '', trim($val)));
            return in_array($normalized, $allowedTitles) ? $normalized : 'mr';
        };

        DB::transaction(function () use ($request, $tenantId, $authId, $normalizeTitle, &$saved, &$errors) {
            $lecturerRole = \App\Models\Role::where('name', 'lecturer')->first();

            foreach ($request->items as $index => $item) {
                try {
                    if (!empty($item['id'])) {
                        // --- UPDATE existing lecturer ---
                        $lecturer = Lecturer::where('tenant_id', $tenantId)->find($item['id']);
                        if (!$lecturer) {
                            $errors[] = "Row {$index}: Lecturer ID {$item['id']} not found.";
                            continue;
                        }

                        $lecturer->update([
                            'department_id' => $item['department_id'] ?? $lecturer->department_id,
                            'employee_number' => $item['employee_number'] ?? $lecturer->employee_number,
                            'title' => $normalizeTitle($item['title'] ?? $lecturer->title),
                            'specialization' => $item['specialization'] ?? $lecturer->specialization,
                            'qualification' => $item['qualification'] ?? $lecturer->qualification,
                            'hire_date' => $item['hire_date'] ?? $lecturer->hire_date,
                            'status' => $item['status'] ?? $lecturer->status,
                            'updated_by' => $authId,
                        ]);

                        if ($lecturer->user) {
                            $userData = [];
                            if (!empty($item['first_name'])) $userData['first_name'] = $item['first_name'];
                            if (!empty($item['last_name'])) $userData['last_name'] = $item['last_name'];
                            if (!empty($item['email'])) $userData['email'] = $item['email'];
                            if (count($userData) > 0) {
                                $lecturer->user->update($userData);
                            }
                        }

                        $saved[] = $lecturer->load(['user', 'department']);
                    } else {
                        // --- CREATE new lecturer ---
                        // Check uniqueness manually since we're skipping FormRequest here
                        $existingUser = \App\Models\User::where('tenant_id', $tenantId)
                            ->where('email', $item['email'])
                            ->first();

                        if ($existingUser) {
                            $errors[] = "Row {$index}: Email '{$item['email']}' already exists.";
                            continue;
                        }

                        $existingEmp = Lecturer::where('tenant_id', $tenantId)
                            ->where('employee_number', $item['employee_number'])
                            ->first();

                        if ($existingEmp) {
                            $errors[] = "Row {$index}: Employee number '{$item['employee_number']}' already exists.";
                            continue;
                        }

                        $user = \App\Models\User::create([
                            'tenant_id' => $tenantId,
                            'role_id' => $lecturerRole?->id,
                            'first_name' => $item['first_name'],
                            'last_name' => $item['last_name'],
                            'email' => $item['email'],
                            'password' => bcrypt($item['password'] ?? 'password'),
                            'status' => 'active',
                        ]);

                        $lecturer = Lecturer::create([
                            'tenant_id' => $tenantId,
                            'user_id' => $user->id,
                            'department_id' => $item['department_id'],
                            'employee_number' => $item['employee_number'],
                            'title' => $normalizeTitle($item['title'] ?? null),
                            'specialization' => $item['specialization'] ?? null,
                            'qualification' => $item['qualification'] ?? null,
                            'hire_date' => $item['hire_date'],
                            'status' => $item['status'] ?? 'active',
                            'created_by' => $authId,
                        ]);

                        $saved[] = $lecturer->load(['user', 'department']);
                    }
                } catch (\Exception $e) {
                    $errors[] = "Row {$index}: " . $e->getMessage();
                }
            }
        });

        return response()->json([
            'success' => true,
            'data' => $saved,
            'errors' => $errors,
            'message' => count($errors) === 0
                ? 'All lecturers saved successfully'
                : count($saved) . ' saved, ' . count($errors) . ' failed',
        ]);
    }

    public function show(Lecturer $lecturer): JsonResponse
    {
        $lecturer->load(['user', 'department', 'assignments.courseUnit']);

        return response()->json([
            'success' => true,
            'data' => $lecturer,
        ]);
    }

    public function update(UpdateLecturerRequest $request, Lecturer $lecturer): JsonResponse
    {
        $allowedTitles = ['mr', 'mrs', 'ms', 'dr', 'prof'];
        if ($request->has('title')) {
            $title = $request->title ? strtolower(str_replace('.', '', trim($request->title))) : 'mr';
            if (!in_array($title, $allowedTitles)) {
                $title = 'mr';
            }
        } else {
            $title = $lecturer->title;
        }

        $lecturer->update([
            'department_id' => $request->has('department_id') ? $request->department_id : $lecturer->department_id,
            'employee_number' => $request->has('employee_number') ? $request->employee_number : $lecturer->employee_number,
            'title' => $title,
            'specialization' => $request->has('specialization') ? $request->specialization : $lecturer->specialization,
            'qualification' => $request->has('qualification') ? $request->qualification : $lecturer->qualification,
            'hire_date' => $request->has('hire_date') ? $request->hire_date : $lecturer->hire_date,
            'status' => $request->has('status') ? $request->status : $lecturer->status,
            'updated_by' => auth()->id(),
        ]);

        if ($lecturer->user) {
            $userData = [];
            if ($request->has('first_name')) $userData['first_name'] = $request->first_name;
            if ($request->has('last_name')) $userData['last_name'] = $request->last_name;
            if ($request->has('email')) $userData['email'] = $request->email;
            if (count($userData) > 0) {
                $lecturer->user->update($userData);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $lecturer->load(['user', 'department']),
            'message' => 'Lecturer updated successfully',
        ]);
    }

    public function destroy(Lecturer $lecturer): JsonResponse
    {
        $lecturer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lecturer deleted successfully',
        ]);
    }

    public function assignments(Request $request): JsonResponse
    {
        $lecturer = auth()->user()->lecturer;
        
        $query = $lecturer->assignments()->with(['courseUnit', 'quarter', 'academicYear']);

        if ($request->quarter_id) {
            $query->where('quarter_id', $request->quarter_id);
        }

        if ($request->academic_year_id) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        $assignments = $query->active()->get();

        return response()->json([
            'success' => true,
            'data' => $assignments,
        ]);
    }

    public function courseStudents(Request $request, CourseUnit $courseUnit): JsonResponse
    {
        $lecturer = auth()->user()->lecturer;
        
        // Verify lecturer is assigned to this course
        $assignment = $lecturer->assignments()
            ->where('course_unit_id', $courseUnit->id)
            ->where('quarter_id', $request->quarter_id)
            ->where('academic_year_id', $request->academic_year_id)
            ->first();

        if (!$assignment) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_ASSIGNED',
                    'message' => 'You are not assigned to this course unit',
                ],
            ], 403);
        }

        $students = $courseUnit->enrollments()
            ->where('quarter_id', $request->quarter_id)
            ->where('academic_year_id', $request->academic_year_id)
            ->with(['student.user', 'result'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $students,
        ]);
    }
}
