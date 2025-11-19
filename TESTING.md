# Testing Guide

This document provides comprehensive guidance for running tests in Stratos and troubleshooting test failures across different environments.

## Table of Contents
- [Quick Start](#quick-start)
- [Requirements](#requirements)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)
- [CI/CD](#cicd)
- [Test Architecture](#test-architecture)

---

## Quick Start

```bash
# Run all unit tests
make test

# Run specific package tests
bun run test:core
bun run test:store
bun run test:cloud-foundry
bun run test:kubernetes

# Run E2E tests
make test-e2e

# Run with UI (interactive)
bun run test:ui

# Run with coverage
bun run test:coverage
```

---

## Requirements

### Minimum Versions Required

- **Node.js**: `24.x` or higher
- **Bun**: `1.2.0` or higher (including 1.3.x)

### Important Notes

**Bun 1.3.x Compatibility:**
- Bun 1.3.x changed test discovery behavior
- Our configuration (`bunfig.toml`) disables Bun's built-in test runner
- All tests run through Vitest via `bun run test` (NOT `bun test`)
- The workspace configuration explicitly excludes E2E tests from Vitest

### Installing Correct Versions

#### Option 1: Using asdf (Recommended)
```bash
# Install asdf first: https://asdf-vm.com/
asdf plugin add nodejs
asdf plugin add bun

# Install from .tool-versions
asdf install
```

#### Option 2: Manual Installation
```bash
# Node.js 24
nvm install 24
nvm use 24

# Bun (latest)
bun upgrade

# Verify versions
node --version  # Should show v24.x.x or higher
bun --version   # Should show 1.2.0 or higher
```

#### Option 3: Docker (Most Consistent)
```bash
# Use latest Bun environment
docker run -it --rm \
  -v $(pwd):/workspace \
  -w /workspace \
  oven/bun:latest \
  /bin/bash

# Inside container
bun run test
```

### Version Check

A pre-test hook automatically validates versions:

```bash
bun run test
# Output:
# ✓ Node.js v25.2.1 ✓
# ✓ Bun 1.3.2 ✓
# ✅ All version checks passed!
```

If versions are incorrect, you'll see:

```bash
✗ ERROR: Node.js version v23.1.0 detected. Required: 24.x or higher
✗ ERROR: Bun version 1.1.0 detected. Required: 1.2.0 or higher
```

---

## Test Types

### Unit Tests (Vitest)
- **Location**: `src/frontend/packages/*/src/**/*.spec.ts`
- **Runner**: Vitest 3.1.1
- **Environment**: happy-dom
- **Framework**: Angular 20 TestBed

### E2E Tests (Playwright)
- **Location**: `e2e/**/*.spec.ts`
- **Runner**: Playwright 1.49+
- **Browsers**: Chromium, Firefox, WebKit
- **Note**: ⚠️ E2E tests MUST NOT be run by Vitest!

---

## Running Tests

### Make Targets

```bash
# All tests
make test                 # Runs unit tests only

# Specific test types
make test-unit            # Unit tests (Vitest)
make test-e2e             # E2E tests (Playwright)

# Linting
make lint                 # ESLint
```

### NPM Scripts

```bash
# Run all unit tests with explicit projects
bun run test

# Individual packages
bun run test:core
bun run test:store
bun run test:cloud-foundry
bun run test:kubernetes
bun run test:cf-autoscaler
bun run test:git
bun run test:shared
bun run test:extension

# Interactive/Debug modes
bun run test:ui           # Vitest UI (browser-based)
bun run test:watch        # Watch mode
bun run test:coverage     # Coverage report

# E2E tests
bun run e2e               # Run all E2E tests
bun run e2e:ui            # Playwright UI
bun run e2e:debug         # Debug mode
bun run e2e:headed        # Show browser
```

### Running Individual Test Files

```bash
# Vitest CLI
bunx vitest run src/frontend/packages/core/src/core/utils.service.spec.ts

# With watch mode
bunx vitest src/frontend/packages/core/src/core/utils.service.spec.ts
```

---

## Troubleshooting

### Common Issues

#### 1. E2E Tests Run by Vitest

**Symptoms:**
```
error: Playwright Test did not expect test.describe() to be called here.
```

**Cause**: E2E test files are being discovered and run by Vitest instead of Playwright.

**Fix**:
1. Ensure you're using `bun run test` (NOT `bun test`)
2. Verify `bunfig.toml` exists and disables Bun's test runner
3. Check `.vitestignore` file exists
4. Verify exclusions in `vitest.workspace.ts`

#### 2. TestBed Not Initialized

**Symptoms:**
```
error: Need to call TestBed.initTestEnvironment() first
```

**Cause**: Setup files not loading in correct order or at all.

**Fix**:
1. Verify setup file order in `vitest.config.ts`:
   ```typescript
   setupFiles: [
     join(__dirname, '../../vitest.workspace.setup.ts'), // MUST be first
     join(__dirname, 'src/test-setup.ts'),
   ]
   ```
2. Check `vitest.workspace.setup.ts` exists
3. Ensure using `bun run test` not `bun test`

#### 3. Module Export Errors

**Symptoms:**
```
SyntaxError: export 'PermissionValues' not found in './selectors/current-user-role.selectors'
```

**Cause**: Module resolution timing issues or cache corruption.

**Fix**:
1. Clear build cache:
   ```bash
   rm -rf node_modules dist-devkit coverage
   bun install
   ```
2. Ensure `bunfig.toml` exists and is configured properly

#### 4. Tests Pass Locally, Fail on Coworker's Machine

**Cause**: Version mismatch (most common), environment differences, or caching issues.

**Fix**:
1. **Verify versions** on both machines:
   ```bash
   node --version  # Should be 24.x or higher
   bun --version   # Should be 1.2.0 or higher
   ```
2. **Ensure same Bun version**:
   ```bash
   bun upgrade  # Get latest
   ```
3. **Clean install**:
   ```bash
   rm -rf node_modules dist-devkit coverage
   bun install
   ```
4. **Verify configuration files exist**:
   ```bash
   ls -la bunfig.toml .vitestignore vitest.workspace.ts
   ```

#### 5. Timeouts or Flaky Tests

**Symptoms:**
```
Error: Test timeout of 15000ms exceeded
```

**Fix**:
1. Increase timeout in `vitest.config.ts`:
   ```typescript
   testTimeout: 30000,
   hookTimeout: 30000,
   ```
2. Check for race conditions in tests
3. Ensure test isolation:
   ```typescript
   afterEach(() => {
     TestBed.resetTestingModule();
   });
   ```

### Debug Mode

```bash
# Vitest debug
NODE_OPTIONS='--inspect-brk' bun run test:watch

# View detailed logs
bun run test -- --reporter=verbose

# Run single test file
bunx vitest run src/frontend/packages/core/src/core/utils.service.spec.ts --reporter=verbose
```

---

## CI/CD

### GitHub Actions

Our CI pipeline (`.github/workflows/pr.yml`) ensures consistent testing:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [24.x]
        bun-version: [1.3.x]
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${{ matrix.bun-version }}
      - run: bun install
      - run: bun run test
```

**Key Points:**
- Uses latest Bun 1.3.x
- Node 24.x or higher
- Clean environment every run
- Parallel test execution by package

---

## Test Architecture

### Vitest Workspace

Tests are organized in a monorepo workspace:

```
vitest.workspace.ts
├── core (8 projects)
├── store
├── cloud-foundry
├── kubernetes
├── cf-autoscaler
├── git
├── shared
└── extension
```

Each project has:
- Own `vitest.config.ts`
- Own `test-setup.ts`
- Path aliases for imports
- Coverage configuration

### Test Isolation

**Pool Configuration:**
```typescript
pool: 'forks',
poolOptions: {
  forks: {
    singleFork: true,    // One process, TestBed stability
    isolate: false,      // Share environment for speed
  },
},
```

**Why `singleFork: true`?**
- Ensures TestBed state is properly reset between test files
- Prevents cross-test contamination
- Required for Angular 20 zoneless change detection

### Test Setup Flow

1. **Workspace Setup** (`vitest.workspace.setup.ts`):
   - Initializes Angular TestBed platform
   - Configures browser environment (happy-dom)
   - Sets up global test utilities

2. **Package Setup** (`src/test-setup.ts`):
   - Package-specific mocks
   - Custom matchers
   - Test helpers

### File Discovery

Vitest uses these patterns:

**Include:**
- `src/**/*.spec.ts` (unit tests)

**Exclude:**
- `e2e/**` (Playwright tests)
- `**/e2e/**`
- `**/*.e2e.spec.ts`
- `**/*.e2e-spec.ts`
- `node_modules/**`
- `dist/**`

### Module Resolution

Path aliases (from `vitest.config.ts`):

```typescript
'@stratosui/core' → '../core/src/public-api.ts'
'@stratosui/store' → '../store/src/public-api.ts'
'@test-framework' → '../core/test-framework'
```

These must match `tsconfig.json` paths for IDE support.

---

## Best Practices

### 1. Always Use bun run Commands

```bash
# ✅ Good (uses bun run script → vitest)
bun run test
bun run test:core

# ❌ Bad (uses Bun's built-in test runner directly)
bun test
```

### 2. Clean Cache on Version Changes

```bash
rm -rf node_modules dist-devkit coverage
bun install
bun run test
```

### 3. Test One Package at a Time During Development

```bash
# Faster iteration
bun run test:core -- --watch
```

### 4. Use Vitest UI for Debugging

```bash
bun run test:ui
# Opens browser at http://localhost:51204/__vitest__/
```

### 5. Check Version Before Reporting Issues

```bash
node --version && bun --version
# Should be: v24.x.x and 1.2.13
```

---

## Getting Help

### Check These First

1. ✅ Verify versions: `node --version && bun --version`
2. ✅ Clean install: `rm -rf node_modules && bun install`
3. ✅ Check setup files exist
4. ✅ Review error message type (E2E discovery, TestBed, or module error)

### File an Issue

If tests still fail, include:

```bash
# Environment info
node --version
bun --version
uname -a

# Test command
bun run test:core 2>&1 | head -50

# Config check
ls -la vitest.workspace.ts src/frontend/packages/core/vitest.config.ts
```

---

## Summary

**Key Takeaways:**
1. **Use Bun 1.2.0+** (including 1.3.x) - latest is recommended
2. **ALWAYS use bun run test** (NOT `bun test` directly) - this is critical!
3. **E2E tests are separate** - run with `bun run e2e`
4. **Clean install** after version changes
5. **Version check runs automatically** before tests
6. **bunfig.toml disables Bun's test runner** - do not modify this file

Following these guidelines ensures tests run consistently across all development machines and CI environments.
