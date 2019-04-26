import { TestBed } from '@angular/core/testing';
import { GlobalEventService } from './global-events.service';
import { CoreModule } from '../core/core.module';
import { AppStoreModule } from '../../../store/src/store.module';
import { SharedModule } from './shared.module';
import { createBasicStoreModule } from '../../test-framework/store-test-helper';


describe('GlobalEventsService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      CoreModule,
      SharedModule,
      createBasicStoreModule()
    ]
  }));

  it('should be created', () => {
    const service: GlobalEventService = TestBed.get(GlobalEventService);
    expect(service).toBeTruthy();
  });
});
