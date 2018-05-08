import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { ServicesService } from '../services.service';
import { ServicesServiceMock } from '../services.service.mock';
import { ServiceBaseComponent } from './service-base.component';

describe('ServiceBaseComponent', () => {
  let component: ServiceBaseComponent;
  let fixture: ComponentFixture<ServiceBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServiceBaseComponent],
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
        DatePipe],
      imports: [
        BaseTestModules,
        createBasicStoreModule(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
