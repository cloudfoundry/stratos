import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationRef, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';

import { generateCfBaseTestModulesNoShared } from "@test-framework/cf";
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TailwindSnackBarService } from '@stratosui/core';
import { CfDeployAppDataService } from '../../../../services/domain-data/cf-deploy-app-data.service';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import {
  GitAppDetails,
  OverrideAppDetails,
  SocketEventTypes,
  SourceType } from '../../../../store/types/deploy-application.types';
import { DeployApplicationStep3Component } from "./deploy-application-step3.component";

vi.mock('rxjs-websockets', () => ({ default: () => NEVER }));

describe('DeployApplicationStep3Component', () => {
  let component: DeployApplicationStep3Component;
  let fixture: ComponentFixture<DeployApplicationStep3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DeployApplicationStep3Component,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        CfOrgSpaceDataService,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeployApplicationStep3Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // Enter the step with a complete git source, so the deployer connects
  const enterConnected = async () => {
    const deployData = TestBed.inject(CfDeployAppDataService);
    deployData.setCfDetails({ cloudFoundry: 'cf', org: 'org', space: 'space' });
    deployData.setSourceType({ id: 'giturl', name: 'Git URL' } as SourceType);
    deployData.saveAppDetails({ projectName: 'p', branch: { name: 'main' } } as GitAppDetails, null);
    deployData.saveAppOverrides({} as OverrideAppDetails);
    component.onEnter(undefined as any);
    await fixture.whenStable();
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the manifest title before the push starts', async () => {
    component.onEnter(undefined as any);
    await fixture.whenStable();
    const deployer = component.deployer;
    deployer.processWebSocketMessage({
      type: SocketEventTypes.MANIFEST,
      message: JSON.stringify({ Applications: [{ Name: 'a' }] }),
    });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.font-semibold').textContent.trim()).toBe('Starting deployment...');
    // The app GUID lookup waits for the push to finish
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });

  it('reports a deploy that finishes after the user leaves the page', async () => {
    const snackBar = TestBed.inject(TailwindSnackBarService);
    const show = vi.spyOn(snackBar, 'show').mockReturnValue({ onAction: () => NEVER } as any);

    await enterConnected();
    const deployer = component.deployer;
    const close = vi.spyOn(deployer, 'close');
    deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_STARTED, message: '' });
    await fixture.whenStable();

    // Leave the page mid-deploy, then let the deploy finish.
    fixture.destroy();
    deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_COMPLETED, message: '' });
    expect(close).not.toHaveBeenCalled();
    deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_SUCCESS, message: '' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(show).toHaveBeenCalledWith('Application deployment complete', 'View', 10000, true);
    expect(close).toHaveBeenCalled();
  });

  it('reports a deploy that fails after the user leaves the page', async () => {
    const snackBar = TestBed.inject(TailwindSnackBarService);
    const show = vi.spyOn(snackBar, 'show').mockReturnValue({ onAction: () => NEVER } as any);

    await enterConnected();
    const deployer = component.deployer;
    const close = vi.spyOn(deployer, 'close');
    deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_STARTED, message: '' });
    await fixture.whenStable();

    fixture.destroy();
    deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_PUSH_ERROR, message: 'boom' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(show).toHaveBeenCalledWith(expect.stringContaining('Reason: boom'), 'Dismiss');
    expect(close).toHaveBeenCalled();
  });

  it('reports a deploy that fails after the user leaves before the push starts', async () => {
    const snackBar = TestBed.inject(TailwindSnackBarService);
    const show = vi.spyOn(snackBar, 'show').mockReturnValue({ onAction: () => NEVER } as any);

    await enterConnected();
    const deployer = component.deployer;
    const close = vi.spyOn(deployer, 'close');

    // Leave during the clone, then let the deploy fail.
    fixture.destroy();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(close).not.toHaveBeenCalled();
    expect(show).not.toHaveBeenCalled();

    deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_FAILED_CLONE, message: 'no repo' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(show).toHaveBeenCalledWith(expect.stringContaining('Reason: no repo'), 'Dismiss');
    expect(close).toHaveBeenCalled();
  });

  it('closes a deploy whose connection never opened when the user leaves', async () => {
    const snackBar = TestBed.inject(TailwindSnackBarService);
    const show = vi.spyOn(snackBar, 'show').mockReturnValue({ onAction: () => NEVER } as any);

    // No deploy details yet, so the deployer is still waiting to connect;
    // leaving clears them, so it never would.
    component.onEnter(undefined as any);
    await fixture.whenStable();
    const close = vi.spyOn(component.deployer, 'close');

    fixture.destroy();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(close).toHaveBeenCalled();
    expect(show).not.toHaveBeenCalled();
  });

  it('closes a finished deploy when the user leaves', async () => {
    const snackBar = TestBed.inject(TailwindSnackBarService);
    const show = vi.spyOn(snackBar, 'show').mockReturnValue({ onAction: () => NEVER } as any);

    await enterConnected();
    const deployer = component.deployer;
    const close = vi.spyOn(deployer, 'close');
    deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_STARTED, message: '' });
    deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_COMPLETED, message: '' });
    deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_SUCCESS, message: '' });
    await fixture.whenStable();

    fixture.destroy();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(close).toHaveBeenCalled();
    expect(show).not.toHaveBeenCalled();
  });
});
