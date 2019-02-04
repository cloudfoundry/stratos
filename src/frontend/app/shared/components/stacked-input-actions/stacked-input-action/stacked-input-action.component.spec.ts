import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of as observableOf } from 'rxjs';

import { ActiveRouteCfOrgSpace } from '../../../../features/cloud-foundry/cf-page.types';
import {
  BaseCfOrgSpaceRouteMock,
  BaseTestModulesNoShared,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { testSCFGuid } from '../../../../test-framework/store-test-helper';
import { BooleanIndicatorComponent } from '../../boolean-indicator/boolean-indicator.component';
import { StackedInputActionComponent } from './stacked-input-action.component';

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

  beforeEach(() => {
    fixture = TestBed.createComponent(StackedInputActionComponent);
    component = fixture.componentInstance;
    component.stateIn$ = observableOf(null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
