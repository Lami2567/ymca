<?php

namespace App\Http\Requests\AssessmentWindow;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssessmentWindowRequest extends FormRequest
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
            'assessment_type' => 'required|in:cw1,cw2,cw3,cw4,test,exam',
            'open_time' => 'required|date',
            'close_time' => 'required|date|after:open_time',
        ];
    }
}
