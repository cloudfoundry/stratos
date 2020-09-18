import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialDesignFrameworkModule } from '@cfstratos/ajsf-material';

import { EntityMonitorFactory } from '../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { generateCfBaseTestModulesNoShared } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { LongRunningCfOperationsService } from '../../../data-services/long-running-cf-op.service';
import { SchemaFormComponent } from '../../schema-form/schema-form.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CsiModeService } from '../csi-mode.service';
import { SpecifyDetailsStepComponent } from './specify-details-step.component';

describe('SpecifyDetailsStepComponent', () => {
  let component: SpecifyDetailsStepComponent;
  let fixture: ComponentFixture<SpecifyDetailsStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SpecifyDetailsStepComponent,
        SchemaFormComponent
      ],
      imports: [
        generateCfBaseTestModulesNoShared(),
        MaterialDesignFrameworkModule
      ],
      providers: [
        CreateServiceInstanceHelperServiceFactory,
        CsiGuidsService,
        PaginationMonitorFactory,
        EntityMonitorFactory,
        CsiModeService,
        LongRunningCfOperationsService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecifyDetailsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
