import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateTestApplicationServiceProvider } from '../../../../../../../../test-framework/application-service-helper';
import { generateCfBaseTestModules } from '../../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationStateService } from '../../../../../../../shared/services/application-state.service';
import { ApplicationEnvVarsHelper } from '../../build-tab/application-env-vars.service';
import { RoutesTabComponent } from './routes-tab.component';

describe('RoutesTabComponent', () => {
  let component: RoutesTabComponent;
  let fixture: ComponentFixture<RoutesTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoutesTabComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        
        generateTestApplicationServiceProvider('test', 'test'),
        ApplicationEnvVarsHelper,
        DatePipe,
        ApplicationStateService,
      ,
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RoutesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
