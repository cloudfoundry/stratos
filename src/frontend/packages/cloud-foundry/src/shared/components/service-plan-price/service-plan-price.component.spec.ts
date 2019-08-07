import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MDAppModule } from '../../../../../core/src/core/md.module';
import { ServicePlanPriceComponent } from './service-plan-price.component';

describe('ServicePlanPriceComponent', () => {
  let component: ServicePlanPriceComponent;
  let fixture: ComponentFixture<ServicePlanPriceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServicePlanPriceComponent],
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
    fixture = TestBed.createComponent(ServicePlanPriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
