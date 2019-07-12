import { inject, TestBed } from '@angular/core/testing';
import { HttpModule, XHRBackend } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { Store } from '@ngrx/store';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import { GetApplication } from '../../../cloud-foundry/src/actions/application.actions';
import { APIResponse } from '../../../store/src/actions/request.actions';
import { GeneralAppState } from '../../../store/src/app-state';
import { EntitySchema } from '../../../store/src/helpers/entity-schema';
import {
  completeApiRequest,
  failApiRequest,
  startApiRequest,
} from '../../../store/src/reducers/api-request-reducer/request-helpers';
import { RequestSectionKeys } from '../../../store/src/reducers/api-request-reducer/types';
import { NormalizedResponse } from '../../../store/src/types/api.types';
import { ICFAction, EntityRequestAction } from '../../../store/src/types/request.types';
import { EntityCatalogueTestHelper } from '../../test-framework/entity-catalogue-test-helpers';
import { generateTestEntityServiceProvider } from '../../test-framework/entity-service.helper';
import { createEntityStore, TestStoreEntity } from '../../test-framework/store-test-helper';
import { ENTITY_SERVICE } from '../shared/entity.tokens';
import { EntityMonitor } from '../shared/monitors/entity-monitor';
import { EntityMonitorFactory } from '../shared/monitors/entity-monitor.factory.service';
import { StratosBaseCatalogueEntity } from './entity-catalogue/entity-catalogue-entity';
import { EntityCatalogueEntityConfig } from './entity-catalogue/entity-catalogue.types';
import { EntityService } from './entity-service';
import { EntityServiceFactory } from './entity-service-factory.service';

const endpointType = 'endpoint1';
const entitySchema = new EntitySchema('child2', endpointType);

const appId = '4e4858c4-24ab-4caf-87a8-7703d1da58a0';
const cfId = 'cf123';

const entityType = 'key';

const catalogueEntity = new StratosBaseCatalogueEntity({
  type: entityType,
  schema: new EntitySchema(
    entityType,
    'endpoint'
  ),
  label: 'Entity',
  labelPlural: 'Entities',
});

describe('EntityServiceService', () => {
  beforeAll(() => {
    const helper = new EntityCatalogueTestHelper(
      spyOn,
      {
        catalogueEntities: [
          [entitySchema, catalogueEntity]
        ]
      }
    );
    helper.mockGetEntityResponses();
  });
  function createTestService(
    store: Store<GeneralAppState>,
    guid: string,
    schema: EntitySchema,
    action: EntityRequestAction,
  ) {

    const entityMonitor = new EntityMonitor(store, guid, schema.key, schema);
    return new EntityService(store, entityMonitor, action, false, RequestSectionKeys.CF);
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
    const action = {
      actions: ['fa', 'k', 'e'],
      options: {},
      entityType: entitySchema.entityType,
      endpointType: entitySchema.endpointType,
      guid,
      type: 'test-action'
    } as ICFAction;

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
    return {
      action,
      entities,
      entitySchema,
      entityService,
      res
    };
  }
  beforeEach(() => {
    const entityMap = new Map<EntityCatalogueEntityConfig, Array<TestStoreEntity | string>>([
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
    TestBed.configureTestingModule({
      providers: [
        EntityServiceFactory,
        EntityMonitorFactory,
        generateTestEntityServiceProvider(
          appId,
          entitySchema,
          new GetApplication(appId, cfId)
        ),
        {
          provide: XHRBackend,
          useClass: MockBackend
        }
      ],
      imports: [
        HttpModule,
        createEntityStore(entityMap),
      ]
    });
  });

  it('should be created', inject([ENTITY_SERVICE], (service: EntityService) => {
    expect(service).toBeTruthy();
  }));

  it('should poll', (done) => {
    inject([ENTITY_SERVICE, XHRBackend], (service: EntityService, mockBackend: MockBackend) => {
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
        res
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
      failApiRequest(store, action, res);
    })();
  });

  it('should fail previously fetched entity', (done) => {
    inject([Store], (store: Store<GeneralAppState>) => {
      const guid = '1234567890';
      const {
        action,
        entityService,
        res
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
      failApiRequest(store, action, res);
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
      action.options.method = 'delete';
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
      action.options.method = 'delete';
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
        res
      } = getAllTheThings(store, guid, entitySchema.key);
      startApiRequest(store, action);
      completeApiRequest(store, action, res);
      action.options.method = 'delete';
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
          failApiRequest(store, action, res, 'delete');
        })
      ).subscribe();

    })();
  });

});
