# YMCA Academic ERP - Database Schema

## ER Diagram Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   tenants   │────▶│   users     │────▶│   roles     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ departments │────▶│  programs   │
└─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  students   │     │ course_units│
└─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ enrollments │     │ assignments │
└─────────────┘     └─────────────┘
                           │
                           │
                           ▼
                  ┌─────────────┐
                  │   results   │
                  └─────────────┘
```

## Core Tables

### 1. tenants
Multi-tenancy support for multiple institutions.

```sql
CREATE TABLE tenants (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    settings JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    logo_path VARCHAR(500),
    status ENUM('active', 'suspended', 'trial') DEFAULT 'active',
    trial_ends_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
```

### 2. users
System users with role-based access.

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES roles(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_path VARCHAR(500),
    email_verified_at TIMESTAMP NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login_at TIMESTAMP NULL,
    last_login_ip VARCHAR(45),
    remember_token VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### 3. roles
User roles and permissions.

```sql
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_name ON roles(name);
```

### 4. departments
Academic departments.

```sql
CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    head_id BIGINT REFERENCES users(id),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_departments_tenant ON departments(tenant_id);
CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_status ON departments(status);
```

### 5. programs
Academic programs (degrees, diplomas).

```sql
CREATE TABLE programs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    department_id BIGINT REFERENCES departments(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('degree', 'diploma', 'certificate', 'masters', 'phd') NOT NULL,
    duration_years INTEGER NOT NULL,
    description TEXT,
    total_credit_units INTEGER DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_programs_tenant ON programs(tenant_id);
CREATE INDEX idx_programs_department ON programs(department_id);
CREATE INDEX idx_programs_code ON programs(code);
CREATE INDEX idx_programs_status ON programs(status);
```

### 6. academic_years
Academic calendar years.

```sql
CREATE TABLE academic_years (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP NULL,
    CONSTRAINT chk_academic_year_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_academic_years_tenant ON academic_years(tenant_id);
CREATE INDEX idx_academic_years_name ON academic_years(name);
CREATE INDEX idx_academic_years_current ON academic_years(is_current);
```

### 7. quarters
Academic quarters (Q1, Q2, Q3).

```sql
CREATE TABLE quarters (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id BIGINT REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(20) NOT NULL,
    number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 3),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP NULL,
    CONSTRAINT chk_quarter_dates CHECK (end_date > start_date),
    CONSTRAINT unique_quarter_per_year UNIQUE(academic_year_id, number)
);

CREATE INDEX idx_quarters_tenant ON quarters(tenant_id);
CREATE INDEX idx_quarters_academic_year ON quarters(academic_year_id);
CREATE INDEX idx_quarters_current ON quarters(is_current);
```

### 8. course_units
Individual course units.

```sql
CREATE TABLE course_units (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    department_id BIGINT REFERENCES departments(id) ON DELETE CASCADE,
    program_id BIGINT REFERENCES programs(id) ON DELETE CASCADE,
    year_of_study INTEGER NOT NULL CHECK (year_of_study > 0),
    quarter_id BIGINT REFERENCES quarters(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    credit_units INTEGER NOT NULL CHECK (credit_units > 0),
    description TEXT,
    prerequisites TEXT[],
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP NULL,
    CONSTRAINT unique_course_unit UNIQUE(tenant_id, code)
);

CREATE INDEX idx_course_units_tenant ON course_units(tenant_id);
CREATE INDEX idx_course_units_department ON course_units(department_id);
CREATE INDEX idx_course_units_program ON course_units(program_id);
CREATE INDEX idx_course_units_quarter ON course_units(quarter_id);
CREATE INDEX idx_course_units_code ON course_units(code);
CREATE INDEX idx_course_units_program_year_quarter ON course_units(program_id, year_of_study, quarter_id);
```

### 9. students
Student profiles.

```sql
CREATE TABLE students (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    program_id BIGINT REFERENCES programs(id),
    student_number VARCHAR(20) UNIQUE NOT NULL,
    admission_date DATE NOT NULL,
    current_year_of_study INTEGER DEFAULT 1,
    expected_graduation_date DATE,
    status ENUM('active', 'graduated', 'suspended', 'withdrawn') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_students_tenant ON students(tenant_id);
CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_program ON students(program_id);
CREATE INDEX idx_students_number ON students(student_number);
CREATE INDEX idx_students_status ON students(status);
```

### 10. lecturers
Lecturer profiles.

```sql
CREATE TABLE lecturers (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    department_id BIGINT REFERENCES departments(id),
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    title ENUM('mr', 'mrs', 'ms', 'dr', 'prof') DEFAULT 'mr',
    specialization VARCHAR(255),
    qualification VARCHAR(255),
    hire_date DATE NOT NULL,
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_lecturers_tenant ON lecturers(tenant_id);
CREATE INDEX idx_lecturers_user ON lecturers(user_id);
CREATE INDEX idx_lecturers_department ON lecturers(department_id);
CREATE INDEX idx_lecturers_number ON lecturers(employee_number);
CREATE INDEX idx_lecturers_status ON lecturers(status);
```

### 11. lecturer_assignments
Course unit assignments to lecturers.

```sql
CREATE TABLE lecturer_assignments (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    lecturer_id BIGINT REFERENCES lecturers(id) ON DELETE CASCADE,
    course_unit_id BIGINT REFERENCES course_units(id) ON DELETE CASCADE,
    quarter_id BIGINT REFERENCES quarters(id) ON DELETE CASCADE,
    academic_year_id BIGINT REFERENCES academic_years(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT REFERENCES users(id),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT unique_assignment UNIQUE(lecturer_id, course_unit_id, quarter_id, academic_year_id)
);

CREATE INDEX idx_assignments_tenant ON lecturer_assignments(tenant_id);
CREATE INDEX idx_assignments_lecturer ON lecturer_assignments(lecturer_id);
CREATE INDEX idx_assignments_course ON lecturer_assignments(course_unit_id);
CREATE INDEX idx_assignments_quarter ON lecturer_assignments(quarter_id);
CREATE INDEX idx_assignments_academic_year ON lecturer_assignments(academic_year_id);
```

### 12. enrollments
Student course enrollments.

```sql
CREATE TABLE enrollments (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    course_unit_id BIGINT REFERENCES course_units(id) ON DELETE CASCADE,
    quarter_id BIGINT REFERENCES quarters(id) ON DELETE CASCADE,
    academic_year_id BIGINT REFERENCES academic_years(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enrolled_by BIGINT REFERENCES users(id),
    status ENUM('registered', 'dropped', 'completed', 'failed') DEFAULT 'registered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT unique_enrollment UNIQUE(student_id, course_unit_id, quarter_id, academic_year_id)
);

CREATE INDEX idx_enrollments_tenant ON enrollments(tenant_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_unit_id);
CREATE INDEX idx_enrollments_quarter ON enrollments(quarter_id);
CREATE INDEX idx_enrollments_academic_year ON enrollments(academic_year_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
```

### 13. assessment_configurations
Assessment structure configuration.

```sql
CREATE TABLE assessment_configurations (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    course_unit_id BIGINT REFERENCES course_units(id) ON DELETE CASCADE,
    quarter_id BIGINT REFERENCES quarters(id) ON DELETE CASCADE,
    academic_year_id BIGINT REFERENCES academic_years(id) ON DELETE CASCADE,
    cw1_weight DECIMAL(5,2) DEFAULT 0.00,
    cw2_weight DECIMAL(5,2) DEFAULT 0.00,
    cw3_weight DECIMAL(5,2) DEFAULT 0.00,
    cw4_weight DECIMAL(5,2) DEFAULT 0.00,
    test_weight DECIMAL(5,2) DEFAULT 0.00,
    exam_weight DECIMAL(5,2) DEFAULT 0.00,
    total_weight DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP NULL,
    CONSTRAINT unique_assessment_config UNIQUE(course_unit_id, quarter_id, academic_year_id),
    CONSTRAINT chk_weight_total CHECK (total_weight = 100.00)
);

CREATE INDEX idx_assessment_config_tenant ON assessment_configurations(tenant_id);
CREATE INDEX idx_assessment_config_course ON assessment_configurations(course_unit_id);
```

### 14. assessment_windows
Assessment opening/closing windows.

```sql
CREATE TABLE assessment_windows (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    course_unit_id BIGINT REFERENCES course_units(id) ON DELETE CASCADE,
    quarter_id BIGINT REFERENCES quarters(id) ON DELETE CASCADE,
    academic_year_id BIGINT REFERENCES academic_years(id) ON DELETE CASCADE,
    assessment_type ENUM('cw1', 'cw2', 'cw3', 'cw4', 'test', 'exam') NOT NULL,
    open_time TIMESTAMP NOT NULL,
    close_time TIMESTAMP NOT NULL,
    is_locked BOOLEAN DEFAULT TRUE,
    override_by BIGINT REFERENCES users(id),
    override_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP NULL,
    CONSTRAINT chk_window_times CHECK (close_time > open_time)
);

CREATE INDEX idx_assessment_windows_tenant ON assessment_windows(tenant_id);
CREATE INDEX idx_assessment_windows_course ON assessment_windows(course_unit_id);
CREATE INDEX idx_assessment_windows_type ON assessment_windows(assessment_type);
```

### 15. results
Student assessment results.

```sql
CREATE TABLE results (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    enrollment_id BIGINT REFERENCES enrollments(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    course_unit_id BIGINT REFERENCES course_units(id) ON DELETE CASCADE,
    quarter_id BIGINT REFERENCES quarters(id) ON DELETE CASCADE,
    academic_year_id BIGINT REFERENCES academic_years(id) ON DELETE CASCADE,
    cw1_score DECIMAL(5,2) NULL,
    cw2_score DECIMAL(5,2) NULL,
    cw3_score DECIMAL(5,2) NULL,
    cw4_score DECIMAL(5,2) NULL,
    test_score DECIMAL(5,2) NULL,
    exam_score DECIMAL(5,2) NULL,
    total_score DECIMAL(5,2) NULL,
    grade VARCHAR(2) NULL,
    grade_points DECIMAL(3,2) NULL,
    status ENUM('draft', 'submitted', 'under_review', 'approved', 'published') DEFAULT 'draft',
    submitted_at TIMESTAMP NULL,
    submitted_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMP NULL,
    reviewed_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP NULL,
    approved_by BIGINT REFERENCES users(id),
    published_at TIMESTAMP NULL,
    published_by BIGINT REFERENCES users(id),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP NULL,
    CONSTRAINT unique_result UNIQUE(enrollment_id),
    CONSTRAINT chk_score_range CHECK (
        (cw1_score IS NULL OR (cw1_score >= 0 AND cw1_score <= 100)) AND
        (cw2_score IS NULL OR (cw2_score >= 0 AND cw2_score <= 100)) AND
        (cw3_score IS NULL OR (cw3_score >= 0 AND cw3_score <= 100)) AND
        (cw4_score IS NULL OR (cw4_score >= 0 AND cw4_score <= 100)) AND
        (test_score IS NULL OR (test_score >= 0 AND test_score <= 100)) AND
        (exam_score IS NULL OR (exam_score >= 0 AND exam_score <= 100)) AND
        (total_score IS NULL OR (total_score >= 0 AND total_score <= 100))
    )
);

CREATE INDEX idx_results_tenant ON results(tenant_id);
CREATE INDEX idx_results_enrollment ON results(enrollment_id);
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_results_course ON results(course_unit_id);
CREATE INDEX idx_results_quarter ON results(quarter_id);
CREATE INDEX idx_results_academic_year ON results(academic_year_id);
CREATE INDEX idx_results_status ON results(status);
CREATE INDEX idx_results_student_quarter ON results(student_id, quarter_id, academic_year_id);
```

### 16. grade_scales
Grade point scale configuration.

```sql
CREATE TABLE grade_scales (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    min_score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    grade VARCHAR(2) NOT NULL,
    grade_points DECIMAL(3,2) NOT NULL,
    remarks VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP NULL,
    CONSTRAINT chk_score_range CHECK (max_score > min_score)
);

CREATE INDEX idx_grade_scales_tenant ON grade_scales(tenant_id);
CREATE INDEX idx_grade_scales_active ON grade_scales(is_active);
```

### 17. audit_logs
System audit trail.

```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

### 18. notifications
User notifications.

```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

### 19. settings
System-wide settings.

```sql
CREATE TABLE settings (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_setting UNIQUE(tenant_id, key)
);

CREATE INDEX idx_settings_tenant ON settings(tenant_id);
CREATE INDEX idx_settings_key ON settings(key);
```

### 20. password_reset_tokens
Password reset functionality.

```sql
CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_email ON password_reset_tokens(email);
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
```

## Views

### v_student_results
View for student results with computed totals.

```sql
CREATE VIEW v_student_results AS
SELECT 
    r.id,
    r.tenant_id,
    r.student_id,
    s.student_number,
    u.first_name,
    u.last_name,
    r.course_unit_id,
    cu.code AS course_code,
    cu.name AS course_name,
    cu.credit_units,
    r.quarter_id,
    q.name AS quarter_name,
    r.academic_year_id,
    ay.name AS academic_year,
    r.cw1_score,
    r.cw2_score,
    r.cw3_score,
    r.cw4_score,
    r.test_score,
    r.exam_score,
    r.total_score,
    r.grade,
    r.grade_points,
    r.status,
    r.published_at
FROM results r
JOIN students s ON r.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN course_units cu ON r.course_unit_id = cu.id
JOIN quarters q ON r.quarter_id = q.id
JOIN academic_years ay ON r.academic_year_id = ay.id;
```

### v_lecturer_assignments
View for lecturer assignments with course details.

```sql
CREATE VIEW v_lecturer_assignments AS
SELECT 
    la.id,
    la.tenant_id,
    la.lecturer_id,
    l.employee_number,
    u.first_name,
    u.last_name,
    la.course_unit_id,
    cu.code AS course_code,
    cu.name AS course_name,
    cu.credit_units,
    la.quarter_id,
    q.name AS quarter_name,
    la.academic_year_id,
    ay.name AS academic_year,
    la.status
FROM lecturer_assignments la
JOIN lecturers l ON la.lecturer_id = l.id
JOIN users u ON l.user_id = u.id
JOIN course_units cu ON la.course_unit_id = cu.id
JOIN quarters q ON la.quarter_id = q.id
JOIN academic_years ay ON la.academic_year_id = ay.id;
```

## Stored Functions

### fn_calculate_total_score
Calculate total score based on assessment weights.

```sql
CREATE OR REPLACE FUNCTION fn_calculate_total_score(
    p_cw1_score DECIMAL,
    p_cw2_score DECIMAL,
    p_cw3_score DECIMAL,
    p_cw4_score DECIMAL,
    p_test_score DECIMAL,
    p_exam_score DECIMAL,
    p_cw1_weight DECIMAL,
    p_cw2_weight DECIMAL,
    p_cw3_weight DECIMAL,
    p_cw4_weight DECIMAL,
    p_test_weight DECIMAL,
    p_exam_weight DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN COALESCE(p_cw1_score, 0) * (p_cw1_weight / 100) +
           COALESCE(p_cw2_score, 0) * (p_cw2_weight / 100) +
           COALESCE(p_cw3_score, 0) * (p_cw3_weight / 100) +
           COALESCE(p_cw4_score, 0) * (p_cw4_weight / 100) +
           COALESCE(p_test_score, 0) * (p_test_weight / 100) +
           COALESCE(p_exam_score, 0) * (p_exam_weight / 100);
END;
$$ LANGUAGE plpgsql;
```

### fn_calculate_grade
Calculate grade based on total score.

```sql
CREATE OR REPLACE FUNCTION fn_calculate_grade(
    p_total_score DECIMAL,
    p_tenant_id BIGINT
) RETURNS VARCHAR AS $$
DECLARE
    v_grade VARCHAR(2);
BEGIN
    SELECT grade INTO v_grade
    FROM grade_scales
    WHERE tenant_id = p_tenant_id
    AND is_active = TRUE
    AND p_total_score >= min_score
    AND p_total_score <= max_score
    ORDER BY min_score DESC
    LIMIT 1;
    
    RETURN COALESCE(v_grade, 'F');
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### trg_update_timestamp
Auto-update updated_at timestamp.

```sql
CREATE OR REPLACE FUNCTION trg_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Apply to all tables:
```sql
CREATE TRIGGER trg_users_update BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trg_update_timestamp();

CREATE TRIGGER trg_departments_update BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION trg_update_timestamp();

-- Apply to all other tables similarly
```

## Initial Data

### Default Roles
```sql
INSERT INTO roles (name, display_name, description, permissions, is_system) VALUES
('super_admin', 'Super Admin', 'Full system access', '["*"]', true),
('admin', 'Admin', 'Administrative access', '["users.*", "departments.*", "programs.*", "course_units.*", "results.*", "reports.*"]', true),
('lecturer', 'Lecturer', 'Lecturer access', '["results.own", "assignments.own", "grades.own"]', true),
('student', 'Student', 'Student access', '["results.own", "enrollments.own", "grades.own"]', true);
```

### Default Grade Scale
```sql
INSERT INTO grade_scales (tenant_id, min_score, max_score, grade, grade_points, remarks) VALUES
(1, 70.00, 100.00, 'A', 5.00, 'Excellent'),
(1, 60.00, 69.99, 'B', 4.00, 'Very Good'),
(1, 50.00, 59.99, 'C', 3.00, 'Good'),
(1, 40.00, 49.99, 'D', 2.00, 'Pass'),
(1, 0.00, 39.99, 'F', 0.00, 'Fail');
```

## Performance Considerations

### Partitioning Strategy
For large tables, consider partitioning by:
- **results**: Partition by academic_year_id
- **enrollments**: Partition by academic_year_id
- **audit_logs**: Partition by created_at (monthly)

### Indexing Strategy
- All foreign keys indexed
- Frequently queried columns indexed
- Composite indexes for common query patterns
- Partial indexes for filtered queries

### Connection Pooling
Configure PostgreSQL connection pool:
- Max connections: 100
- Reserved for superuser: 3
- Per application: 20-30 connections
