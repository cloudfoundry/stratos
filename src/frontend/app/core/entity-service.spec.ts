import { inject, TestBed } from '@angular/core/testing';
import { HttpModule, XHRBackend } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { Store } from '@ngrx/store';
import { schema as normalizrSchema } from 'normalizr';
import { filter, first, tap, pairwise, map } from 'rxjs/operators';
import { ENTITY_SERVICE } from '../shared/entity.tokens';
import { EntityMonitor } from '../shared/monitors/entity-monitor';
import { EntityMonitorFactory } from '../shared/monitors/entity-monitor.factory.service';
import { GetApplication } from '../store/actions/application.actions';
import { APIResponse } from '../store/actions/request.actions';
import { AppState } from '../store/app-state';
import { applicationSchemaKey, entityFactory } from '../store/helpers/entity-factory';
import { completeApiRequest, startApiRequest, failApiRequest } from '../store/reducers/api-request-reducer/request-helpers';
import { RequestSectionKeys } from '../store/reducers/api-request-reducer/types';
import { NormalizedResponse } from '../store/types/api.types';
import { ICFAction, IRequestAction } from '../store/types/request.types';
import { generateTestEntityServiceProvider } from '../test-framework/entity-service.helper';
import { createBasicStoreModule } from '../test-framework/store-test-helper';
import { EntityService } from './entity-service';
import { EntityServiceFactory } from './entity-service-factory.service';


const appId = '4e4858c4-24ab-4caf-87a8-7703d1da58a0';
const cfId = 'cf123';

describe('EntityServiceService', () => {
  function createTestService(
    store: Store<AppState>,
    guid: string,
    schema: normalizrSchema.Entity,
    action: IRequestAction,
  ) {
    const entityMonitor = new EntityMonitor(store, guid, schema.key, schema);
    return new EntityService(store, entityMonitor, action, false, RequestSectionKeys.CF);
  }

  function getAllTheThings(store: Store<AppState>, guid: string, schemaKey: string) {
    const entities = {
      [applicationSchemaKey]: {
        [guid]: {
          guid,
          test: 123
        }
      }
    };
    const action = {
      actions: ['fa', 'k', 'e'],
      options: {},
      entityKey: applicationSchemaKey,
      guid,
      type: 'test-action'
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
    return {
      action,
      entities,
      schema,
      entityService,
      res
    };
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

  it('should get application', (done) => {
    inject([Store], (store: Store<AppState>) => {
      const guid = 'GUID123456789x';
      const {
        action,
        entityService,
        res
      } = getAllTheThings(store, guid, applicationSchemaKey);
      startApiRequest(store, action);
      entityService.entityObs$.pipe(
        filter(ent => !!ent.entity),
        first(),
        tap(ent => {
          expect(ent.entity).toEqual(res.response.entities[applicationSchemaKey][guid]);
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
    inject([Store], (store: Store<AppState>) => {
      const guid = '1234567890';
      const {
        action,
        entityService,
        res
      } = getAllTheThings(store, guid, applicationSchemaKey);
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
    inject([Store], (store: Store<AppState>) => {
      const guid = '1234567890';
      const {
        action,
        entityService,
        res
      } = getAllTheThings(store, guid, applicationSchemaKey);
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
    inject([Store], (store: Store<AppState>) => {
      const updatingKey = 'upd8ing';
      const guid = `${updatingKey}-1234567890`;
      const {
        action,
        entityService,
        res
      } = getAllTheThings(store, guid, applicationSchemaKey);
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
    inject([Store], (store: Store<AppState>) => {
      const updatingKey = 'upd8ing';
      const guid = `${updatingKey}-1234567890`;
      const {
        action,
        entityService,
        res
      } = getAllTheThings(store, guid, applicationSchemaKey);
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
    inject([Store], (store: Store<AppState>) => {
      const updatingKey = 'upd8ing';
      const guid = `${updatingKey}-1234567890`;
      const {
        action,
        entityService,
        res
      } = getAllTheThings(store, guid, applicationSchemaKey);
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
    inject([Store], (store: Store<AppState>) => {
      const guid = `1-delete123`;
      const {
        action,
        entityService,
        res
      } = getAllTheThings(store, guid, applicationSchemaKey);
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
    inject([Store], (store: Store<AppState>) => {
      const guid = `1234567890123124hjvgh`;
      const {
        action,
        entityService,
        res
      } = getAllTheThings(store, guid, applicationSchemaKey);
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
