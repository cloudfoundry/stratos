import {  NO_ERRORS_SCHEMA, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { SessionService } from '../../../../../../core/src/shared/services/session.service';

import { EndpointsService } from '../../../../../../core/src/core/endpoints.service';
import { UtilsService } from '../../../../../../core/src/core/utils.service';
import { BaseTestModulesNoShared } from '../../../../../../core/test-framework/core-test.helper';
import { HelmReleaseActivatedRouteMock } from '../../../helm-testing.module';
import { ChartDetailsUsageComponent } from './chart-details-usage.component';

describe('Component: ChartDetailsUsage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...BaseTestModulesNoShared, ChartDetailsUsageComponent],
      providers: [
        HelmReleaseActivatedRouteMock,
        EndpointsService,
        UtilsService,
        SessionService,

        provideZonelessChangeDetection(),
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create an instance', () => {
    const component = TestBed.createComponent(ChartDetailsUsageComponent);
    expect(component).toBeTruthy();
  });

  // Install needs somewhere to install to; without one the button is disabled.
  it('enables Install only while a Kubernetes endpoint is connected', async () => {
    const noKube = signal(true);
    const endpoints = TestBed.inject(EndpointsService);
    const spy = vi.spyOn(endpoints, 'noConnectedEndpointOfType').mockReturnValue(noKube);
    const fixture = TestBed.createComponent(ChartDetailsUsageComponent);
    fixture.componentRef.setInput('chart', { id: 'repo/chart', monocularEndpointId: 'mono' });
    fixture.componentRef.setInput('currentVersion', '1.0.0');
    await fixture.whenStable();
    const install = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find(b => b.textContent!.includes('Install Chart'));

    expect(spy).toHaveBeenCalledWith('k8s');
    expect(install()!.disabled).toBe(true);
    noKube.set(false);
    await fixture.whenStable();
    expect(install()!.disabled).toBe(false);
  });
});
