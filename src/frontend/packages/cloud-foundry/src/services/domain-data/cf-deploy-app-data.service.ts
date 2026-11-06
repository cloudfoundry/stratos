import { HttpClient } from '@angular/common/http';
import { ApplicationRef, Injectable, Signal, computed, inject, signal } from '@angular/core';
import { GitBranch, GitSCM } from '@stratosui/git';
import { take } from 'rxjs/operators';

import { NewAppCFDetails } from '../../store/types/create-application.types';
import {
  DeployApplicationSource,
  DeployApplicationState,
  DockerAppDetails,
  GitAppDetails,
  OverrideAppDetails,
  ProjectExists,
  SourceType,
} from '../../store/types/deploy-application.types';

const DEFAULT_STATE: DeployApplicationState = {
  // Wizard starts with no CF target, source, or overrides selected yet.
  cloudFoundryDetails: null,
  applicationSource: undefined,
  applicationOverrides: undefined,
  projectExists: { checking: false, exists: false, error: false, name: '' },
};

// Signal-native owner of the deploy-application wizard's cross-step
// state. Replaces the @ngrx/store reducer + effect that this slice
// originally lived in — see the C2 deploy-application ngrx-removal
// PR for the migration notes.
@Injectable({ providedIn: 'root' })
export class CfDeployAppDataService {
  private readonly httpClient = inject(HttpClient);
  private readonly appRef = inject(ApplicationRef);

  private readonly _state = signal<DeployApplicationState>(DEFAULT_STATE);

  readonly state: Signal<DeployApplicationState> = this._state.asReadonly();
  readonly applicationSource: Signal<DeployApplicationSource | undefined> = computed(
    () => this._state().applicationSource,
  );
  readonly sourceType: Signal<SourceType | undefined> = computed(
    () => this._state().applicationSource?.type,
  );
  readonly projectExists: Signal<ProjectExists | undefined> = computed(
    () => this._state().projectExists,
  );
  readonly projectName: Signal<string | undefined> = computed(
    () => this._state().projectExists?.name,
  );
  readonly newProjectCommit: Signal<string | undefined> = computed(
    () => this._state().applicationSource?.gitDetails?.commit,
  );
  readonly deployBranchName: Signal<string | undefined> = computed(
    () => this._state().applicationSource?.gitDetails?.branchName,
  );
  readonly cfDetails: Signal<NewAppCFDetails | null> = computed(
    () => this._state().cloudFoundryDetails,
  );

  setCfDetails(details: NewAppCFDetails) {
    this._state.update(s => ({ ...s, cloudFoundryDetails: details }));
  }

  setSourceType(sourceType: SourceType) {
    this._state.update(s => ({
      ...s,
      applicationSource: { ...s.applicationSource, type: sourceType },
    }));
  }

  saveAppDetails(git: GitAppDetails | null, docker: DockerAppDetails | null) {
    this._state.update(s => {
      // The wizard always selects a source type before saving its details,
      // so applicationSource (and its type) is present at runtime.
      if (!s.applicationSource) {
        return s;
      }
      return {
        ...s,
        applicationSource: {
          ...s.applicationSource,
          gitDetails: git || s.applicationSource.gitDetails,
          dockerDetails: docker || s.applicationSource.dockerDetails,
        },
      };
    });
  }

  saveAppOverrides(overrides: OverrideAppDetails) {
    this._state.update(s => ({ ...s, applicationOverrides: { ...overrides } }));
  }

  setBranch(branch: GitBranch | null) {
    this._state.update(s => {
      // Reached only after a git source type is selected, so applicationSource exists.
      if (!s.applicationSource) {
        return s;
      }
      return {
        ...s,
        applicationSource: {
          ...s.applicationSource,
          gitDetails: { ...s.applicationSource.gitDetails, branch } as GitAppDetails,
        },
      };
    });
  }

  setDeployBranch(branchName: string) {
    this._state.update(s => {
      // Reached only after a git source type is selected, so applicationSource exists.
      if (!s.applicationSource) {
        return s;
      }
      return {
        ...s,
        applicationSource: {
          ...s.applicationSource,
          gitDetails: { ...s.applicationSource.gitDetails, branchName } as GitAppDetails,
        },
      };
    });
  }

  setDeployCommit(commit: string) {
    this._state.update(s => {
      // Reached only after a git source type is selected, so applicationSource exists.
      if (!s.applicationSource) {
        return s;
      }
      return {
        ...s,
        applicationSource: {
          ...s.applicationSource,
          gitDetails: { ...s.applicationSource.gitDetails, commit } as GitAppDetails,
        },
      };
    });
  }

  projectDoesntExist(projectName: string) {
    this._state.update(s => ({
      ...s,
      projectExists: {
        checking: false,
        exists: false,
        name: projectName,
        error: false,
        data: null,
      },
    }));
  }

  resetState() {
    this._state.set(DEFAULT_STATE);
  }

  // Replaces the legacy CheckProjectExists action + DeployAppEffects
  // pipeline. Flips projectExists to {checking:true} so reactive
  // consumers (github-project-exists.directive form validator) see the
  // intermediate state, then issues the SCM repo lookup and resolves to
  // exists / doesnt-exist / fetch-failed.
  checkProjectExists(scm: GitSCM, projectName: string) {
    this._state.update(s => ({
      ...s,
      projectExists: { checking: true, exists: false, name: projectName, error: false },
    }));

    scm.getRepository(this.httpClient, projectName).pipe(take(1)).subscribe({
      next: data => {
        this._state.update(s => ({
          ...s,
          projectExists: { checking: false, exists: true, name: projectName, error: false, data },
        }));
        this.appRef.tick();
      },
      error: err => {
        const is404 = err?.status === 404;
        this._state.update(s => ({
          ...s,
          projectExists: is404
            ? { checking: false, exists: false, name: projectName, error: false, data: null }
            : {
                checking: false,
                exists: false,
                name: projectName,
                error: true,
                data: scm.parseErrorAsString(err),
              },
        }));
        this.appRef.tick();
      },
    });
  }
}
