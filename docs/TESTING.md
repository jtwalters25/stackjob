# Testing Guide

## Overview

StackJob uses a comprehensive testing strategy with three types of tests:

1. **Unit Tests** - Test individual functions and logic (Vitest)
2. **Component Tests** - Test React components in isolation (Vitest + React Testing Library)
3. **E2E Tests** - Test complete user flows (Playwright)

## Quick Start

```bash
# Run unit and component tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests (requires dev server)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

---

## Unit Testing (Vitest)

### Configuration

See `vitest.config.ts` for configuration. Key settings:

- **Environment**: `jsdom` (simulates browser)
- **Globals**: Enabled (no need to import `describe`, `it`, etc.)
- **Setup**: `vitest.setup.ts` loads testing library matchers

### Writing Unit Tests

**Location**: Place tests next to source files in `__tests__` directories

**Example**: Testing helper functions

```typescript
// lib/__tests__/supabase.test.ts
import { describe, it, expect } from 'vitest';
import { getDocFlags, getCriticalDocs } from '../supabase';

describe('supabase helpers', () => {
  describe('getDocFlags', () => {
    it('should return Elevator doc flags', () => {
      const flags = getDocFlags('Elevator');
      expect(flags).toHaveLength(3);
      expect(flags[0].key).toBe('has_prints');
    });
  });
});
```

### Mocking

**Mocking Sentry:**

```typescript
import { vi } from 'vitest';
import * as Sentry from '@sentry/nextjs';

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}));

// In test
expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
  expect.objectContaining({
    category: 'performance',
    message: 'test_metric',
  })
);
```

**Mocking Next.js router:**

```typescript
// Already configured in vitest.setup.ts
// useRouter, usePathname, useSearchParams are mocked automatically
```

**Mocking fetch:**

```typescript
// Already configured in vitest.setup.ts
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ data: 'test' }),
  })
);
```

---

## Component Testing (React Testing Library)

### Configuration

Components are tested in a simulated browser environment using `jsdom`.

### Writing Component Tests

**Location**: `components/__tests__/ComponentName.test.tsx`

**Example**: Testing JobCard component

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import JobCard from '../JobCard';

const mockJob = {
  id: 'test-123',
  customer_name: 'Acme Corp',
  stage: 'In Progress',
  // ... other fields
};

describe('JobCard', () => {
  it('should render customer name', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('should render as a link to job detail page', () => {
    const { container } = render(<JobCard job={mockJob} />);
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/jobs/test-123');
  });
});
```

### Best Practices

1. **Query Priority** (in order of preference):
   - `getByRole` - accessibility first
   - `getByLabelText` - forms
   - `getByText` - text content
   - `getByTestId` - last resort

2. **Async Testing**:
   ```typescript
   import { waitFor } from '@testing-library/react';

   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });
   ```

3. **User Events**:
   ```typescript
   import { fireEvent } from '@testing-library/react';

   fireEvent.click(screen.getByText('Submit'));
   ```

---

## E2E Testing (Playwright)

### Configuration

See `playwright.config.ts` for configuration. Key settings:

- **Test Directory**: `tests/e2e/`
- **Base URL**: `http://localhost:3000`
- **Auto-start dev server**: Enabled
- **Browsers**: Chromium, Firefox, Safari

### Writing E2E Tests

**Location**: `tests/e2e/*.spec.ts`

**Example**: Testing job creation flow

```typescript
import { test, expect } from '@playwright/test';

test('user can create a new job', async ({ page }) => {
  await page.goto('/');

  // Click new job button
  await page.click('text=New Job');

  // Fill form
  await page.fill('input[name="customer_name"]', 'Test Customer');
  await page.selectOption('select[name="trade"]', 'Elevator');

  // Submit
  await page.click('button[type="submit"]');

  // Verify
  await expect(page.locator('text=Test Customer')).toBeVisible();
});
```

### Authentication in E2E Tests

For authenticated tests, you'll need to:

1. Create a test user in Supabase
2. Store credentials in `.env.test`
3. Add authentication setup to tests

**Example setup** (to implement):

```typescript
import { test as base } from '@playwright/test';

const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login');

    // Login with test credentials
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('/');

    // Use authenticated page
    await use(page);
  },
});

export { test, expect };
```

### Best Practices

1. **Use data-testid for dynamic content**:
   ```tsx
   <button data-testid="delete-job-btn">Delete</button>
   ```

2. **Wait for network requests**:
   ```typescript
   await page.waitForResponse('**/api/jobs');
   ```

3. **Take screenshots on failure**:
   ```typescript
   // Already configured in playwright.config.ts
   screenshot: 'only-on-failure'
   ```

---

## Test Coverage

Run tests with coverage to see what's tested:

```bash
npm run test:coverage
```

**Coverage report** will be generated in `coverage/` directory.

**Target metrics:**
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

## CI/CD Integration

### GitHub Actions (Example)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

---

## Testing Pyramid

```
        /\
       /  \       E2E Tests (few)
      /____\      - Critical user flows
     /      \     - Slow, expensive
    /________\    Component Tests (some)
   /          \   - UI interactions
  /____________\  - Medium speed
 /              \ Unit Tests (many)
/________________\- Business logic
                  - Fast, cheap
```

**Strategy:**
- **70%** unit tests (fast, cheap)
- **20%** component tests (medium)
- **10%** E2E tests (slow, expensive)

---

## Current Test Coverage

### Unit Tests
- ✅ `lib/supabase.ts` - Helper functions
- ✅ `lib/metrics.ts` - Performance measurement

### Component Tests
- ✅ `components/JobCard.tsx` - Job card rendering

### E2E Tests
- ⏸️ Job creation flow (skipped - needs auth)
- ⏸️ Job update flow (skipped - needs auth)
- ⏸️ Job deletion flow (skipped - needs auth)
- ⏸️ Document upload flow (skipped - needs auth)

---

## Next Steps

1. **Add authentication setup for E2E tests**
   - Create test user credentials
   - Implement auth helper
   - Enable skipped E2E tests

2. **Increase coverage**
   - Test API routes (`app/api/**`)
   - Test more components (`StageSelect`, `DocumentUpload`, etc.)
   - Test error scenarios

3. **Add visual regression testing**
   - Consider Playwright screenshots
   - Chromatic for Storybook (if added)

4. **Add performance testing**
   - Lighthouse CI
   - Web Vitals tracking

---

## Interview Talking Points

### "How do you approach testing?"

*"I use a testing pyramid approach with three layers:*

1. **Unit tests** for business logic (70%) - Fast, cheap, test individual functions like `getDocFlags()` and `measurePerformance()`
2. **Component tests** for UI (20%) - Test React components in isolation with React Testing Library
3. **E2E tests** for critical flows (10%) - Playwright tests for user journeys like job creation

*I prioritize fast, reliable tests that give confidence without slowing down development. For StackJob, I achieved 29 passing tests covering core business logic and UI components.*"

### "Tell me about a testing challenge you solved"

*"When setting up testing for StackJob, I had to mock Sentry's metrics API since it's not available in the free tier. Instead of using the full API, I switched to breadcrumbs and wrote tests that verify the breadcrumb data structure. This let me test the metrics tracking logic without needing a Sentry account.*

*I also had to configure Vitest to exclude Playwright E2E tests, since Vitest tried to run them. I updated the config with an explicit exclude pattern for the `tests/e2e/` directory.*"

### "How would you scale testing at Netflix?"

*"At Netflix scale, I'd focus on:*

1. **Parallelization** - Run tests across multiple workers/containers
2. **Test sharding** - Split E2E tests into smaller suites
3. **Flake detection** - Retry flaky tests, mark patterns
4. **Visual regression** - Automated screenshot comparison
5. **Performance budgets** - Fail builds if bundle size increases
6. **Smart test selection** - Only run affected tests based on changed files*"

---

## Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
