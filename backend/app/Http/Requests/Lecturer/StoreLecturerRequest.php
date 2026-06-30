<?php

namespace App\Http\Requests\Lecturer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLecturerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_number' => [
                'required',
                'string',
                Rule::unique('lecturers')->where(fn ($query) => $query->where('tenant_id', auth()->user()->tenant_id)),
            ],
            'first_name' => 'required_without:user_id|string|max:255',
            'last_name' => 'required_without:user_id|string|max:255',
            'email' => [
                'required_without:user_id',
                'email',
                Rule::unique('users')->where(fn ($query) => $query->where('tenant_id', auth()->user()->tenant_id)),
            ],
            'password' => 'nullable|string|min:6',
            'department_id' => 'required|exists:departments,id',
            'title' => 'nullable|string|max:255',
            'specialization' => 'nullable|string',
            'qualification' => 'nullable|string',
            'hire_date' => 'required|date',
            'user_id' => 'nullable|exists:users,id',
        ];
    }
}