<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\AcademicYearController;
use App\Http\Controllers\QuarterController;
use App\Http\Controllers\CourseUnitController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\LecturerController;
use App\Http\Controllers\ResultController;
use App\Http\Controllers\AssessmentConfigurationController;
use App\Http\Controllers\AssessmentWindowController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\LecturerAssignmentController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\NotificationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Protected routes
    Route::middleware(['jwt'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

        // Admin routes
        Route::middleware(['role:admin'])->prefix('/admin')->group(function () {
            Route::apiResource('/departments', DepartmentController::class);
            Route::apiResource('/programs', ProgramController::class);
            Route::apiResource('/academic-years', AcademicYearController::class);
            Route::apiResource('/quarters', QuarterController::class);
            Route::apiResource('/course-units', CourseUnitController::class);
            Route::apiResource('/students', StudentController::class);
            Route::post('/lecturers/bulk', [LecturerController::class, 'bulk']);
            Route::apiResource('/lecturers', LecturerController::class);
            Route::apiResource('/lecturer-assignments', LecturerAssignmentController::class);
            Route::apiResource('/results', ResultController::class);
            Route::apiResource('/assessment-configurations', AssessmentConfigurationController::class);
            Route::apiResource('/assessment-windows', AssessmentWindowController::class);
            
            Route::post('/assessment-windows/{window}/unlock', [AssessmentWindowController::class, 'unlock']);
            Route::post('/assessment-windows/{window}/lock', [AssessmentWindowController::class, 'lock']);
            
            Route::post('/students/{student}/enroll', [EnrollmentController::class, 'enroll']);
            Route::delete('/students/{student}/enrollments/{enrollment}', [EnrollmentController::class, 'drop']);
            
            Route::post('/results/{result}/submit', [ResultController::class, 'submit']);
            Route::post('/results/{result}/review', [ResultController::class, 'review']);
            Route::post('/results/{result}/approve', [ResultController::class, 'approve']);
            Route::post('/results/{result}/publish', [ResultController::class, 'publish']);
            
            Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
            Route::get('/analytics/performance', [AnalyticsController::class, 'performance']);
            Route::get('/reports/performance', [ReportController::class, 'performance']);
            Route::get('/reports/export', [ReportController::class, 'exportResults']);
            Route::get('/reports/transcript/{student}', [ReportController::class, 'generateTranscript']);
        });

        // Lecturer routes
        Route::middleware(['role:lecturer'])->prefix('/lecturer')->group(function () {
            Route::get('/assignments', [LecturerController::class, 'assignments']);
            Route::get('/course-units/{courseUnit}/students', [LecturerController::class, 'courseStudents']);
            Route::post('/results/bulk', [ResultController::class, 'bulkStore']);
            Route::get('/results/course/{courseUnit}', [ResultController::class, 'byCourse']);
            Route::get('/assessment-configurations', [AssessmentConfigurationController::class, 'index']);
            Route::post('/assessment-configurations', [AssessmentConfigurationController::class, 'storeOrUpdate']);
        });

        // Student routes
        Route::middleware(['role:student'])->prefix('/student')->group(function () {
            Route::get('/enrollments', [StudentController::class, 'enrollments']);
            Route::post('/enrollments', [StudentController::class, 'registerCourses']);
            Route::get('/results', [StudentController::class, 'results']);
            Route::get('/transcript', [StudentController::class, 'transcript']);
            Route::get('/gpa', [StudentController::class, 'gpa']);
        });

        // Common routes
        Route::get('/departments', [DepartmentController::class, 'index']);
        Route::get('/programs', [ProgramController::class, 'index']);
        Route::get('/academic-years/current', [AcademicYearController::class, 'current']);
        Route::get('/quarters/current', [QuarterController::class, 'current']);
        Route::get('/course-units', [CourseUnitController::class, 'index']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    });
});
