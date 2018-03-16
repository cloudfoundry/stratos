import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceIconComponent } from './service-icon.component';
import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('ServiceIconComponent', () => {
  let component: ServiceIconComponent;
  let fixture: ComponentFixture<ServiceIconComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServiceIconComponent],
      imports: [...BaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
