import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { EntityCatalogueHelpers } from '../../../../../../../../core/src/core/entity-catalogue/entity-catalogue.helper';
import { EntityCatalogueEntityConfig } from '../../../../../../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { MDAppModule } from '../../../../../../../../core/src/core/md.module';
import {
  ApplicationStateService,
} from '../../../../../../../../core/src/shared/components/application-state/application-state.service';
import { SharedModule } from '../../../../../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from '../../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { createEntityStoreState, TestStoreEntity } from '../../../../../../../../core/test-framework/store-test-helper';
import {
  getDefaultPaginationEntityState,
} from '../../../../../../../../store/src/reducers/pagination-reducer/pagination-reducer-reset-pagination';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cf-types';
import { CFAppState } from '../../../../../../cf-app-state';
import { appEventEntityType, cfEntityFactory } from '../../../../../../cf-entity-factory';
import { ApplicationService } from '../../../../application.service';
import { ApplicationEnvVarsHelper } from '../build-tab/application-env-vars.service';
import { EventsTabComponent } from './events-tab.component';


fdescribe('EventsTabComponent', () => {
  class ApplicationServiceMock {
    cfGuid = 'mockCfGuid';
    appGuid = 'mockAppGuid';
  }

  let component: EventsTabComponent;
  let fixture: ComponentFixture<EventsTabComponent>;

  const entityMap = new Map<EntityCatalogueEntityConfig, Array<TestStoreEntity | string>>([
    [
      cfEntityFactory(appEventEntityType),
      []
    ],
  ]);
  const initialState = createEntityStoreState(entityMap) as CFAppState;
  initialState.pagination = {
    ...initialState.pagination,
    [EntityCatalogueHelpers.buildEntityKey(appEventEntityType, CF_ENDPOINT_TYPE)]: {
      ['app-events:mockCfGuidmockAppGuid']: getDefaultPaginationEntityState()
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EventsTabComponent],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
        ApplicationEnvVarsHelper,
      ],
      imports: [
        ...generateCfStoreModules(initialState),
        MDAppModule,
        SharedModule,
        CoreModule,
        NoopAnimationsModule,
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
