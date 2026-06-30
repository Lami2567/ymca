<?php

namespace App\Http\Requests\LecturerAssignment;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLecturerAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lecturer_id' => 'nullable|exists:lecturers,id',
            'course_unit_id' => 'nullable|exists:course_units,id',
            'quarter_id' => 'nullable|exists:quarters,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'status' => 'nullable|in:active,inactive',
        ];
    }
}
