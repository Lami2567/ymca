<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transcript - {{ $student->student_number }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #006666;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #006666;
            margin: 0;
            font-size: 24px;
        }
        .student-info {
            margin-bottom: 20px;
        }
        .student-info table {
            width: 100%;
            border-collapse: collapse;
        }
        .student-info td {
            padding: 5px;
            border-bottom: 1px solid #ddd;
        }
        .student-info td:first-child {
            font-weight: bold;
            width: 30%;
        }
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .results-table th,
        .results-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .results-table th {
            background-color: #006666;
            color: white;
            font-weight: bold;
        }
        .results-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .grade-A { color: #166534; font-weight: bold; }
        .grade-B { color: #006666; font-weight: bold; }
        .grade-C { color: #92400e; font-weight: bold; }
        .grade-D { color: #92400e; font-weight: bold; }
        .grade-F { color: #991b1b; font-weight: bold; }
        .summary {
            margin-top: 30px;
            padding: 20px;
            background-color: #f5f5f5;
            border-radius: 5px;
        }
        .summary h3 {
            margin-top: 0;
            color: #006666;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>YMCA University</h1>
        <h2>Official Academic Transcript</h2>
    </div>

    <div class="student-info">
        <table>
            <tr>
                <td>Student Number:</td>
                <td>{{ $student->student_number }}</td>
            </tr>
            <tr>
                <td>Student Name:</td>
                <td>{{ $student->user->full_name }}</td>
            </tr>
            <tr>
                <td>Program:</td>
                <td>{{ $student->program->name }} ({{ $student->program->code }})</td>
            </tr>
            <tr>
                <td>Department:</td>
                <td>{{ $student->program->department->name }}</td>
            </tr>
            <tr>
                <td>Admission Date:</td>
                <td>{{ \Carbon\Carbon::parse($student->admission_date)->format('F d, Y') }}</td>
            </tr>
        </table>
    </div>

    <table class="results-table">
        <thead>
            <tr>
                <th>Academic Year</th>
                <th>Quarter</th>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Credit Units</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Grade Points</th>
            </tr>
        </thead>
        <tbody>
            @foreach($results as $result)
                <tr>
                    <td>{{ $result->academicYear->name }}</td>
                    <td>{{ $result->quarter->name }}</td>
                    <td>{{ $result->courseUnit->code }}</td>
                    <td>{{ $result->courseUnit->name }}</td>
                    <td>{{ $result->courseUnit->credit_units }}</td>
                    <td>{{ number_format($result->total_score, 2) }}</td>
                    <td class="grade-{{ $result->grade }}">{{ $result->grade }}</td>
                    <td>{{ $result->grade_points }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="summary">
        <h3>Academic Summary</h3>
        <table>
            <tr>
                <td>Total Courses Completed:</td>
                <td>{{ $results->count() }}</td>
            </tr>
            <tr>
                <td>Cumulative GPA:</td>
                <td><strong>{{ number_format($gpa, 2) }}</strong></td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>This transcript is generated automatically by the YMCA Academic ERP System.</p>
        <p>Generated on: {{ \Carbon\Carbon::now()->format('F d, Y g:i A') }}</p>
    </div>
</body>
</html>
