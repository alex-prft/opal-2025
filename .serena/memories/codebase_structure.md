# Codebase Structure

## Directory Layout

```
my-nextjs-app/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── api/               # Backend API endpoints
│   │   │   ├── admin/         # Admin monitoring endpoints
│   │   │   ├── opal/          # OPAL integration endpoints
│   │   │   ├── phase1/        # Phase 1 implementation APIs
│   │   │   ├── phase2/        # Phase 2 implementation APIs
│   │   │   └── phase3/        # Phase 3 implementation APIs
│   │   └── engine/            # Core business logic engines
│   ├── components/            # React UI components
│   │   ├── ui/               # Base UI components (Radix-based)
│   │   ├── opal/             # OPAL-specific components
│   │   └── widgets/          # Specialized dashboard widgets
│   ├── lib/                  # Core utilities and services
│   │   ├── opal/             # OPAL integration utilities
│   │   ├── database/         # Database interaction layers
│   │   ├── security/         # Authentication and security
│   │   ├── validation/       # Data validation systems
│   │   ├── orchestration/    # Workflow management
│   │   ├── analytics/        # Analytics and tracking
│   │   ├── cache/            # Intelligent caching systems
│   │   ├── ml/               # Machine learning utilities
│   │   └── recommendations/  # Recommendation engines
│   └── types/                # TypeScript type definitions
├── opal-config/              # OPAL configuration
│   ├── opal-agents/         # JSON configurations for agents
│   ├── opal-mapping/        # Mapping configurations
│   └── opal-tools/          # Tool configurations
├── tests/                   # Test suites
├── scripts/                 # Utility scripts
└── supabase/               # Database migrations and schemas
```

## Key Files for Understanding
- `src/lib/simple-opal-data-service.ts` - Core OPAL integration service
- `src/lib/types/database.ts` - Database type definitions
- `src/components/opal/ContentRenderer.tsx` - OPAL content rendering
- `src/components/widgets/WidgetRenderer.tsx` - Widget system architecture
- `opal-config/opal-agents/` - OPAL agent configurations
- `src/lib/orchestration/` - Workflow management systems