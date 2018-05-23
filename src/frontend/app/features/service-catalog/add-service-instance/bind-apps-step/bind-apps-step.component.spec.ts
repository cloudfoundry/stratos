import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BindAppsStepComponent } from './bind-apps-step.component';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesService } from '../../services.service';
import { ServicesServiceMock } from '../../services.service.mock';
import { CsiGuidsService } from '../csi-guids.service';

describe('BindAppsStepComponent', () => {
  let component: BindAppsStepComponent;
  let fixture: ComponentFixture<BindAppsStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BindAppsStepComponent],
      imports: [BaseTestModules],
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
        CsiGuidsService
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
