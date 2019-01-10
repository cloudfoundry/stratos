import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { BaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { CardStatusComponent } from '../../cards/card-status/card-status.component';
import { FocusDirective } from '../../focus.directive';
import { MetadataItemComponent } from '../../metadata-item/metadata-item.component';
import { ServicePlanPriceComponent } from '../../service-plan-price/service-plan-price.component';
import { ServicePlanPublicComponent } from '../../service-plan-public/service-plan-public.component';
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
