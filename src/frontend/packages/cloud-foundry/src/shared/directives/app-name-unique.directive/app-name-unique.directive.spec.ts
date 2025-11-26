import { provideZonelessChangeDetection } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import { createBasicStoreModule } from '@stratosui/store/testing';
import type { CFAppState } from '@stratosui/cloud-foundry';
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
  it('should create an instance', inject([Store, HttpClient], (store: Store, http: HttpClient) => {
    const directive = new AppNameUniqueDirective(store, http);
    expect(directive).toBeTruthy();
  }));
});
