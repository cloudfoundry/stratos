import { inject, TestBed } from '@angular/core/testing';

import { AppStoreModule } from '../../store/store.module';
import { ApplicationService } from './application.service';

describe('ApplicationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppStoreModule],
      providers: [ApplicationService]
    });
  });

  it('should be created', inject([ApplicationService], (service: ApplicationService) => {
    expect(service).toBeTruthy();
  }));
});
