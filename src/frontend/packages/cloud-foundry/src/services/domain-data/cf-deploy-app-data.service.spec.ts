import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import {
  DeployApplicationState,
  ProjectExists,
  SourceType,
} from '../../store/types/deploy-application.types';
import { CfDeployAppDataService } from './cf-deploy-app-data.service';

const sourceType: SourceType = { name: 'Git', id: 'git' };
const projectExists: ProjectExists = {
  exists: true,
  checking: false,
  name: 'demo',
  error: false,
} as unknown as ProjectExists;

const fullState: DeployApplicationState = {
  cloudFoundryDetails: { cloudFoundry: 'cf-1', org: 'org-1', space: 'space-1' },
  applicationSource: {
    type: sourceType,
    gitDetails: {
      projectName: 'demo',
      branch: { name: 'main' } as any,
      branchName: 'main',
      commit: 'abcdef',
    } as any,
  },
  projectExists,
} as unknown as DeployApplicationState;

function stateWith(deploy: Partial<DeployApplicationState>): unknown {
  return {
    deployApplication: { ...fullState, ...deploy },
  };
}

describe('CfDeployAppDataService', () => {
  let svc: CfDeployAppDataService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore({ initialState: stateWith({}) }),
        CfDeployAppDataService,
      ],
    });
    store = TestBed.inject(MockStore);
    svc = TestBed.inject(CfDeployAppDataService);
  });

  it('exposes wizard slice fields as signals', () => {
    expect(svc.state()).toEqual(fullState);
    expect(svc.sourceType()).toEqual(sourceType);
    expect(svc.projectExists()).toEqual(projectExists);
    expect(svc.projectName()).toBe('demo');
    expect(svc.newProjectCommit()).toBe('abcdef');
    expect(svc.deployBranchName()).toBe('main');
    expect(svc.cfDetails()).toEqual({ cloudFoundry: 'cf-1', org: 'org-1', space: 'space-1' });
  });

  it('reflects state changes', () => {
    store.setState(stateWith({
      cloudFoundryDetails: { cloudFoundry: 'cf-2', org: 'org-2', space: 'space-2' },
    }));
    expect(svc.cfDetails()).toEqual({ cloudFoundry: 'cf-2', org: 'org-2', space: 'space-2' });
  });
});
