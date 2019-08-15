import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../../../core/src/core/entity-service-factory.service';
import { CardStatusComponent } from '../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import { FocusDirective } from '../../../../../../core/src/shared/components/focus.directive';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import {
  ServicePlanPriceComponent,
} from '../../../../../../core/src/shared/components/service-plan-price/service-plan-price.component';
import {
  ServicePlanPublicComponent,
} from '../../../../../../core/src/shared/components/service-plan-public/service-plan-public.component';
import { EntityMonitorFactory } from '../../../../../../core/src/shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { BaseTestModulesNoShared } from '../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CsiModeService } from '../csi-mode.service';
import { SelectPlanStepComponent } from './select-plan-step.component';


describe('SelectPlanStepComponent', () => {
  let component: SelectPlanStepComponent;
  let fixture: ComponentFixture<SelectPlanStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SelectPlanStepComponent,
        CardStatusComponent,
        MetadataItemComponent,
        ServicePlanPublicComponent,
        ServicePlanPriceComponent,
        FocusDirective
      ],
      imports: [BaseTestModulesNoShared],
      providers: [
        EntityServiceFactory,
        CreateServiceInstanceHelperServiceFactory,
        CsiGuidsService,
        PaginationMonitorFactory,
        EntityMonitorFactory,
        CsiModeService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectPlanStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
