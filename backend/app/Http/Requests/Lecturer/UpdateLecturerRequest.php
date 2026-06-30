<?php

namespace App\Http\Requests\Lecturer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLecturerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $lecturer = $this->route('lecturer');
        $lecturerId = $lecturer?->id ?? $lecturer;
        $userId = is_object($lecturer) ? $lecturer->user_id : null;

        return [
            'employee_number' => [
                'sometimes',
                'string',
                Rule::unique('lecturers')
                    ->where(fn ($query) => $query->where('tenant_id', auth()->user()->tenant_id))
                    ->ignore($lecturerId),
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
            'department_id' => 'sometimes|exists:departments,id',
            'title' => 'nullable|string|max:255',
            'specialization' => 'nullable|string',
            'qualification' => 'nullable|string',
            'hire_date' => 'sometimes|date',
            'status' => 'sometimes|string|in:active,inactive,on_leave',
        ];
    }
}