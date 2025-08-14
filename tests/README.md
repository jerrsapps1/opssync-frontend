# StaffTrak MVP Optional Addons - Test Suite

Comprehensive test suite for the MVP Optional Addons bundle including Analytics, Branding, and Billing modules.

## Test Structure

```
tests/
├── api/                          # API endpoint tests
│   ├── analytics.test.ts         # Analytics API tests
│   ├── branding.test.ts          # Branding API tests  
│   └── billing.test.ts           # Billing API tests
├── components/                   # React component tests
│   ├── AdvancedAnalytics.test.tsx
│   └── BillingSettings.test.tsx
├── integration/                  # Full system integration tests
│   └── mvp-addons.test.ts
└── setup/                        # Test configuration
    ├── jest.config.js
    ├── setupTests.ts
    └── README.md
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Categories
```bash
# API tests only
npm run test:api

# Component tests only  
npm run test:components

# Integration tests only
npm run test:integration

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

## Test Categories

### 1. API Tests (`tests/api/`)

**Analytics API Tests** (`analytics.test.ts`)
- ✅ Analytics overview endpoint functionality
- ✅ Time period filtering and validation
- ✅ Data accuracy and calculations
- ✅ Performance under load
- ✅ Error handling and recovery

**Branding API Tests** (`branding.test.ts`)
- ✅ Configuration CRUD operations
- ✅ Logo upload with presigned URLs
- ✅ CSS generation from configs
- ✅ Multi-tenant data isolation
- ✅ Input validation and sanitization

**Billing API Tests** (`billing.test.ts`)
- ✅ Stripe integration mocking
- ✅ Subscription lifecycle management
- ✅ Checkout session creation
- ✅ Billing portal integration
- ✅ Webhook event processing
- ✅ Customer and subscription data handling

### 2. Component Tests (`tests/components/`)

**AdvancedAnalytics Component** (`AdvancedAnalytics.test.tsx`)
- ✅ Data visualization and metrics display
- ✅ Interactive time period selection
- ✅ Chart rendering and responsiveness
- ✅ Export functionality
- ✅ Loading states and error handling
- ✅ Accessibility compliance

**BillingSettings Component** (`BillingSettings.test.tsx`)
- ✅ Subscription form handling
- ✅ Stripe checkout integration
- ✅ Billing portal navigation
- ✅ Subscription status display
- ✅ Form validation and error states
- ✅ Mobile responsiveness

### 3. Integration Tests (`tests/integration/`)

**MVP Addons Integration** (`mvp-addons.test.ts`)
- ✅ Cross-module data consistency
- ✅ Complete tenant setup workflows
- ✅ Multi-tenant isolation verification
- ✅ Performance under concurrent load
- ✅ Error recovery and system resilience
- ✅ Security and authorization checks

## Test Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL test database
- Jest and React Testing Library

### Environment Variables
```bash
# Test Database
DATABASE_URL=postgresql://test:test@localhost:5432/stafftrak_test

# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_mock_key
VITE_STRIPE_PUBLIC_KEY=pk_test_mock_key
STRIPE_PRICE_ID=price_test_id
STRIPE_WEBHOOK_SECRET=whsec_test_secret
```

### Database Setup
```sql
-- Create test database
CREATE DATABASE stafftrak_test;

-- Run migrations
npm run db:migrate:test
```

## Mocking Strategy

### API Mocking
- `fetch` is globally mocked
- Stripe SDK is mocked for billing tests
- Database operations use test-specific data

### Component Mocking  
- External libraries (Stripe Elements) are mocked
- Toast notifications are mocked
- Router navigation is mocked

### Service Mocking
- Object storage operations are mocked
- Email services are mocked
- External API calls are intercepted

## Test Data Management

### Fixtures
- Mock analytics data with realistic metrics
- Sample branding configurations
- Test billing scenarios (active, cancelled, failed)

### Database Isolation
- Each test uses isolated tenant data
- Automatic cleanup between tests
- Transaction rollback for database tests

## Coverage Requirements

Minimum coverage thresholds:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70% 
- **Statements**: 70%

### Critical Path Coverage
- All API endpoints: 100%
- Payment processing flows: 95%
- Data validation logic: 90%
- Authentication/authorization: 95%

## Performance Testing

### Load Testing Scenarios
- 50 concurrent API requests
- Database stress testing
- Memory leak detection
- Response time validation (<1000ms)

### Performance Benchmarks
- Analytics endpoint: <500ms
- Branding updates: <200ms
- Billing operations: <1000ms (includes Stripe calls)

## Security Testing

### Input Validation
- SQL injection prevention
- XSS protection
- CSRF token validation
- Rate limiting compliance

### Authorization Testing
- Tenant isolation enforcement
- Role-based access control
- API key validation
- Session management

## Continuous Integration

### GitHub Actions Integration
```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    npm install
    npm run test:ci
    npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Pre-commit Hooks
- Lint and format code
- Run unit tests
- Check coverage thresholds
- Validate API schemas

## Debugging Tests

### Common Issues
1. **Database Connection Errors**
   - Check DATABASE_URL configuration
   - Ensure test database exists
   - Verify connection pool settings

2. **Stripe Mock Failures**
   - Update mock responses for API changes
   - Check webhook signature validation
   - Verify test environment variables

3. **Component Rendering Issues**
   - Ensure all providers are wrapped
   - Check for missing mock implementations
   - Verify data-testid attributes

### Debug Commands
```bash
# Run specific test with debugging
npm test -- --testNamePattern="should create checkout session" --verbose

# Run with coverage debugging
npm run test:coverage -- --verbose

# Debug component tests specifically
npm test -- --testPathPattern=components --detectOpenHandles
```

## Contributing to Tests

### Adding New Tests
1. Follow existing naming conventions
2. Add appropriate mocks and fixtures  
3. Include both happy path and error cases
4. Ensure accessibility testing
5. Update this README with new test descriptions

### Test Quality Standards
- Each test should test one specific behavior
- Use descriptive test names
- Include setup and teardown as needed
- Mock external dependencies appropriately
- Maintain test isolation and independence

### Code Review Checklist
- [ ] Tests cover all new functionality
- [ ] Error cases are tested
- [ ] Performance implications considered
- [ ] Security scenarios included
- [ ] Accessibility requirements met
- [ ] Documentation is updated