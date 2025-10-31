// Vitest + Angular testing setup
import '@analogjs/vitest-angular/setup-zone';

// Import compiler for JIT compilation support (required for partially compiled libraries)
import '@angular/compiler';

import { APP_BASE_HREF } from '@angular/common';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Initialize the Angular testing environment
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
  }
);
