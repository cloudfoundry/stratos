import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsTabComponent } from './events-tab.component';
import { StoreModule } from '@ngrx/store';
import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { MDAppModule } from '../../../../core/md.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { entitiesReducer } from '../../../../store/reducers/entity.reducer';
import { paginationReducer } from '../../../../store/reducers/pagination.reducer';
import { appMetaDataReducer } from '../../../../store/reducers.module';
import { getInitialTestStoreState } from '../../../../test-framework/store-test-helper';
import { ApplicationService } from '../../application.service';
import { ApplicationStateService } from '../summary-tab/application-state/application-state.service';
import { EventTabActorIconPipe } from './event-tab-actor-icon.pipe';
import { ApplicationEnvVarsService } from '../summary-tab/application-env-vars.service';

describe('EventsTabComponent', () => {
  let component: EventsTabComponent;
  let fixture: ComponentFixture<EventsTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        EventsTabComponent,
        EventTabActorIconPipe
      ],
      imports: [
        StoreModule,
        CoreModule,
        SharedModule,
        MDAppModule,
        BrowserAnimationsModule,
        StoreModule.forRoot({
          entities: entitiesReducer,
          pagination: paginationReducer,
          appMetadata: appMetaDataReducer,
        }, {
            initialState: getInitialTestStoreState()
          })
      ],
      providers: [
        ApplicationService,
        ApplicationStateService,
        ApplicationEnvVarsService,
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
