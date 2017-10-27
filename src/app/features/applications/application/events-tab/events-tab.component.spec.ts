import { CoreModule } from '../../../../core/core.module';
import { MDAppModule } from '../../../../core/md.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsTabComponent } from './events-tab.component';
import { SharedModule } from '../../../../shared/shared.module';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../../store/reducers.module';
import { getInitialTestStoreState } from '../../../../test-framework/store-test-helper';
import { ApplicationService } from '../../application.service';
import { ApplicationStateService } from '../summary-tab/application-state/application-state.service';
import { ApplicationEnvVarsService } from '../summary-tab/application-env-vars.service';

describe('EventsTabComponent', () => {
  let component: EventsTabComponent;
  let fixture: ComponentFixture<EventsTabComponent>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EventsTabComponent],
      providers: [
        ApplicationService,
        ApplicationStateService,
        ApplicationEnvVarsService,
      ],
      imports: [
        MDAppModule,
        SharedModule,
        CoreModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
