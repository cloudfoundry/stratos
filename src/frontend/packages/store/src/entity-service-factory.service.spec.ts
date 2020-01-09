import { StoreTestingModule } from './../test-framework/store-test.module';
import { inject, TestBed } from '@angular/core/testing';

import { createBasicStoreModule } from '../../core/test-framework/store-test-helper';
import { EntityMonitorFactory } from '../../core/src/shared/monitors/entity-monitor.factory.service';
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
