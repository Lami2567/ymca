<?php

namespace App\Http\Requests\AcademicYear;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAcademicYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $academicYear = $this->route('academic_year');
        $academicYearId = $academicYear?->id ?? $academicYear;

        return [
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('academic_years')
                    ->where(fn ($query) => $query->where('tenant_id', auth()->user()->tenant_id))
                    ->ignore($academicYearId),
            ],
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after:start_date',
            'is_current' => 'sometimes|boolean',
            'status' => 'sometimes|string|in:active,archived',
        ];
    }
}