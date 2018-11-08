import { TestBed, inject } from '@angular/core/testing';

import { EntityServiceFactory } from './entity-service-factory.service';
import { EntityMonitorFactory } from '../shared/monitors/entity-monitor.factory.service';
import { createBasicStoreModule } from '../../test-framework/store-test-helper';

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
