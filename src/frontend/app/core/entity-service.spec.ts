import { inject, TestBed } from '@angular/core/testing';
import { HttpModule, XHRBackend } from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import { EntityMonitorFactory } from '../shared/monitors/entity-monitor.factory.service';
import { GetApplication } from '../store/actions/application.actions';
import { applicationSchemaKey, entityFactory } from '../store/helpers/entity-factory';
import { generateTestEntityServiceProvider } from '../test-framework/entity-service.helper';
import { createBasicStoreModule } from '../test-framework/store-test-helper';
import { EntityService } from './entity-service';
import { EntityServiceFactory } from './entity-service-factory.service';
import { ENTITY_SERVICE } from '../shared/entity.tokens';
import { Store } from '@ngrx/store';
import { startApiRequest, completeApiRequest } from '../store/reducers/api-request-reducer/request-helpers';
import { AppState } from '../store/app-state';
import { ICFAction, IRequestAction } from '../store/types/request.types';
import { APIResponse } from '../store/actions/request.actions';
import { NormalizedResponse } from '../store/types/api.types';
import { entityServiceFactory } from '../features/applications/application/application-base.component';
import { RequestSectionKeys } from '../store/reducers/api-request-reducer/types';
import { EntityMonitor } from '../shared/monitors/entity-monitor';
import { first, filter, tap } from 'rxjs/operators';
import { schema } from 'normalizr';

const appId = '4e4858c4-24ab-4caf-87a8-7703d1da58a0';
const cfId = 'cf123';

describe('EntityServiceService', () => {
  function createTestService(
    store: Store<AppState>,
    guid: string,
    schema: schema.Entity,
    action: IRequestAction,
  ) {
    const entityMonitor = new EntityMonitor(store, guid, schema.key, schema);
    return new EntityService(this.store, entityMonitor, action, false, RequestSectionKeys.CF);
  }
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EntityServiceFactory,
        EntityMonitorFactory,
        generateTestEntityServiceProvider(
          appId,
          entityFactory(applicationSchemaKey),
          new GetApplication(appId, cfId)
        ),
        {
          provide: XHRBackend,
          useClass: MockBackend
        }
      ],
      imports: [
        HttpModule,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([ENTITY_SERVICE], (service: EntityService) => {
    expect(service).toBeTruthy();
  }));

  it('should poll', (done) => {
    inject([ENTITY_SERVICE, XHRBackend], (service: EntityService, mockBackend: MockBackend) => {
      const sub = service.poll(1).subscribe(a => {
        sub.unsubscribe();
        expect(sub.closed).toBeTruthy();
        done();
      });
    })();
  });

  fit('should get application', (done) => {
    inject([ENTITY_SERVICE, Store], (store: Store<AppState>) => {
      const guid = 'GUID123456789x';

      const entities = {
        [guid]: {
          guid,
          test: 123
        }
      };
      const action = {
        actions: ['fa', 'k', 'e'],
        options: {},
        entityKey: applicationSchemaKey,
        guid
      } as ICFAction;
      const schema = entityFactory(applicationSchemaKey);
      const entityService = createTestService(
        store,
        guid,
        schema,
        action
      );

      const data = {
        entities,
        result: [guid]
      } as NormalizedResponse;
      const res = new APIResponse();
      res.response = data;
      startApiRequest(store, action);
      entityService.entityObs$.pipe(
        filter(ent => !!ent.entity),
        first(),
        tap(ent => {
          expect(ent).toBe(res.response[guid]);
          done();
        })
      );
      entityService.isFetchingEntity$.pipe(
        filter(isFetching => isFetching),
        first(),
        tap(() => completeApiRequest(store, action, res))
      ).subscribe();

    })();
  });
});
