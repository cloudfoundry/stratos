import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TabNavService } from '@stratosui/core';
import { generateTestApplicationServiceProvider, generateCfStoreModules, ApplicationStateService, ApplicationEnvVarsHelper } from '@test-framework/cf';
import { LogStreamTabComponent } from './log-stream-tab.component';

describe('LogStreamTabComponent', () => {
  let component: LogStreamTabComponent;
  let fixture: ComponentFixture<LogStreamTabComponent>;

  const appId = '';
  const cfId = '2';
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LogStreamTabComponent,
        ...generateCfStoreModules(),
        HttpClientTestingModule,
      ],
      providers: [
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        TabNavService,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LogStreamTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
