import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutesComponent } from './routes.component';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../store/reducers.module';
import { ApplicationService } from '../application.service';
import { ApplicationServiceMock } from '../../../test-framework/application-service-helper';
import { getInitialTestStoreState } from '../../../test-framework/store-test-helper';

describe('RoutesComponent', () => {
  let component: RoutesComponent;
  let fixture: ComponentFixture<RoutesComponent>;
  const initialState = { ...getInitialTestStoreState() };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoutesComponent ],
      imports: [
        CoreModule,
        SharedModule,
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
    fixture = TestBed.createComponent(RoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
