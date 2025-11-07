# Plan: Fix All Frontend Test File Imports

## Metadata
adw_id: `scan all src/frontend code to create a plan in .claude/plans/ for fixing all imports accoring to these instructions: .claude/instructions/imports.md`
prompt: `scan all src/frontend code to create a plan in .claude/plans/ for fixing all imports accoring to these instructions: .claude/instructions/imports.md`
task_type: refactor
complexity: complex

## Task Description
Refactor all test files (*.spec.ts) in the src/frontend/packages directory to replace relative imports with package imports using @stratosui/* aliases. The project has 599 test files with approximately 1750 relative import statements that need to be converted to use the proper monorepo package import pattern.

## Objective
Convert all relative imports (starting with '../') in test files to use the configured TypeScript path aliases (@stratosui/*) to improve maintainability, consistency, and build reliability across the monorepo structure.

## Problem Statement
The codebase currently has inconsistent import patterns in test files:
- Approximately 1750 relative imports across 599 test files
- Relative imports break when files are moved and make the codebase harder to maintain
- The build system and TypeScript are configured for package aliases but test files aren't using them consistently
- This violates the monorepo architecture principles and can cause build optimization issues

## Solution Approach
Systematically scan and refactor all test files to:
1. Identify all relative imports that cross package boundaries
2. Map them to the correct @stratosui/* package aliases
3. Consolidate multiple imports from the same package
4. Ensure all imports resolve correctly after changes

## Relevant Files
Use these files to complete the task:

- `.claude/instructions/imports.md` - Import fix instructions and rules
- `src/tsconfig.json` - TypeScript path mappings configuration
- `src/frontend/packages/*/src/**/*.spec.ts` - All test files to be fixed
- `src/frontend/packages/*/src/public-api.ts` - Public API exports for each package
- `src/frontend/packages/*/src/public_api.ts` - Alternative public API file name
- `src/frontend/packages/store/testing/index.ts` - Store testing exports

### New Files
No new files will be created. Only existing test files will be modified.

## Implementation Phases

### Phase 1: Foundation
- Create a comprehensive mapping of relative imports to package imports
- Identify all unique import patterns and their correct package aliases
- Build automation scripts to assist with the refactoring

### Phase 2: Core Implementation
- Process test files package by package, starting with packages with fewer dependencies
- Apply import transformations systematically
- Consolidate imports from the same package
- Verify imports resolve after each package is complete

### Phase 3: Integration & Polish
- Run all test suites to ensure no breaking changes
- Fix any remaining import resolution errors
- Update any missed edge cases
- Document the changes made

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Analyze Import Patterns
- Scan all test files to identify unique relative import patterns
- Create a mapping of relative paths to their corresponding package aliases
- Identify the most common import patterns that need fixing

### 2. Create Import Mapping Script
- Write a script to automate the mapping of relative imports to package imports
- Include logic to handle:
  - Cross-package imports (../../../store -> @stratosui/store)
  - Testing imports (../../../store/testing -> @stratosui/store/testing)
  - Local package imports (should remain relative if within same package)
- Add import consolidation logic to merge multiple imports from same package

### 3. Fix Store Package Test Files
- Start with store package as it has no dependencies on other packages
- Apply import transformations to all *.spec.ts files
- Verify imports resolve correctly
- Run store package tests to ensure no breakage

### 4. Fix Shared Package Test Files
- Process shared package test files
- Update imports to use @stratosui/store and other aliases
- Consolidate duplicate imports
- Verify and test

### 5. Fix Core Package Test Files
- Process the 127 test files in the core package with relative imports
- Update imports to use package aliases for store, shared dependencies
- Keep local imports relative when they're within the core package
- Run core package tests

### 6. Fix Cloud Foundry Package Test Files
- Process the 212 test files in the cloud-foundry package
- Update cross-package imports to use aliases
- Ensure proper imports for store, core, and shared packages
- Run cloud-foundry package tests

### 7. Fix Kubernetes Package Test Files
- Process kubernetes package test files
- Update imports following the same pattern
- Verify and test

### 8. Fix Remaining Package Test Files
- Process cf-autoscaler package
- Process git package
- Process extension package
- Process any other packages with test files

### 9. Consolidate and Optimize Imports
- Run a final pass to consolidate any remaining duplicate imports
- Ensure all imports follow the correct pattern
- Remove any unused imports

### 10. Validate All Changes
- Run full test suite: `bun run test-frontend:core`
- Run full test suite: `bun run test-frontend:store`
- Run full test suite: `bun run test-frontend:cloud-foundry`
- Run full test suite: `bun run test-frontend:kubernetes`
- Verify no TypeScript compilation errors
- Ensure all imports resolve correctly

## Testing Strategy
- Unit test execution for each package after import fixes
- Verify TypeScript compilation succeeds without import errors
- Run the complete frontend test suite to ensure no regression
- Test edge cases:
  - Circular dependencies detection
  - Dynamic imports if any
  - Mock imports in test setup files
  - Test helper imports from @test-framework

## Acceptance Criteria
- All relative imports that cross package boundaries are converted to package imports
- All test files use @stratosui/* aliases for cross-package imports
- Multiple imports from the same package are consolidated into single import statements
- All tests pass without import resolution errors
- TypeScript compilation succeeds without warnings
- No relative imports remain that traverse to other packages (../../../)
- Build and test performance is maintained or improved

## Validation Commands
Execute these commands to validate the task is complete:

- `bun run test-frontend:core` - Verify core package tests pass
- `bun run test-frontend:store` - Verify store package tests pass
- `bun run test-frontend:cloud-foundry` - Verify cloud-foundry package tests pass
- `bun run test-frontend:kubernetes` - Verify kubernetes package tests pass
- `bunx tsc --noEmit` - Verify TypeScript compilation succeeds
- `grep -r "from '\.\.\/" src/frontend/packages --include="*.spec.ts" | grep -E "(store|core|shared|cloud-foundry|kubernetes)" | wc -l` - Should return 0 cross-package relative imports

## Notes
- The project uses Bun as package manager and Vitest for testing
- TypeScript path mappings are configured in src/tsconfig.json
- Public API exports must exist in each package's public-api.ts or public_api.ts file
- Local imports within the same package should remain relative for better encapsulation
- Store testing utilities are in a separate export path: @stratosui/store/testing
- Test framework helpers use @test-framework alias
- This refactoring will make the codebase more maintainable and consistent with monorepo best practices