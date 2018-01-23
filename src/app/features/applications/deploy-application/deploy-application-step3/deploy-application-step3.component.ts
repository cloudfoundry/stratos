import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { selectNewAppDetails } from '../../../../store/selectors/create-application.selectors';
import { tap, filter, map, mergeMap, combineLatest, switchMap } from 'rxjs/operators';
import { getEntityById, selectEntity } from '../../../../store/selectors/api.selectors';
import { OrganizationSchema } from '../../../../store/actions/organization.actions';
import { SpaceSchema } from '../../../../store/actions/space.actions';
import websocketConnect from 'rxjs-websockets';
import { QueueingSubject } from 'queueing-subject/lib';
import { Subscription } from 'rxjs/Subscription';
import { selectDeployAppState } from '../../../../store/selectors/deploy-application.selector';
import { DeployApplicationSource, socketEventTypes } from '../../../../store/types/deploy-application.types';
import { LogViewerComponent } from '../../../../shared/components/log-viewer/log-viewer.component';
import * as moment from 'moment';

@Component({
  selector: 'app-deploy-application-step3',
  templateUrl: './deploy-application-step3.component.html',
  styleUrls: ['./deploy-application-step3.component.scss']
})
export class DeployApplicationStep3Component implements OnInit, OnDestroy {

  connect$: Subscription;
  streamTitle$: Observable<string>;
  messages: Observable<string>;

  ngOnDestroy(): void {
    this.connect$.unsubscribe();
  }

  constructor(
    private store: Store<AppState>
  ) { }

  ngOnInit() {

    this.connect$ = this.store.select(selectDeployAppState).pipe(
      filter(appDetail => !!appDetail.cloudFoundryDetails
        && !!appDetail.applicationSource
        && !!appDetail.applicationSource.projectName),
      mergeMap(p => {
          const orgSubscription = this.store.select(selectEntity(OrganizationSchema.key, p.cloudFoundryDetails.org));
          const spaceSubscription = this.store.select(selectEntity(SpaceSchema.key, p.cloudFoundryDetails.space));
          return  Observable.of(p).combineLatest(orgSubscription, spaceSubscription );
      }),
      tap(p => {
        const host = window.location.host;
        const streamUrl = (
          `wss://${host}/pp/v1/${p[0].cloudFoundryDetails.cloudFoundry}/` +
          `${p[0].cloudFoundryDetails.org}/${p[0].cloudFoundryDetails.space}/deploy` +
          `?org=${p[1].entity.name}&space=${p[2].entity.name}`
        );

        const inputStream =  new QueueingSubject<string>();
        console.log(streamUrl);
        this.messages = websocketConnect(streamUrl, inputStream)
        .messages
        .share()
        .map(message => {
          const json = JSON.parse(message);
          return json;
        })
        .filter(l => !!l)
        .filter(l => l !== '')
        .map(log => {
          let { message } = log;
          const { searchIndex } = log;
          if (searchIndex) {
            const colorStyles = 'color: black; background-color: yellow;';
            const highlight = `<span style="${colorStyles}">${message.slice(searchIndex[0], searchIndex[1])}</span>`;
            message = message.substring(0, searchIndex[0]) + highlight + message.substring(searchIndex[1]);
          }
          return {
            message,
            log
          };
        })
        .map(({ log, message }) => {
          const timesString = moment(Math.round(log.timestamp / 1000000)).format('HH:mm:ss.SSS');
          return (
            `[${timesString}]: ${message}`
          );
        });


        inputStream.next(this.sendProjectInfo(p[0].applicationSource));

      })
    ).subscribe();
  }

  sendProjectInfo = (appSource: DeployApplicationSource)  => {
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


  sendGitHubSourceMetadata = (appSource: DeployApplicationSource) =>  {
    const github = {
      project: appSource.projectName,
      branch: appSource.branch.name,
      type: appSource.type.subType
    };

    const msg = {
      message: JSON.stringify(github),
      timestamp: Math.round((new Date()).getTime() / 1000),
      type: socketEventTypes.SOURCE_GITHUB
    };
    return JSON.stringify(msg);
  }

  sendGitUrlSourceMetadata = (appSource: DeployApplicationSource) =>  {
    const giturl = {
      url: appSource.projectName,
      branch: appSource.branch.name,
      type: appSource.type.subType
    };

    const msg = {
      message: JSON.stringify(giturl),
      timestamp: Math.round((new Date()).getTime() / 1000),
      type: socketEventTypes.SOURCE_GITURL
    };
    return JSON.stringify(msg);
  }

}
