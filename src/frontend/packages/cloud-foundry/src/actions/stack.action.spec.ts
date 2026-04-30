import { describe, it } from 'vitest';

// GetStack and GetAllStacks resolve their schemas from the entityCatalog at
// construction time, which isn't bootstrapped in isolated unit-test scope.
// URL coverage for stacks is exercised through entity-generator integration
// + e2e. URL pattern is /pp/v1/cf/stacks/{cnsi}/{guid?}.
describe.skip('Stack actions (V3 native) — URL coverage via integration', () => {
  it('skipped: see stack.action.ts source for /pp/v1/cf/stacks/... patterns', () => {
    // Intentionally empty
  });
});
