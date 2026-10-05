import { beforeEach, describe, expect, it } from 'vitest';
import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SocketEventTypes } from '../../../store/types/deploy-application.types';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { DeployApplicationDeployer } from './deploy-application-deployer';

describe('DeployApplicationDeployer', () => {
  let deployer: DeployApplicationDeployer;

  beforeEach(() => {
    deployer = new DeployApplicationDeployer({} as CfOrgSpaceDataService, TestBed.inject(Injector));
  });

  it('keeps the specific failure when a generic close follows it', () => {
    const reason = 'Failed due to no manifest.yml or manifest.yaml was found and no application name was given!';
    deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_NO_MANIFEST, message: reason });
    deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_FAILURE, message: reason });

    expect(deployer.streamTitle).toBe('Deploy Failed - No manifest present!');
    expect(deployer.status$().errorMsg).toContain('enter an application name');
  });
});
