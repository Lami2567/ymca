<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\Role;
use App\Models\User;
use App\Models\Department;
use App\Models\Program;
use App\Models\AcademicYear;
use App\Models\Quarter;
use App\Models\CourseUnit;
use App\Models\GradeScale;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create default tenant
        $tenant = Tenant::create([
            'uuid' => \Illuminate\Support\Str::uuid(),
            'name' => 'YMCA University',
            'slug' => 'ymca',
            'status' => 'active',
            'settings' => [
                'institution_name' => 'YMCA University',
                'timezone' => 'UTC',
            ],
            'branding' => [
                'primary_color' => '#006666',
                'logo' => null,
            ],
        ]);

        // Create default roles
        $roles = [
            ['name' => 'super_admin', 'display_name' => 'Super Admin', 'permissions' => ['*'], 'is_system' => true],
            ['name' => 'admin', 'display_name' => 'Admin', 'permissions' => ['users.*', 'departments.*', 'programs.*', 'course_units.*', 'results.*', 'reports.*'], 'is_system' => true],
            ['name' => 'lecturer', 'display_name' => 'Lecturer', 'permissions' => ['results.own', 'assignments.own', 'grades.own'], 'is_system' => true],
            ['name' => 'student', 'display_name' => 'Student', 'permissions' => ['results.own', 'enrollments.own', 'grades.own'], 'is_system' => true],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }

        // Create super admin user
        $superAdminRole = Role::where('name', 'super_admin')->first();
        $admin = User::create([
            'uuid' => \Illuminate\Support\Str::uuid(),
            'tenant_id' => $tenant->id,
            'role_id' => $superAdminRole->id,
            'email' => 'admin@ymca.edu',
            'password' => bcrypt('password'),
            'first_name' => 'System',
            'last_name' => 'Administrator',
            'status' => 'active',
        ]);

        // Create grade scale
        $gradeScale = [
            ['min_score' => 70.00, 'max_score' => 100.00, 'grade' => 'A', 'grade_points' => 5.00, 'remarks' => 'Excellent'],
            ['min_score' => 60.00, 'max_score' => 69.99, 'grade' => 'B', 'grade_points' => 4.00, 'remarks' => 'Very Good'],
            ['min_score' => 50.00, 'max_score' => 59.99, 'grade' => 'C', 'grade_points' => 3.00, 'remarks' => 'Good'],
            ['min_score' => 40.00, 'max_score' => 49.99, 'grade' => 'D', 'grade_points' => 2.00, 'remarks' => 'Pass'],
            ['min_score' => 0.00, 'max_score' => 39.99, 'grade' => 'F', 'grade_points' => 0.00, 'remarks' => 'Fail'],
        ];

        foreach ($gradeScale as $grade) {
            GradeScale::create([
                'tenant_id' => $tenant->id,
                ...$grade,
                'is_active' => true,
            ]);
        }

        // Create sample department
        $department = Department::create([
            'tenant_id' => $tenant->id,
            'code' => 'CS',
            'name' => 'Computer Science',
            'description' => 'Department of Computer Science',
            'head_id' => $admin->id,
            'status' => 'active',
            'created_by' => $admin->id,
        ]);

        // Create sample program
        $program = Program::create([
            'tenant_id' => $tenant->id,
            'department_id' => $department->id,
            'code' => 'BIT',
            'name' => 'Bachelor of Information Technology',
            'type' => 'degree',
            'duration_years' => 4,
            'description' => 'Bachelor of Information Technology',
            'total_credit_units' => 0,
            'status' => 'active',
            'created_by' => $admin->id,
        ]);

        // Create academic year
        $academicYear = AcademicYear::create([
            'tenant_id' => $tenant->id,
            'name' => '2024-2025',
            'start_date' => '2024-09-01',
            'end_date' => '2025-08-31',
            'is_current' => true,
            'status' => 'active',
            'created_by' => $admin->id,
        ]);

        // Create quarters
        $quarters = [
            ['name' => 'Quarter 1', 'number' => 1, 'start_date' => '2024-09-01', 'end_date' => '2024-11-30'],
            ['name' => 'Quarter 2', 'number' => 2, 'start_date' => '2024-12-01', 'end_date' => '2025-02-28'],
            ['name' => 'Quarter 3', 'number' => 3, 'start_date' => '2025-03-01', 'end_date' => '2025-05-31'],
        ];

        foreach ($quarters as $quarter) {
            Quarter::create([
                'tenant_id' => $tenant->id,
                'academic_year_id' => $academicYear->id,
                ...$quarter,
                'is_current' => $quarter['number'] === 1,
                'status' => 'active',
                'created_by' => $admin->id,
            ]);
        }

        // Create sample course units
        $courseUnits = [
            ['code' => 'CS101', 'name' => 'Introduction to Computer Science', 'credit_units' => 3, 'year_of_study' => 1],
            ['code' => 'CS102', 'name' => 'Programming Fundamentals', 'credit_units' => 4, 'year_of_study' => 1],
            ['code' => 'CS201', 'name' => 'Data Structures', 'credit_units' => 4, 'year_of_study' => 2],
            ['code' => 'CS202', 'name' => 'Database Systems', 'credit_units' => 3, 'year_of_study' => 2],
        ];

        $quarter1 = Quarter::where('number', 1)->first();

        foreach ($courseUnits as $courseUnit) {
            CourseUnit::create([
                'tenant_id' => $tenant->id,
                'department_id' => $department->id,
                'program_id' => $program->id,
                'quarter_id' => $quarter1->id,
                ...$courseUnit,
                'status' => 'active',
                'created_by' => $admin->id,
            ]);
        }

        $this->command->info('Database seeded successfully!');
        $this->command->info('Default admin credentials: admin@ymca.edu / password');
    }
}
