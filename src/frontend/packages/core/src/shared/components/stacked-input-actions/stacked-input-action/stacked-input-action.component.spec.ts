import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of as observableOf } from 'rxjs';

import { BaseTestModulesNoShared } from '../../../../../test-framework/core-test.helper';
import { StackedInputActionComponent, StackedInputActionResult } from './stacked-input-action.component';

describe('StackedInputActionComponent', () => {
  let component: StackedInputActionComponent;
  let fixture: ComponentFixture<StackedInputActionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        StackedInputActionComponent,
        ...BaseTestModulesNoShared
      ],
    })
      .compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(StackedInputActionComponent);
    component = fixture.componentInstance;
    component.stateIn$ = observableOf({
      key: 'string',
      result: StackedInputActionResult.OTHER_VALUES_UPDATED
    });
    fixture.detectChanges();
  }));

  it('should create', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));
});
