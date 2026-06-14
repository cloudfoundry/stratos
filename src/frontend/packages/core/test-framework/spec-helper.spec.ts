import { APP_BASE_HREF } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

/**
 * The ngx Charts lobrary needs APP_BASE_HREF - so we will provide it through
 * a global beforeEach so we don't have to add it to all the necessary
 * spec files.
 */
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [{ provide: APP_BASE_HREF, useValue: '/' }]
  });
});

/**
 * Bump up the default test timeout from 5 seconds
 */
beforeAll(() => {
  vi.setConfig({ testTimeout: 10000 });
});
