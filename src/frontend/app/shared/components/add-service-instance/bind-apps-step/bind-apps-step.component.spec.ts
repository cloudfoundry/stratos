import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BindAppsStepComponent } from './bind-apps-step.component';
import { BaseTestModules, BaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { CsiGuidsService } from '../csi-guids.service';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { MaterialDesignFrameworkModule } from 'angular6-json-schema-form';

describe('BindAppsStepComponent', () => {
  let component: BindAppsStepComponent;
  let fixture: ComponentFixture<BindAppsStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BindAppsStepComponent],
      imports: [BaseTestModulesNoShared , MaterialDesignFrameworkModule],
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
