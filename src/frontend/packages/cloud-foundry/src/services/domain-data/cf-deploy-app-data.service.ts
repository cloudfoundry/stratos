import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Store } from '@stratosui/store';

import { CFAppState } from '../../cf-app-state';
import {
  selectCfDetails,
  selectDeployAppState,
  selectDeployBranchName,
  selectNewProjectCommit,
  selectPEProjectName,
  selectProjectExists,
  selectSourceType,
} from '../../store/selectors/deploy-application.selector';
import {
  DeployApplicationState,
  ProjectExists,
  SourceType,
} from '../../store/types/deploy-application.types';
import { NewAppCFDetails } from '../../store/types/create-application.types';

// Signal-native bridge for the deployApplication wizard slice. Wraps
// each compose-style selector in toSignal so deploy-application{,
// -deployer,-step2,-options-step}, github-project-exists, and the
// create-application step can drop their `store.select(selectDeploy
// App... | select{Cf,Source,Project,New}*)` calls without waiting
// for the underlying NgRx reducer to migrate.
//
// Read-only on top of the existing reducer; the deploy wizard still
// dispatches actions for state mutations.
@Injectable({ providedIn: 'root' })
export class CfDeployAppDataService {
  private readonly store = inject<Store<CFAppState>>(Store);

  readonly state: Signal<DeployApplicationState | undefined> = toSignal(
    this.store.select(selectDeployAppState),
    { initialValue: undefined },
  );

  readonly sourceType: Signal<SourceType | undefined> = toSignal(
    this.store.select(selectSourceType),
    { initialValue: undefined },
  );

  readonly projectExists: Signal<ProjectExists | undefined> = toSignal(
    this.store.select(selectProjectExists),
    { initialValue: undefined },
  );

  readonly projectName: Signal<string | undefined> = toSignal(
    this.store.select(selectPEProjectName),
    { initialValue: undefined },
  );

  readonly newProjectCommit: Signal<string | undefined> = toSignal(
    this.store.select(selectNewProjectCommit),
    { initialValue: undefined },
  );

  readonly deployBranchName: Signal<string | undefined> = toSignal(
    this.store.select(selectDeployBranchName),
    { initialValue: undefined },
  );

  readonly cfDetails: Signal<NewAppCFDetails | undefined> = toSignal(
    this.store.select(selectCfDetails),
    { initialValue: undefined },
  );

}
