import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { BindAppsStepComponent } from '../bind-apps-step/bind-apps-step.component';
import { SelectPlanStepComponent } from '../select-plan-step/select-plan-step.component';
import { SpecifyDetailsStepComponent } from '../specify-details-step/specify-details-step.component';
import { AddServiceInstanceComponent } from './add-service-instance.component';
import { CreateApplicationModule } from '../../../../features/applications/create-application/create-application.module';
import { ServiceCatalogModule } from '../../../../features/service-catalog/service-catalog.module';
import { SelectServiceComponent } from '../select-service/select-service.component';

describe('AddServiceInstanceComponent', () => {
  let component: AddServiceInstanceComponent;
  let fixture: ComponentFixture<AddServiceInstanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AddServiceInstanceComponent,
        SelectPlanStepComponent,
        SpecifyDetailsStepComponent,
        BindAppsStepComponent,
        SelectServiceComponent
      ],
      imports: [BaseTestModules, CreateApplicationModule],
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddServiceInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
