<?php

namespace App\Http\Requests\AssessmentConfiguration;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssessmentConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
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
