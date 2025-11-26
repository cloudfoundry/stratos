// Type definitions for @analogjs/vitest-angular side-effect imports
// These modules are imported for their side effects (setup code) and don't export anything

declare module '@analogjs/vitest-angular/setup-snapshots' {
  // This module has no exports - it's imported for side effects only
  // It sets up snapshot serializers for Angular fixtures in Vitest
}

declare module '@analogjs/vitest-angular/setup-testbed' {
  // This module has no exports - it's imported for side effects only
  // It sets up Angular TestBed for Vitest
}

declare module '@analogjs/vitest-angular/setup-zone' {
  // This module has no exports - it's imported for side effects only
  // It sets up Zone.js for Vitest (not used in zoneless mode)
}
