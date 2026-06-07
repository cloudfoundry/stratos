import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { GitCommit } from '@stratosui/git';
import { CfDeployAppDataService } from '../../../../services/domain-data/cf-deploy-app-data.service';
import { DeployApplicationStep21Component } from './deploy-application-step2-1.component';

describe('DeployApplicationStep21Component', () => {
  let component: DeployApplicationStep21Component;
  let fixture: ComponentFixture<DeployApplicationStep21Component>;
  let deployData: { setDeployCommit: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    deployData = { setDeployCommit: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [
        DeployApplicationStep21Component,
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: CfDeployAppDataService, useValue: deployData },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeployApplicationStep21Component);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid triggering lifecycle hooks
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('deploy target: pin a commit vs deploy latest HEAD', () => {
    const commit = { sha: 'abc123def456' } as GitCommit;

    it('is valid when a specific commit is selected', () => {
      expect(DeployApplicationStep21Component.isStepValid(false, commit)).toBe(true);
    });

    it('is valid when deploying latest HEAD with no commit pinned', () => {
      expect(DeployApplicationStep21Component.isStepValid(true, null)).toBe(true);
    });

    it('is invalid when neither a commit is selected nor latest HEAD is chosen', () => {
      expect(DeployApplicationStep21Component.isStepValid(false, null)).toBe(false);
    });

    it('onNext pins the selected commit SHA when not deploying latest HEAD', () => {
      (component as unknown as { selectedCommitSubject: { next(c: GitCommit): void } }).selectedCommitSubject.next(commit);
      component.onNext();
      expect(deployData.setDeployCommit).toHaveBeenCalledWith('abc123def456');
    });

    it('onNext sends an empty commit (deploy latest HEAD) when that option is chosen', () => {
      // Even with a commit still selected underneath, latest-HEAD wins and unpins.
      (component as unknown as { selectedCommitSubject: { next(c: GitCommit): void } }).selectedCommitSubject.next(commit);
      (component as unknown as { useLatestHeadSubject: { next(v: boolean): void } }).useLatestHeadSubject.next(true);
      component.onNext();
      expect(deployData.setDeployCommit).toHaveBeenCalledWith('');
    });
  });
});
