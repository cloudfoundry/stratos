import { StoreTestingModule } from '../testing/src/store-test.module';
import { inject, TestBed } from '@angular/core/testing';

import { createBasicStoreModule } from '../testing/src/store-test-helper';
import { EntityMonitorFactory } from './monitors/entity-monitor.factory.service';
import { EntityServiceFactory } from './entity-service-factory.service';

describe('EntityServiceFactoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EntityServiceFactory, EntityMonitorFactory],
      imports: [
        StoreTestingModule,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([EntityServiceFactory], (service: EntityServiceFactory) => {
    expect(service).toBeTruthy();
  }));
});
