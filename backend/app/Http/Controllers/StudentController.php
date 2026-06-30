<?php

namespace App\Http\Controllers;

use App\Http\Requests\Student\StoreStudentRequest;
use App\Http\Requests\Student\UpdateStudentRequest;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Student::with(['user', 'program'])
            ->byTenant(auth()->user()->tenant_id);

        if ($request->program_id) {
            $query->where('program_id', $request->program_id);
        }

        if ($request->year_of_study) {
            $query->where('current_year_of_study', $request->year_of_study);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $query->where('student_number', 'ilike', "%{$request->search}%")
                ->orWhereHas('user', function ($q) use ($request) {
                    $q->where('first_name', 'ilike', "%{$request->search}%")
                        ->orWhere('last_name', 'ilike', "%{$request->search}%");
                });
        }

        $students = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $students->items(),
            'meta' => [
                'page' => $students->currentPage(),
                'per_page' => $students->perPage(),
                'total' => $students->total(),
            ],
        ]);
    }

    public function store(StoreStudentRequest $request): JsonResponse
    {
        $userId = $request->user_id;

        if (!$userId) {
            $studentRole = \App\Models\Role::where('name', 'student')->first();
            $user = \App\Models\User::create([
                'tenant_id' => auth()->user()->tenant_id,
                'role_id' => $studentRole?->id,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'password' => bcrypt($request->password ?? 'password'),
                'status' => 'active',
            ]);
            $userId = $user->id;
        }

        $student = Student::create([
            'tenant_id' => auth()->user()->tenant_id,
            'user_id' => $userId,
            'program_id' => $request->program_id,
            'student_number' => $request->student_number,
            'admission_date' => $request->admission_date,
            'current_year_of_study' => 1,
            'expected_graduation_date' => $request->expected_graduation_date,
            'status' => 'active',
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $student->load(['user', 'program']),
            'message' => 'Student created successfully',
        ], 201);
    }

    public function show(Student $student): JsonResponse
    {
        $student->load(['user', 'program.department', 'enrollments.courseUnit', 'results']);

        return response()->json([
            'success' => true,
            'data' => $student,
        ]);
    }

    public function update(UpdateStudentRequest $request, Student $student): JsonResponse
    {
        $student->update([
            'program_id' => $request->program_id ?? $student->program_id,
            'student_number' => $request->student_number ?? $student->student_number,
            'admission_date' => $request->admission_date ?? $student->admission_date,
            'current_year_of_study' => $request->current_year_of_study ?? $student->current_year_of_study,
            'expected_graduation_date' => $request->expected_graduation_date ?? $student->expected_graduation_date,
            'status' => $request->status ?? $student->status,
            'updated_by' => auth()->id(),
        ]);

        if ($student->user) {
            $userData = [];
            if ($request->has('first_name')) $userData['first_name'] = $request->first_name;
            if ($request->has('last_name')) $userData['last_name'] = $request->last_name;
            if ($request->has('email')) $userData['email'] = $request->email;
            if (count($userData) > 0) {
                $student->user->update($userData);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $student->load(['user', 'program']),
            'message' => 'Student updated successfully',
        ]);
    }

    public function destroy(Student $student): JsonResponse
    {
        $student->delete();

        return response()->json([
            'success' => true,
            'message' => 'Student deleted successfully',
        ]);
    }

    public function enrollments(Request $request): JsonResponse
    {
        $student = auth()->user()->student;
        
        $query = $student->enrollments()->with(['courseUnit', 'result']);

        if ($request->quarter_id) {
            $query->where('quarter_id', $request->quarter_id);
        }

        $enrollments = $query->get();

        return response()->json([
            'success' => true,
            'data' => $enrollments,
        ]);
    }

    public function results(Request $request): JsonResponse
    {
        $student = auth()->user()->student;
        
        $query = $student->results()->with(['courseUnit', 'quarter', 'academicYear'])->published();

        if ($request->quarter_id) {
            $query->where('quarter_id', $request->quarter_id);
        }

        $results = $query->get();

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    public function transcript(): JsonResponse
    {
        $student = auth()->user()->student;
        
        $results = $student->results()
            ->with(['courseUnit', 'quarter', 'academicYear'])
            ->published()
            ->orderBy('academic_year_id')
            ->orderBy('quarter_id')
            ->get();

        $gpa = $student->calculateGPA();

        return response()->json([
            'success' => true,
            'data' => [
                'student' => $student->load(['user', 'program']),
                'results' => $results,
                'gpa' => $gpa,
            ],
        ]);
    }

    public function gpa(): JsonResponse
    {
        $student = auth()->user()->student;
        $gpa = $student->calculateGPA();

        return response()->json([
            'success' => true,
            'data' => [
                'gpa' => $gpa,
            ],
        ]);
    }

    public function registerCourses(Request $request): JsonResponse
    {
        $request->validate([
            'course_unit_ids' => 'required|array',
            'course_unit_ids.*' => 'exists:course_units,id',
            'quarter_id' => 'required|exists:quarters,id',
            'academic_year_id' => 'required|exists:academic_years,id',
        ]);

        $student = auth()->user()->student;
        $enrollments = [];

        \Illuminate\Support\Facades\DB::beginTransaction();

        try {
            foreach ($request->course_unit_ids as $courseUnitId) {
                $enrollment = \App\Models\Enrollment::where('student_id', $student->id)
                    ->where('course_unit_id', $courseUnitId)
                    ->where('quarter_id', $request->quarter_id)
                    ->where('academic_year_id', $request->academic_year_id)
                    ->first();

                if (!$enrollment) {
                    $enrollment = \App\Models\Enrollment::create([
                        'tenant_id' => auth()->user()->tenant_id,
                        'student_id' => $student->id,
                        'course_unit_id' => $courseUnitId,
                        'quarter_id' => $request->quarter_id,
                        'academic_year_id' => $request->academic_year_id,
                        'enrolled_at' => now(),
                        'enrolled_by' => auth()->id(),
                        'status' => 'registered',
                    ]);

                    // Create empty result record
                    \App\Models\Result::create([
                        'tenant_id' => auth()->user()->tenant_id,
                        'enrollment_id' => $enrollment->id,
                        'student_id' => $student->id,
                        'course_unit_id' => $courseUnitId,
                        'quarter_id' => $request->quarter_id,
                        'academic_year_id' => $request->academic_year_id,
                        'status' => 'draft',
                        'created_by' => auth()->id(),
                    ]);
                }

                $enrollments[] = $enrollment;
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Successfully registered for courses',
                'data' => $enrollments,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'REGISTRATION_FAILED',
                    'message' => 'Failed to register courses: ' . $e->getMessage(),
                ],
            ], 500);
        }
    }
}
