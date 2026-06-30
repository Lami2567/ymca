<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $student = $this->route('student');
        $studentId = $student?->id ?? $student;
        $userId = is_object($student) ? $student->user_id : null;

        return [
            'student_number' => [
                'sometimes',
                'string',
                Rule::unique('students')
                    ->where(fn ($query) => $query->where('tenant_id', auth()->user()->tenant_id))
                    ->ignore($studentId),
            ],
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'email',
                Rule::unique('users')
                    ->where(fn ($query) => $query->where('tenant_id', auth()->user()->tenant_id))
                    ->ignore($userId),
            ],
            'program_id' => 'sometimes|exists:programs,id',
            'admission_date' => 'sometimes|date',
            'current_year_of_study' => 'sometimes|integer',
            'expected_graduation_date' => 'nullable|date',
            'status' => 'sometimes|string|in:active,graduated,suspended,withdrawn',
        ];
    }
}