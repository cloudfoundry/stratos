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
