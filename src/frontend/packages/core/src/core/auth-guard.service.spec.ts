import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule, Store } from '@ngrx/store';

import { authGuard } from './auth-guard.service';
import { appReducers } from '@stratosui/store';
import { InternalAppState } from '@stratosui/store';

describe('authGuard', () => {
  let store: Store<InternalAppState>;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        RouterTestingModule,
        StoreModule.forRoot(appReducers),
      ]
    });
    store = TestBed.inject(Store);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });

  it('should return a function', () => {
    expect(typeof authGuard).toBe('function');
  });
});
