import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityMonitorFactory, EntityServiceFactory } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { ApplicationServiceMock } from "@test-framework/application-service-helper";
import { ApplicationMonitorService } from '../../../../features/applications/application-monitor.service';
import { ApplicationService } from '../../../../features/applications/application.service';
import { ApplicationStateService } from '../../../services/application-state.service';
import { CardAppUptimeComponent } from "./card-app-uptime.component";

describe('CardAppUptimeComponent', () => {
  let component: CardAppUptimeComponent;
  let fixture: ComponentFixture<CardAppUptimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CardAppUptimeComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        EntityServiceFactory,
        EntityMonitorFactory,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
        ApplicationMonitorService,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppUptimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
