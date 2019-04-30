import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of as observableOf } from 'rxjs';

import {
  BaseCfOrgSpaceRouteMock,
  BaseTestModulesNoShared,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { testSCFGuid } from '../../../../../test-framework/store-test-helper';
import { ActiveRouteCfOrgSpace } from '../../../../features/cloud-foundry/cf-page.types';
import { BooleanIndicatorComponent } from '../../boolean-indicator/boolean-indicator.component';
import { StackedInputActionComponent, StackedInputActionResult } from './stacked-input-action.component';

describe('StackedInputActionComponent', () => {
  let component: StackedInputActionComponent;
  let fixture: ComponentFixture<StackedInputActionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StackedInputActionComponent, BooleanIndicatorComponent],
      imports: [...BaseTestModulesNoShared],
      providers: [{
        provide: ActiveRouteCfOrgSpace,
        useFactory: () => new BaseCfOrgSpaceRouteMock(testSCFGuid)
      }]
    })
      .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(StackedInputActionComponent);
    component = fixture.componentInstance;
    component.stateIn$ = observableOf({
      key: 'string',
      result: StackedInputActionResult.OTHER_VALUES_UPDATED
    });
    fixture.detectChanges();
  }));

  it('should create', async(() => {
    expect(component).toBeTruthy();
  }));
});
