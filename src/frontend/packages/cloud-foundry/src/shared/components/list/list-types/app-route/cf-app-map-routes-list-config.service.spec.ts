import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { ApplicationServiceMock } from '../../../../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfAppMapRoutesListConfigService } from './cf-app-map-routes-list-config.service';

describe('CfAppMapRoutesListConfigService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        ...generateCfStoreModules(),
        CfAppMapRoutesListConfigService,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        DatePipe
      ]
    }).compileComponents();
  });

  it('should be created', () => {
    const service = TestBed.inject(CfAppMapRoutesListConfigService);
    expect(service).toBeTruthy();
  });
});
