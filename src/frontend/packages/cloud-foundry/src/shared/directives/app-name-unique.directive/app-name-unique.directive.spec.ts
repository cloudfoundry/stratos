import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { createBasicStoreModule } from '@stratosui/store/testing';
import { AppNameUniqueDirective } from './app-name-unique.directive';

describe('AppNameUniqueDirective', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
  });
  it('should create an instance', () => {
    const directive = TestBed.runInInjectionContext(() => new AppNameUniqueDirective());
    expect(directive).toBeTruthy();
  });
});
