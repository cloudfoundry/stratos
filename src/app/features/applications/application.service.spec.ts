import { inject, TestBed } from '@angular/core/testing';

import { AppStoreModule } from '../../store/store.module';
import { ApplicationService } from './application.service';
import { ApplicationsModule } from './applications.module';

describe('ApplicationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AppStoreModule,
        ApplicationsModule
      ],
      providers: []
    });
  });

  it('should be created', inject([ApplicationService], (service: ApplicationService) => {
    expect(service).toBeTruthy();
  }));
});
