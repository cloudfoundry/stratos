import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { StoreModule } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../../../core/core.module';
import { SharedModule } from '../../../../shared.module';

import { DatePipe } from '@angular/common';
import { TestBed, inject } from '@angular/core/testing';

import { CfAppConfigService } from '../../list-configs/cf-app-config.service';

describe('CfAppConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppConfigService,
        DatePipe
      ],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        createBasicStoreModule()
      ]
    });
  });

  it('should be created', inject([CfAppConfigService], (service: CfAppConfigService) => {
    expect(service).toBeTruthy();
  }));
});
