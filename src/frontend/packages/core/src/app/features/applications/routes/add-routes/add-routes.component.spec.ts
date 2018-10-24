import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { appReducers } from '../../../../store/reducers.module';
import { ApplicationServiceMock } from '../../../../test-framework/application-service-helper';
import { getInitialTestStoreState } from '../../../../test-framework/store-test-helper';
import { ApplicationService } from '../../application.service';
import { AddRoutesComponent } from './add-routes.component';
import { MapRoutesComponent } from '../map-routes/map-routes.component';

describe('AddRoutesComponent', () => {
  let component: AddRoutesComponent;
  let fixture: ComponentFixture<AddRoutesComponent>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddRoutesComponent, MapRoutesComponent],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

