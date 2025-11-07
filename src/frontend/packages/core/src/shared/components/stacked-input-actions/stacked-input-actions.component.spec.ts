import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { of as observableOf } from 'rxjs';

import { BaseTestModulesNoShared, STORE_TEST_PROVIDERS } from "@test-framework/core-test.helper";
import { BooleanIndicatorComponent } from '../boolean-indicator/boolean-indicator.component';
import { StackedInputActionComponent } from './stacked-input-action/stacked-input-action.component';
import { StackedInputActionsComponent } from './stacked-input-actions.component';

describe('StackedInputActionsComponent', () => {
  let component: StackedInputActionsComponent;
  let fixture: ComponentFixture<StackedInputActionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection()
      ],
      imports: [
        ...BaseTestModulesNoShared,
        StackedInputActionsComponent,
        BooleanIndicatorComponent,
        StackedInputActionComponent,
      ],
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StackedInputActionsComponent);
    component = fixture.componentInstance;
    component.stateIn$ = observableOf([]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
