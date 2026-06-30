<?php

namespace App\Http\Requests\Program;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProgramRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $program = $this->route('program');
        $programId = $program?->id ?? $program;

        return [
            'code' => [
                'sometimes',
                'string',
                Rule::unique('programs')
                    ->where(fn ($query) => $query->where('tenant_id', auth()->user()->tenant_id))
                    ->ignore($programId),
            ],
            'name' => 'sometimes|string|max:255',
            'department_id' => 'sometimes|exists:departments,id',
            'type' => 'sometimes|string|in:degree,diploma,certificate,masters,phd',
            'duration_years' => 'sometimes|integer|min:1',
            'description' => 'nullable|string',
            'status' => 'sometimes|string|in:active,inactive',
        ];
    }
}