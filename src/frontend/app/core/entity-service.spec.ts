import { generateTestEntityServiceProvider } from '../test-framework/entity-service.helper';
import { RouterTestingModule } from '@angular/router/testing';
import { ResponseOptions, XHRBackend, HttpModule } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { Store, StoreModule } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApplicationSchema, GetApplication } from '../store/actions/application.actions';
import { TestBed, inject } from '@angular/core/testing';

import { EntityService } from './entity-service';
import { createBasicStoreModule } from '../test-framework/store-test-helper';
import { EntityServiceFactory } from './entity-service-factory.service';
import { EntityMonitorFactory } from '../shared/monitors/entity-monitor.factory.service';

const appId = '4e4858c4-24ab-4caf-87a8-7703d1da58a0';
const cfId = '01ccda9d-8f40-4dd0-bc39-08eea68e364f';

describe('EntityServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EntityServiceFactory,
        EntityMonitorFactory,
        generateTestEntityServiceProvider(
          appId,
          ApplicationSchema,
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

  it('should be created', inject([EntityService], (service: EntityService) => {
    expect(service).toBeTruthy();
  }));

  it('should poll', (done) => {
    inject([EntityService, XHRBackend], (service: EntityService, mockBackend: MockBackend) => {
      const sub = service.poll(1).subscribe(a => {
        done();
        sub.unsubscribe();
      });
    })();
  });
});
