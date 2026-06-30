<?php

namespace App\Http\Requests\Quarter;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuarterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $quarter = $this->route('quarter');
        $periodType = $this->input('period_type', (is_object($quarter) ? $quarter->period_type : ($quarter ? \App\Models\Quarter::find($quarter)?->period_type : null)) ?? 'quarter');
        $maxNumber  = $periodType === 'semester' ? 2 : 4;

        return [
            'academic_year_id' => 'sometimes|exists:academic_years,id',
            'period_type'      => 'sometimes|string|in:quarter,semester',
            'name'             => 'sometimes|string|max:255',
            'number'           => "sometimes|integer|min:1|max:{$maxNumber}",
            'start_date'       => 'sometimes|date',
            'end_date'         => 'sometimes|date|after:start_date',
            'is_current'       => 'sometimes|boolean',
            'status'           => 'sometimes|string|in:active,archived',
        ];
    }

    public function messages(): array
    {
        return [
            'number.max' => 'A semester can only have 2 periods (1 or 2). A quarter can have up to 4.',
        ];
    }
}