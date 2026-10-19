import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationRef, EnvironmentInjector, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER, Observable, Subject, of } from 'rxjs';

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
import { DeployApplicationDeployer } from '../deploy-application-deployer';
import { FileScannerInfo } from '../deploy-application-step2/deploy-application-fs/deploy-application-fs-scanner';
import { DeployApplicationStep3Component } from "./deploy-application-step3.component";

// Each connection gets a server stream the test drives; what the client
// sends is recorded by connection
const socket = vi.hoisted(() => ({ server: undefined as any, connections: 0, sentOn: [] as unknown[][] }));
vi.mock('rxjs-websockets', () => ({
  default: () => {
    socket.connections++;
    socket.server = new Subject<string>();
    return of((input: Observable<unknown>) => {
      const sent: unknown[] = [];
      socket.sentOn.push(sent);
      input.subscribe(m => sent.push(m));
      return socket.server;
    });
  },
}));

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

  // A first deploy of my-app that the user leaves mid-way; it then succeeds
  // and the user clicks View on the snackbar it shows
  const viewAfterLeaving = async () => {
    const action = new Subject<void>();
    const show = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'show').mockReturnValue({ onAction: () => action } as any);
    await enterConnected();
    const deployer = component.deployer;
    deployer.processWebSocketMessage({
      type: SocketEventTypes.MANIFEST,
      message: JSON.stringify({ Applications: [{ Name: 'my-app' }] }),
    });
    deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_STARTED, message: '' });
    await fixture.whenStable();

    fixture.destroy();
    deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_COMPLETED, message: '' });
    deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_SUCCESS, message: '' });
    await TestBed.inject(ApplicationRef).whenStable();
    action.next();
    return show;
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the manifest title before the push starts', async () => {
    await enterConnected();
    const deployer = component.deployer;
    deployer.processWebSocketMessage({
      type: SocketEventTypes.MANIFEST,
      message: JSON.stringify({ Applications: [{ Name: 'a' }] }),
    });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.font-semibold').textContent.trim()).toBe('Starting deployment...');
    // The app GUID lookup waits for the push to finish
    TestBed.inject(HttpTestingController).expectNone(req => req.url.startsWith('/pp/v1/cf/apps/'));
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

  it('looks up the app GUID once when the deploy finishes on the page', async () => {
    await enterConnected();
    const deployer = component.deployer;
    deployer.processWebSocketMessage({
      type: SocketEventTypes.MANIFEST,
      message: JSON.stringify({ Applications: [{ Name: 'my-app' }] }),
    });
    deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_STARTED, message: '' });
    deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_COMPLETED, message: '' });
    deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_SUCCESS, message: '' });
    await fixture.whenStable();

    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/pp/v1/cf/apps/cf?space_guids=space')
      .flush({ resources: [{ name: 'my-app', guid: 'g1' }] });
    httpMock.verify();
    expect(component.appGuid).toBe('g1');
  });

  describe('the Previous button', () => {
    let disabled: boolean[];
    const locked = () => disabled.at(-1);
    const fromServer = (type: SocketEventTypes, message = '') => component.deployer.processWebSocketMessage({ type, message });

    beforeEach(() => {
      disabled = [];
      component.disablePrevious$.subscribe(d => disabled.push(d));
    });

    it('stays locked from entry until the deploy ends', async () => {
      await enterConnected();
      expect(locked()).toBe(true);

      fromServer(SocketEventTypes.MANIFEST, JSON.stringify({ Applications: [{ Name: 'a' }] }));
      expect(locked()).toBe(true);
      fromServer(SocketEventTypes.EVENT_PUSH_STARTED);
      fromServer(SocketEventTypes.EVENT_PUSH_COMPLETED);
      expect(locked()).toBe(true);
      fromServer(SocketEventTypes.CLOSE_SUCCESS);

      expect(locked()).toBe(false);
    });

    it('unlocks when the deploy fails before the push', async () => {
      await enterConnected();
      fromServer(SocketEventTypes.CLOSE_FAILED_CLONE, 'no repo');

      expect(locked()).toBe(false);
    });

    it('unlocks when the connection is lost', async () => {
      await enterConnected();
      socket.server.complete();

      expect(component.deployer.finished).toBe(true);
      expect(locked()).toBe(false);
    });

    it('locks a file deploy from entry', async () => {
      // The upload step's deployer, uploaded and handed on
      TestBed.inject(CfDeployAppDataService).setCfDetails({ cloudFoundry: 'cf', org: 'org', space: 'space' });
      const deployer = new DeployApplicationDeployer(TestBed.inject(CfOrgSpaceDataService), TestBed.inject(EnvironmentInjector));
      deployer.fsFileInfo = {} as FileScannerInfo;
      deployer.open();
      await TestBed.inject(ApplicationRef).whenStable();
      component.onEnter(deployer);
      await fixture.whenStable();
      expect(locked()).toBe(true);

      fromServer(SocketEventTypes.CLOSE_PUSH_ERROR, 'boom');
      expect(locked()).toBe(false);
    });

    it('unlocks a deploy whose details are missing', async () => {
      // A file source without the upload step's deployer has no source
      // to send
      const deployData = TestBed.inject(CfDeployAppDataService);
      deployData.setCfDetails({ cloudFoundry: 'cf', org: 'org', space: 'space' });
      deployData.setSourceType({ id: 'file', name: 'File' } as SourceType);
      deployData.saveAppOverrides({} as OverrideAppDetails);
      component.onEnter(undefined as any);
      await fixture.whenStable();

      expect(component.deployer.finished).toBe(true);
      expect(component.deployer.status$().error).toBe(true);
      expect(locked()).toBe(false);
    });
  });

  it('uploads again before deploying a file deploy entered again', async () => {
    const appRef = TestBed.inject(ApplicationRef);
    const fromServer = (type: SocketEventTypes, message = '') => socket.server.next(JSON.stringify({ type, message }));
    const sentTypes = (connection: number) => socket.sentOn[connection]
      .filter((m): m is string => typeof m === 'string').map(m => JSON.parse(m).type);
    const deployData = TestBed.inject(CfDeployAppDataService);
    deployData.setCfDetails({ cloudFoundry: 'cf', org: 'org', space: 'space' });
    deployData.setSourceType({ id: 'file', name: 'File' } as SourceType);
    deployData.saveAppOverrides({} as OverrideAppDetails);
    socket.connections = 0;
    socket.sentOn = [];

    // The upload step uploads the file and hands the deployer on
    const deployer = new DeployApplicationDeployer(TestBed.inject(CfOrgSpaceDataService), TestBed.inject(EnvironmentInjector));
    deployer.fsFileInfo = { root: { files: [new File(['x'], 'a.txt')] }, total: 1 } as unknown as FileScannerInfo;
    deployer.open();
    await appRef.whenStable();
    fromServer(SocketEventTypes.SOURCE_REQUIRED);
    fromServer(SocketEventTypes.SOURCE_FILE_ACK);
    await vi.waitFor(() => expect(socket.sentOn[0].some(m => m instanceof ArrayBuffer)).toBe(true));
    fromServer(SocketEventTypes.SOURCE_FILE_ACK);
    component.onEnter(deployer);
    await fixture.whenStable();
    fromServer(SocketEventTypes.CLOSE_FAILURE, 'boom');

    // Previous to the overrides, then Next: the wizard hands it on again
    component.onEnter(deployer);
    await fixture.whenStable();
    expect(socket.connections).toBe(2);
    fromServer(SocketEventTypes.SOURCE_REQUIRED);
    fromServer(SocketEventTypes.SOURCE_FILE_ACK);
    await vi.waitFor(() => expect(socket.sentOn[1].some(m => m instanceof ArrayBuffer)).toBe(true));
    expect(sentTypes(1)).not.toContain(SocketEventTypes.SOURCE_WAIT_ACK);

    // The server acknowledges the last file; only now may the deploy go on
    fromServer(SocketEventTypes.SOURCE_FILE_ACK);
    expect(sentTypes(1).at(-1)).toBe(SocketEventTypes.SOURCE_WAIT_ACK);
    expect(sentTypes(1).filter(t => t === SocketEventTypes.SOURCE_WAIT_ACK).length).toBe(1);
    expect(component.deployer.finished).toBe(false);
    deployer.close();
  });

  describe('deploying again after Previous', () => {
    const appsUrl = '/pp/v1/cf/apps/cf?space_guids=space';

    // The deploy of the named app succeeds on the page
    const succeed = async (name: string) => {
      const deployer = component.deployer;
      deployer.processWebSocketMessage({
        type: SocketEventTypes.MANIFEST,
        message: JSON.stringify({ Applications: [{ Name: name }] }),
      });
      deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_STARTED, message: '' });
      deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_COMPLETED, message: '' });
      deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_SUCCESS, message: '' });
      await fixture.whenStable();
    };

    it('looks up the app of the new deploy', async () => {
      const httpMock = TestBed.inject(HttpTestingController);
      await enterConnected();
      await succeed('my-app');
      httpMock.expectOne(appsUrl).flush({ resources: [{ name: 'my-app', guid: 'g1' }] });
      expect(component.appGuid).toBe('g1');

      // Back to the overrides, where the user renames the app
      component.onEnter(undefined as any);
      await fixture.whenStable();
      expect(component.appGuid).toBeFalsy();
      await succeed('renamed');

      httpMock.expectOne(appsUrl).flush({ resources: [{ name: 'my-app', guid: 'g1' }, { name: 'renamed', guid: 'g2' }] });
      expect(component.appGuid).toBe('g2');
    });

    it('can be closed when the deployed app is not found', async () => {
      const show = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'show').mockReturnValue({ onAction: () => NEVER } as any);
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      let closeable: boolean | undefined;
      let valid: boolean | undefined;
      component.closeable$.subscribe(c => closeable = c);
      component.valid$.subscribe(v => valid = v);
      await enterConnected();
      await succeed('my-app');

      TestBed.inject(HttpTestingController).expectOne(appsUrl).flush({ resources: [{ name: 'other', guid: 'g0' }] });

      expect(closeable).toBe(true);
      expect(valid).toBe(false);
      expect(show).toHaveBeenCalledWith('Application my-app was deployed but could not be found in the space', 'Dismiss');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('can be closed when the lookup of the deployed app fails', async () => {
      const show = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'show').mockReturnValue({ onAction: () => NEVER } as any);
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      let closeable: boolean | undefined;
      let valid: boolean | undefined;
      component.closeable$.subscribe(c => closeable = c);
      component.valid$.subscribe(v => valid = v);
      await enterConnected();
      await succeed('my-app');

      TestBed.inject(HttpTestingController).expectOne(appsUrl).flush('boom', { status: 500, statusText: 'Server Error' });

      expect(closeable).toBe(true);
      expect(valid).toBe(false);
      expect(show).toHaveBeenCalledWith('Application my-app was deployed but looking it up in the space failed', 'Dismiss');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('keeps the app given for a redeploy', async () => {
      const httpMock = TestBed.inject(HttpTestingController);
      fixture.componentRef.setInput('appGuid', 'r1');
      await enterConnected();
      await succeed('my-app');

      component.onEnter(undefined as any);
      await fixture.whenStable();
      await succeed('my-app');

      httpMock.expectNone(appsUrl);
      expect(component.appGuid).toBe('r1');
    });
  });

  describe('the log of a retry', () => {
    const logText = (): string => fixture.nativeElement.querySelector('.log-scroller__content').textContent;
    const log = async (line: string) => {
      component.deployer.messages.next(`${line}\n`);
      await vi.waitFor(() => expect(logText()).toContain(line));
    };

    it('starts empty for a git deploy', async () => {
      await enterConnected();
      await log('first run');

      component.onEnter(undefined as any);
      await fixture.whenStable();
      await log('second run');

      expect(logText()).not.toContain('first run');
    });

    it('starts empty for a file deploy', async () => {
      // The upload step's deployer, uploaded and handed on
      const appRef = TestBed.inject(ApplicationRef);
      TestBed.inject(CfDeployAppDataService).setCfDetails({ cloudFoundry: 'cf', org: 'org', space: 'space' });
      const deployer = new DeployApplicationDeployer(TestBed.inject(CfOrgSpaceDataService), TestBed.inject(EnvironmentInjector));
      deployer.fsFileInfo = {} as FileScannerInfo;
      deployer.open();
      await appRef.whenStable();
      component.onEnter(deployer);
      await fixture.whenStable();
      await log('first run');

      // Back to the upload step, which uploads again on the same deployer
      deployer.close();
      deployer.open();
      await appRef.whenStable();
      component.onEnter(deployer);
      await fixture.whenStable();
      await log('second run');

      expect(logText()).not.toContain('first run');
      deployer.close();
    });
  });

  it('opens a first-time deploy that finishes after the user leaves the page', async () => {
    const snackBar = TestBed.inject(TailwindSnackBarService);
    const action = new Subject<void>();
    vi.spyOn(snackBar, 'show').mockReturnValue({ onAction: () => action } as any);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const httpMock = TestBed.inject(HttpTestingController);

    await enterConnected();
    const deployer = component.deployer;
    deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_STARTED, message: '' });
    deployer.processWebSocketMessage({
      type: SocketEventTypes.MANIFEST,
      message: JSON.stringify({ Applications: [{ Name: 'my-app' }] }),
    });
    await fixture.whenStable();

    fixture.destroy();
    deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_COMPLETED, message: '' });
    deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_SUCCESS, message: '' });
    await TestBed.inject(ApplicationRef).whenStable();
    // The lookup waits for the click
    httpMock.expectNone('/pp/v1/cf/apps/cf?space_guids=space');

    action.next();
    httpMock.expectOne('/pp/v1/cf/apps/cf?space_guids=space')
      .flush({ resources: [{ name: 'other', guid: 'g0' }, { name: 'my-app', guid: 'g1' }] });

    expect(navigate).toHaveBeenCalledWith(['applications', 'cf', 'g1'], undefined);
  });

  it('reports on View that the app of a deploy left mid-way is not found', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const show = await viewAfterLeaving();

    TestBed.inject(HttpTestingController).expectOne('/pp/v1/cf/apps/cf?space_guids=space')
      .flush({ resources: [{ name: 'other', guid: 'g0' }] });

    expect(show).toHaveBeenCalledWith('Application my-app was deployed but could not be found in the space', 'Dismiss');
    expect(navigate).not.toHaveBeenCalled();
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

    // Leave before the deployer has read the deploy details, so it is
    // still waiting to connect; leaving clears them, so it never would.
    component.onEnter(undefined as any);
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

  it('reports on View that the lookup of the app of a deploy left mid-way failed', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const show = await viewAfterLeaving();

    TestBed.inject(HttpTestingController).expectOne('/pp/v1/cf/apps/cf?space_guids=space')
      .flush('boom', { status: 500, statusText: 'Server Error' });

    expect(show).toHaveBeenCalledWith('Application my-app was deployed but looking it up in the space failed', 'Dismiss');
    expect(navigate).not.toHaveBeenCalled();
  });
});
