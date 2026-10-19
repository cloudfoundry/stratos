import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationRef, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';

import { SocketEventTypes, SourceType } from '../../../store/types/deploy-application.types';
import { CfDeployAppDataService } from '../../../services/domain-data/cf-deploy-app-data.service';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { FileScannerInfo } from './deploy-application-step2/deploy-application-fs/deploy-application-fs-scanner';
import { DeployApplicationDeployer } from './deploy-application-deployer';

// Each connection gets a server stream the test drives
const socket = vi.hoisted(() => ({ server: undefined as any }));
vi.mock('rxjs-websockets', () => ({
  default: () => {
    socket.server = new Subject<string>();
    return of(() => socket.server);
  },
}));

describe('DeployApplicationDeployer', () => {
  let deployer: DeployApplicationDeployer;

  beforeEach(() => {
    const orgSpace = { orgList: () => [], spaceList: () => [] } as unknown as CfOrgSpaceDataService;
    deployer = new DeployApplicationDeployer(orgSpace, TestBed.inject(EnvironmentInjector));
  });

  describe('when the connection ends', () => {
    beforeEach(async () => {
      socket.server = undefined;
      TestBed.inject(CfDeployAppDataService).setCfDetails({ cloudFoundry: 'cf', org: 'org', space: 'space' });
      deployer.fsFileInfo = {} as FileScannerInfo;
      deployer.open();
      await TestBed.inject(ApplicationRef).whenStable();
      expect(socket.server).toBeDefined();
    });

    it('reports a failure when no close message came first', () => {
      socket.server.complete();

      expect(deployer.streamTitle()).toBe('Deploy Failed - Connection lost');
      expect(deployer.status$().error).toBeTruthy();
      expect(deployer.status$().errorMsg).toBe('The connection to the server was lost before the deploy finished.');
    });

    it('keeps the reported close when the server then closes the connection', () => {
      socket.server.next(JSON.stringify({ type: SocketEventTypes.CLOSE_SUCCESS, message: '' }));
      socket.server.complete();

      expect(deployer.status$().error).toBeFalsy();
      expect(deployer.streamTitle()).not.toBe('Deploy Failed - Connection lost');
    });

    it('reports nothing when the deployer itself closes the connection', () => {
      deployer.close();
      socket.server.complete();

      expect(deployer.status$().error).toBe(false);
    });

    it('starts a reopened deploy afresh', () => {
      const send = (type: SocketEventTypes, message = '') => socket.server.next(JSON.stringify({ type, message }));
      send(SocketEventTypes.MANIFEST, JSON.stringify({ Applications: [{ Name: 'a' }] }));
      send(SocketEventTypes.APP_GUID_NOTIFY, 'g1');
      send(SocketEventTypes.CLOSE_FAILURE, 'boom');

      deployer.close();
      deployer.open();

      expect(deployer.finished).toBe(false);
      expect(deployer.status$()).toEqual({ error: false, errorMsg: undefined, deploying: false });
      expect(deployer.streamTitle()).toBe('Preparing...');
      expect(deployer.applicationGuid$()).toBeNull();
      expect(deployer.appData).toBeUndefined();
      deployer.close();
    });
  });

  describe('uploading files', () => {
    let read: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      // Each file reads at once
      read = vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function (this: FileReader) {
        this.onload?.({} as ProgressEvent<FileReader>);
      });
      const deployData = TestBed.inject(CfDeployAppDataService);
      deployData.setCfDetails({ cloudFoundry: 'cf', org: 'org', space: 'space' });
      deployData.setSourceType({ id: 'file', name: 'File' } as SourceType);
      deployer.fsFileInfo = { root: { files: [new File(['x'], 'a.txt')] }, total: 1 } as unknown as FileScannerInfo;
      deployer.open();
      await TestBed.inject(ApplicationRef).whenStable();
    });

    afterEach(() => {
      read.mockRestore();
      deployer.close();
    });

    it('counts the last file once when an extra acknowledgement follows', () => {
      const send = (type: SocketEventTypes) => socket.server.next(JSON.stringify({ type, message: '' }));
      send(SocketEventTypes.SOURCE_REQUIRED);
      send(SocketEventTypes.SOURCE_FILE_ACK);
      send(SocketEventTypes.SOURCE_FILE_ACK);
      expect(deployer.fileTransferStatus$()?.filesSent).toBe(1);

      send(SocketEventTypes.SOURCE_FILE_ACK);

      expect(deployer.fileTransferStatus$()).toMatchObject({ filesSent: 1, totalFiles: 1, bytesSent: 1 });
    });
  });

  it('keeps the specific failure when a generic close follows it', () => {
    const reason = 'Failed due to no manifest.yml or manifest.yaml was found and no application name was given!';
    deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_NO_MANIFEST, message: reason });
    deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_FAILURE, message: reason });

    expect(deployer.streamTitle()).toBe('Deploy Failed - No manifest present!');
    expect(deployer.status$().errorMsg).toContain('enter an application name');
  });

  it('delivers every log line of a synchronous burst', async () => {
    const received: string[] = [];
    deployer.messages.asObservable().subscribe(m => received.push(m));
    const lines = ['one\n', 'two\n', 'three\n', 'four\n'];

    // The socket handler writes each completed line as its frame arrives,
    // several within one task when frames come in together.
    lines.forEach(line => deployer.messages.next(line));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(received.filter(m => !!m)).toEqual(lines);
  });

  it('reports each status change of a burst', async () => {
    const deploying: boolean[] = [];
    deployer.status$.asObservable().subscribe(s => deploying.push(s.deploying));

    deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_STARTED, message: '' });
    deployer.processWebSocketMessage({ type: SocketEventTypes.EVENT_PUSH_COMPLETED, message: '' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(deploying).toEqual([false, true, false]);
  });

  it('returns the same observable on every asObservable() call', () => {
    // Templates bind asObservable() directly; a new instance per change
    // detection pass would resubscribe and replay the last value.
    expect(deployer.messages.asObservable()).toBe(deployer.messages.asObservable());
    expect(deployer.fileTransferStatus$.asObservable()).toBe(deployer.fileTransferStatus$.asObservable());
  });
});
