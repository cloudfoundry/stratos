import { HttpClientModule, HttpRequest, HttpXhrBackend } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { Action, Store } from '@ngrx/store';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import { STRATOS_ENDPOINT_TYPE } from '../../core/src/base-entity-schemas';
import { ENTITY_SERVICE } from '../../core/src/shared/entity.tokens';
import { generateTestEntityServiceProvider } from '../../core/test-framework/entity-service.helper';
import { createEntityStore, TestStoreEntity } from '../testing/src/store-test-helper';
import { APIResponse } from './actions/request.actions';
import { GeneralAppState } from './app-state';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES } from './entity-catalog-test.module';
import { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntityCatalogEntityConfig, IStratosEndpointDefinition } from './entity-catalog/entity-catalog.types';
import { failedEntityHandler } from './entity-request-pipeline/entity-request-base-handlers/fail-entity-request.handler';
import { PipelineResult } from './entity-request-pipeline/entity-request-pipeline.types';
import { EntityService } from './entity-service';
import { EntityServiceFactory } from './entity-service-factory.service';
import { EntitySchema } from './helpers/entity-schema';
import { EntityMonitor } from './monitors/entity-monitor';
import { EntityMonitorFactory } from './monitors/entity-monitor.factory.service';
import { completeApiRequest, startApiRequest } from './reducers/api-request-reducer/request-helpers';
import { NormalizedResponse } from './types/api.types';
import { EntityRequestAction, ICFAction } from './types/request.types';

function getActionDispatcher(store: Store<any>) {
  return (action: Action) => {
    store.dispatch(action);
  };
}

const endpointType = 'endpoint1';
const entityType = 'entity1';
const entitySchema = new EntitySchema(entityType, endpointType);
const createAction = (guid: string) => {
  return {
    actions: ['fa', 'k', 'e'],
    options: new HttpRequest<any>('GET', 'b'),
    entityType: entitySchema.entityType,
    endpointType: entitySchema.endpointType,
    guid,
    type: 'test-action'
  } as ICFAction;
};

const catalogEndpointEntity = new StratosBaseCatalogEntity({
  type: endpointType,
  schema: new EntitySchema(
    endpointType,
    STRATOS_ENDPOINT_TYPE
  ),
  label: 'Endpoint',
  labelPlural: 'Endpoints',
  logoUrl: '',
  authTypes: []
});


const catalogEntity = new StratosBaseCatalogEntity({
  endpoint: catalogEndpointEntity.definition as IStratosEndpointDefinition,
  type: entityType,
  schema: new EntitySchema(
    entityType,
    endpointType
  ),
  label: 'Entity',
  labelPlural: 'Entities',

});

function createTestService(
  store: Store<GeneralAppState>,
  guid: string,
  schema: EntitySchema,
  action: EntityRequestAction,
) {
  const entityMonitor = new EntityMonitor(store, guid, schema.key, schema);
  return new EntityService(store, entityMonitor, action);
}

function getAllTheThings(store: Store<GeneralAppState>, guid: string, schemaKey: string) {
  const entities = {
    [entitySchema.key]: {
      [guid]: {
        guid,
        test: 123
      }
    }
  };
  const action = createAction(guid);

  const entityService = createTestService(
    store,
    guid,
    entitySchema,
    action
  );

  const data = {
    entities,
    result: [guid]
  } as NormalizedResponse;
  const res = new APIResponse();
  res.response = data;

  const pipelineRes: PipelineResult = {
    success: true
  };

  return {
    action,
    entities,
    entitySchema,
    entityService,
    res,
    pipelineRes
  };
}

describe('EntityServiceService', () => {
  beforeEach(() => {
    const entityMap = new Map<EntityCatalogEntityConfig, Array<TestStoreEntity | string>>([
      [
        entitySchema,
        [
          {
            guid: 'GUID123456789x',
            data: {
              test: 123
            }
          },
          '1234567890',
          'upd8ing-1234567890',
          '1-delete123',
          '1234567890123124hjvgh'
        ]
      ]
    ]);

    const action = createAction('123');
    TestBed.configureTestingModule({
      providers: [
        EntityServiceFactory,
        EntityMonitorFactory,
        generateTestEntityServiceProvider(
          action.guid,
          entitySchema,
          action
        ),
        {
          provide: HttpXhrBackend,
          useClass: HttpTestingController
        }
      ],
      imports: [
        HttpClientModule,
        createEntityStore(entityMap),
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES, useValue: [
                catalogEntity
              ]
            }
          ]
        },
      ]
    });
  });

  it('should be created', inject([ENTITY_SERVICE], (service: EntityService) => {
    expect(service).toBeTruthy();
  }));

  it('should poll', (done) => {
    inject([ENTITY_SERVICE, HttpXhrBackend], (service: EntityService, mockBackend: HttpTestingController) => {
      const sub = service.poll(1, '_root_').subscribe(a => {
        sub.unsubscribe();
        expect('polled once').toEqual('polled once');
        done();
      });
    })();
  });

  it('should get application', (done) => {
    inject([Store], (store: Store<GeneralAppState>) => {
      const guid = 'GUID123456789x';
      const {
        action,
        entityService,
        res
      } = getAllTheThings(store, guid, entitySchema.key);
      startApiRequest(store, action);
      entityService.entityObs$.pipe(
        filter(ent => !!ent.entity),
        first(),
        tap(ent => {
          expect(ent.entity).toEqual(res.response.entities[entitySchema.key][guid]);
          done();
        })
      ).subscribe();
      entityService.isFetchingEntity$.pipe(
        filter(isFetching => isFetching),
        first(),
        tap(() => completeApiRequest(store, action, res))
      ).subscribe();
    })();
  });

  it('should fail new entity', (done) => {
    inject([Store], (store: Store<GeneralAppState>) => {
      const guid = '1234567890';
      const {
        action,
        entityService,
        pipelineRes
      } = getAllTheThings(store, guid, entitySchema.key);
      startApiRequest(store, action);
      entityService.entityObs$.pipe(
        filter(ent => ent.entityRequestInfo.error),
        first(),
        tap(ent => {
          expect(true).toEqual(true);
          done();
        })
      ).subscribe();
      failedEntityHandler(getActionDispatcher(store), catalogEntity, 'fetch', action, pipelineRes);
    })();
  });

  it('should fail previously fetched entity', (done) => {
    inject([Store], (store: Store<GeneralAppState>) => {
      const guid = '1234567890';
      const {
        action,
        entityService,
        res,
        pipelineRes
      } = getAllTheThings(store, guid, entitySchema.key);
      startApiRequest(store, action);
      completeApiRequest(store, action, res);
      entityService.entityObs$.pipe(
        filter(ent => ent.entityRequestInfo.error),
        first(),
        tap(ent => {
          expect(ent.entityRequestInfo.error).toEqual(true);
          done();
        })
      ).subscribe();
      failedEntityHandler(getActionDispatcher(store), catalogEntity, 'fetch', action, pipelineRes);
    })();
  });

  it('should set busy new entity', (done) => {
    inject([Store], (store: Store<GeneralAppState>) => {
      const updatingKey = 'upd8ing';
      const guid = `${updatingKey}-1234567890`;
      const {
        action,
        entityService,
        res
      } = getAllTheThings(store, guid, entitySchema.key);
      action.updatingKey = updatingKey;
      startApiRequest(store, action);
      entityService.entityObs$.pipe(
        filter(ent => !!ent.entityRequestInfo.updating[updatingKey].busy),
        first(),
        tap(ent => {
          expect(ent.entityRequestInfo.updating[updatingKey].busy).toEqual(true);
          completeApiRequest(store, action, res);
        })
      ).subscribe();
      entityService.entityObs$.pipe(
        filter(ent => !ent.entityRequestInfo.updating[updatingKey].busy),
        first(),
        tap(ent => {
          expect(ent.entityRequestInfo.updating[updatingKey].busy).toEqual(false);
          done();
        })
      ).subscribe();
    })();
  });

  it('should set busy', (done) => {
    inject([Store], (store: Store<GeneralAppState>) => {
      const updatingKey = 'upd8ing';
      const guid = `${updatingKey}-1234567890`;
      const {
        action,
        entityService,
        res
      } = getAllTheThings(store, guid, entitySchema.key);
      startApiRequest(store, action);
      completeApiRequest(store, action, res);
      action.updatingKey = updatingKey;
      startApiRequest(store, action);
      entityService.entityObs$.pipe(
        filter(ent => !!ent.entityRequestInfo.updating[updatingKey].busy),
        first(),
        tap(ent => {
          expect(ent.entityRequestInfo.updating[updatingKey].busy).toEqual(true);
          completeApiRequest(store, action, res);
        })
      ).subscribe();
      entityService.entityObs$.pipe(
        filter(ent => !ent.entityRequestInfo.updating[updatingKey].busy),
        first(),
        tap(ent => {
          expect(ent.entityRequestInfo.updating[updatingKey].busy).toEqual(false);
          done();
        })
      ).subscribe();
    })();
  });

  it('should set deleted new entity', (done) => {
    inject([Store], (store: Store<GeneralAppState>) => {
      const updatingKey = 'upd8ing';
      const guid = `${updatingKey}-1234567890`;
      const {
        action,
        entityService,
        res
      } = getAllTheThings(store, guid, entitySchema.key);
      action.options = action.options.clone({
        method: 'DELETE'
      });
      startApiRequest(store, action);
      entityService.entityObs$.pipe(
        filter(ent => !!ent.entityRequestInfo.deleting.busy),
        first(),
        tap(ent => {
          expect(ent.entityRequestInfo.deleting.busy).toEqual(true);
          completeApiRequest(store, action, res);
        })
      ).subscribe();
      entityService.entityObs$.pipe(
        filter(ent => !ent.entityRequestInfo.deleting.busy),
        first(),
        tap(ent => {
          expect(ent.entityRequestInfo.deleting.busy).toEqual(false);
          done();
        })
      ).subscribe();
    })();
  });

  it('should set deleted', (done) => {
    inject([Store], (store: Store<GeneralAppState>) => {
      const guid = `1-delete123`;
      const {
        action,
        entityService,
        res
      } = getAllTheThings(store, guid, entitySchema.key);
      startApiRequest(store, action);
      completeApiRequest(store, action, res);
      action.options = action.options.clone({
        method: 'DELETE'
      });
      startApiRequest(store, action, 'delete');
      entityService.entityObs$.pipe(
        filter(ent => !!ent.entityRequestInfo.deleting.busy),
        first(),
        tap(ent => {
          expect(ent.entityRequestInfo.deleting.busy).toEqual(true);
          completeApiRequest(store, action, res, 'delete');
        })
      ).subscribe();
      entityService.entityObs$.pipe(
        filter(ent => !ent.entityRequestInfo.deleting.busy),
        first(),
        tap(ent => {
          expect(ent.entityRequestInfo.deleting.busy).toEqual(false);
          done();
        })
      ).subscribe();
    })();
  });

  it('should set deleted failed', (done) => {
    inject([Store], (store: Store<GeneralAppState>) => {
      const guid = `1234567890123124hjvgh`;
      const {
        action,
        entityService,
        res,
        pipelineRes
      } = getAllTheThings(store, guid, entitySchema.key);
      startApiRequest(store, action);
      completeApiRequest(store, action, res);
      action.options = action.options.clone({
        method: 'DELETE'
      });
      entityService.entityObs$.pipe(
        pairwise(),
        filter(([x, y]) => x.entityRequestInfo.deleting.busy && !y.entityRequestInfo.deleting.busy),
        first(),
        map(([x, y]) => y),
        tap(ent => {
          expect(ent.entityRequestInfo.deleting.busy).toEqual(false);
          expect(ent.entityRequestInfo.deleting.error).toEqual(true);
          done();
        })
      ).subscribe();

      startApiRequest(store, action, 'delete');

      entityService.entityObs$.pipe(
        filter(ent => !!ent.entityRequestInfo.deleting.busy),
        first(),
        tap(ent => {
          expect(ent.entityRequestInfo.deleting.busy).toEqual(true);
          failedEntityHandler(getActionDispatcher(store), catalogEntity, 'delete', action, pipelineRes);
        })
      ).subscribe();
    })();
  });
});
