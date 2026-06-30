<?php

namespace App\Http\Requests\Result;

use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'results' => 'required|array',
            'results.*.enrollment_id' => 'required|exists:enrollments,id',
            'results.*.cw1_score' => 'nullable|numeric|min:0|max:100',
            'results.*.cw2_score' => 'nullable|numeric|min:0|max:100',
            'results.*.cw3_score' => 'nullable|numeric|min:0|max:100',
            'results.*.cw4_score' => 'nullable|numeric|min:0|max:100',
            'results.*.test_score' => 'nullable|numeric|min:0|max:100',
            'results.*.exam_score' => 'nullable|numeric|min:0|max:100',
        ];
    }
}