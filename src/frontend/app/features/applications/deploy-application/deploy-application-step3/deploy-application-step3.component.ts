
import {
  of as observableOf,
  combineLatest as observableCombineLatest,
  BehaviorSubject,
  Observable,
  interval,
  Subscription
} from 'rxjs';

import { startWith, catchError, filter, map, switchMap, takeWhile } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Input, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';

import {
  CfAppsDataSource,
  createGetAllAppAction,
} from '../../../../shared/components/list/list-types/app/cf-apps-data-source';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { GetAppEnvVarsAction } from '../../../../store/actions/app-metadata.actions';
import { DeleteDeployAppSection } from '../../../../store/actions/deploy-applications.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import { DeployApplicationDeployer } from '../deploy-application-deployer';
import { FileScannerInfo } from '../deploy-application-step2/deploy-application-fs/deploy-application-fs-scanner';

// Interval to check for new application
const APP_CHECK_INTERVAL = 3000;

@Component({
  selector: 'app-deploy-application-step3',
  templateUrl: './deploy-application-step3.component.html',
  styleUrls: ['./deploy-application-step3.component.scss']
})
export class DeployApplicationStep3Component implements OnDestroy {

  @Input('appGuid') appGuid: string;
  fetchedApp = false;

  // Validation poller
  valid$ = this.createValidationPoller();

  error$ = new BehaviorSubject<boolean>(false);
  // Observable for when the deploy modal can be closed
  closeable$: Observable<boolean>;

  private deployer: DeployApplicationDeployer;

  private deploySub: Subscription;
  private errorSub: Subscription;

  private fsData: FileScannerInfo;

  constructor(
    private store: Store<AppState>,
    private snackBar: MatSnackBar,
    public cfOrgSpaceService: CfOrgSpaceDataService,
    private http: HttpClient,
  ) {
    this.deployer = new DeployApplicationDeployer(store, cfOrgSpaceService, http);
    this.initDeployer();
  }

  private initDeployer() {
    // Observables
    this.errorSub = this.deployer.status$.pipe(
      filter((status) => status.error)
    ).subscribe(status => this.snackBar.open(status.errorMsg, 'Dismiss'));

    this.closeable$ = observableCombineLatest(
      this.valid$.pipe(startWith(false)),
      this.deployer.status$).pipe(
        map(([validated, status]) => {
          return validated || status.error;
        })
      );
    this.deploySub = this.deployer.status$.pipe(
      filter(status => status.deploying),
    ).subscribe(deploying => {
      // Deploying
    });
  }

  private destroyDeployer() {
    this.deploySub.unsubscribe();
    this.errorSub.unsubscribe();
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
    return observableOf({ success: true });
  }

  /**
   * Create a poller that will be used to periodically check for the new application.
   */
  private createValidationPoller(): Observable<boolean> {
    return interval(APP_CHECK_INTERVAL).pipe(
      takeWhile(() => !this.fetchedApp),
      filter(() => this.deployer.deploying),
      switchMap(() => {
        const { cfGuid, spaceGuid, appData, proxyAPIVersion } = this.deployer;
        if (this.appGuid) {
          this.store.dispatch(createGetAllAppAction(CfAppsDataSource.paginationKey));
          this.store.dispatch(new GetAppEnvVarsAction(this.appGuid, cfGuid));
          this.fetchedApp = true;
          return observableOf(true);
        } else {
          const headers = new HttpHeaders({ 'x-cap-cnsi-list': cfGuid });
          return this.http.get(`/pp/${proxyAPIVersion}/proxy/v2/apps?q=space_guid:${spaceGuid}&q=name:${appData.Name}`,
            { headers: headers }).pipe(
              map(info => {
                if (info && info[cfGuid]) {
                  const apps = info[cfGuid];
                  if (apps.total_results === 1) {
                    this.appGuid = apps.resources[0].metadata.guid;
                    this.fetchedApp = true;
                    // New app - so refresh the application wall data
                    this.store.dispatch(createGetAllAppAction(CfAppsDataSource.paginationKey));
                    return true;
                  }
                }
                return false;
              }),
              catchError(err => [
                // ignore
              ])
            );
        }
      })
    );
  }
}
