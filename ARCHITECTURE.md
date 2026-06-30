# YMCA Academic ERP - System Architecture

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI primitives)
- **Data Grid**: AG Grid Enterprise
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Auth**: JWT with localStorage

### Backend
- **Framework**: Laravel 11 (PHP 8.2+)
- **API**: RESTful API
- **Auth**: JWT (sanctum/jwt)
- **Database**: PostgreSQL 15+
- **ORM**: Eloquent
- **File Processing**: Laravel Excel (PhpSpreadsheet)
- **PDF Generation**: DomPDF
- **Queue**: Redis + Laravel Horizon
- **Cache**: Redis

### Infrastructure
- **Web Server**: Nginx
- **PHP Handler**: PHP-FPM
- **Process Manager**: Supervisor
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt

## Architecture Pattern

### Monolithic with Service Layer
```
┌─────────────────────────────────────────┐
│         Next.js Frontend                │
│  (Static + Server Components)           │
└──────────────┬──────────────────────────┘
               │ HTTPS
               │
┌──────────────▼──────────────────────────┐
│         Nginx Reverse Proxy             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Laravel API (PHP-FPM)            │
│  ┌─────────────────────────────────┐   │
│  │  Controllers                     │   │
│  │  Services (Business Logic)      │   │
│  │  Repositories (Data Access)     │   │
│  │  Middleware (Auth, RBAC)         │   │
│  │  Events & Listeners              │   │
│  │  Jobs (Queue)                    │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         PostgreSQL Database             │
└─────────────────────────────────────────┘
```

## Multi-Tenancy Strategy

### Tenant Isolation
- **Database-level isolation**: Each tenant has separate schema
- **Tenant identification**: Subdomain or custom domain
- **Tenant context**: Middleware injects tenant_id into requests

### Tenant Table Structure
```sql
tenants
├── id
├── name
├── slug (subdomain)
├── domain
├── settings (JSON)
├── branding (JSON)
├── status
└── timestamps
```

## Security Architecture

### Authentication Flow
1. User submits credentials
2. Server validates against database
3. Server generates JWT access token (15min expiry)
4. Server generates refresh token (7day expiry)
5. Client stores tokens in httpOnly cookies
6. Client includes access token in Authorization header
7. Server validates token on each request
8. Refresh token used to get new access token

### Authorization (RBAC)
- **Roles**: Super Admin, Admin, Lecturer, Student
- **Permissions**: Granular permissions per module
- **Middleware**: Role-based route protection
- **Policies**: Laravel authorization policies

### Security Measures
- CSRF protection (stateless for API)
- Rate limiting (Redis)
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- Password hashing (bcrypt)
- API request signing (optional)
- IP whitelisting (optional)

## Database Design Principles

### Normalization
- Third Normal Form (3NF)
- Proper foreign key relationships
- Indexed columns for performance

### Audit Trail
- created_at, updated_at on all tables
- created_by, updated_by tracking
- Soft deletes (deleted_at)
- Separate audit_logs table for critical changes

### Performance
- Composite indexes on frequently queried columns
- Partitioning for large tables (results, enrollments)
- Connection pooling
- Query caching (Redis)

## API Design

### RESTful Conventions
```
GET    /api/v1/resource          - List
GET    /api/v1/resource/{id}     - Show
POST   /api/v1/resource          - Create
PUT    /api/v1/resource/{id}     - Update
DELETE /api/v1/resource/{id}     - Delete
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid",
    "details": { ... }
  }
}
```

## Frontend Architecture

### Directory Structure
```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── admin/
│   ├── lecturer/
│   └── student/
├── api/
├── components/
│   ├── ui/ (shadcn)
│   ├── dashboard/
│   ├── forms/
│   └── tables/
├── lib/
│   ├── api/
│   ├── hooks/
│   ├── utils/
│   └── stores/
├── types/
└── middleware.ts
```

### Component Hierarchy
```
Layout
├── Sidebar
├── Header
│   ├── UserMenu
│   └── Notifications
└── PageContent
    ├── DataCard
    ├── DataTable (AG Grid)
    ├── Form
    └── Chart
```

### State Management
- **Global state**: Zustand stores (auth, theme, notifications)
- **Server state**: React Query (SWR) for API caching
- **Form state**: React Hook Form
- **UI state**: React useState/useReducer

## Performance Optimization

### Frontend
- Code splitting (dynamic imports)
- Image optimization (Next.js Image)
- Lazy loading components
- Virtual scrolling (AG Grid)
- Memoization (React.memo, useMemo)
- Bundle size optimization

### Backend
- Query optimization (eager loading, indexes)
- Caching (Redis)
- Queue heavy operations (Excel export, PDF generation)
- Compression (gzip)
- CDN for static assets

## Scalability Strategy

### Horizontal Scaling
- Stateless API servers
- Load balancer (Nginx)
- Database read replicas
- Redis cluster for cache

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement connection pooling

## Deployment Architecture

### Development
- Local environment with Docker Compose
- Hot reload for frontend
- Laravel Sail for backend

### Staging
- Single server deployment
- Automated testing
- Feature flags

### Production
- Multi-server setup
- Load balancer
- Database cluster
- CDN
- Monitoring (Sentry, New Relic)
- Log aggregation (ELK stack)

## Monitoring & Logging

### Application Logs
- Laravel Log channels
- Structured logging (JSON)
- Log levels: debug, info, warning, error, critical

### Error Tracking
- Sentry integration
- Stack traces
- User context

### Performance Monitoring
- API response times
- Database query times
- Memory usage
- Request throughput

## Backup Strategy

### Database Backups
- Daily full backups
- Hourly incremental backups
- 30-day retention
- Off-site storage

### File Backups
- Student uploads
- Generated documents
- Versioned backups

## Development Workflow

### Git Flow
- main (production)
- develop (staging)
- feature/* (branches)
- hotfix/* (urgent fixes)

### CI/CD Pipeline
- Automated tests on push
- Code quality checks (PHP CS, ESLint)
- Automated deployment to staging
- Manual approval for production

## Testing Strategy

### Backend Testing
- Unit tests (PHPUnit)
- Feature tests (API endpoints)
- Integration tests (database)
- E2E tests (critical flows)

### Frontend Testing
- Unit tests (Jest)
- Component tests (React Testing Library)
- E2E tests (Playwright)

## Documentation

### API Documentation
- OpenAPI/Swagger specification
- Auto-generated from Laravel annotations
- Interactive API explorer

### Code Documentation
- PHPDoc for backend
- JSDoc for frontend
- Inline comments for complex logic

### User Documentation
- Admin guide
- Lecturer guide
- Student guide
- Video tutorials
