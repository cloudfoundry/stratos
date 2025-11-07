import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { generateTestApplicationServiceProvider } from "@test-framework/application-service-helper";
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CfAppVariablesListConfigService } from './cf-app-variables-list-config.service';

describe('CfAppVariablesListConfigService', () => {

  beforeEach(() => {
    const cfGuid = 'cfGuid';
    const appGuid = 'appGuid';
    TestBed.configureTestingModule({
      providers: [
        
        CfAppVariablesListConfigService,
        generateTestApplicationServiceProvider(appGuid, cfGuid),

        provideZonelessChangeDetection(),
      ],
      imports: [
        generateCfStoreModules(),
        CommonModule,
        SharedModule,
        RouterTestingModule,
    ]
    });
  });

  it('should be created', inject(
    [CfAppVariablesListConfigService],
    (service: CfAppVariablesListConfigService) => {
      expect(service).toBeTruthy();
    }
  ));
});
