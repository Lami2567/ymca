<?php

namespace App\Http\Requests\AssessmentConfiguration;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssessmentConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'course_unit_id' => 'required|exists:course_units,id',
            'quarter_id' => 'required|exists:quarters,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'cw1_weight' => 'nullable|numeric|min:0|max:100',
            'cw2_weight' => 'nullable|numeric|min:0|max:100',
            'cw3_weight' => 'nullable|numeric|min:0|max:100',
            'cw4_weight' => 'nullable|numeric|min:0|max:100',
            'test_weight' => 'nullable|numeric|min:0|max:100',
            'exam_weight' => 'nullable|numeric|min:0|max:100',
            'total_weight' => 'nullable|numeric|min:0|max:100',
        ];
    }
}
