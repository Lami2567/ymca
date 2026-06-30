<?php

namespace App\Http\Requests\Result;

use Illuminate\Foundation\Http\FormRequest;

class UpdateResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cw1_score' => 'nullable|numeric|min:0|max:100',
            'cw2_score' => 'nullable|numeric|min:0|max:100',
            'cw3_score' => 'nullable|numeric|min:0|max:100',
            'cw4_score' => 'nullable|numeric|min:0|max:100',
            'test_score' => 'nullable|numeric|min:0|max:100',
            'exam_score' => 'nullable|numeric|min:0|max:100',
            'status' => 'sometimes|string|in:draft,submitted,approved,published',
        ];
    }
}