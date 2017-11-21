import { RouterTestingModule } from '@angular/router/testing';
import { getInitialTestStoreState } from '../test-framework/store-test-helper';
import { appReducers } from '../store/reducers.module';
import { ResponseOptions, XHRBackend, HttpModule } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { Store, StoreModule } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApplicationSchema, GetApplication } from '../store/actions/application.actions';
import { TestBed, inject } from '@angular/core/testing';

import { EntityService } from './entity-service';

const appId = '4e4858c4-24ab-4caf-87a8-7703d1da58a0';
const cfId = '01ccda9d-8f40-4dd0-bc39-08eea68e364f';
const entityServiceFactory = (
  store: Store<AppState>
) => {
  return new EntityService(
    store,
    ApplicationSchema.key,
    ApplicationSchema,
    appId,
    new GetApplication(appId, cfId)
  );
};

fdescribe('EntityServiceService', () => {
  beforeEach(() => {
    const initialState = getInitialTestStoreState();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EntityService,
          useFactory: entityServiceFactory,
          deps: [Store]
        },
        {
          provide: XHRBackend,
          useClass: MockBackend
        }
      ],
      imports: [
        HttpModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
      ]
    });
  });

  it('should be created', inject([EntityService], (service: EntityService) => {
    expect(service).toBeTruthy();
  }));

  it('should poll', (done) => {
    inject([EntityService, XHRBackend], (service: EntityService, mockBackend: MockBackend) => {
      // mockBackend.connections.subscribe(connection => {
      //   connection.mockRespond(new Response(new ResponseOptions({
      //     body: JSON.stringify(applicationRes)
      //   })));
      // });
      const sub = service.poll(1).subscribe(a => {
        done();
        sub.unsubscribe();
      });
    })();
  });
});
