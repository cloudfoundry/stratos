import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialDesignFrameworkModule } from 'stratos-angular6-json-schema-form';

import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { BaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
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
        BaseTestModulesNoShared,
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
