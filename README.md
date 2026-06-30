# YMCA Academic ERP

A production-ready university-grade academic management and results system for YMCA University.

## Features

- **Multi-tenant SaaS Architecture**: Support for multiple institutions
- **Role-based Access Control**: Super Admin, Admin, Lecturer, Student roles
- **Academic Structure**: Departments, Programs, Academic Years, Quarters
- **Course Unit Management**: Full CRUD with program/year/quarter organization
- **Student Enrollment**: Course registration per quarter
- **Lecturer Assignments**: Assign course units to lecturers
- **Results Management**: Spreadsheet-style data entry with AG Grid
- **Assessment Structure**: Configurable coursework, tests, exams with weights
- **Assessment Locking**: Time-based windows for result entry
- **Results Workflow**: Draft → Submitted → Under Review → Approved → Published
- **Analytics Dashboard**: Performance metrics and statistics
- **Grade Calculation**: Automatic grade and GPA calculation
- **Export/Import**: Excel and CSV support
- **PDF Generation**: Transcript generation
- **Audit Logging**: Track all system changes
- **Notifications**: In-app notification system

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS, shadcn/ui
- **Data Grid**: AG Grid Enterprise
- **Charts**: Recharts
- **State**: Zustand
- **Forms**: React Hook Form + Zod

### Backend
- **Framework**: Laravel 11 (PHP 8.2+)
- **API**: RESTful API
- **Auth**: JWT (firebase/php-jwt)
- **Database**: PostgreSQL 15+
- **Queue**: Redis + Laravel Horizon
- **Excel**: Laravel Excel (PhpSpreadsheet)
- **PDF**: DomPDF

## Installation

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- PostgreSQL 15+
- Redis

### Backend Setup

```bash
cd backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=ymca_academic_erp
# DB_USERNAME=postgres
# DB_PASSWORD=your_password

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Start development server
php artisan serve
```

Backend will be available at `http://localhost:8000`

On Windows Command Prompt, use `cd /d C:\xampp\htdocs\YMCA\backend` to jump to the backend folder and `copy .env.example .env` instead of `cp .env.example .env`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Configure API URL in .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Default Credentials

After seeding the database:

- **Email**: admin@ymca.edu
- **Password**: password

## Project Structure

### Backend
```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/      # API controllers
│   │   ├── Middleware/        # JWT, RBAC middleware
│   │   └── Requests/          # Form validation
│   ├── Models/                # Eloquent models
│   ├── Services/              # Business logic (JWT, etc.)
│   └── ...
├── database/
│   ├── migrations/           # Database migrations
│   └── seeders/              # Database seeders
├── routes/
│   └── api.php               # API routes
└── ...
```

### Frontend
```
frontend/
├── src/
│   ├── app/                  # Next.js app router pages
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   └── tables/          # AG Grid table components
│   ├── lib/
│   │   ├── api.ts           # Axios client
│   │   ├── auth.ts          # Auth store (Zustand)
│   │   └── utils.ts         # Utility functions
│   └── ...
└── ...
```

## API Documentation

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Departments
- `GET /api/v1/departments` - List departments
- `POST /api/v1/departments` - Create department
- `GET /api/v1/departments/{id}` - Get department
- `PUT /api/v1/departments/{id}` - Update department
- `DELETE /api/v1/departments/{id}` - Delete department

### Programs
- `GET /api/v1/programs` - List programs
- `POST /api/v1/programs` - Create program
- `GET /api/v1/programs/{id}` - Get program
- `PUT /api/v1/programs/{id}` - Update program
- `DELETE /api/v1/programs/{id}` - Delete program

### Academic Years & Quarters
- `GET /api/v1/academic-years` - List academic years
- `POST /api/v1/academic-years` - Create academic year
- `GET /api/v1/quarters` - List quarters
- `POST /api/v1/quarters` - Create quarter
- `GET /api/v1/academic-years/current` - Get current academic year
- `GET /api/v1/quarters/current` - Get current quarter

### Course Units
- `GET /api/v1/course-units` - List course units
- `POST /api/v1/course-units` - Create course unit
- `GET /api/v1/course-units/{id}` - Get course unit
- `PUT /api/v1/course-units/{id}` - Update course unit
- `DELETE /api/v1/course-units/{id}` - Delete course unit

### Students
- `GET /api/v1/students` - List students
- `POST /api/v1/students` - Create student
- `GET /api/v1/students/{id}` - Get student
- `PUT /api/v1/students/{id}` - Update student
- `DELETE /api/v1/students/{id}` - Delete student

### Lecturers
- `GET /api/v1/lecturers` - List lecturers
- `POST /api/v1/lecturers` - Create lecturer
- `GET /api/v1/lecturers/{id}` - Get lecturer
- `PUT /api/v1/lecturers/{id}` - Update lecturer
- `DELETE /api/v1/lecturers/{id}` - Delete lecturer

### Lecturer Assignments
- `GET /api/v1/lecturer-assignments` - List assignments
- `POST /api/v1/lecturer-assignments` - Create assignment
- `GET /api/v1/lecturer-assignments/{id}` - Get assignment
- `PUT /api/v1/lecturer-assignments/{id}` - Update assignment
- `DELETE /api/v1/lecturer-assignments/{id}` - Delete assignment

### Results
- `GET /api/v1/results` - List results
- `POST /api/v1/results` - Create result
- `POST /api/v1/results/bulk` - Bulk create/update results
- `GET /api/v1/results/{id}` - Get result
- `PUT /api/v1/results/{id}` - Update result
- `POST /api/v1/results/{id}/submit` - Submit for review
- `POST /api/v1/results/{id}/review` - Mark as under review
- `POST /api/v1/results/{id}/approve` - Approve result
- `POST /api/v1/results/{id}/publish` - Publish result
- `DELETE /api/v1/results/{id}` - Delete result

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard statistics
- `GET /api/v1/reports/performance` - Performance reports

### Notifications
- `GET /api/v1/notifications` - List notifications
- `POST /api/v1/notifications/{id}/read` - Mark as read
- `POST /api/v1/notifications/mark-all-read` - Mark all as read

## Development

### Running Tests

```bash
# Backend tests
cd backend
php artisan test

# Frontend tests
cd frontend
npm test
```

### Code Style

```bash
# Backend
cd backend
./vendor/bin/pint

# Frontend
cd frontend
npm run lint
```

## Deployment

### Production Checklist

1. Set `APP_ENV=production` in `.env`
2. Set `APP_DEBUG=false`
3. Configure production database
4. Configure Redis for cache/queue
5. Set up SSL certificates
6. Configure CORS for production domain
7. Run `php artisan config:cache`
8. Run `php artisan route:cache`
9. Run `npm run build` for frontend
10. Set up supervisor for queue workers
11. Configure Laravel Horizon for queue monitoring

### Docker Deployment

```bash
# Build and start containers
docker-compose up -d

# Run migrations
docker-compose exec backend php artisan migrate

# Seed database
docker-compose exec backend php artisan db:seed
```

## Security

- JWT-based authentication
- Role-based access control
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- CSRF protection
- Rate limiting
- Encrypted passwords (bcrypt)
- Audit logging for sensitive operations

## License

Proprietary - YMCA University

## Support

For support, contact the IT department at YMCA University.
