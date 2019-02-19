import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of as observableOf } from 'rxjs';

import { ActiveRouteCfOrgSpace } from '../../../features/cloud-foundry/cf-page.types';
import {
  BaseCfOrgSpaceRouteMock,
  BaseTestModulesNoShared,
} from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { testSCFGuid } from '../../../test-framework/store-test-helper';
import { BooleanIndicatorComponent } from '../boolean-indicator/boolean-indicator.component';
import { StackedInputActionComponent } from './stacked-input-action/stacked-input-action.component';
import { StackedInputActionsComponent } from './stacked-input-actions.component';

describe('StackedInputActionsComponent', () => {
  let component: StackedInputActionsComponent;
  let fixture: ComponentFixture<StackedInputActionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StackedInputActionsComponent, BooleanIndicatorComponent, StackedInputActionComponent],
      imports: [...BaseTestModulesNoShared],
      providers: [{
        provide: ActiveRouteCfOrgSpace,
        useFactory: () => new BaseCfOrgSpaceRouteMock(testSCFGuid)
      }]
    })
      .compileComponents();
  }));

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
