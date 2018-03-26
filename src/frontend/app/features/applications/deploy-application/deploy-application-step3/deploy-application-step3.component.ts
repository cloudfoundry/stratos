import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { tap, filter, map, mergeMap, combineLatest, switchMap, share, catchError, takeWhile } from 'rxjs/operators';
import { getEntityById, selectEntity, selectEntities } from '../../../../store/selectors/api.selectors';
import { DeleteDeployAppSection } from '../../../../store/actions/deploy-applications.actions';
import websocketConnect from 'rxjs-websockets';
import { QueueingSubject } from 'queueing-subject/lib';
import { Subscription } from 'rxjs/Subscription';
import { selectDeployAppState } from '../../../../store/selectors/deploy-application.selector';
import { DeployApplicationSource, SocketEventTypes, AppData } from '../../../../store/types/deploy-application.types';
import { LogViewerComponent } from '../../../../shared/components/log-viewer/log-viewer.component';
import * as moment from 'moment';
import { MatSnackBar } from '@angular/material';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { RouterNav } from '../../../../store/actions/router.actions';
import { GetAllApplications } from '../../../../store/actions/application.actions';
import { environment } from '../../../../../environments/environment';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { organizationSchemaKey, spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { CfAppsDataSource } from '../../../../shared/components/list/list-types/app/cf-apps-data-source';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { interval } from 'rxjs/observable/interval';

// Interval to check for new application
const APP_CHECK_INTERVAL = 3000;

@Component({
  selector: 'app-deploy-application-step3',
  templateUrl: './deploy-application-step3.component.html',
  styleUrls: ['./deploy-application-step3.component.scss']
})
export class DeployApplicationStep3Component implements OnInit, OnDestroy {

  connect$: Subscription;
  streamTitle: string;
  messages: Observable<string>;
  appData: AppData;
  proxyAPIVersion = environment.proxyAPIVersion;
  appGuid: string;

  // Validation poller
  validate = this.createValidationPoller();

  // Are we deploying?
  deploying = false;

  constructor(
    private store: Store<AppState>,
    private snackBar: MatSnackBar,
    public cfOrgSpaceService: CfOrgSpaceDataService,
    private http: HttpClient,
  ) { }

  ngOnDestroy() {
    // Unsubscribe from the websocket stream
    if (this.connect$) {
      this.connect$.unsubscribe();
    }
  }

  ngOnInit() {
    this.connect$ = this.store.select(selectDeployAppState).pipe(
      filter(appDetail => !!appDetail.cloudFoundryDetails
        && !!appDetail.applicationSource
        && !!appDetail.applicationSource.projectName),
      mergeMap(p => {
        const orgSubscription = this.store.select(selectEntity(organizationSchemaKey, p.cloudFoundryDetails.org));
        const spaceSubscription = this.store.select(selectEntity(spaceSchemaKey, p.cloudFoundryDetails.space));
        return Observable.of(p).combineLatest(orgSubscription, spaceSubscription);
      }),
      tap(p => {
        const host = window.location.host;
        const streamUrl = (
          `wss://${host}/pp/${this.proxyAPIVersion}/${p[0].cloudFoundryDetails.cloudFoundry}/` +
          `${p[0].cloudFoundryDetails.org}/${p[0].cloudFoundryDetails.space}/deploy` +
          `?org=${p[1].entity.name}&space=${p[2].entity.name}`
        );

        const inputStream = new QueueingSubject<string>();
        this.messages = websocketConnect(streamUrl, inputStream)
          .messages.pipe(
            catchError(e => {
              return [];
            }),
            share(),
            map(message => {
              const json = JSON.parse(message);
              return json;
            }),
            filter(l => !!l),
            tap((log) => {
              // Deal with control messages
              if (log.type !== SocketEventTypes.DATA) {
                this.processWebSocketMessage(log);
              }
            }),
            filter((log) => log.type === SocketEventTypes.DATA),
            map((log) => log.message)
          );
        inputStream.next(this.sendProjectInfo(p[0].applicationSource));
      })
    ).subscribe();
  }

  sendProjectInfo = (appSource: DeployApplicationSource) => {
    if (appSource.type.id === 'git') {
      if (appSource.type.subType === 'github') {
        return this.sendGitHubSourceMetadata(appSource);
      }
      if (appSource.type.subType === 'giturl') {
        return this.sendGitUrlSourceMetadata(appSource);
      }
    }
    return '';
  }

  sendGitHubSourceMetadata = (appSource: DeployApplicationSource) => {
    const github = {
      project: appSource.projectName,
      branch: appSource.branch.name,
      type: appSource.type.subType
    };

    const msg = {
      message: JSON.stringify(github),
      timestamp: Math.round((new Date()).getTime() / 1000),
      type: SocketEventTypes.SOURCE_GITHUB
    };
    return JSON.stringify(msg);
  }

  sendGitUrlSourceMetadata = (appSource: DeployApplicationSource) => {
    const giturl = {
      url: appSource.projectName,
      branch: appSource.branch.name,
      type: appSource.type.subType
    };

    const msg = {
      message: JSON.stringify(giturl),
      timestamp: Math.round((new Date()).getTime() / 1000),
      type: SocketEventTypes.SOURCE_GITURL
    };
    return JSON.stringify(msg);
  }

  processWebSocketMessage = (log) => {
    switch (log.type) {
      case SocketEventTypes.MANIFEST:
        this.streamTitle = 'Starting deployment...';
        // This info is will be used to retrieve the app Id
        this.appData = JSON.parse(log.message).Applications[0];
        this.appData.cloudFoundry = this.cfOrgSpaceService.cf.select.getValue();
        this.appData.org = this.cfOrgSpaceService.org.select.getValue();
        this.appData.space = this.cfOrgSpaceService.space.select.getValue();
        break;
      case SocketEventTypes.EVENT_PUSH_STARTED:
        this.streamTitle = 'Deploying...';
        this.deploying = true;
        break;
      case SocketEventTypes.EVENT_PUSH_COMPLETED:
        // Done
        this.streamTitle = 'Deployed';
        this.deploying = false;
        break;
      case SocketEventTypes.CLOSE_SUCCESS:
        this.close(log, null, null, true);
        break;
      case SocketEventTypes.CLOSE_INVALID_MANIFEST:
        this.close(log, 'Deploy Failed - Invalid manifest!',
          'Failed to deploy app! Please make sure that a valid manifest.yaml was provided!', true);
        break;
      case SocketEventTypes.CLOSE_NO_MANIFEST:
        this.close(log, 'Deploy Failed - No manifest present!',
          'Failed to deploy app! Please make sure that a valid manifest.yaml is present!', true);
        break;
      case SocketEventTypes.CLOSE_FAILED_CLONE:
        this.close(log, 'Deploy Failed - Failed to clone repository!',
          'Failed to deploy app! Please make sure the repository is public!', true);
        break;
      case SocketEventTypes.CLOSE_FAILED_NO_BRANCH:
        this.close(log, 'Deploy Failed - Failed to located branch!',
          'Failed to deploy app! Please make sure that branch exists!', true);
        break;
      case SocketEventTypes.CLOSE_FAILURE:
      case SocketEventTypes.CLOSE_PUSH_ERROR:
      case SocketEventTypes.CLOSE_NO_SESSION:
      case SocketEventTypes.CLOSE_NO_CNSI:
      case SocketEventTypes.CLOSE_NO_CNSI_USERTOKEN:
        this.close(log, 'Deploy Failed!',
          'Failed to deploy app!', true);
        break;
      case SocketEventTypes.SOURCE_REQUIRED:
      case SocketEventTypes.EVENT_CLONED:
      case SocketEventTypes.EVENT_FETCHED_MANIFEST:
      case SocketEventTypes.MANIFEST:
        break;
      default:
      // noop
    }
  }

  close(log, title, error, deleteAppSection) {
    if (deleteAppSection) {
      this.store.dispatch(new DeleteDeployAppSection());
    }

    if (title) {
      this.streamTitle = title;
    }

    if (error) {
      error = `${error}\nReason: ${log.message}`;
      this.snackBar.open(error, 'Dismiss');
    }
    this.deploying = false;
  }

  onNext: StepOnNextFunction = () => {
    this.deploying = false;
    this.store.dispatch(new GetAllApplications(CfAppsDataSource.paginationKey));
    // Delete Deploy App Section
    this.store.dispatch(new DeleteDeployAppSection());
    // Take user to applications
    this.store.dispatch(new RouterNav({ path: ['applications', this.appData.cloudFoundry, this.appGuid] }));
    return Observable.of({ success: true });
  }

  /**
   * Create a poller that will be used to periodically check for the new application.
   */
  private createValidationPoller() {
    return interval(APP_CHECK_INTERVAL).pipe(
      takeWhile(() => !this.appGuid),
      filter(() => this.deploying),
      switchMap(() => {
        const headers = new HttpHeaders({ 'x-cap-cnsi-list': this.appData.cloudFoundry });
        return this.http.get(`/pp/${this.proxyAPIVersion}/proxy/v2/apps?q=space_guid:` +
          this.appData.space + '&q=name:' + this.appData.Name, { headers: headers })
          .pipe(
            mergeMap(info => {
              if (info && info[this.appData.cloudFoundry]) {
                const apps = info[this.appData.cloudFoundry];
                if (apps.total_results === 1) {
                  this.appGuid = apps.resources[0].metadata.guid;
                  return Observable.of(true);
                }
              }
              return Observable.of(false);
            }),
            catchError(err => [
              // ignore
            ])
          );
      })
    );
  }
}
