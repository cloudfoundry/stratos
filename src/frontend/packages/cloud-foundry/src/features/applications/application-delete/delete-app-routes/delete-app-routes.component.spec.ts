import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateTestApplicationServiceProvider, generateCfBaseTestModulesNoShared, ApplicationStateService, ApplicationEnvVarsHelper } from '@test-framework/cf';
import { DeleteAppRoutesComponent } from './delete-app-routes.component';

describe('DeleteAppRoutesComponent', () => {
  let component: DeleteAppRoutesComponent;
  let fixture: ComponentFixture<DeleteAppRoutesComponent>;
  const appId = '1';
  const cfId = '2';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DeleteAppRoutesComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        DatePipe,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteAppRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
