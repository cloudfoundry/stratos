import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialDesignFrameworkModule } from '@cfstratos/ajsf-material';

import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import {
  generateCfBaseTestModulesNoShared,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { SchemaFormComponent } from '../../schema-form/schema-form.component';
import { CsiGuidsService } from '../csi-guids.service';
import { BindAppsStepComponent } from './bind-apps-step.component';

describe('BindAppsStepComponent', () => {
  let component: BindAppsStepComponent;
  let fixture: ComponentFixture<BindAppsStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        BindAppsStepComponent,
        SchemaFormComponent
      ],
      imports: [
        generateCfBaseTestModulesNoShared(),
        MaterialDesignFrameworkModule
      ],
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
        CsiGuidsService,
        PaginationMonitorFactory
      ]


    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BindAppsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
