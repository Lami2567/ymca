<?php

namespace App\Http\Requests\Enrollment;

use Illuminate\Foundation\Http\FormRequest;

class StoreEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:students,id',
            'course_unit_ids' => 'required|array',
            'course_unit_ids.*' => 'exists:course_units,id',
            'quarter_id' => 'required|exists:quarters,id',
            'academic_year_id' => 'required|exists:academic_years,id',
        ];
    }
}
