<?php

namespace App\Http\Requests\AssessmentWindow;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssessmentWindowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'open_time' => 'nullable|date',
            'close_time' => 'nullable|date|after:open_time',
            'is_locked' => 'nullable|boolean',
            'override_reason' => 'nullable|string|max:500',
        ];
    }
}
