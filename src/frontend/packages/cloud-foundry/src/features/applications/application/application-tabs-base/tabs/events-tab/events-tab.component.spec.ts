import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Store } from '@ngrx/store';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { MDAppModule } from '../../../../../../../../core/src/core/md.module';
import { SharedModule } from '../../../../../../../../core/src/shared/shared.module';
import {
  getPaginationAction,
} from '../../../../../../../../store/src/entity-catalog/action-orchestrator/action-orchestrator.spec.helpers';
import { EntityCatalogEntityConfig } from '../../../../../../../../store/src/entity-catalog/entity-catalog.types';
import { NormalizedResponse } from '../../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../../store/src/types/pagination.types';
import { WrapperRequestActionSuccess } from '../../../../../../../../store/src/types/request.types';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { cfEntityFactory } from '../../../../../../cf-entity-factory';
import { cfEventEntityType } from '../../../../../../cf-entity-types';
import {
  CloudFoundryEventsListComponent,
} from '../../../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';
import { ApplicationStateService } from '../../../../../../shared/services/application-state.service';
import { ApplicationService } from '../../../../application.service';
import { ApplicationEnvVarsHelper } from '../build-tab/application-env-vars.service';
import { EventsTabComponent } from './events-tab.component';

describe('EventsTabComponent', () => {
  class ApplicationServiceMock {
    cfGuid = 'mockCfGuid';
    appGuid = 'mockAppGuid';
  }

  let component: EventsTabComponent;
  let fixture: ComponentFixture<EventsTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        EventsTabComponent,
        CloudFoundryEventsListComponent
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
        ApplicationEnvVarsHelper
      ],
      imports: [
        ...generateCfStoreModules(),
        MDAppModule,
        SharedModule,
        CoreModule,
        NoopAnimationsModule,
      ]
    })
      .compileComponents();
    const eventsConfig: EntityCatalogEntityConfig = cfEntityFactory(cfEventEntityType);

    const mappedData = {
      entities: {},
      result: []
    } as NormalizedResponse;
    const pagAction: PaginatedAction = {
      type: 'POPULATE_TEST_DATA',
      ...getPaginationAction(),
      ...eventsConfig,
      paginationKey: 'app-events:mockCfGuidmockAppGuid'
    };
    const store = TestBed.get(Store);
    store.dispatch(new WrapperRequestActionSuccess(mappedData, pagAction, 'fetch'));
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
