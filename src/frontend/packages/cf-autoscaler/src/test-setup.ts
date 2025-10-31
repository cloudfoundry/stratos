// Vitest + Angular testing setup
import 'zone.js';
import 'zone.js/testing';

import { APP_BASE_HREF } from '@angular/common';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { beforeAll, beforeEach } from 'vitest';

// Initialize the Angular testing environment
const testBed = getTestBed();
testBed.initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
  }
);

beforeEach(() => {
  testBed.configureTestingModule({
    providers: [{ provide: APP_BASE_HREF, useValue: '/' }]
  });
});

// Test timeout is configured in vitest.config.ts
beforeAll(() => {
  // Any global test setup can go here
});
