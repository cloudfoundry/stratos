import { beforeEach, describe, expect, it } from 'vitest';
import { ApplicationRef, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SocketEventTypes } from '../../../store/types/deploy-application.types';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { DeployApplicationDeployer } from './deploy-application-deployer';

describe('DeployApplicationDeployer', () => {
  let deployer: DeployApplicationDeployer;

  beforeEach(() => {
    deployer = new DeployApplicationDeployer({} as CfOrgSpaceDataService, TestBed.inject(EnvironmentInjector));
  });

  it('keeps the specific failure when a generic close follows it', () => {
    const reason = 'Failed due to no manifest.yml or manifest.yaml was found and no application name was given!';
    deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_NO_MANIFEST, message: reason });
    deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_FAILURE, message: reason });

    expect(deployer.streamTitle).toBe('Deploy Failed - No manifest present!');
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
