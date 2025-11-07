import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Store } from '@ngrx/store';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { MDAppModule } from '../../../../../../../../core/src/core/md.module';
import { SharedModule } from '../../../../../../../../core/src/shared/shared.module';
import {
  getPaginationAction,
} from '@stratosui/store/entity-catalog/action-orchestrator/action-orchestrator.spec.helpers';
import { EntityCatalogEntityConfig } from '@stratosui/store/entity-catalog/entity-catalog.types';
import { NormalizedResponse } from '@stratosui/store/types/api.types';
import { PaginatedAction } from '@stratosui/store/types/pagination.types';
import { WrapperRequestActionSuccess } from '@stratosui/store/types/request.types';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { cfEntityFactory } from '../../../../../../cf-entity-factory';
import { cfEventEntityType } from '../../../../../../cf-entity-types';
import {
  CloudFoundryEventsListComponent,
} from '../../../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';
import { ApplicationStateService } from '../../../../../../shared/services/application-state.service';
import { ApplicationService } from '../../../../application.service';
import { ApplicationEnvVarsHelper } from '../build-tab/application-env-vars.service';
import { EventsTabComponent } from './events-tab.component';
import { EntityServiceFactory } from '@stratosui/store/entity-service-factory.service';

describe('EventsTabComponent', () => {
  class ApplicationServiceMock {
    cfGuid = 'mockCfGuid';
    appGuid = 'mockAppGuid';
  }

  let component: EventsTabComponent;
  let fixture: ComponentFixture<EventsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        EntityServiceFactory,
        
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
        ApplicationEnvVarsHelper,

        provideZonelessChangeDetection(),
      ],
      imports: [
        EventsTabComponent,
        CloudFoundryEventsListComponent,
        ...generateCfStoreModules(),
        MDAppModule,
        SharedModule,
        CoreModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();

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
    const store = TestBed.inject(Store);
    store.dispatch(new WrapperRequestActionSuccess(mappedData, pagAction, 'fetch'));

    fixture = TestBed.createComponent(EventsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
