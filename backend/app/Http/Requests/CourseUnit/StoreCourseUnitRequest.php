<?php

namespace App\Http\Requests\CourseUnit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                Rule::unique('course_units')->where(fn ($query) => $query->where('tenant_id', auth()->user()->tenant_id)),
            ],
            'name' => 'required|string|max:255',
            'credit_units' => 'required|integer|min:1',
            'department_id' => 'required|exists:departments,id',
            'program_id' => 'required|exists:programs,id',
            'quarter_id' => 'required|exists:quarters,id',
            'year_of_study' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'prerequisites' => 'nullable',
            'status' => 'sometimes|string|in:active,inactive',
        ];
    }
}