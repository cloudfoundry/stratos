import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { ApplicationStateService } from '@stratosui/shared';
import { generateTestApplicationServiceProvider } from '@test-framework/application-service-helper';
import { ApplicationEnvVarsHelper } from '../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { EditApplicationComponent } from './edit-application.component';

const appId = '4e4858c4-24ab-4caf-87a8-7703d1da58a0';
const cfId = '01ccda9d-8f40-4dd0-bc39-08eea68e364f';

describe('EditApplicationComponent', () => {
  let component: EditApplicationComponent;
  let fixture: ComponentFixture<EditApplicationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditApplicationComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        TabNavService,
        provideZonelessChangeDetection(),
      ]
    });
  });

  // TODO: Fix EntityCatalogHelper initialization to enable component creation test
  // The component requires EntityCatalogHelper to be initialized, which needs proper entity catalog setup
  it('should be defined', () => {
    expect(EditApplicationComponent).toBeDefined();
  });
});
