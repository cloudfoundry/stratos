import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { of as observableOf } from 'rxjs';

import { BaseTestModulesNoShared, STORE_TEST_PROVIDERS } from "@test-framework/core-test.helper";
import { StackedInputActionComponent, StackedInputActionResult } from './stacked-input-action.component';

describe('StackedInputActionComponent', () => {
  let component: StackedInputActionComponent;
  let fixture: ComponentFixture<StackedInputActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ],
      imports: [
        ...BaseTestModulesNoShared,
        StackedInputActionComponent,
      ],
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StackedInputActionComponent);
    component = fixture.componentInstance;
    component.stateIn$ = observableOf({
      key: 'string',
      result: StackedInputActionResult.OTHER_VALUES_UPDATED,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
