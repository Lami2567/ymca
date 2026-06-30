<?php

namespace App\Http\Requests\Program;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProgramRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                Rule::unique('programs')->where(fn ($query) => $query->where('tenant_id', auth()->user()->tenant_id)),
            ],
            'name' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'type' => 'required|string|in:degree,diploma,certificate,masters,phd',
            'duration_years' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'status' => 'sometimes|string|in:active,inactive',
        ];
    }
}