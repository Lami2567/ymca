<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_number' => [
                'required',
                'string',
                Rule::unique('students')->where(fn ($query) => $query->where('tenant_id', auth()->user()->tenant_id)),
            ],
            'first_name' => 'required_without:user_id|string|max:255',
            'last_name' => 'required_without:user_id|string|max:255',
            'email' => [
                'required_without:user_id',
                'email',
                Rule::unique('users')->where(fn ($query) => $query->where('tenant_id', auth()->user()->tenant_id)),
            ],
            'password' => 'nullable|string|min:6',
            'program_id' => 'required|exists:programs,id',
            'admission_date' => 'required|date',
            'expected_graduation_date' => 'nullable|date',
            'user_id' => 'nullable|exists:users,id',
        ];
    }
}