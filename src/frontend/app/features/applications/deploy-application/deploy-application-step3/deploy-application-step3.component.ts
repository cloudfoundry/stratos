import { Component, Input, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  combineLatest as observableCombineLatest,
  Observable,
  of as observableOf,
  Subscription,
} from 'rxjs';
import { filter, first, map, startWith } from 'rxjs/operators';

import {
  CfAppsDataSource,
  createGetAllAppAction,
} from '../../../../shared/components/list/list-types/app/cf-apps-data-source';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { GetAppEnvVarsAction } from '../../../../store/actions/app-metadata.actions';
import { GetApplication } from '../../../../store/actions/application.actions';
import { DeleteDeployAppSection } from '../../../../store/actions/deploy-applications.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import { DeployApplicationDeployer } from '../deploy-application-deployer';

@Component({
  selector: 'app-deploy-application-step3',
  templateUrl: './deploy-application-step3.component.html',
  styleUrls: ['./deploy-application-step3.component.scss']
})
export class DeployApplicationStep3Component implements OnDestroy {

  @Input() appGuid: string;

  // Validation observable
  valid$: Observable<boolean>;

  error$ = new BehaviorSubject<boolean>(false);
  // Observable for when the deploy modal can be closed
  closeable$: Observable<boolean>;

  public deployer: DeployApplicationDeployer;

  private deploySub: Subscription;
  private errorSub: Subscription;
  private validSub: Subscription;

  constructor(
    private store: Store<AppState>,
    snackBar: MatSnackBar,
    public cfOrgSpaceService: CfOrgSpaceDataService,
  ) {
    this.deployer = new DeployApplicationDeployer(store, cfOrgSpaceService);
    // Observables
    this.errorSub = this.deployer.status$.pipe(
      filter((status) => status.error)
    ).subscribe(status => snackBar.open(status.errorMsg, 'Dismiss'));

    const appGuid$ = this.deployer.applicationGuid$.pipe(
      filter((appGuid) => appGuid !== null),
      first(),
    );

    this.valid$ = appGuid$.pipe(
      map(guid => !!guid),
    );

    this.validSub = appGuid$.subscribe(guid => {
      this.appGuid = guid;
      this.store.dispatch(createGetAllAppAction(CfAppsDataSource.paginationKey));
      this.store.dispatch(new GetAppEnvVarsAction(this.appGuid, this.deployer.cfGuid));
    });

    this.closeable$ = observableCombineLatest(
      this.valid$.pipe(startWith(false)),
      this.deployer.status$).pipe(
        map(([validated, status]) => {
          return validated || status.error;
        })
      );
    this.initDeployer();
  }

  private initDeployer() {
    this.deploySub = this.deployer.status$.pipe(
      filter(status => status.deploying),
    ).subscribe();
  }

  private destroyDeployer() {
    this.deploySub.unsubscribe();
    this.errorSub.unsubscribe();
    this.validSub.unsubscribe();
  }

  ngOnDestroy() {
    this.store.dispatch(new DeleteDeployAppSection());
    this.destroyDeployer();
    this.deployer.close();
  }

  onEnter = (fsDeployer: DeployApplicationDeployer) => {
    // If we were passed data, then we came from the File System step
    if (fsDeployer) {
      // Kill off the deployer we created in out constructor and use the one supplied to us
      this.destroyDeployer();
      this.deployer = fsDeployer;
      this.initDeployer();
    }

    // Start deploying
    this.deployer.open();
    if (fsDeployer) {
      // Ask the existing deployer to continue deploying
      this.deployer.deploy();
    }
  }

  onNext: StepOnNextFunction = () => {
    // Delete Deploy App Section
    this.store.dispatch(new DeleteDeployAppSection());
    // Take user to applications
    const { cfGuid } = this.deployer;
    this.store.dispatch(new RouterNav({ path: ['applications', cfGuid, this.appGuid] }));
    if (this.appGuid) {
      this.store.dispatch(new GetAppEnvVarsAction(this.appGuid, cfGuid));
      // Ensure the application package_state is correct
      this.store.dispatch(new GetApplication(this.appGuid, cfGuid));
    }
    return observableOf({ success: true });
  }
}
