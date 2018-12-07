import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MDAppModule } from '../../../core/md.module';
import { ServicePlanPublicComponent } from './service-plan-public.component';

describe('ServicePlanPublicComponent', () => {
  let component: ServicePlanPublicComponent;
  let fixture: ComponentFixture<ServicePlanPublicComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServicePlanPublicComponent],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MDAppModule,
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicePlanPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
