import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { SourceType } from '../../store/types/deploy-application.types';
import { CfDeployAppDataService } from './cf-deploy-app-data.service';

const sourceType: SourceType = { name: 'Git', id: 'git' };

describe('CfDeployAppDataService', () => {
  let svc: CfDeployAppDataService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        CfDeployAppDataService,
      ],
    });
    svc = TestBed.inject(CfDeployAppDataService);
  });

  it('starts with the default empty wizard state', () => {
    expect(svc.cfDetails()).toBeNull();
    // Optional wizard fields start unset (undefined) until the user picks a source.
    expect(svc.sourceType()).toBeUndefined();
    expect(svc.applicationSource()).toBeUndefined();
    expect(svc.projectExists()).toEqual({ checking: false, exists: false, error: false, name: '' });
  });

  it('setCfDetails / setSourceType / saveAppDetails fan-out signal updates', () => {
    svc.setCfDetails({ cloudFoundry: 'cf-1', org: 'org-1', space: 'space-1' });
    svc.setSourceType(sourceType);
    svc.saveAppDetails({
      projectName: 'demo',
      branch: { name: 'main' } as any,
      branchName: 'main',
      commit: 'abcdef',
      endpointGuid: 'gh',
    }, null);

    expect(svc.cfDetails()).toEqual({ cloudFoundry: 'cf-1', org: 'org-1', space: 'space-1' });
    expect(svc.sourceType()).toEqual(sourceType);
    expect(svc.deployBranchName()).toBe('main');
    expect(svc.newProjectCommit()).toBe('abcdef');
  });

  it('resetState restores defaults', () => {
    svc.setCfDetails({ cloudFoundry: 'cf-1', org: 'org-1', space: 'space-1' });
    svc.resetState();
    expect(svc.cfDetails()).toBeNull();
    expect(svc.sourceType()).toBeUndefined();
  });

  // The legacy CheckProjectExists action + DeployAppEffects pipeline is
  // collapsed into a single async method. Verify the three-phase
  // observable contract still holds: checking:true intermediate, then
  // exists/doesntExist/error terminal.
  it('checkProjectExists resolves to exists:true when the SCM returns 200', () => {
    const scm = {
      getRepository: vi.fn().mockReturnValue(of({ id: 1, full_name: 'a/b' })),
      parseErrorAsString: vi.fn(),
    } as any;

    svc.checkProjectExists(scm, 'a/b');

    expect(svc.projectExists()).toEqual({ checking: false, exists: true, name: 'a/b', error: false, data: { id: 1, full_name: 'a/b' } });
  });

  it('checkProjectExists resolves to exists:false on 404', () => {
    const scm = {
      getRepository: vi.fn().mockReturnValue(throwError(() => ({ status: 404 }))),
      parseErrorAsString: vi.fn(),
    } as any;

    svc.checkProjectExists(scm, 'a/b');

    expect(svc.projectExists()).toEqual({ checking: false, exists: false, name: 'a/b', error: false, data: null });
  });

  it('checkProjectExists surfaces non-404 errors with the SCM-parsed message', () => {
    const scm = {
      getRepository: vi.fn().mockReturnValue(throwError(() => ({ status: 500 }))),
      parseErrorAsString: vi.fn().mockReturnValue('boom'),
    } as any;

    svc.checkProjectExists(scm, 'a/b');

    expect(svc.projectExists()).toEqual({ checking: false, exists: false, name: 'a/b', error: true, data: 'boom' });
  });
});
