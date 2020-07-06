import { TestBed } from '@angular/core/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from '../../test-framework/core-test.modules';
import { CoreModule } from '../core/core.module';
import { GlobalEventService } from './global-events.service';
import { SharedModule } from './shared.module';


describe('GlobalEventsService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      CoreModule,
      SharedModule,
      CoreTestingModule,
      createBasicStoreModule()
    ]
  }));

  it('should be created', () => {
    const service: GlobalEventService = TestBed.get(GlobalEventService);
    expect(service).toBeTruthy();
  });
});
