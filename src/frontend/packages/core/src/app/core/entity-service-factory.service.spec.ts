import { TestBed, inject } from '@angular/core/testing';

import { EntityServiceFactory } from './entity-service-factory.service';
import { createBasicStoreModule } from '../test-framework/store-test-helper';
import { EntityMonitorFactory } from '../shared/monitors/entity-monitor.factory.service';

describe('EntityServiceFactoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EntityServiceFactory, EntityMonitorFactory],
      imports: [
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([EntityServiceFactory], (service: EntityServiceFactory) => {
    expect(service).toBeTruthy();
  }));
});
