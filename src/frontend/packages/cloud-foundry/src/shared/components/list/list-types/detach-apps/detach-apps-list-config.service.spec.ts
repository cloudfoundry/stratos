import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { DetachAppsListConfigService } from "./detach-apps-list-config.service";
describe('DetachAppsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DetachAppsListConfigService,
        DatePipe, {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                serviceInstanceId: 'serviceInstanceId',
                endpointId: 'endpointId'
              }
            }
          }
        },
      ],
      imports: [generateCfBaseTestModules()],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(DetachAppsListConfigService);
    expect(service).toBeTruthy();
  });
});
