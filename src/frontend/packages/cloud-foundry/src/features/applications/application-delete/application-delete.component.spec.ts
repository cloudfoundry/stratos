import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import {
  generateTestApplicationServiceProvider,
  ApplicationStateService,
  ApplicationEnvVarsHelper,
  generateCfBaseTestModulesNoShared,
} from '@test-framework/cf';

import { ApplicationDeleteComponent } from './application-delete.component';

describe('ApplicationDeleteComponent', () => {
  let component: ApplicationDeleteComponent<any>;
  let fixture: ComponentFixture<ApplicationDeleteComponent<any>>;
  const appId = '1';
  const cfId = '2';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ApplicationDeleteComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        generateTestApplicationServiceProvider(appId, cfId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        TabNavService,
        DatePipe,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
