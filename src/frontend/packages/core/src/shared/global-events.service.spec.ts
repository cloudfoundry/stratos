import { TestBed } from '@angular/core/testing';
import { GlobalEventService } from './global-events.service';


describe('GlobalWarningsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GlobalEventService = TestBed.get(GlobalEventService);
    expect(service).toBeTruthy();
  });
});
