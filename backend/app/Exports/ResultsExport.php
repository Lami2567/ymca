<?php

namespace App\Exports;

use App\Models\Result;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ResultsExport implements FromCollection, WithHeadings, WithStyles
{
    protected $results;

    public function __construct($results)
    {
        $this->results = $results;
    }

    public function collection()
    {
        return $this->results->map(function ($result) {
            return [
                $result->student->student_number,
                $result->student->user->full_name,
                $result->courseUnit->code,
                $result->courseUnit->name,
                $result->cw1_score ?? '-',
                $result->cw2_score ?? '-',
                $result->cw3_score ?? '-',
                $result->cw4_score ?? '-',
                $result->test_score ?? '-',
                $result->exam_score ?? '-',
                $result->total_score ?? '-',
                $result->grade ?? '-',
                $result->grade_points ?? '-',
                $result->quarter->name,
                $result->academicYear->name,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Student Number',
            'Student Name',
            'Course Code',
            'Course Name',
            'CW1',
            'CW2',
            'CW3',
            'CW4',
            'Test',
            'Exam',
            'Total',
            'Grade',
            'Grade Points',
            'Quarter',
            'Academic Year',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
