<?php

namespace App\Http\Requests\LecturerAssignment;

use Illuminate\Foundation\Http\FormRequest;

class StoreLecturerAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lecturer_id' => 'required|exists:lecturers,id',
            'course_unit_id' => 'required|exists:course_units,id',
            'quarter_id' => 'required|exists:quarters,id',
            'academic_year_id' => 'required|exists:academic_years,id',
        ];
    }
}
