<?php

namespace App\Http\Requests\Result;

use Illuminate\Foundation\Http\FormRequest;

class StoreResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:students,id',
            'course_unit_id' => 'required|exists:course_units,id',
            'quarter_id' => 'required|exists:quarters,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'cw1_score' => 'nullable|numeric|min:0|max:100',
            'cw2_score' => 'nullable|numeric|min:0|max:100',
            'cw3_score' => 'nullable|numeric|min:0|max:100',
            'cw4_score' => 'nullable|numeric|min:0|max:100',
            'test_score' => 'nullable|numeric|min:0|max:100',
            'exam_score' => 'nullable|numeric|min:0|max:100',
        ];
    }
}