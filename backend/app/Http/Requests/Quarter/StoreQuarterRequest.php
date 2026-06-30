<?php

namespace App\Http\Requests\Quarter;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuarterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Max period number depends on the period type:
        //   semester  → 1–2
        //   quarter   → 1–4
        $periodType = $this->input('period_type', 'quarter');
        $maxNumber = $periodType === 'semester' ? 2 : 4;

        return [
            'academic_year_id' => 'required|exists:academic_years,id',
            'period_type'      => 'sometimes|string|in:quarter,semester',
            'name'             => 'required|string|max:255',
            'number'           => "required|integer|min:1|max:{$maxNumber}",
            'start_date'       => 'required|date',
            'end_date'         => 'required|date|after:start_date',
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