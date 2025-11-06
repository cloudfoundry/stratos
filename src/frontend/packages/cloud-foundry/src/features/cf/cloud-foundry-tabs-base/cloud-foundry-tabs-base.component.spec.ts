import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { populateStoreWithTestEndpoint, testSCFEndpointGuid } from "../../test-framework/cloud-foundry-endpoint-service.helper";

import { TabNavService } from '../../../../../core/src/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CloudFoundryTabsBaseComponent } from './cloud-foundry-tabs-base.component';

describe('CloudFoundryTabsBaseComponent', () => {
  let component: CloudFoundryTabsBaseComponent;
  let fixture: ComponentFixture<CloudFoundryTabsBaseComponent>;
  beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [CloudFoundryTabsBaseComponent],
        imports: generateCfBaseTestModules(),
        providers: [
          CloudFoundryEndpointService,
          generateTestCfEndpointServiceProvider(),
          { provide: ActiveRouteCfOrgSpace, useValue: { cfGuid: testSCFEndpointGuid } },
          TabNavService,
        ]
      }).compileComponents();

      populateStoreWithTestEndpoint();
    });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryTabsBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterAll(() => { });
});
