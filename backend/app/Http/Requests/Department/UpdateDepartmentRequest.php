<?php

namespace App\Http\Requests\Department;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $department = $this->route('department');
        $departmentId = $department?->id ?? $department;

        return [
            'code' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('departments')
                    ->where(fn ($query) => $query->where('tenant_id', auth()->user()->tenant_id))
                    ->ignore($departmentId),
            ],
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'head_id' => 'nullable|exists:users,id',
            'status' => 'sometimes|string|in:active,inactive',
        ];
    }
}