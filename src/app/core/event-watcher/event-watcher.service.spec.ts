import { inject, TestBed } from '@angular/core/testing';

import { EventWatcherService } from './event-watcher.service';

describe('EventWatcherService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventWatcherService]
    });
  });

  it('should be created', inject([EventWatcherService], (service: EventWatcherService) => {
    expect(service).toBeTruthy();
  }));
});
