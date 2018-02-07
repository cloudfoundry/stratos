import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../core/core.module';
import { SteppersModule } from '../../../../shared/components/stepper/steppers.module';
import { SharedModule } from '../../../../shared/shared.module';
import { ApplicationServiceMock } from '../../../../test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { ApplicationService } from '../../application.service';
import { AddRoutesComponent } from '../add-routes/add-routes.component';
import { MapRoutesComponent } from '../map-routes/map-routes.component';
import { AddRouteStepperComponent } from './add-route-stepper.component';

describe('AddRouteStepperComponent', () => {
  let component: AddRouteStepperComponent;
  let fixture: ComponentFixture<AddRouteStepperComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [
          AddRouteStepperComponent,
          AddRoutesComponent,
          MapRoutesComponent
        ],
        imports: [
          SteppersModule,
          CoreModule,
          SharedModule,
          createBasicStoreModule(),
          RouterTestingModule,
          NoopAnimationsModule
        ],
        providers: [
          { provide: ApplicationService, useClass: ApplicationServiceMock }
        ]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRouteStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
