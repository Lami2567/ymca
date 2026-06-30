<?php

namespace App\Http\Requests\CourseUnit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $courseUnit = $this->route('course_unit');
        $courseUnitId = $courseUnit?->id ?? $courseUnit;

        return [
            'code' => [
                'sometimes',
                'string',
                Rule::unique('course_units')
                    ->where(fn ($query) => $query->where('tenant_id', auth()->user()->tenant_id))
                    ->ignore($courseUnitId),
            ],
            'name' => 'sometimes|string|max:255',
            'credit_units' => 'sometimes|integer|min:1',
            'department_id' => 'sometimes|exists:departments,id',
            'program_id' => 'sometimes|exists:programs,id',
            'quarter_id' => 'sometimes|exists:quarters,id',
            'year_of_study' => 'sometimes|integer|min:1',
            'description' => 'nullable|string',
            'prerequisites' => 'nullable',
            'status' => 'sometimes|string|in:active,inactive',
        ];
    }
}