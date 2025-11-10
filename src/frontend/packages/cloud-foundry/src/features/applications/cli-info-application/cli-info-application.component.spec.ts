import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TabNavService } from '@stratosui/core';
import { generateTestApplicationServiceProvider, generateCfStoreModules, ApplicationStateService, ApplicationEnvVarsHelper } from '@test-framework/cf';
import { CliInfoApplicationComponent } from './cli-info-application.component';

describe('CliInfoApplicationComponent', () => {
  let component: CliInfoApplicationComponent;
  let fixture: ComponentFixture<CliInfoApplicationComponent>;

  const appId = '1';
  const cfId = '2';
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CliInfoApplicationComponent,
        NoopAnimationsModule,
      ],
      providers: [
        importProvidersFrom(generateCfStoreModules()),
        provideRouter([]),
        provideHttpClient(),
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        TabNavService,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CliInfoApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
