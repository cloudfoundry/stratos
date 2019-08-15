import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../core/src/core/core.module';
import { SteppersModule } from '../../../../../../core/src/shared/components/stepper/steppers.module';
import { SharedModule } from '../../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../../core/tab-nav.service';
import { ApplicationServiceMock } from '../../../../../../core/test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../../../core/test-framework/store-test-helper';
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
          { provide: ApplicationService, useClass: ApplicationServiceMock },
          TabNavService
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
