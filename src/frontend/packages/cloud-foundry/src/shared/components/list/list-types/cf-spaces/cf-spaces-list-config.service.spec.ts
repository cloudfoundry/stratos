import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateCfStoreModules, CloudFoundryOrganizationServiceMock } from '@test-framework/cf';
import { CloudFoundryOrganizationService } from '../../../../../features/cf/services/cloud-foundry-organization.service';
import { CfSpacesListConfigService } from './cf-spaces-list-config.service';

describe('CfOrgsSpaceListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
      ],
      providers: [
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        CfSpacesListConfigService,
        provideZonelessChangeDetection(),
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfSpacesListConfigService);
    expect(service).toBeTruthy();
  });
});
