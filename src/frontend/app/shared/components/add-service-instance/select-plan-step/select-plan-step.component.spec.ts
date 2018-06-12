import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { BaseTestModules, BaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CreateServiceInstanceHelperService } from '../create-service-instance-helper.service';
import { SelectPlanStepComponent } from './select-plan-step.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CsiGuidsService } from '../csi-guids.service';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';
import { CardStatusComponent } from '../../cards/card-status/card-status.component';
import { MetadataItemComponent } from '../../metadata-item/metadata-item.component';
import { CsiModeService } from '../csi-mode.service';

describe('SelectPlanStepComponent', () => {
  let component: SelectPlanStepComponent;
  let fixture: ComponentFixture<SelectPlanStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SelectPlanStepComponent,
        CardStatusComponent,
        MetadataItemComponent
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
