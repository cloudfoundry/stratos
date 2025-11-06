import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { of as observableOf } from 'rxjs';

import { BaseTestModulesNoShared } from '../../../../../test-framework/core-test.helper';
import { StackedInputActionComponent, StackedInputActionResult } from './stacked-input-action.component';

describe('StackedInputActionComponent', () => {
  let component: StackedInputActionComponent;
  let fixture: ComponentFixture<StackedInputActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StackedInputActionComponent,
        ...BaseTestModulesNoShared
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StackedInputActionComponent);
    component = fixture.componentInstance;
    component.stateIn$ = observableOf({
      key: 'string',
      result: StackedInputActionResult.OTHER_VALUES_UPDATED
    });
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
