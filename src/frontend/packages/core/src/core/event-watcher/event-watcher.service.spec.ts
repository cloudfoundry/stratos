import { inject, TestBed } from '@angular/core/testing';

import { CoreModule } from '../core.module';
import { EventWatcherService } from './event-watcher.service';

describe('EventWatcherService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventWatcherService],
      imports: [
        CoreModule
      ]
    });
  });

  it('should be created', inject([EventWatcherService], (service: EventWatcherService) => {
    expect(service).toBeTruthy();
  }));
});
