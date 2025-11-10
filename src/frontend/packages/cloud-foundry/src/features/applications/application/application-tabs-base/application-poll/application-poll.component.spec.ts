import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import {
  generateTestApplicationServiceProvider,
  ApplicationEnvVarsHelper,
  ApplicationStateService,
  generateCfBaseTestModulesNoShared,
} from '@test-framework/cf';

import { ApplicationPollingService } from '../application-polling.service';
import { ApplicationPollComponent } from './application-poll.component';

describe('ApplicationPollComponent', () => {
  let component: ApplicationPollComponent;
  let fixture: ComponentFixture<ApplicationPollComponent>;

  const appId = '1';
  const cfId = '2';
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ApplicationPollComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        ApplicationPollingService,
        generateTestApplicationServiceProvider(appId, cfId),
        ApplicationEnvVarsHelper,
        ApplicationStateService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationPollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
